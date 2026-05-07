import { NextRequest, NextResponse } from "next/server"
import { clearAuthCookiesForNextResponse, getAuthFromNextRequest, revokeAuthSession } from "@/lib/auth-server"
import { enforceSameOrigin } from "@/lib/request-security"

export async function POST(request: NextRequest) {
  if (!enforceSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  const auth = getAuthFromNextRequest(request)
  if (auth) {
    revokeAuthSession(auth.sessionId)
  }

  const response = NextResponse.json({ success: true })
  clearAuthCookiesForNextResponse(response)
  return response
}
