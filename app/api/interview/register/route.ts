import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sanitizeRoomCode } from "@/lib/security"
import { registerRoom } from "@/lib/room-registry"
import { enforceRateLimit } from "@/lib/request-security"

const schema = z.object({ roomCode: z.string().trim().min(4).max(12) })

export async function POST(request: NextRequest) {
  if (!enforceRateLimit(request, "room-register", 20, 0.5)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  try {
    const body = schema.parse(await request.json())
    const roomCode = sanitizeRoomCode(body.roomCode)
    if (!roomCode || roomCode.length < 4) {
      return NextResponse.json({ error: "Invalid room code" }, { status: 400 })
    }
    const urlToken = registerRoom(roomCode)
    return NextResponse.json({ urlToken })
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
