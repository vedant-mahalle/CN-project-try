// Socket.io client configuration for real-time collaboration
// In production, this would connect to a Socket.io server

export interface SocketMessage {
  type: "code-change" | "cursor-position" | "user-joined" | "user-left"
  payload: any
  roomCode: string
  userId: string
}

class SocketClient {
  private listeners: Map<string, ((data: any) => void)[]> = new Map()

  emit(event: string, data: any) {
    // In production, this would send to the Socket.io server
    console.log("[Socket] Emitting:", event, data)
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
  }

  off(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  joinRoom(roomCode: string) {
    this.emit("join-room", { roomCode })
  }

  leaveRoom(roomCode: string) {
    this.emit("leave-room", { roomCode })
  }

  sendCodeChange(roomCode: string, code: string) {
    this.emit("code-change", { roomCode, code })
  }
}

export const socketClient = new SocketClient()
