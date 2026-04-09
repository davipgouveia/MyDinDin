import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { to, subject, html } = await request.json()
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL

    if (!apiKey || !from) {
      return NextResponse.json(
        { error: 'Resend nao configurado. Defina RESEND_API_KEY e RESEND_FROM_EMAIL.' },
        { status: 500 },
      )
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const isRateLimited = response.status === 429 || String(errorText).toLowerCase().includes('rate limit')

      if (isRateLimited) {
        return NextResponse.json(
          { error: 'Limite temporario de envio de email atingido no provedor. Tente novamente em alguns instantes.' },
          { status: 429 },
        )
      }

      return NextResponse.json({ error: `Falha ao enviar email: ${errorText}` }, { status: response.status || 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Falha inesperada' }, { status: 500 })
  }
}
