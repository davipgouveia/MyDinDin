import { formatDateBR } from '../utils/date'

const APP_NAME = 'MyDinDin'
const APP_TAGLINE = 'Suas finanças em família, sem complicação'

// Identidade visual alinhada ao app: fundo slate-950, cartão slate-900,
// destaque ciano (#06b6d4). Layout 100% em tabelas + CSS inline, sem SVG
// nem grid/flex — é o que Gmail, Outlook e Apple Mail renderizam igual.

const COLORS = {
  bg: '#020617',
  card: '#0f172a',
  cardBorder: '#1e293b',
  inner: '#1e293b',
  innerSoft: 'rgba(148, 163, 184, 0.08)',
  text: '#e2e8f0',
  muted: '#94a3b8',
  faint: '#64748b',
  white: '#ffffff',
  accent: '#06b6d4',
  accentDark: '#083344',
  green: '#10b981',
  red: '#ef4444',
  sky: '#38bdf8',
}

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, Helvetica, sans-serif"

function brandHeader() {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:8px 0 4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td width="46" height="46" align="center" valign="middle" bgcolor="${COLORS.accent}" style="border-radius:13px;background-color:${COLORS.accent};background-image:linear-gradient(135deg, #22d3ee, ${COLORS.accent});font-family:${FONT};font-size:24px;font-weight:800;color:${COLORS.accentDark};line-height:46px;">M</td>
            <td style="padding-left:12px;font-family:${FONT};font-size:24px;font-weight:800;color:${COLORS.white};letter-spacing:-0.02em;">My<span style="color:${COLORS.accent};">DinDin</span></td>
          </tr>
        </table>
        <div style="margin-top:10px;font-family:${FONT};font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${COLORS.faint};">${APP_TAGLINE}</div>
      </td>
    </tr>
  </table>`
}

function renderEmailButton(href, label) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:30px auto 6px auto;">
    <tr>
      <td align="center" bgcolor="${COLORS.accent}" style="border-radius:14px;background-color:${COLORS.accent};background-image:linear-gradient(135deg, #22d3ee, ${COLORS.accent});box-shadow:0 10px 24px rgba(6, 182, 212, 0.35);">
        <a href="${href}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:15px;font-weight:700;color:${COLORS.accentDark};text-decoration:none;border-radius:14px;">${label}</a>
      </td>
    </tr>
  </table>
  <div style="margin-top:14px;text-align:center;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLORS.faint};">
    Se o botão não funcionar, copie e cole este link no navegador:<br />
    <a href="${href}" target="_blank" style="color:${COLORS.sky};text-decoration:underline;word-break:break-all;">${href}</a>
  </div>`
}

function infoCard(label, value, valueSize = 16) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    <tr>
      <td style="padding:14px 16px;border-radius:14px;background-color:${COLORS.innerSoft};border:1px solid ${COLORS.cardBorder};">
        <div style="font-family:${FONT};font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:${COLORS.muted};">${label}</div>
        <div style="margin-top:6px;font-family:${FONT};font-size:${valueSize}px;font-weight:700;color:${COLORS.white};">${value}</div>
      </td>
    </tr>
  </table>`
}

function twoColCard(leftLabel, leftValue, rightLabel, rightValue) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    <tr>
      <td style="padding:14px 16px;border-radius:14px;background-color:${COLORS.innerSoft};border:1px solid ${COLORS.cardBorder};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="top" style="font-family:${FONT};">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:${COLORS.muted};">${leftLabel}</div>
              <div style="margin-top:6px;font-size:14px;font-weight:600;color:${COLORS.white};">${leftValue}</div>
            </td>
            <td valign="top" align="right" style="font-family:${FONT};">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:${COLORS.muted};">${rightLabel}</div>
              <div style="margin-top:6px;font-size:14px;font-weight:600;color:${COLORS.white};">${rightValue}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

const p = (text, extra = '') => `<p style="margin:0 0 16px 0;${extra}">${text}</p>`

export function buildEmailShell({ title, preheader, body, actionUrl, actionLabel, footerNote }) {
  const buttonHtml = actionUrl && actionLabel ? renderEmailButton(actionUrl, actionLabel) : ''

  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>${title} — ${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:${FONT};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader || title}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;">
          <tr>
            <td bgcolor="${COLORS.card}" style="background-color:${COLORS.card};border:1px solid ${COLORS.cardBorder};border-radius:24px;padding:36px 36px 30px 36px;box-shadow:0 24px 48px rgba(0,0,0,0.45);">
              ${brandHeader()}
              <h1 style="margin:26px 0 0 0;text-align:center;font-family:${FONT};font-size:27px;line-height:1.25;font-weight:800;color:${COLORS.white};">${title}</h1>
              <div style="margin-top:20px;font-family:${FONT};font-size:16px;line-height:1.7;color:${COLORS.text};">
                ${body}
              </div>
              ${buttonHtml}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;">
                <tr>
                  <td style="border-top:1px solid ${COLORS.cardBorder};padding-top:18px;font-family:${FONT};font-size:12px;line-height:1.7;color:${COLORS.muted};">
                    ${footerNote || 'Se você não solicitou este e-mail, pode ignorá-lo com segurança.'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 8px 4px 8px;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLORS.faint};">
              ${APP_NAME} — controle financeiro compartilhado para famílias<br />
              Este é um e-mail automático, não precisa responder.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const fmtBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)

export function buildAlertEmail({ alertTitle, amount, dueDate, actionUrl }) {
  const dateText = formatDateBR(dueDate, 'Sem vencimento definido')

  return buildEmailShell({
    title: alertTitle || 'Alerta financeiro',
    preheader: `Alerta da sua conta: ${fmtBRL(amount)} — vencimento ${dateText}.`,
    body: `
      ${p('Segue um alerta automatizado da sua conta:')}
      ${infoCard('Valor', fmtBRL(amount), 22)}
      ${infoCard('Vencimento', dateText)}
    `,
    actionUrl,
    actionLabel: 'Abrir MyDinDin',
    footerNote: 'Você pode revisar esse lançamento diretamente no aplicativo.',
  })
}

export function buildPasswordResetEmail({ requestedAt, actionUrl, supportEmail }) {
  const requestedAtText = formatDateBR(requestedAt, formatDateBR(new Date().toISOString(), 'Agora'))

  return buildEmailShell({
    title: 'Redefinição de senha solicitada',
    preheader: 'Recebemos um pedido para redefinir a senha da sua conta MyDinDin.',
    body: `
      ${p(`Recebemos uma solicitação para redefinir sua senha no ${APP_NAME}.`)}
      ${p('Se foi você, use o botão abaixo para continuar com segurança.')}
      ${infoCard('Solicitação registrada em', requestedAtText)}
      ${p('Caso não tenha sido você, recomendamos trocar a senha do seu e-mail principal e revisar os dispositivos conectados.', 'margin-top:16px;')}
    `,
    actionUrl,
    actionLabel: 'Redefinir senha',
    footerNote: supportEmail
      ? `Se precisar de ajuda, fale com ${supportEmail}.`
      : 'Se você não solicitou essa redefinição, ignore este e-mail com segurança.',
  })
}

export function buildDueReminderEmail({ description, amount, dueDate, daysLeft, actionUrl }) {
  const dueText = formatDateBR(dueDate, 'Sem vencimento definido')
  const urgencyLabel =
    typeof daysLeft === 'number'
      ? daysLeft <= 0
        ? 'Vence hoje'
        : `Vence em ${daysLeft} dia(s)`
      : 'Vencimento próximo'

  return buildEmailShell({
    title: 'Lembrete de vencimento',
    preheader: `${description || 'Um lançamento'} de ${fmtBRL(amount)} — ${urgencyLabel.toLowerCase()}.`,
    body: `
      ${p('Temos um lembrete importante para a sua organização financeira:')}
      ${infoCard('Lançamento', description || 'Despesa/receita')}
      ${twoColCard('Valor', fmtBRL(amount), 'Vencimento', `${dueText}<br /><span style="font-size:12px;font-weight:400;color:${COLORS.muted};">${urgencyLabel}</span>`)}
    `,
    actionUrl,
    actionLabel: 'Abrir e revisar agora',
    footerNote: 'Manter os vencimentos em dia reduz multas e melhora a sua previsibilidade mensal.',
  })
}

export function buildBudgetWarningEmail({ category, spent, limit, usagePercent, actionUrl }) {
  const resolvedUsage = Number.isFinite(Number(usagePercent))
    ? Number(usagePercent)
    : (Number(limit) > 0 ? (Number(spent) / Number(limit)) * 100 : 0)
  const barWidth = Math.max(0, Math.min(100, resolvedUsage))

  return buildEmailShell({
    title: 'Alerta de orçamento',
    preheader: `Seu orçamento de ${category || 'categoria'} atingiu ${resolvedUsage.toFixed(0)}% do limite.`,
    body: `
      ${p(`Seu orçamento de <strong style="color:${COLORS.white};">${category || 'Categoria'}</strong> atingiu um nível de atenção.`)}
      ${infoCard('Consumo atual', `${fmtBRL(spent)} de ${fmtBRL(limit)} (${resolvedUsage.toFixed(0)}%)`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
        <tr>
          <td height="10" style="border-radius:999px;background-color:${COLORS.inner};font-size:0;line-height:0;">
            <div style="width:${barWidth}%;height:10px;border-radius:999px;background-color:${resolvedUsage >= 100 ? COLORS.red : COLORS.accent};font-size:0;line-height:0;">&nbsp;</div>
          </td>
        </tr>
      </table>
      ${p('Se quiser, ajuste o limite ou priorize os gastos essenciais até o fim do período.', 'margin-top:16px;')}
    `,
    actionUrl,
    actionLabel: 'Revisar orçamento',
    footerNote: 'Acompanhar os orçamentos semanalmente evita surpresas no fechamento do mês.',
  })
}

export function buildMonthlySummaryEmail({ monthLabel, income, expense, balance, topCategory, actionUrl }) {
  const statRow = (label, value, color) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
    <tr>
      <td style="padding:12px 16px;border-radius:14px;background-color:${COLORS.innerSoft};border:1px solid ${COLORS.cardBorder};border-left:4px solid ${color};font-family:${FONT};font-size:15px;color:${COLORS.text};">
        ${label}: <strong style="color:${COLORS.white};">${fmtBRL(value)}</strong>
      </td>
    </tr>
  </table>`

  return buildEmailShell({
    title: `Resumo mensal${monthLabel ? ` — ${monthLabel}` : ''}`,
    preheader: `Seu resumo${monthLabel ? ` de ${monthLabel}` : ''}: receitas ${fmtBRL(income)}, despesas ${fmtBRL(expense)}, saldo ${fmtBRL(balance)}.`,
    body: `
      ${p('Fechamos o seu resumo do período com os principais indicadores:')}
      ${statRow('Receitas', income, COLORS.green)}
      ${statRow('Despesas', expense, COLORS.red)}
      ${statRow('Saldo', balance, COLORS.sky)}
      ${topCategory ? p(`Categoria com maior impacto: <strong style="color:${COLORS.white};">${topCategory}</strong>.`, 'margin-top:16px;') : ''}
    `,
    actionUrl,
    actionLabel: 'Ver detalhes no painel',
    footerNote: 'Use este resumo para ajustar metas, limites e o planejamento do próximo mês.',
  })
}

export function buildSecurityNoticeEmail({ title, message, actionUrl }) {
  return buildEmailShell({
    title: title || 'Aviso de segurança',
    preheader: 'Detectamos uma atividade sensível na sua conta MyDinDin.',
    body: `
      ${p(message || 'Detectamos uma atividade sensível na sua conta.')}
      ${p('Se você reconhece a ação, não é necessário fazer nada. Caso contrário, revise o acesso da sua conta imediatamente.')}
    `,
    actionUrl,
    actionLabel: 'Revisar segurança da conta',
    footerNote: 'Dica: mantenha sua senha única e atualize-a periodicamente.',
  })
}

export function buildSignupVerificationEmail({ actionUrl }) {
  return buildEmailShell({
    title: 'Confirme seu e-mail para entrar',
    preheader: 'Sua conta no MyDinDin foi criada — falta só confirmar o e-mail.',
    body: `
      ${p(`Sua conta no ${APP_NAME} foi criada com sucesso. 🎉`)}
      ${p('Para liberar o acesso, confirme seu e-mail clicando no botão abaixo.')}
      ${infoCard('Etapa obrigatória', 'Verificação de e-mail antes do primeiro login')}
      ${p('Se não foi você, ignore este e-mail com segurança.', 'margin-top:16px;')}
    `,
    actionUrl,
    actionLabel: 'Confirmar e-mail',
    footerNote: 'Depois da confirmação, volte ao app e faça login normalmente.',
  })
}

export function buildGroupInviteEmail({ groupName, inviterName, expiresAt, actionUrl }) {
  const expiresText = formatDateBR(expiresAt, 'Sem expiração definida')

  return buildEmailShell({
    title: 'Você foi convidado para um grupo',
    preheader: `${inviterName || 'Um administrador'} convidou você para o grupo ${groupName || 'no MyDinDin'}.`,
    body: `
      ${p(`Você recebeu um convite para participar de um grupo financeiro no ${APP_NAME}, onde as contas da família ficam organizadas num só lugar.`)}
      ${infoCard('Grupo', groupName || 'Grupo sem nome', 18)}
      ${twoColCard('Convidado por', inviterName || 'Administrador do grupo', 'Expira em', expiresText)}
      ${p('Ao abrir o app e entrar com este e-mail, o convite aparece na sua conta — é só aceitar para entrar no grupo e ver as finanças compartilhadas.', 'margin-top:16px;')}
    `,
    actionUrl,
    actionLabel: 'Abrir MyDinDin',
    footerNote: 'Se você não esperava este convite, basta ignorar este e-mail.',
  })
}
