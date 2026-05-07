import type { NextApiRequest } from "next"
import { Server as IOServer } from "socket.io"
import type { NextApiResponseServerIO } from "@/types/next"
import { sanitizeRoomCode, verifySignedToken } from "@/lib/security"

export const config = {
  api: {
    bodyParser: false,
  },
}

type JoinPayload = {
  roomCode: string
  token: string
  displayName?: string
}

type SignalMessage = {
  target: string
  sdp?: unknown
  candidate?: unknown
}

type ParticipantInfo = {
  id: string
  displayName: string
}

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/socket.io",
      cors: {
        origin: true,
        methods: ["GET", "POST"],
      },
    })

    const leaveCurrentRoom = (socketId: string) => {
      const socket = io.sockets.sockets.get(socketId)
      if (!socket) return
      const room: string | undefined = socket.data.roomCode
      if (room) {
        socket.leave(room)
        socket.to(room).emit("participant-left", socketId)
      }
    }

    const forwardSignal = (event: string, socketId: string, message: SignalMessage) => {
      if (!message.target) return
      const source = io.sockets.sockets.get(socketId)
      const target = io.sockets.sockets.get(message.target)
      if (!source || !target) return
      if (source.data.roomCode !== target.data.roomCode) return
      target.emit(event, { ...message, sender: socketId, displayName: source.data.displayName })
    }

    io.on("connection", (socket) => {
      socket.on("join-room", ({ roomCode, token, displayName }: JoinPayload) => {
        if (!roomCode) return
        const normalizedRoomCode = sanitizeRoomCode(roomCode)
        const roomToken = verifySignedToken<{ type: "room"; roomCode: string; sub: string; exp: number }>(
          token,
        )

        if (!roomToken.valid || !roomToken.payload) return
        if (roomToken.payload.type !== "room") return
        if (roomToken.payload.roomCode !== normalizedRoomCode) return

        socket.data.roomCode = normalizedRoomCode
        socket.data.displayName = displayName || "Guest"
        socket.join(normalizedRoomCode)
        const participants: ParticipantInfo[] = Array.from(io.sockets.adapter.rooms.get(normalizedRoomCode) ?? [])
          .filter((memberId) => memberId !== socket.id)
          .map((memberId) => {
            const memberSocket = io.sockets.sockets.get(memberId)
            return {
              id: memberId,
              displayName: memberSocket?.data.displayName || "Guest",
            }
          })
        socket.emit("participants", participants)
        socket.to(normalizedRoomCode).emit("participant-joined", {
          id: socket.id,
          displayName: socket.data.displayName,
        } as ParticipantInfo)
      })

      socket.on("leave-room", () => {
        leaveCurrentRoom(socket.id)
      })

      socket.on("disconnect", () => {
        leaveCurrentRoom(socket.id)
      })

      socket.on("signal:offer", (payload: SignalMessage) => {
        forwardSignal("signal:offer", socket.id, payload)
      })

      socket.on("signal:answer", (payload: SignalMessage) => {
        forwardSignal("signal:answer", socket.id, payload)
      })

      socket.on("signal:candidate", (payload: SignalMessage) => {
        forwardSignal("signal:candidate", socket.id, payload)
      })
    })

    res.socket.server.io = io
  }

  res.end()
}
