import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"
import { generateAlumniId } from "@/lib/server/alumni-id"

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })

  // Idempotent: approving an already-approved registration is a no-op success.
  if (registration.status === "APPROVED") return NextResponse.json(serializeRegistration(registration))

  if (registration.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending registrations can be approved." }, { status: 409 })
  }

  // The Alumni ID is assigned here, the single point of approval — never
  // at registration time, and never regenerated on a later refresh since
  // the idempotent early-return above means this branch only runs once
  // per registration.
  const alumniId = registration.alumniId ?? (await generateAlumniId())

  const updated = await prisma.alumniRegistration.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), alumniId },
  })

  return NextResponse.json(serializeRegistration(updated))
}
