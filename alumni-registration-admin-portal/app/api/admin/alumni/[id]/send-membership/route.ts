import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"
import { generateMembershipCard, readDocumentBuffer } from "@/lib/server/documents"
import { sendEmail } from "@/lib/server/mailer"
import { membershipCardEmail } from "@/lib/server/email-templates"

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  let registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })

  if (registration.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved registrations can be sent a membership card." }, { status: 409 })
  }
  if (!registration.alumniId) {
    return NextResponse.json({ error: "Alumni ID is missing for this approved registration." }, { status: 500 })
  }
  const alumniId = registration.alumniId

  // Reuse the existing card if one was already generated; never create a duplicate.
  let documentPath = registration.membershipCardPath
  if (!documentPath || registration.membershipStatus === "NOT_GENERATED") {
    const generated = await generateMembershipCard({
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
    documentPath = generated.documentPath
    registration = await prisma.alumniRegistration.update({
      where: { id },
      data: { membershipStatus: "GENERATED", membershipCardPath: documentPath },
    })
  }

  const { subject, html } = membershipCardEmail({ name: registration.name })

  try {
    const buffer = await readDocumentBuffer(documentPath)
    await sendEmail({
      to: registration.email,
      subject,
      html,
      attachments: [{ filename: "svce-alumni-membership-card.png", content: buffer, contentType: "image/png" }],
    })
  } catch (emailError) {
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType: "MEMBERSHIP_CARD",
        recipient: registration.email,
        subject,
        status: "FAILED",
        failureReason: emailError instanceof Error ? emailError.message : "Unknown error",
      },
    })
    return NextResponse.json({ error: "Could not send the email. The card was generated and can be resent." }, { status: 502 })
  }

  await prisma.emailLog.create({
    data: {
      registrationId: registration.id,
      emailType: "MEMBERSHIP_CARD",
      recipient: registration.email,
      subject,
      status: "SENT",
      sentAt: new Date(),
    },
  })

  const updated = await prisma.alumniRegistration.update({
    where: { id },
    data: { membershipStatus: "SENT" },
  })

  return NextResponse.json(serializeRegistration(updated))
}
