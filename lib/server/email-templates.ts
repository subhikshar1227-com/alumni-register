const COLLEGE_NAME = "Sri Venkateshwara College of Engineering"

export function registrationAcknowledgementEmail(input: { name: string; alumniId: string | null; attending: boolean }) {
  const subject = "Your SVCE Alumni Registration Has Been Received"
  const documentLine = input.attending
    ? "Your Alumni Membership Card and Event Entry Pass will be processed after verification."
    : "Your Alumni Membership Card will be processed after verification."
  const alumniIdLine = input.alumniId
    ? `Your Alumni ID: <strong>${escapeHtml(input.alumniId)}</strong>`
    : "Your Alumni ID will be shared once your registration is verified."

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #18202b;">
      <p>Dear ${escapeHtml(input.name)},</p>
      <p>Thank you for registering for the 25th Silver Jubilee Alumni Celebration of ${COLLEGE_NAME}.</p>
      <p>Your registration has been successfully received and is currently under verification.</p>
      <p>${documentLine}</p>
      <p style="margin-top: 24px;">${alumniIdLine}</p>
      <p style="margin-top: 24px;">Regards,<br/>${COLLEGE_NAME}</p>
    </div>
  `
  return { subject, html }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })
}
