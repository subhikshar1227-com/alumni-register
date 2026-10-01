import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"

// Public, unauthenticated by design (scanned at the event gate by whoever
// is coordinating entry, who won't have an admin login on their phone) —
// deliberately excluded from middleware.ts's auth matcher. Only returns the
// minimal fields a coordinator needs at the door, never the full
// registration (no email, phone, company, etc.).
function summarize(registration: {
  name: string
  status: string
  attending: boolean
  peopleCount: number | null
  checkedIn: boolean
  checkedInAt: Date | null
}) {
  return {
    name: registration.name,
    eligible: registration.status === "APPROVED" && registration.attending,
    notApproved: registration.status !== "APPROVED",
    notAttending: !registration.attending,
    peopleCount: registration.peopleCount ?? 1,
    checkedIn: registration.checkedIn,
    checkedInAt: registration.checkedInAt,
  }
}

export async function GET(_request: Request, context: { params: Promise<{ alumniId: string }> }) {
  const { alumniId } = await context.params
  const registration = await prisma.alumniRegistration.findUnique({ where: { alumniId } })
  if (!registration) return NextResponse.json({ error: "No registration matches this Alumni ID." }, { status: 404 })
  return NextResponse.json(summarize(registration))
}

export async function POST(_request: Request, context: { params: Promise<{ alumniId: string }> }) {
  const { alumniId } = await context.params
  const registration = await prisma.alumniRegistration.findUnique({ where: { alumniId } })
  if (!registration) return NextResponse.json({ error: "No registration matches this Alumni ID." }, { status: 404 })

  if (registration.status !== "APPROVED" || !registration.attending) {
    return NextResponse.json({ error: "This registration is not eligible for event check-in." }, { status: 409 })
  }

  // Idempotent: scanning/tapping again after a successful check-in just
  // returns the existing confirmation instead of erroring or overwriting
  // the original checked-in time.
  const updated = registration.checkedIn
    ? registration
    : await prisma.alumniRegistration.update({
        where: { alumniId },
        data: { checkedIn: true, checkedInAt: new Date() },
      })

  return NextResponse.json(summarize(updated))
}
