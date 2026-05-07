import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSession, createUser, findUserByEmail, type AppRole } from "@/lib/auth-store"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/request-security"
import { setAuthCookiesForNextResponse } from "@/lib/auth-server"
import { validatePasswordStrength } from "@/lib/security"

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(10).max(128),
  role: z.enum(["interviewer", "candidate"]),
})

export async function POST(request: NextRequest) {
  if (!enforceSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  if (!enforceRateLimit(request, "auth-register", 6, 0.1)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const parsed = registerSchema.parse(await request.json())

    const strength = validatePasswordStrength(parsed.password)
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 })
    }

    if (findUserByEmail(parsed.email)) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const user = createUser({
      fullName: parsed.fullName,
      email: parsed.email,
      password: parsed.password,
      role: parsed.role as AppRole,
    })

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
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 })
  }
}
