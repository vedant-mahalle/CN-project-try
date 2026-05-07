/**
 * Security utility module for handling authentication, encryption, and rate limiting.
 * 
 * Provides functions for:
 * - JWT token creation and verification using HMAC-SHA256
 * - Password hashing and verification using scrypt
 * - Base64 URL encoding/decoding
 * - Token bucket rate limiting
 * - Utility functions for generating random IDs and timestamps
 * 
 * @module security
 * @requires node:crypto
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

type SignedPayload = Record<string, unknown>

type VerifyResult<T extends SignedPayload> = {
  valid: boolean
  payload?: T
  expired?: boolean
}

type TokenBucketState = {
  tokens: number
  lastRefill: number
}

const DEFAULT_SECRET = "dev-only-secret-change-this"
const SECRET = process.env.APP_SECURITY_SECRET ?? process.env.NEXTAUTH_SECRET ?? DEFAULT_SECRET

// Encodes a string or Buffer into a Base64-URL string
// This format is safe for URLs as it removes +, /, and = which have special meanings in URLs
function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

// Decodes a Base64-URL string back to a standard UTF-8 string
// Re-adds padding characters (=) and replaces - and _ with standard Base64 characters (+ and /)
function base64UrlDecode(input: string): string {
  let value = input.replace(/-/g, "+").replace(/_/g, "/")
  const padding = value.length % 4
  if (padding) value += "=".repeat(4 - padding)
  return Buffer.from(value, "base64").toString("utf8")
}

// Generates an HMAC-SHA256 signature for the given value based on the application's SECRET
// HMAC provides both data integrity and authentication.
function sign(value: string): string {
  return base64UrlEncode(createHmac("sha256", SECRET).update(value).digest())
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000)
}

export function randomId(size = 32): string {
  return base64UrlEncode(randomBytes(size))
}

// Hashes a plain text password using the secure scrypt key derivation function.
// It generates a 16-byte random salt, combines it with the password, and derives a 64-byte hash.
// The result is formatted as "saltHex:hashHex" for future verification.
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const derived = scryptSync(password, salt, 64)
  return `${salt.toString("hex")}:${derived.toString("hex")}`
}

// Verifies a plain text password against a safely stored hashed password.
// It splits the stored value into salt and hash, applies the scrypt function to the provided
// password using the stored salt, and securely compares the result using timingSafeEqual
// to prevent timing attacks.
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false

// Creates a JSON Web Token (JWT) using the HS256 algorithm.
// The JWT is built in three parts: Header, Payload, and Signature, each Base64Url encoded
// and joined by periods. The signature ensures the payload has not been tampered with.
export function createSignedToken(payload: SignedPayload): string {
  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = sign(data)
  return `${data}.${signature}`
}

// Verifies a JWT's signature and expiration time.
// It splits the token into its constituent parts, recalculates the signature using the
// application SECRET, and performs a timing-safe equality check against the provided signature.
// Then it decodes the payload to ensure any expiration time (exp) hasn't passed.  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = sign(data)
  return `${data}.${signature}`
}

export function verifySignedToken<T extends SignedPayload>(token: string): VerifyResult<T> {
  const [encodedHeader, encodedPayload, tokenSignature] = token.split(".")
  if (!encodedHeader || !encodedPayload || !tokenSignature) {
    return { valid: false }
  }

  const data = `${encodedHeader}.${encodedPayload}`
  const expected = sign(data)

  const provided = Buffer.from(tokenSignature)
  const expectedBuffer = Buffer.from(expected)
  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
    return { valid: false }
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as T
    if (typeof payload.exp === "number" && payload.exp <= nowUnix()) {
      return { valid: false, expired: true, payload }
    }
    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}

export function sanitizeRoomCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)
}

// Deterministic HMAC-derived URL token for a room code.
// Replaces the plain room code in the browser URL so the actual code is not exposed.
export function generateRoomUrlToken(roomCode: string): string {
  return base64UrlEncode(
    createHmac("sha256", SECRET).update(`room-url:${roomCode}`).digest()
  ).slice(0, 16)
}

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
// Implements the Token Bucket algorithm for rate limiting requests.
// This allows occasional bursts of requests up to a 'capacity' limit while forcing a steady
// long-term average rate of 'refillPerSecond'. Each consumer key tracks its own token count
// and the last time those tokens were replenished.
export class TokenBucketRateLimiter {
  private readonly state = new Map<string, TokenBucketState>()

  // Attempts to consume 1 token from the bucket for the given key.
  // It calculates elapsed time since the last action to add any refilled tokens,
  // up to the maximum capacity. If >= 1 token is available, consumption succeeds.  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain at least one number" }
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: "Password must contain at least one special character (e.g. !@#$%)" }
  return { valid: true }
}

export class TokenBucketRateLimiter {
  private readonly state = new Map<string, TokenBucketState>()

  consume(key: string, capacity: number, refillPerSecond: number): boolean {
    const now = Date.now()
    const bucket = this.state.get(key) ?? { tokens: capacity, lastRefill: now }
    const elapsedSeconds = (now - bucket.lastRefill) / 1000
    const nextTokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillPerSecond)

    if (nextTokens < 1) {
      this.state.set(key, { tokens: nextTokens, lastRefill: now })
      return false
    }

    this.state.set(key, { tokens: nextTokens - 1, lastRefill: now })
    return true
  }
}

export const sharedRateLimiter = new TokenBucketRateLimiter()
