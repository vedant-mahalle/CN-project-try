import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromNextRequest, setAuthCookiesForNextResponse } from "@/lib/auth-server"
import { createSignedToken, nowUnix, randomId } from "@/lib/security"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/request-security"
import { findUserById, getSession } from "@/lib/auth-store"
import { resolveRoomToken } from "@/lib/room-registry"

// max(32) to accommodate 16-char URL tokens as well as plain room codes
const schema = z.object({
  roomCode: z.string().trim().min(4).max(32),
})

export async function POST(request: NextRequest) {
  if (!enforceSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  if (!enforceRateLimit(request, "room-token", 20, 0.8)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const auth = getAuthFromNextRequest(request)

  try {
    const body = schema.parse(await request.json())
    // Resolve URL token (hash) → actual room code, or sanitize a plain room code
    const roomCode = resolveRoomToken(body.roomCode)
    if (!roomCode) {
      return NextResponse.json({ error: "Invalid room code" }, { status: 400 })
    }

    const actorId = auth?.user.id ?? `guest-${randomId(8)}`
    const actorRole = auth?.user.role ?? "candidate"

    const token = createSignedToken({
      type: "room",
      roomCode,
      sub: actorId,
      role: actorRole,
      exp: nowUnix() + 10 * 60,
    })

    const response = NextResponse.json({ roomCode, token, role: actorRole, guest: !auth })

    if (auth?.refreshed && auth.refreshTokenId) {
      const user = findUserById(auth.user.id)
      const session = getSession(auth.sessionId)
      if (user && session) {
        setAuthCookiesForNextResponse(response, user, session.id, auth.refreshTokenId)
      }
    }

    return response
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
