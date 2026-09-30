import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/server/auth"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const authenticated = await verifyAdminSessionToken(token)
  return NextResponse.json({ authenticated })
}
