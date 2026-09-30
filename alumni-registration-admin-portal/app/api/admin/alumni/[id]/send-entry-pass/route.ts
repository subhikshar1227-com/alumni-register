import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"
import { generateEntryPass, readDocumentBuffer } from "@/lib/server/documents"
import { sendEmail } from "@/lib/server/mailer"
import { entryPassEmail } from "@/lib/server/email-templates"

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  let registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })

  if (registration.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved registrations can be sent an entry pass." }, { status: 409 })
  }
  if (!registration.attending) {
    return NextResponse.json({ error: "Entry pass is not applicable — this alumnus is not attending." }, { status: 409 })
  }

  // Reuse the existing pass if one was already generated; never create a duplicate.
  let documentPath = registration.entryPassPath
  if (!documentPath || registration.entryPassStatus === "NOT_GENERATED") {
    const generated = await generateEntryPass({
      alumniId: registration.alumniId,
      name: registration.name,
      batchYear: registration.batchYear,
      branch: registration.branch,
      usn: registration.usn,
      photoUrl: registration.photoUrl,
    })
    documentPath = generated.documentPath
    registration = await prisma.alumniRegistration.update({
      where: { id },
      data: { entryPassStatus: "GENERATED", entryPassPath: documentPath },
    })
  }

  const { subject, html } = entryPassEmail({ name: registration.name })

  try {
    const buffer = await readDocumentBuffer(documentPath)
    await sendEmail({
      to: registration.email,
      subject,
      html,
      attachments: [{ filename: "svce-alumni-entry-pass.png", content: buffer, contentType: "image/png" }],
    })
  } catch (emailError) {
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType: "ENTRY_PASS",
        recipient: registration.email,
        subject,
        status: "FAILED",
        failureReason: emailError instanceof Error ? emailError.message : "Unknown error",
      },
    })
    return NextResponse.json({ error: "Could not send the email. The pass was generated and can be resent." }, { status: 502 })
  }

  await prisma.emailLog.create({
    data: {
      registrationId: registration.id,
      emailType: "ENTRY_PASS",
      recipient: registration.email,
      subject,
      status: "SENT",
      sentAt: new Date(),
    },
  })

  const updated = await prisma.alumniRegistration.update({
    where: { id },
    data: { entryPassStatus: "SENT" },
  })

  return NextResponse.json(serializeRegistration(updated))
}
