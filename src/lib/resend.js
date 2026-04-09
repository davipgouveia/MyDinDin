export function isResendConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL)
}

export async function sendAlertEmail({ to, subject, html }) {
  const response = await fetch('/api/resend/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
