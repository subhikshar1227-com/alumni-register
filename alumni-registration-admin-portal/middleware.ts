import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/server/auth"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const isValid = await verifyAdminSessionToken(token)

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized. Please sign in again." }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/admin/alumni/:path*"
  ],
}
