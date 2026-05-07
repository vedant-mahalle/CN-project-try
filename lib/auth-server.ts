import type { NextApiResponse } from "next"
import type { NextRequest } from "next/server"
import { createSignedToken, nowUnix, verifySignedToken } from "@/lib/security"
import { findUserById, getSession, revokeSession, rotateSessionRefreshToken, type AppUser } from "@/lib/auth-store"

const ACCESS_TOKEN_COOKIE = "ci_at"
const REFRESH_TOKEN_COOKIE = "ci_rt"

type AccessTokenPayload = {
  type: "access"
  sub: string
  role: "interviewer" | "candidate"
  email: string
  fullName: string
  sid: string
  exp: number
}

type RefreshTokenPayload = {
  type: "refresh"
  sid: string
  rid: string
  exp: number
}

function createAccessToken(user: AppUser, sessionId: string): string {
  const payload: AccessTokenPayload = {
    type: "access",
    sub: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
    sid: sessionId,
    exp: nowUnix() + 15 * 60,
  }
  return createSignedToken(payload)
}

function createRefreshToken(sessionId: string, refreshTokenId: string): string {
  const payload: RefreshTokenPayload = {
    type: "refresh",
    sid: sessionId,
    rid: refreshTokenId,
    exp: nowUnix() + 7 * 24 * 60 * 60,
  }
  return createSignedToken(payload)
}

export function setAuthCookiesForNextResponse(response: Response, user: AppUser, sessionId: string, refreshTokenId: string): void {
  const accessToken = createAccessToken(user, sessionId)
  const refreshToken = createRefreshToken(sessionId, refreshTokenId)
  const secure = process.env.NODE_ENV === "production"

  response.headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=${accessToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${15 * 60}; ${secure ? "Secure; " : ""}`,
  )
  response.headers.append(
    "Set-Cookie",
    `${REFRESH_TOKEN_COOKIE}=${refreshToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; ${secure ? "Secure; " : ""}`,
  )
}

export function clearAuthCookiesForNextResponse(response: Response): void {
  const secure = process.env.NODE_ENV === "production"
  response.headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; ${secure ? "Secure; " : ""}`,
  )
  response.headers.append(
    "Set-Cookie",
    `${REFRESH_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; ${secure ? "Secure; " : ""}`,
  )
}

export type AuthContext = {
  user: Omit<AppUser, "passwordHash">
  sessionId: string
  refreshed: boolean
  refreshTokenId?: string
}

function toPublicUser(user: AppUser): Omit<AppUser, "passwordHash"> {
  const { passwordHash: _, ...publicUser } = user
  return publicUser
}

export function getAuthFromNextRequest(request: NextRequest): AuthContext | null {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (accessToken) {
    const parsed = verifySignedToken<AccessTokenPayload>(accessToken)
    if (parsed.valid && parsed.payload?.type === "access") {
      const session = getSession(parsed.payload.sid)
      if (!session) return null
      const user = findUserById(parsed.payload.sub)
      if (!user) return null
      return { user: toPublicUser(user), sessionId: session.id, refreshed: false }
    }
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return null

  const refreshParsed = verifySignedToken<RefreshTokenPayload>(refreshToken)
  if (!refreshParsed.valid || !refreshParsed.payload || refreshParsed.payload.type !== "refresh") {
    return null
  }

  const session = getSession(refreshParsed.payload.sid)
  if (!session) return null
  if (session.refreshTokenId !== refreshParsed.payload.rid) return null

  const rotated = rotateSessionRefreshToken(session.id)
  if (!rotated) return null

  const user = findUserById(rotated.userId)
  if (!user) return null

  return {
    user: toPublicUser(user),
    sessionId: rotated.id,
    refreshed: true,
    refreshTokenId: rotated.refreshTokenId,
  }
}

export function getCookieValue(cookieHeader: string | undefined, key: string): string | undefined {
  if (!cookieHeader) return undefined
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`))
    ?.slice(key.length + 1)
}

export function getAuthFromCookieHeader(cookieHeader: string | undefined): AuthContext | null {
  const accessToken = getCookieValue(cookieHeader, ACCESS_TOKEN_COOKIE)
  if (!accessToken) return null

  const parsed = verifySignedToken<AccessTokenPayload>(accessToken)
  if (!parsed.valid || !parsed.payload || parsed.payload.type !== "access") {
    return null
  }

  const session = getSession(parsed.payload.sid)
  if (!session) return null
  const user = findUserById(parsed.payload.sub)
  if (!user) return null

  return { user: toPublicUser(user), sessionId: session.id, refreshed: false }
}

export function clearAuthCookiesForApiResponse(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === "production"
  res.setHeader("Set-Cookie", [
    `${ACCESS_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; ${secure ? "Secure; " : ""}`,
    `${REFRESH_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; ${secure ? "Secure; " : ""}`,
  ])
}

export function revokeAuthSession(sessionId: string): void {
  revokeSession(sessionId)
}
