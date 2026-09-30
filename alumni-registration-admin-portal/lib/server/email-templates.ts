const COLLEGE_NAME = "Sri Venkateshwara College of Engineering"

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

export function membershipCardEmail(input: { name: string }) {
  const subject = "Your SVCE Alumni Membership Card – 25th Silver Jubilee"
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #18202b;">
      <p>Dear ${escapeHtml(input.name)},</p>
      <p>Your Alumni registration has been successfully verified.</p>
      <p>Please find your Alumni Membership Card attached to this email.</p>
      <p>Thank you for being part of the SVCE Alumni community.</p>
      <p style="margin-top: 24px;">Regards,<br/>${COLLEGE_NAME}</p>
    </div>
  `
  return { subject, html }
}

export function entryPassEmail(input: { name: string }) {
  const subject = "Your SVCE 25th Silver Jubilee Event Entry Pass"
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #18202b;">
      <p>Dear ${escapeHtml(input.name)},</p>
      <p>Your registration for the 25th Silver Jubilee Alumni Celebration has been approved.</p>
      <p>Please find your Event Entry Pass attached.</p>
      <p>We look forward to welcoming you back to SVCE.</p>
      <p style="margin-top: 24px;">Regards,<br/>${COLLEGE_NAME}</p>
    </div>
  `
  return { subject, html }
}
