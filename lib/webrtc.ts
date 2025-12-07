// WebRTC configuration for peer-to-peer video calling
// In production, this would include STUN/TURN server configuration

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private onRemoteStream: ((stream: MediaStream) => void) | null = null

  async initialize(onRemoteStream: (stream: MediaStream) => void) {
    this.onRemoteStream = onRemoteStream
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS)

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to signaling server
        console.log("[WebRTC] ICE candidate:", event.candidate)
      }
    }

    this.peerConnection.ontrack = (event) => {
      if (this.onRemoteStream && event.streams[0]) {
        this.onRemoteStream(event.streams[0])
      }
    }
  }

  async setLocalStream(stream: MediaStream) {
    this.localStream = stream
    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream)
    })
  }

  async createOffer(): Promise<RTCSessionDescriptionInit | undefined> {
    if (!this.peerConnection) return
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | undefined> {
    if (!this.peerConnection) return
    await this.peerConnection.setRemoteDescription(offer)
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    await this.peerConnection?.setRemoteDescription(description)
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    await this.peerConnection?.addIceCandidate(candidate)
  }

  close() {
    this.peerConnection?.close()
    this.peerConnection = null
  }
}
