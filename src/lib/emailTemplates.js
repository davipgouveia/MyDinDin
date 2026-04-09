import { formatDateBR } from '../utils/date'

const APP_NAME = 'MyDinDin'

const logoMarkup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="88" height="88" style="display:block;margin:0 auto;">
    <rect width="120" height="120" rx="24" fill="transparent"/>
    <path d="M30 30Q60 15 60 15Q60 15 90 30V55Q90 85 60 95Q30 85 30 55Z" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M45 35Q60 28 75 35M40 45H80M45 55Q60 50 75 55M35 65H85" stroke="#ffffff" stroke-opacity="0.78" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <rect x="40" y="60" width="8" height="20" rx="1" fill="#ffffff" fill-opacity="0.9"/>
    <rect x="52" y="50" width="8" height="30" rx="1" fill="#ffffff" fill-opacity="0.95"/>
    <rect x="64" y="55" width="8" height="25" rx="1" fill="#ffffff" fill-opacity="0.9"/>
    <path d="M76 62V48M73 52L76 48L79 52" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>
`

function renderFinanceEmailButton(href, label) {
  return `
    <div style="margin-top:28px;text-align:center;">
      <a href="${href}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:linear-gradient(135deg, #ffffff, #dbeafe);color:#0f172a;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 12px 24px rgba(255,255,255,0.15);">
        ${label}
      </a>
    </div>
  `
}

export function buildEmailShell({ title, body, actionUrl, actionLabel, footerNote }) {
  const buttonHtml = actionUrl && actionLabel ? renderFinanceEmailButton(actionUrl, actionLabel) : ''

  return `
  <div style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="background:linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));border:1px solid rgba(255,255,255,0.1);border-radius:24px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.35);">
        <div style="padding:28px 28px 18px 28px;text-align:center;background:radial-gradient(circle at top, rgba(255,255,255,0.16), rgba(255,255,255,0));">
          <div style="width:88px;height:88px;margin:0 auto 18px auto;">${logoMarkup}</div>
          <div style="font-size:13px;letter-spacing:0.24em;text-transform:uppercase;color:#cbd5e1;">${APP_NAME}</div>
          <h1 style="margin:12px 0 0 0;font-size:28px;line-height:1.15;color:#ffffff;">${title}</h1>
        </div>
        <div style="padding:0 28px 28px 28px;">
          <div style="font-size:16px;line-height:1.7;color:#cbd5e1;">${body}</div>
          ${buttonHtml}
          <div style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;line-height:1.6;color:#94a3b8;">
            ${footerNote || 'Se voce nao solicitou este alerta, ignore este email.'}
          </div>
        </div>
      </div>
    </div>
  </div>
  `
}

export function buildAlertEmail({ alertTitle, amount, dueDate, actionUrl }) {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(amount) || 0)

  const dateText = formatDateBR(dueDate, 'Sem vencimento definido')

  return buildEmailShell({
    title: alertTitle || 'Alerta financeiro',
    body: `
      <p style="margin:0 0 16px 0;">Segue um alerta automatizado da sua conta:</p>
      <div style="display:grid;gap:12px;">
        <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Valor</div>
          <div style="margin-top:6px;font-size:22px;font-weight:700;color:#ffffff;">${formattedAmount}</div>
        </div>
        <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Vencimento</div>
          <div style="margin-top:6px;font-size:16px;font-weight:600;color:#ffffff;">${dateText}</div>
        </div>
      </div>
    `,
    actionUrl,
    actionLabel: 'Abrir MyDinDin',
    footerNote: 'Você pode revisar esse lançamento diretamente no aplicativo.',
  })
}

export function buildPasswordResetEmail({ requestedAt, actionUrl, supportEmail }) {
  const requestedAtText = formatDateBR(requestedAt, formatDateBR(new Date().toISOString(), 'Agora'))

  return buildEmailShell({
    title: 'Redefinicao de senha solicitada',
    body: `
      <p style="margin:0 0 16px 0;">Recebemos uma solicitacao para redefinir sua senha no ${APP_NAME}.</p>
      <p style="margin:0 0 16px 0;">Se foi voce, use o botao abaixo para continuar com seguranca.</p>
      <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Solicitacao registrada em</div>
        <div style="margin-top:6px;font-size:16px;font-weight:600;color:#ffffff;">${requestedAtText}</div>
      </div>
      <p style="margin:16px 0 0 0;">Caso nao tenha sido voce, recomendamos trocar a senha do seu email principal e revisar dispositivos conectados.</p>
    `,
    actionUrl,
    actionLabel: 'Redefinir senha',
    footerNote: supportEmail
      ? `Se precisar de ajuda, fale com ${supportEmail}.`
      : 'Se voce nao solicitou essa redefinicao, ignore este email com seguranca.',
  })
}

export function buildDueReminderEmail({ description, amount, dueDate, daysLeft, actionUrl }) {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(amount) || 0)

  const dueText = formatDateBR(dueDate, 'Sem vencimento definido')
  const urgencyLabel =
    typeof daysLeft === 'number'
      ? daysLeft <= 0
        ? 'Vence hoje'
        : `Vence em ${daysLeft} dia(s)`
      : 'Vencimento proximo'

  return buildEmailShell({
    title: 'Lembrete de vencimento',
    body: `
      <p style="margin:0 0 16px 0;">Temos um lembrete importante para sua organizacao financeira:</p>
      <div style="display:grid;gap:12px;">
        <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Lancamento</div>
          <div style="margin-top:6px;font-size:16px;font-weight:600;color:#ffffff;">${description || 'Despesa/receita'}</div>
        </div>
        <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Valor</div>
            <div style="margin-top:6px;font-size:18px;font-weight:700;color:#ffffff;">${formattedAmount}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Vencimento</div>
            <div style="margin-top:6px;font-size:14px;font-weight:600;color:#ffffff;">${dueText}</div>
            <div style="margin-top:4px;font-size:12px;color:#cbd5e1;">${urgencyLabel}</div>
          </div>
        </div>
      </div>
    `,
    actionUrl,
    actionLabel: 'Abrir e revisar agora',
    footerNote: 'Manter vencimentos em dia reduz multas e melhora sua previsibilidade mensal.',
  })
}

export function buildBudgetWarningEmail({ category, spent, limit, usagePercent, actionUrl }) {
  const fmt = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value) || 0)

  const resolvedUsage = Number.isFinite(Number(usagePercent))
    ? Number(usagePercent)
    : (Number(limit) > 0 ? (Number(spent) / Number(limit)) * 100 : 0)

  return buildEmailShell({
    title: 'Alerta de orcamento',
    body: `
      <p style="margin:0 0 16px 0;">Seu orcamento de <strong>${category || 'Categoria'}</strong> atingiu nivel de atencao.</p>
      <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Consumo atual</div>
        <div style="margin-top:6px;font-size:16px;font-weight:700;color:#ffffff;">${fmt(spent)} de ${fmt(limit)} (${resolvedUsage.toFixed(0)}%)</div>
      </div>
      <p style="margin:16px 0 0 0;">Se quiser, ajuste o limite ou priorize os gastos essenciais ate o fim do periodo.</p>
    `,
    actionUrl,
    actionLabel: 'Revisar orcamento',
    footerNote: 'Acompanhar orcamentos semanalmente evita surpresas no fechamento do mes.',
  })
}

export function buildMonthlySummaryEmail({ monthLabel, income, expense, balance, topCategory, actionUrl }) {
  const fmt = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value) || 0)

  return buildEmailShell({
    title: `Resumo mensal${monthLabel ? ` - ${monthLabel}` : ''}`,
    body: `
      <p style="margin:0 0 16px 0;">Fechamos seu resumo do periodo com os principais indicadores:</p>
      <div style="display:grid;gap:10px;">
        <div style="padding:12px 14px;border-radius:14px;background:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.25);">Receitas: <strong style="color:#ffffff;">${fmt(income)}</strong></div>
        <div style="padding:12px 14px;border-radius:14px;background:rgba(239,68,68,0.14);border:1px solid rgba(239,68,68,0.25);">Despesas: <strong style="color:#ffffff;">${fmt(expense)}</strong></div>
        <div style="padding:12px 14px;border-radius:14px;background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.25);">Saldo: <strong style="color:#ffffff;">${fmt(balance)}</strong></div>
      </div>
      ${topCategory ? `<p style="margin:16px 0 0 0;">Categoria com maior impacto: <strong>${topCategory}</strong>.</p>` : ''}
    `,
    actionUrl,
    actionLabel: 'Ver detalhes no painel',
    footerNote: 'Use este resumo para ajustar metas, limites e planejamento do proximo mes.',
  })
}

export function buildSecurityNoticeEmail({ title, message, actionUrl }) {
  return buildEmailShell({
    title: title || 'Aviso de seguranca',
    body: `
      <p style="margin:0 0 16px 0;">${message || 'Detectamos uma atividade sensivel em sua conta.'}</p>
      <p style="margin:0;">Se voce reconhece a acao, nao e necessario fazer nada. Caso contrario, revise o acesso da sua conta imediatamente.</p>
    `,
    actionUrl,
    actionLabel: 'Revisar seguranca da conta',
    footerNote: 'Dica: mantenha sua senha unica e atualizada periodicamente.',
  })
}

export function buildSignupVerificationEmail({ actionUrl }) {
  return buildEmailShell({
    title: 'Confirme seu email para entrar',
    body: `
      <p style="margin:0 0 16px 0;">Sua conta no ${APP_NAME} foi criada com sucesso.</p>
      <p style="margin:0 0 16px 0;">Para liberar o acesso, confirme seu email clicando no botao abaixo.</p>
      <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Etapa obrigatoria</div>
        <div style="margin-top:6px;font-size:16px;font-weight:600;color:#ffffff;">Verificacao de email antes do primeiro login</div>
      </div>
      <p style="margin:16px 0 0 0;">Se nao foi voce, ignore este email com seguranca.</p>
    `,
    actionUrl,
    actionLabel: 'Confirmar email',
    footerNote: 'Depois da confirmacao, volte ao app e faca login normalmente.',
  })
}

export function buildGroupInviteEmail({ groupName, inviterName, expiresAt, actionUrl }) {
  const expiresText = formatDateBR(expiresAt, 'Sem expiracao definida')

  return buildEmailShell({
    title: 'Convite para grupo no MyDinDin',
    body: `
      <p style="margin:0 0 16px 0;">Voce recebeu um convite para participar de um grupo financeiro no ${APP_NAME}.</p>
      <div style="display:grid;gap:12px;">
        <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Grupo</div>
          <div style="margin-top:6px;font-size:16px;font-weight:700;color:#ffffff;">${groupName || 'Grupo sem nome'}</div>
        </div>
        <div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Convidado por</div>
            <div style="margin-top:6px;font-size:14px;font-weight:600;color:#ffffff;">${inviterName || 'Administrador do grupo'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Expira em</div>
            <div style="margin-top:6px;font-size:14px;font-weight:600;color:#ffffff;">${expiresText}</div>
          </div>
        </div>
      </div>
      <p style="margin:16px 0 0 0;">Ao abrir o app e entrar com este email, selecione a opcao <strong>Entrar em grupo</strong> para aceitar o convite.</p>
    `,
    actionUrl,
    actionLabel: 'Abrir MyDinDin',
    footerNote: 'Se voce nao esperava este convite, basta ignorar este email.',
  })
}
