import { NextRequest, NextResponse } from "next/server"
import { getAuthFromNextRequest, setAuthCookiesForNextResponse } from "@/lib/auth-server"
import { findUserById, getSession } from "@/lib/auth-store"

export async function GET(request: NextRequest) {
  const auth = getAuthFromNextRequest(request)
  if (!auth) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const response = NextResponse.json({ authenticated: true, user: auth.user })

  if (auth.refreshed && auth.refreshTokenId) {
    const user = findUserById(auth.user.id)
    const session = getSession(auth.sessionId)
    if (user && session) {
      setAuthCookiesForNextResponse(response, user, session.id, auth.refreshTokenId)
    }
  }

  return response
}
