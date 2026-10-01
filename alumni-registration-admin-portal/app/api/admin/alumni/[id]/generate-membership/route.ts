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
  if (!registration.alumniId) {
    return NextResponse.json({ error: "Alumni ID is missing for this approved registration." }, { status: 500 })
  }
  const alumniId = registration.alumniId

  // Idempotent: reuse the existing card instead of generating a duplicate.
  if (registration.membershipStatus === "GENERATED" || registration.membershipStatus === "SENT") {
    return NextResponse.json(serializeRegistration(registration))
  }

  const { documentPath } = await generateMembershipCard({
    alumniId,
    name: registration.name,
    batchYear: registration.batchYear,
    branch: registration.branch,
    usn: registration.usn,
    phone: registration.phone,
    photoUrl: registration.photoUrl,
    company: registration.company,
    position: registration.position,
  })

  const updated = await prisma.alumniRegistration.update({
    where: { id },
    data: { membershipStatus: "GENERATED", membershipCardPath: documentPath },
  })

  return NextResponse.json(serializeRegistration(updated))
}
