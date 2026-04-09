import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { buildSignupVerificationEmail } from '../../../../src/lib/emailTemplates'

const EMAIL_ALREADY_REGISTERED_ERROR = 'Este email ja possui cadastro. Use Entrar ou Esqueci minha senha.'
const EMAIL_PAGE_SIZE = 200
const EMAIL_PAGE_LIMIT = 20

const sendVerificationEmail = async ({ to, actionUrl }) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    throw new Error('Envio de verificacao indisponivel. Configure RESEND_API_KEY e RESEND_FROM_EMAIL.')
  }

  const html = buildSignupVerificationEmail({ actionUrl })

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Confirme seu email no MyDinDin',
      html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    const status = response.status || 500
    if (status === 429) {
      throw new Error('Limite temporario de envio de email atingido. Tente novamente em alguns instantes.')
    }
    throw new Error(`Falha ao enviar email de verificacao: ${errorText}`)
  }
}

const findUserByEmail = async (supabaseAdmin, normalizedEmail) => {
  for (let page = 1; page <= EMAIL_PAGE_LIMIT; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: EMAIL_PAGE_SIZE,
    })

    if (error) {
      throw error
    }

    const users = data?.users ?? []
    const hasMatch = users.some((user) => String(user?.email || '').toLowerCase() === normalizedEmail)
    if (hasMatch) {
      return true
    }

    if (users.length < EMAIL_PAGE_SIZE) {
      return false
    }
  }

  return false
}

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '')

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Informe um email valido.' }, { status: 400 })
    }

    if (normalizedPassword.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Cadastro indisponivel no momento. Configure SUPABASE_SERVICE_ROLE_KEY no servidor.' },
        { status: 503 },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const emailExists = await findUserByEmail(supabaseAdmin, normalizedEmail)
    if (emailExists) {
      return NextResponse.json({ error: EMAIL_ALREADY_REGISTERED_ERROR }, { status: 409 })
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${String(origin).replace(/\/$/, '')}/auth/callback`

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (linkError) {
      const message = String(linkError.message || '').toLowerCase()
      const isAlreadyRegistered = message.includes('already') && message.includes('registered')
      if (isAlreadyRegistered) {
        return NextResponse.json({ error: EMAIL_ALREADY_REGISTERED_ERROR }, { status: 409 })
      }

      return NextResponse.json(
        { error: linkError.message || 'Nao foi possivel gerar verificacao de email.' },
        { status: 500 },
      )
    }

    const actionLink = linkData?.properties?.action_link
    if (!actionLink) {
      return NextResponse.json(
        { error: 'Nao foi possivel gerar o link de confirmacao de email.' },
        { status: 500 },
      )
    }

    await sendVerificationEmail({
      to: normalizedEmail,
      actionUrl: actionLink,
    })

    return NextResponse.json({
      success: true,
      requiresEmailVerification: true,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Falha inesperada no cadastro.' }, { status: 500 })
  }
}
