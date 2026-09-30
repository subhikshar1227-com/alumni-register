import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })

  // Idempotent: approving an already-approved registration is a no-op success.
  if (registration.status === "APPROVED") return NextResponse.json(serializeRegistration(registration))

  if (registration.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending registrations can be approved." }, { status: 409 })
  }

  const updated = await prisma.alumniRegistration.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date() },
  })

  return NextResponse.json(serializeRegistration(updated))
}
