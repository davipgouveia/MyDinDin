import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const EMAIL_PAGE_SIZE = 200
const EMAIL_PAGE_LIMIT = 20

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
    const { email } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Informe um email valido.' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        exists: false,
        checked: false,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const exists = await findUserByEmail(supabaseAdmin, normalizedEmail)

    return NextResponse.json({
      exists,
      checked: true,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Falha inesperada na verificacao de email.' }, { status: 500 })
  }
}
