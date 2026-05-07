"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff, Monitor, Users } from "lucide-react"

type PeerConnectionMap = Map<string, RTCPeerConnection>

interface VideoPanelProps {
  roomCode: string
}

interface SignalPayload {
  sender: string
  target: string
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  displayName?: string
}

export function VideoPanel({ roomCode }: VideoPanelProps) {
  const socketRef = useRef<Socket | null>(null)
  const resolvedRoomCodeRef = useRef<string>(roomCode)
    const peerConnectionsRef = useRef<PeerConnectionMap>(new Map())
    const cameraStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [localPreviewStream, setLocalPreviewStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
    const [participantNames, setParticipantNames] = useState<Record<string, string>>({})
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const displayName = useMemo(() => `Participant-${crypto.randomUUID().slice(0, 8)}`, [])

  const iceServers = useMemo<RTCIceServer[]>(
    () => [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
      ...(process.env.NEXT_PUBLIC_TURN_URL
        ? [
            {
              urls: process.env.NEXT_PUBLIC_TURN_URL.split(",").map((url) => url.trim()),
              username: process.env.NEXT_PUBLIC_TURN_USERNAME,
              credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
            } as RTCIceServer,
          ]
        : []),
    ],
    [],
  )

  const setLocalVideo = useCallback((stream: MediaStream) => {
    setLocalPreviewStream(stream)
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
    }
  }, [])

  const stopAllPeers = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close())
    peerConnectionsRef.current.clear()
    setRemoteStreams({})
    setIsConnected(false)
  }, [])

  const removePeer = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId)
    if (pc) {
      pc.close()
      peerConnectionsRef.current.delete(peerId)
    }
    setRemoteStreams((prev) => {
      const next = { ...prev }
      delete next[peerId]
      if (Object.keys(next).length === 0) {
        setIsConnected(false)
      }
      return next
    })
  }, [])

  const attachRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }))
    setIsConnected(true)
  }, [])

  const createPeerConnection = useCallback(
    (peerId: string) => {
      let pc = peerConnectionsRef.current.get(peerId)
      if (pc) return pc

      pc = new RTCPeerConnection({ iceServers })

      const localStream = cameraStreamRef.current
      localStream?.getTracks().forEach((track) => {
        pc?.addTrack(track, localStream)
      })

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("signal:candidate", {
            target: peerId,
            candidate: event.candidate,
          })
        }
      }

      pc.ontrack = (event) => {
        const [stream] = event.streams
        if (stream) {
          attachRemoteStream(peerId, stream)
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc) {
          const state = pc.iceConnectionState
          if (state === "disconnected" || state === "failed" || state === "closed") {
            removePeer(peerId)
          }
        }
      }

      peerConnectionsRef.current.set(peerId, pc)
      return pc
    },
    [attachRemoteStream, iceServers, removePeer],
  )

  const makeOffer = useCallback(
    async (peerId: string) => {
      const pc = createPeerConnection(peerId)
      if (!pc) return
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socketRef.current?.emit("signal:offer", { target: peerId, sdp: offer })
      } catch (err) {
        console.error("Failed to create offer", err)
      }
    },
    [createPeerConnection],
  )

  const handleOffer = useCallback(async ({ sender, sdp, displayName }: SignalPayload) => {
    if (sender && displayName) {
      setParticipantNames((prev) => ({ ...prev, [sender]: displayName }))
    }
    const pc = createPeerConnection(sender)
    if (!pc || !sdp) return
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socketRef.current?.emit("signal:answer", { target: sender, sdp: answer })
    } catch (err) {
      console.error("Failed to handle offer", err)
    }
  }, [createPeerConnection])

  const handleAnswer = useCallback(async ({ sender, sdp, displayName }: SignalPayload) => {
    if (sender && displayName) {
      setParticipantNames((prev) => ({ ...prev, [sender]: displayName }))
    }
    const pc = peerConnectionsRef.current.get(sender)
    if (!pc || !sdp) return
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    } catch (err) {
      console.error("Failed to handle answer", err)
    }
  }, [])

  const handleCandidate = useCallback(async ({ sender, candidate, displayName }: SignalPayload) => {
    if (sender && displayName) {
      setParticipantNames((prev) => ({ ...prev, [sender]: displayName }))
    }
    const pc = peerConnectionsRef.current.get(sender)
    if (!pc || !candidate) return
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error("Failed to add ICE candidate", err)
    }
  }, [])

  const replaceVideoTrack = useCallback((track: MediaStreamTrack) => {
    peerConnectionsRef.current.forEach((pc) => {
      const sender = pc
        .getSenders()
        .find((pcSender) => pcSender.track && pcSender.track.kind === "video")
      sender?.replaceTrack(track)
    })
  }, [])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        cameraStreamRef.current = stream
        setLocalVideo(stream)

        const roomTokenResponse = await fetch("/api/interview/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode }),
        })

        const roomTokenData = await roomTokenResponse.json()
        if (!roomTokenResponse.ok || !roomTokenData.token) {
          setError(roomTokenData.error || "Unable to join this room")
          return
        }

        // The API resolves the URL token (hash) to the actual room code for socket routing
        const resolvedRoomCode: string = roomTokenData.roomCode ?? roomCode
        resolvedRoomCodeRef.current = resolvedRoomCode

        await fetch("/api/socket")

        const socket = io({
          path: "/socket.io",
          transports: ["websocket"],
          autoConnect: true,
        })

        socketRef.current = socket

        socket.on("connect", () => {
          socket.emit("join-room", { roomCode: resolvedRoomCode, displayName, token: roomTokenData.token })
        })

        socket.on("participants", (participants: { id: string; displayName: string }[]) => {
          setParticipantNames((prev) => {
            const next = { ...prev }
            participants.forEach((p) => {
              next[p.id] = p.displayName || "Guest"
            })
            next[socket.id] = displayName
            return next
          })
          participants.forEach((p) => {
            // deterministic initiator to avoid glare: lower socket id offers
            if (socket.id && socket.id.localeCompare(p.id) < 0) {
              makeOffer(p.id)
            }
          })
        })

        socket.on("participant-joined", (participant: { id: string; displayName: string }) => {
          setParticipantNames((prev) => ({ ...prev, [participant.id]: participant.displayName || "Guest", [socket.id]: displayName }))
          if (socket.id && socket.id.localeCompare(participant.id) < 0) {
            makeOffer(participant.id)
          }
        })

        socket.on("participant-left", (peerId: string) => {
          removePeer(peerId)
          setParticipantNames((prev) => {
            const next = { ...prev }
            delete next[peerId]
            return next
          })
        })

        socket.on("signal:offer", handleOffer)
        socket.on("signal:answer", handleAnswer)
        socket.on("signal:candidate", handleCandidate)

        socket.on("disconnect", () => {
          setIsConnected(false)
          stopAllPeers()
        })
      } catch (err) {
        console.error("Error initializing media or socket", err)
        setError("Unable to initialize video call. Check camera, microphone, and permissions.")
      }
    }

    init()

    return () => {
      isMounted = false
      socketRef.current?.emit("leave-room", { roomCode: resolvedRoomCodeRef.current })
      socketRef.current?.disconnect()
      socketRef.current = null
      const cameraStream = cameraStreamRef.current
      cameraStream?.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
      stopAllPeers()
    }
  }, [displayName, handleAnswer, handleCandidate, handleOffer, makeOffer, removePeer, roomCode, setLocalVideo, stopAllPeers])

  const toggleMute = useCallback(() => {
    const stream = cameraStreamRef.current
    if (!stream) return
    stream.getAudioTracks().forEach((track) => {
      track.enabled = isMuted
    })
    setIsMuted((prev) => !prev)
  }, [isMuted])

  const toggleVideo = useCallback(() => {
    const stream = cameraStreamRef.current
    if (!stream) return
    stream.getVideoTracks().forEach((track) => {
      track.enabled = isVideoOff
      if (track.enabled && localVideoRef.current && localPreviewStream !== stream) {
        setLocalVideo(stream)
      }
    })
    setIsVideoOff((prev) => !prev)
  }, [isVideoOff, localPreviewStream, setLocalVideo])

  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const [screenTrack] = screenStream.getVideoTracks()
      if (!screenTrack) return

      replaceVideoTrack(screenTrack)
      setLocalVideo(screenStream)

      screenTrack.onended = () => {
        const cameraStream = cameraStreamRef.current
        const cameraTrack = cameraStream?.getVideoTracks()[0]
        if (cameraTrack) {
          replaceVideoTrack(cameraTrack)
          setLocalVideo(cameraStream)
        }
      }
    } catch (err) {
      console.error("Error sharing screen", err)
    }
  }, [replaceVideoTrack, setLocalVideo])

  const remoteEntries = Object.entries(remoteStreams)

  const remoteGridStyle = useMemo(() => {
    const count = remoteEntries.length
    if (count <= 1) return { gridTemplateColumns: "repeat(1, minmax(0, 1fr))" }
    if (count === 2) return { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }
    if (count <= 4) return { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }
    if (count <= 6) return { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }
    return { gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }
  }, [remoteEntries.length])

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 p-2">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
          {remoteEntries.length > 0 ? (
            <div
              className="grid h-full w-full gap-3 p-3"
              style={remoteGridStyle}
            >
              {remoteEntries.map(([peerId, stream]) => (
                <div key={peerId} className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-border/30 bg-black">
                  <video
                    data-peer-id={peerId}
                    autoPlay
                    playsInline
                    className="h-full w-full object-contain"
                    ref={(element) => {
                      if (element && element.srcObject !== stream) {
                        element.srcObject = stream
                      }
                    }}
                  />
                  <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                    {participantNames[peerId] || "Guest"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Users className="h-14 w-14 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Waiting for other participants…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-0 top-3 flex justify-center">
              <span className="rounded bg-destructive/90 px-3 py-1 text-xs text-destructive-foreground shadow">
                {error}
              </span>
            </div>
          )}

          <div className="pointer-events-auto absolute bottom-4 right-4 h-28 w-44 overflow-hidden rounded-lg border border-border/40 bg-black/80 shadow-lg">
            <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-contain" />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/70">
                <VideoOff className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-foreground">{displayName}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-border p-3">
        <Button variant={isMuted ? "destructive" : "secondary"} size="icon" onClick={toggleMute}>
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button variant={isVideoOff ? "destructive" : "secondary"} size="icon" onClick={toggleVideo}>
          {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </Button>
        <Button variant="secondary" size="icon" onClick={shareScreen}>
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
      <div className="border-t border-border px-3 py-1 text-center text-[11px] text-muted-foreground">
        {isConnected ? `Connected as ${displayName}` : "Establishing connection…"}
      </div>
    </div>
  )
}
