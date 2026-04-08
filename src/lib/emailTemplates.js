const APP_NAME = 'FinançasAPP'

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

  const dateText = dueDate
    ? new Date(dueDate).toLocaleDateString('pt-BR')
    : 'Sem vencimento definido'

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
    actionLabel: 'Abrir FinançasAPP',
    footerNote: 'Você pode revisar esse lançamento diretamente no aplicativo.',
  })
}
