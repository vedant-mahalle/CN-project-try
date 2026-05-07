import type { NextRequest } from "next/server"
import { sharedRateLimiter } from "@/lib/security"

const IS_DEV = process.env.NODE_ENV !== "production"

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "127.0.0.1"
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  // In dev, Next.js doesn't set proxy headers; use host to distinguish callers
  return request.headers.get("host") ?? "127.0.0.1"
}

// Blocks cross-origin requests by comparing the Origin header to the Host header.
// Prevents CSRF attacks where a malicious site tricks the user's browser into making requests,
// as the browser will attach cookies but the Origin will not match the domain.
export function enforceSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true // Allow non-browser clients (curl, Postman, etc.)
  const host = request.headers.get("host")
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

// Protects endpoints from abuse or brute force attempts using rate limits based on client IP.
// The Token Bucket manages limits on a sliding time window.
export function enforceRateLimit(request: NextRequest, keySuffix: string, capacity: number, refillPerSecond: number): boolean {
  if (IS_DEV) return true
  const ip = getClientIp(request)
  return sharedRateLimiter.consume(`${ip}:${keySuffix}`, capacity, refillPerSecond)
}
