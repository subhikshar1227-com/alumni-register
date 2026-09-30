import type { AlumniRegistration, EmailLog } from "@prisma/client"

export function serializeRegistration(registration: AlumniRegistration) {
  return {
    id: registration.id,
    alumniId: registration.alumniId,
    name: registration.name,
    batchYear: registration.batchYear,
    branch: registration.branch,
    usn: registration.usn,
    photoUrl: registration.photoUrl,
    attending: registration.attending,
    peopleCount: registration.peopleCount,
    food: registration.food,
    phone: registration.phone,
    email: registration.email,
    company: registration.company,
    position: registration.position,
    awards: registration.awards,
    experience: registration.experience,
    linkedinUrl: registration.linkedinUrl,
    status: registration.status,
    rejectionReason: registration.rejectionReason,
    membershipStatus: registration.membershipStatus,
    membershipCardUrl: registration.membershipCardPath ? `/${registration.membershipCardPath}` : null,
    entryPassStatus: registration.entryPassStatus,
    entryPassUrl: registration.entryPassPath ? `/${registration.entryPassPath}` : null,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
    approvedAt: registration.approvedAt,
    rejectedAt: registration.rejectedAt,
  }
}

export function serializeEmailLog(log: EmailLog) {
  return {
    id: log.id,
    emailType: log.emailType,
    recipient: log.recipient,
    subject: log.subject,
    status: log.status,
    failureReason: log.failureReason,
    sentAt: log.sentAt,
    createdAt: log.createdAt,
  }
}
