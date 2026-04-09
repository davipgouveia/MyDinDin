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
    let errorMessage = 'Falha ao enviar email.'

    try {
      const payload = await response.json()
      errorMessage = payload?.error || errorMessage
    } catch {
      const errorText = await response.text()
      if (errorText) errorMessage = errorText
    }

    if (response.status === 429) {
      throw new Error('Limite de envio de emails atingido temporariamente. Aguarde alguns instantes e tente novamente.')
    }

    throw new Error(`Falha ao enviar email: ${errorMessage}`)
  }

  return response.json()
}

export function buildAlertRecipientList(recipients = []) {
  return Array.isArray(recipients) ? recipients.filter(Boolean) : [recipients].filter(Boolean)
}
