import { SignJWT, jwtVerify } from "jose"

export const ADMIN_SESSION_COOKIE = "svce_admin_session"
const SESSION_DURATION_SECONDS = 60 * 60 * 12 // 12 hours

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.")
  return new TextEncoder().encode(secret)
}

export async function createAdminSessionToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())
}

export async function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload.role === "admin"
  } catch {
    return false
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_DURATION_SECONDS
