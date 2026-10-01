import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"
import { generateMembershipCard } from "@/lib/server/documents"

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })

  if (registration.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved registrations can have a membership card generated." }, { status: 409 })
  }

  // Idempotent: reuse the existing card instead of generating a duplicate.
  if (registration.membershipStatus === "GENERATED" || registration.membershipStatus === "SENT") {
    return NextResponse.json(serializeRegistration(registration))
  }

  const { documentPath } = await generateMembershipCard({
    alumniId: registration.alumniId,
    name: registration.name,
    batchYear: registration.batchYear,
    branch: registration.branch,
    usn: registration.usn,
    phone: registration.phone,
    photoUrl: registration.photoUrl,
  })

  const updated = await prisma.alumniRegistration.update({
    where: { id },
    data: { membershipStatus: "GENERATED", membershipCardPath: documentPath },
  })

  return NextResponse.json(serializeRegistration(updated))
}
