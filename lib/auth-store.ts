import { randomId, hashPassword, nowUnix, verifyPassword } from "@/lib/security"

export type AppRole = "interviewer" | "candidate"

export type AppUser = {
  id: string
  email: string
  fullName: string
  role: AppRole
  passwordHash: string
  createdAt: string
}

type SessionRecord = {
  id: string
  userId: string
  refreshTokenId: string
  expiresAt: number
}

const usersByEmail = new Map<string, AppUser>()
const sessionsById = new Map<string, SessionRecord>()

type FailedLoginRecord = { count: number; lastAttempt: number; lockedUntil?: number }
const failedLoginsByEmail = new Map<string, FailedLoginRecord>()
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_SECONDS = 15 * 60

function seedDefaultUsers(): void {
  const demoUsers: Array<{ email: string; fullName: string; role: AppRole; password: string }> = [
    {
      email: "interviewer@demo.com",
      fullName: "Demo Interviewer",
      role: "interviewer",
      password: "DemoPass@123",
    },
    {
      email: "candidate@demo.com",
      fullName: "Demo Candidate",
      role: "candidate",
      password: "DemoPass@123",
    },
  ]

  for (const demoUser of demoUsers) {
    const normalizedEmail = demoUser.email.toLowerCase()
    if (usersByEmail.has(normalizedEmail)) continue
    createUser(demoUser)
  }
}

export function findUserByEmail(email: string): AppUser | undefined {
  return usersByEmail.get(email.toLowerCase())
}

export function findUserById(id: string): AppUser | undefined {
  for (const user of usersByEmail.values()) {
    if (user.id === id) return user
  }
  return undefined
}

export function createUser(input: { email: string; fullName: string; role: AppRole; password: string }): AppUser {
  const normalizedEmail = input.email.toLowerCase()
  if (usersByEmail.has(normalizedEmail)) {
    throw new Error("EMAIL_ALREADY_EXISTS")
  }

  const user: AppUser = {
    id: randomId(12),
    email: normalizedEmail,
    fullName: input.fullName,
    role: input.role,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  }

  usersByEmail.set(normalizedEmail, user)
  return user
}

export function isAccountLocked(email: string): { locked: boolean; remainingSeconds?: number } {
  const now = nowUnix()
  const record = failedLoginsByEmail.get(email.toLowerCase())
  if (!record?.lockedUntil) return { locked: false }
  if (record.lockedUntil > now) return { locked: true, remainingSeconds: record.lockedUntil - now }
  return { locked: false }
}

export function recordFailedLogin(email: string): void {
  const key = email.toLowerCase()
  const now = nowUnix()
  const existing = failedLoginsByEmail.get(key) ?? { count: 0, lastAttempt: now }
  const newCount = existing.count + 1
  const lockedUntil = newCount >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_SECONDS : existing.lockedUntil
  failedLoginsByEmail.set(key, { count: newCount, lastAttempt: now, lockedUntil })
}

export function clearFailedLogins(email: string): void {
  failedLoginsByEmail.delete(email.toLowerCase())
}

export function authenticateUser(email: string, password: string): AppUser | undefined {
  const user = usersByEmail.get(email.toLowerCase())
  if (!user) return undefined

  if (!verifyPassword(password, user.passwordHash)) {
    return undefined
  }

  return user
}

export function createSession(userId: string): SessionRecord {
  const record: SessionRecord = {
    id: randomId(12),
    userId,
    refreshTokenId: randomId(16),
    expiresAt: nowUnix() + 7 * 24 * 60 * 60,
  }

  sessionsById.set(record.id, record)
  return record
}

export function getSession(sessionId: string): SessionRecord | undefined {
  const session = sessionsById.get(sessionId)
  if (!session) return undefined
  if (session.expiresAt <= nowUnix()) {
    sessionsById.delete(sessionId)
    return undefined
  }
  return session
}

export function rotateSessionRefreshToken(sessionId: string): SessionRecord | undefined {
  const session = sessionsById.get(sessionId)
  if (!session) return undefined
  if (session.expiresAt <= nowUnix()) {
    sessionsById.delete(sessionId)
    return undefined
  }

  const updated: SessionRecord = {
    ...session,
    refreshTokenId: randomId(16),
    expiresAt: nowUnix() + 7 * 24 * 60 * 60,
  }

  sessionsById.set(sessionId, updated)
  return updated
}

export function revokeSession(sessionId: string): void {
  sessionsById.delete(sessionId)
}

seedDefaultUsers()
