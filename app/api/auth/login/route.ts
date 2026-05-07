import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateUser, createSession, clearFailedLogins, isAccountLocked, recordFailedLogin } from "@/lib/auth-store"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/request-security"
import { setAuthCookiesForNextResponse } from "@/lib/auth-server"

const loginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(128),
})

export async function POST(request: NextRequest) {
  if (!enforceSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  if (!enforceRateLimit(request, "auth-login", 8, 0.2)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const parsed = loginSchema.parse(await request.json())

    const lockStatus = isAccountLocked(parsed.email)
    if (lockStatus.locked) {
      const minutes = Math.ceil((lockStatus.remainingSeconds ?? 0) / 60)
      return NextResponse.json(
        { error: `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.` },
        { status: 429 }
      )
    }

    const user = authenticateUser(parsed.email, parsed.password)
    if (!user) {
      recordFailedLogin(parsed.email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    clearFailedLogins(parsed.email)

    const session = createSession(user.id)
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    })

    setAuthCookiesForNextResponse(response, user, session.id, session.refreshTokenId)
    return response
  } catch {
    return NextResponse.json({ error: "Invalid login payload" }, { status: 400 })
  }
}
