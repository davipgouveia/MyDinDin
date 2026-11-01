import { NextResponse } from 'next/server'
import { getUserFromRequest, getClientIp } from '../../../../src/lib/serverAuth'
import { rateLimit } from '../../../../src/lib/rateLimit'

const MAX_RECIPIENTS = 10
const MAX_SUBJECT_LENGTH = 200
const MAX_HTML_LENGTH = 100_000

export async function POST(request) {
  try {
    // Rota protegida: só usuários logados podem disparar e-mails
    // (antes esta rota era um relay aberto, sem nenhuma autenticação).
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para enviar e-mails.' },
        { status: 401 },
      )
    }

    const ip = getClientIp(request)
    const porUsuario = rateLimit(`resend:user:${user.id}`, 20, 60 * 60 * 1000)
    const porIp = rateLimit(`resend:ip:${ip}`, 40, 60 * 60 * 1000)
    if (!porUsuario.ok || !porIp.ok) {
      return NextResponse.json(
        { error: 'Limite de envio de e-mails atingido. Tente novamente mais tarde.' },
        { status: 429 },
      )
    }

    const { to, subject, html } = await request.json()
    const recipients = Array.isArray(to) ? to : [to]

    if (
      recipients.length === 0 ||
      recipients.length > MAX_RECIPIENTS ||
      recipients.some((email) => typeof email !== 'string' || !email.includes('@'))
    ) {
      return NextResponse.json({ error: 'Destinatários inválidos.' }, { status: 400 })
    }
    if (
      typeof subject !== 'string' ||
      subject.length === 0 ||
      subject.length > MAX_SUBJECT_LENGTH ||
      typeof html !== 'string' ||
      html.length === 0 ||
      html.length > MAX_HTML_LENGTH
    ) {
      return NextResponse.json({ error: 'Conteúdo do e-mail inválido.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL

    if (!apiKey || !from) {
      return NextResponse.json(
        { error: 'Resend nao configurado. Defina RESEND_API_KEY e RESEND_FROM_EMAIL.' },
        { status: 500 },
      )
    }

    const authValue = 'Bearer ' + apiKey
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authValue,
      },
      body: JSON.stringify({
        from,
        to: recipients,
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
