import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { registrationSchema } from "@/lib/server/validation"
import { generateAlumniId } from "@/lib/server/alumni-id"
import { savePhoto } from "@/lib/server/photo-storage"
import { sendEmail } from "@/lib/server/mailer"
import { registrationAcknowledgementEmail } from "@/lib/server/email-templates"

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 })
  }

  const raw = {
    name: formData.get("name"),
    year: formData.get("year"),
    branch: formData.get("branch"),
    usn: formData.get("usn") ?? "",
    attending: formData.get("attending"),
    peopleCount: formData.get("peopleCount") || undefined,
    food: formData.get("food") || undefined,
    phone: formData.get("phone"),
    email: formData.get("email"),
    company: formData.get("company"),
    position: formData.get("position") ?? "",
    awards: formData.get("awards") ?? "",
    experience: formData.get("experience") ?? "",
    linkedinUrl: formData.get("linkedinUrl") ?? "",
  }

  const parsed = registrationSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 })
  }

  const data = parsed.data

  const photoFile = formData.get("photo")
  if (!(photoFile instanceof File) || photoFile.size === 0) {
    return NextResponse.json(
      { error: "Please upload a profile photo.", fieldErrors: { photo: "A profile photo is required." } },
      { status: 400 },
    )
  }

  // A prior PENDING or APPROVED registration with this email counts as a
  // duplicate. A REJECTED registration does not block re-registering.
  const existing = await prisma.alumniRegistration.findFirst({
    where: { email: data.email, status: { in: ["PENDING", "APPROVED"] } },
  })
  if (existing) {
    return NextResponse.json(
      { error: "A registration with this email is already pending or approved." },
      { status: 409 },
    )
  }

  let photo: { photoPath: string; photoUrl: string }
  try {
    photo = await savePhoto(photoFile)
  } catch (photoError) {
    return NextResponse.json(
      { error: photoError instanceof Error ? photoError.message : "Could not process the uploaded photo." },
      { status: 400 },
    )
  }

  const attending = data.attending === "yes"
  const alumniId = await generateAlumniId()

  const registration = await prisma.alumniRegistration.create({
    data: {
      alumniId,
      name: data.name,
      batchYear: data.year,
      branch: data.branch,
      usn: data.usn || null,
      photoUrl: photo.photoUrl,
      photoPath: photo.photoPath,
      attending,
      peopleCount: attending ? data.peopleCount ?? null : null,
      food: attending ? (data.food === "non-veg" ? "NON_VEG" : "VEG") : null,
      phone: data.phone,
      email: data.email,
      company: data.company,
      position: data.position || null,
      awards: data.awards || null,
      experience: data.experience || null,
      linkedinUrl: data.linkedinUrl || null,
      status: "PENDING",
      entryPassStatus: attending ? "NOT_GENERATED" : "NOT_APPLICABLE",
    },
  })

  try {
    const { subject, html } = registrationAcknowledgementEmail({
      name: registration.name,
      alumniId: registration.alumniId,
      attending,
    })
    await sendEmail({ to: registration.email, subject, html })
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType: "REGISTRATION_ACKNOWLEDGEMENT",
        recipient: registration.email,
        subject,
        status: "SENT",
        sentAt: new Date(),
      },
    })
  } catch (emailError) {
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType: "REGISTRATION_ACKNOWLEDGEMENT",
        recipient: registration.email,
        subject: "Your SVCE Alumni Registration Has Been Received",
        status: "FAILED",
        failureReason: emailError instanceof Error ? emailError.message : "Unknown error",
      },
    })
  }

  return NextResponse.json({
    success: true,
    id: registration.id,
    alumniId: registration.alumniId,
    status: registration.status,
  })
}
