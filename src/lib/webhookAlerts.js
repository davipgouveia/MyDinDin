const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_ALERT_URL || process.env.VITE_WEBHOOK_ALERT_URL

export function isWebhookConfigured() {
  return Boolean(webhookUrl)
}

export async function sendWebhookAlert(payload) {
  if (!webhookUrl) {
    throw new Error('Webhook nao configurado. Defina NEXT_PUBLIC_WEBHOOK_ALERT_URL no .env')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'mydindin',
      sentAt: new Date().toISOString(),
      ...payload,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`Falha no webhook (${response.status}): ${bodyText}`)
  }
}
