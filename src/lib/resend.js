const RESEND_API_URL = 'https://api.resend.com/emails'

export function isResendConfigured() {
  return Boolean(import.meta.env.VITE_RESEND_API_KEY && import.meta.env.VITE_RESEND_FROM_EMAIL)
}

export async function sendAlertEmail({ to, subject, html }) {
  if (!isResendConfigured()) {
    throw new Error('Resend nao configurado. Defina VITE_RESEND_API_KEY e VITE_RESEND_FROM_EMAIL.')
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: import.meta.env.VITE_RESEND_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Falha ao enviar email: ${errorText}`)
  }

  return response.json()
}

export function buildAlertRecipientList(recipients = []) {
  return Array.isArray(recipients) ? recipients.filter(Boolean) : [recipients].filter(Boolean)
}
