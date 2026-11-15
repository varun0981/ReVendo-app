import nodemailer from 'nodemailer'

function getTransport() {
  if (!process.env.SMTP_HOST) return null

  const options = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
  }
  if (process.env.SMTP_USER) {
    options.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  }
  return nodemailer.createTransport(options)
}

export async function sendAccountEmail({ to, subject, text, html }) {
  const transport = getTransport()
  if (!transport) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Email delivery is not configured. Set SMTP_HOST and SMTP credentials.')
    }
    console.info(`[development email] ${subject} for ${to}\n${text}`)
    return false
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'ReVendo <no-reply@revendo.local>',
    to,
    subject,
    text,
    html,
  })
  return true
}
