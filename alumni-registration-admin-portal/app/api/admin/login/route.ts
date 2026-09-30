import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from "@/lib/server/auth"

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: "Admin login is not configured on the server." }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const password = typeof body?.password === "string" ? body.password : ""

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  }

  const token = await createAdminSessionToken()
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  })
  return response
}
