import { generateRoomUrlToken, sanitizeRoomCode } from "@/lib/security"

// Maps HMAC-derived URL tokens back to the actual room codes.
// Stored in-memory; tokens are deterministic so they survive restarts as long as the secret is stable.
const urlTokenToRoomCode = new Map<string, string>()

export function registerRoom(roomCode: string): string {
  const token = generateRoomUrlToken(roomCode)
  urlTokenToRoomCode.set(token, roomCode)
  return token
}

// Accepts either a 16-char URL token or a plain room code.
export function resolveRoomToken(raw: string): string | undefined {
  const trimmed = raw.trim()
  // Check the token map first (URL tokens are 16 base64url chars)
  const fromMap = urlTokenToRoomCode.get(trimmed)
  if (fromMap) return fromMap
  // Fall back to treating it as a plain room code
  const sanitized = sanitizeRoomCode(trimmed)
  return sanitized.length >= 4 ? sanitized : undefined
}
