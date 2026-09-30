import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : ""

  const registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })

  // Idempotent: rejecting an already-rejected registration is a no-op success.
  if (registration.status === "REJECTED") return NextResponse.json(serializeRegistration(registration))

  if (registration.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending registrations can be rejected." }, { status: 409 })
  }

  const updated = await prisma.alumniRegistration.update({
    where: { id },
    data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: reason || null },
  })

  return NextResponse.json(serializeRegistration(updated))
}
