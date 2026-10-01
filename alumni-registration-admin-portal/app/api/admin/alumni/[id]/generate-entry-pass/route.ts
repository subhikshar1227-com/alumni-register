import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"
import { generateEntryPass } from "@/lib/server/documents"

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })

  if (registration.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved registrations can have an entry pass generated." }, { status: 409 })
  }

  if (!registration.attending) {
    return NextResponse.json({ error: "Entry pass is not applicable — this alumnus is not attending." }, { status: 409 })
  }
  if (!registration.alumniId) {
    return NextResponse.json({ error: "Alumni ID is missing for this approved registration." }, { status: 500 })
  }
  const alumniId = registration.alumniId

  // Idempotent: reuse the existing pass instead of generating a duplicate.
  if (registration.entryPassStatus === "GENERATED" || registration.entryPassStatus === "SENT") {
    return NextResponse.json(serializeRegistration(registration))
  }

  const { documentPath } = await generateEntryPass({
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
    data: { entryPassStatus: "GENERATED", entryPassPath: documentPath },
  })

  return NextResponse.json(serializeRegistration(updated))
}
