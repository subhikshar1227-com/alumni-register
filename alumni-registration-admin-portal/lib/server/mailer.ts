import nodemailer from "nodemailer"

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT ?? 587)
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASSWORD

  if (!host || !user || !pass) {
    throw new Error("Email is not configured: set EMAIL_HOST, EMAIL_USER and EMAIL_PASSWORD.")
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return transporter
}

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; content: Buffer; contentType?: string }[]
}

export async function sendEmail(input: SendEmailInput) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER
  await getTransporter().sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  })
}
