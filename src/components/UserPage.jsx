import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, BellRing, Copy, Download, FileSpreadsheet, LogOut, Shield, Sparkles, Trash2, WalletCards } from 'lucide-react'
import { formatCurrency } from '../utils/format'
import { formatMonthYearBR } from '../utils/date'
import { ConfirmDialog } from './ConfirmDialog'
import { isResendConfigured, sendAlertEmail } from '../lib/resend'
import { buildGroupInviteEmail } from '../lib/emailTemplates'
import { getPublicAppUrl } from '../lib/publicAppUrl'
import { exportTransactionsCsv, printMonthlyPdfReport } from '../utils/reports'
import { isWebhookConfigured, sendWebhookAlert } from '../lib/webhookAlerts'
import { toast } from '../hooks/useToast'
import { usePreferences } from '../context/PreferencesContext'
import { HelpHint } from './HelpHint'

export function UserPage({
  profile,
  user,
  group,
  members = [],
  groupInvites = [],
  pendingGroupInvites = [],
  summary,
  transactions = [],
  activityLogs = [],
  budgets = [],
  onCreateBudget = () => {},
  onDeleteBudget = () => {},
  onUpdateGroupSettings = () => {},
  onInviteGroupMember = () => {},
  onRevokeGroupInvite = () => {},
  onAcceptGroupInvite = () => {},
  onLeaveGroup = () => {},
  onRemoveGroupMember = () => {},
  onSignOut,
  ownerFilter,
  onOwnerFilterChange,
  users = [],
}) {
  const [budgetCategory, setBudgetCategory] = useState('Outros')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [groupNameDraft, setGroupNameDraft] = useState(group?.name || '')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteExpiresIn, setInviteExpiresIn] = useState('7')
  const [fullNameForSwitch, setFullNameForSwitch] = useState(profile?.full_name || '')
  const [memberConfirm, setMemberConfirm] = useState(null)
  const [memberActionBusy, setMemberActionBusy] = useState(false)
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [inviteSending, setInviteSending] = useState(false)
  const [renameSaving, setRenameSaving] = useState(false)
  const [pendingBudget, setPendingBudget] = useState(null)
  const [pendingRevoke, setPendingRevoke] = useState(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const { theme, language, accent, density, layoutMode, toggleTheme, setLanguage, setAccent, setDensity, setLayoutMode, t } = usePreferences()
  const isLight = theme === 'light'
  const isCompact = density === 'compact'
  const isFocusLayout = layoutMode === 'focus'

  const profileName = profile?.full_name || user?.email || 'Usuário'
  const isOwner = profile?.role === 'owner'
  const initials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  const actionLabels = {
    transaction_created: 'Transação criada',
    transaction_deleted: 'Transação removida',
    transaction_commented: 'Comentário adicionado',
    budget_shared: 'Orçamento compartilhado criado',
    budget_deleted: 'Orçamento compartilhado removido',
    statement_imported: 'Extrato ou fatura importado',
  }
  const surfaceClass = isLight ? 'border-slate-200 bg-white/90 text-slate-900' : 'border-slate-800 bg-slate-900/70 text-white'
  const surfaceSoftClass = isLight ? 'border-slate-200 bg-white/80' : 'border-slate-800 bg-slate-950/70'
  const textMutedClass = isLight ? 'text-slate-600' : 'text-slate-400'
  const accentButtonClass =
    accent === 'emerald'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
      : accent === 'amber'
        ? 'border-amber-500/25 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
        : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15'

  const availableCategories = useMemo(() => {
    const set = new Set(
      transactions
        .map((item) => item.category)
        .filter(Boolean),
    )
    set.add('Outros')
    return Array.from(set)
  }, [transactions])

  useEffect(() => {
    setGroupNameDraft(group?.name || '')
  }, [group?.name])

  useEffect(() => {
    setFullNameForSwitch(profile?.full_name || '')
  }, [profile?.full_name])

  const handleCreateBudget = async (event) => {
    event.preventDefault()
    if (budgetSaving) return

    setBudgetSaving(true)
    try {
      await onCreateBudget(budgetCategory, Number(budgetLimit), 'mensal')
      setBudgetLimit('')
      toast.success('Orçamento compartilhado salvo!')
    } catch (budgetError) {
      toast.error(`Erro ao salvar orçamento: ${budgetError.message}`)
    } finally {
      setBudgetSaving(false)
    }
  }

  const handleDeleteBudget = async (budgetId) => {
    try {
      await onDeleteBudget(budgetId)
      toast.success('Orçamento removido!')
    } catch (budgetError) {
      toast.error(`Erro ao remover orçamento: ${budgetError.message}`)
    }
  }

  const handleConfirmBudgetDelete = async () => {
    if (!pendingBudget) return

    setConfirmBusy(true)
    try {
      await handleDeleteBudget(pendingBudget.id)
      setPendingBudget(null)
    } finally {
      setConfirmBusy(false)
    }
  }

  const handleConfirmRevoke = async () => {
    if (!pendingRevoke) return

    setConfirmBusy(true)
    try {
      await handleRevokeInvite(pendingRevoke.id)
      setPendingRevoke(null)
    } finally {
      setConfirmBusy(false)
    }
  }

  const handleTestWebhook = async () => {
    try {
      await sendWebhookAlert({
        event: 'manual_test',
        title: 'Teste de webhook MyDinDin',
        message: 'Webhook de alertas conectado com sucesso.',
      })
      toast.success('Webhook de alertas respondeu com sucesso!')
    } catch (webhookError) {
      toast.error(`Falha no webhook: ${webhookError.message}`)
    }
  }

  const handleGroupRename = async (event) => {
    event.preventDefault()
    if (renameSaving) return

    setRenameSaving(true)
    try {
      await onUpdateGroupSettings({ name: groupNameDraft })
      toast.success('Nome do grupo atualizado com sucesso!')
    } catch (groupError) {
      toast.error(`Erro ao atualizar grupo: ${groupError.message}`)
    } finally {
      setRenameSaving(false)
    }
  }

  const handleInviteSubmit = async (event) => {
    event.preventDefault()
    if (inviteSending) return

    setInviteSending(true)
    try {
      const emails = inviteEmail
        .split(/[\s,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)

      if (emails.length === 0) {
        throw new Error('Informe ao menos um email válido.')
      }

      const expiresInDays = Number(inviteExpiresIn) || 7
      const inviterName = profile?.full_name || user?.email || 'Administrador'
      const actionUrl = getPublicAppUrl()

      const results = await Promise.allSettled(
        emails.map(async (email) => {
          await onInviteGroupMember({
            email,
            expiresInDays,
          })

          const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

          await sendAlertEmail({
            to: email,
            subject: `Convite para o grupo ${group?.name || 'MyDinDin'}`,
            html: buildGroupInviteEmail({
              groupName: group?.name,
              inviterName,
              expiresAt,
              actionUrl,
            }),
          })
        }),
      )

      const sentCount = results.filter((result) => result.status === 'fulfilled').length
      const failedCount = results.length - sentCount

      setInviteEmail('')

      if (sentCount > 0) {
        toast.success(`${sentCount} convite(s) enviado(s) por email com sucesso!`)
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} convite(s) nao tiveram envio de email. Verifique RESEND_API_KEY e RESEND_FROM_EMAIL.`)
      }
    } catch (inviteError) {
      toast.error(`Erro ao enviar convite: ${inviteError.message}`)
    } finally {
      setInviteSending(false)
    }
  }

  const handleRevokeInvite = async (inviteId) => {
    try {
      await onRevokeGroupInvite(inviteId)
      toast.success('Convite revogado.')
    } catch (revokeError) {
      toast.error(`Erro ao revogar convite: ${revokeError.message}`)
    }
  }

  const handleAcceptInvite = async (inviteId) => {
    try {
      await onAcceptGroupInvite({
        inviteId,
        fullName: fullNameForSwitch,
      })
      toast.success('Grupo selecionado com sucesso!')
    } catch (acceptError) {
      toast.error(`Erro ao trocar de grupo: ${acceptError.message}`)
    }
  }

  const handleMemberConfirm = async () => {
    if (!memberConfirm) return
    setMemberActionBusy(true)

    try {
      if (memberConfirm.kind === 'accept') {
        await handleAcceptInvite(memberConfirm.invite.invite_id)
      } else if (memberConfirm.kind === 'remove') {
        await onRemoveGroupMember(memberConfirm.member.id)
        toast.success(`${memberConfirm.member.full_name || 'Membro'} removido(a) do grupo.`)
      } else if (memberConfirm.kind === 'leave') {
        await onLeaveGroup()
        toast.success('Você saiu do grupo.')
      }
      setMemberConfirm(null)
    } catch (memberError) {
      toast.error(`Erro: ${memberError.message}`)
    } finally {
      setMemberActionBusy(false)
    }
  }

  const memberConfirmContent = (() => {
    if (!memberConfirm) return { title: '', message: '', confirmLabel: 'Confirmar', danger: false }

    if (memberConfirm.kind === 'accept') {
      return {
        title: `Trocar para o grupo ${memberConfirm.invite.group_name}?`,
        message: `Ao aceitar, você SAI do grupo "${group?.name || 'atual'}" e entra em "${memberConfirm.invite.group_name}".\n\nSeus lançamentos ficam guardados no grupo atual: eles não vêm junto e você deixa de vê-los. Nada é apagado — se te convidarem de volta, você enxerga tudo de novo.`,
        confirmLabel: 'Sim, trocar de grupo',
        danger: false,
      }
    }

    if (memberConfirm.kind === 'remove') {
      return {
        title: `Remover ${memberConfirm.member.full_name || 'este membro'} do grupo?`,
        message: `A pessoa perde o acesso ao grupo ${group?.name || ''} na hora.\n\nOs lançamentos que ela fez CONTINUAM no grupo — nada é apagado.`,
        confirmLabel: 'Remover do grupo',
        danger: true,
      }
    }

    const othersRemain = members.some((member) => member.id !== profile?.id)
    return {
      title: 'Sair do grupo?',
      message: isOwner
        ? othersRemain
          ? `Você é o dono do grupo ${group?.name || ''}: ao sair, outro membro assume como dono automaticamente.\n\nSeus lançamentos continuam no grupo. Para voltar, o novo dono precisa te convidar de novo.`
          : `Você é a única pessoa do grupo ${group?.name || ''}. Ao sair, você perde o acesso aos lançamentos dele.`
        : `Você perde o acesso ao grupo ${group?.name || ''} e aos lançamentos compartilhados.\n\nOs lançamentos que você fez continuam no grupo. Para voltar, o dono precisa te convidar de novo.`,
      confirmLabel: 'Sair do grupo',
      danger: true,
    }
  })()

  return (
    <section className="space-y-4 md:space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[1.75rem] border ${isCompact ? 'p-4' : 'p-5'} shadow-xl ${surfaceClass}`}
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-xl font-bold text-cyan-300">
            {initials || 'F'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{profileName}</h2>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {t('profile')}
              </span>
            </div>
            <p className={`mt-1 text-sm ${textMutedClass}`}>{user?.email || 'Conta autenticada no Supabase'}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl border ${isCompact ? 'p-2.5' : 'p-3'} ${surfaceSoftClass}`}>
                <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${textMutedClass}`}>
                  <WalletCards size={14} />
                  Saldo
                </div>
                <p className={`mt-2 text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(summary.balance || 0)}</p>
              </div>
              <div className={`rounded-2xl border ${isCompact ? 'p-2.5' : 'p-3'} ${surfaceSoftClass}`}>
                <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${textMutedClass}`}>
                  <BadgeCheck size={14} />
                  {t('group')}
                </div>
                <p className={`mt-2 text-sm font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{profile?.group_id || 'Não informado'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className={`grid gap-3 ${isFocusLayout ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
        <div className={`rounded-2xl border ${isCompact ? 'p-3' : 'p-4'} ${surfaceClass}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <Shield size={16} className="text-cyan-400" />
            {t('security')}
          </div>
          <ul className={`mt-3 space-y-2 text-sm ${textMutedClass}`}>
            <li>Supabase: {profile ? 'Conectado' : 'Aguardando perfil'}</li>
            <li>Resend: {isResendConfigured() ? 'Configurado' : 'Pendente'}</li>
            <li>Webhook alertas: {isWebhookConfigured() ? 'Configurado' : 'Pendente'}</li>
            <li>Email: {user?.email || 'Sem email disponível'}</li>
          </ul>
          <button
            type="button"
            onClick={handleTestWebhook}
            disabled={!isWebhookConfigured()}
            title={isWebhookConfigured() ? 'Enviar um alerta de teste' : 'Webhook ainda não configurado neste ambiente'}
            className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${accentButtonClass}`}
          >
            <BellRing size={14} />
            Testar webhook
          </button>
          {!isWebhookConfigured() && (
            <p className={`mt-1.5 text-[11px] ${textMutedClass}`}>Disponível quando o webhook estiver configurado.</p>
          )}
        </div>

        <div className={`rounded-2xl border ${isCompact ? 'p-3' : 'p-4'} ${surfaceClass}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <Sparkles size={16} className="text-cyan-400" />
            {t('preferences')}
          </div>
          <div className="mt-3 grid gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <label className={`block text-xs uppercase tracking-[0.16em] ${textMutedClass}`}>{t('language')}</label>
                <HelpHint text="Escolha o idioma principal da interface e dos textos do assistente." />
              </div>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-400"
              >
                <option value="pt">{t('languagePt') || 'Português'}</option>
                <option value="en">{t('languageEn') || 'English'}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500/40"
            >
              {t('themeToggle')}
            </button>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <label className={`block text-xs uppercase tracking-[0.16em] ${textMutedClass}`}>{t('accentColor')}</label>
                <HelpHint text="Define a cor de destaque aplicada nos botões, chips e pontos de atenção." />
              </div>
              <select
                value={accent}
                onChange={(event) => setAccent(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-400"
              >
                <option value="cyan">Cyan</option>
                <option value="emerald">Emerald</option>
                <option value="amber">Amber</option>
              </select>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <label className={`block text-xs uppercase tracking-[0.16em] ${textMutedClass}`}>{t('density')}</label>
                <HelpHint text="Compacto mostra mais informação por tela. Espaçoso prioriza leitura e conforto visual." />
              </div>
              <select
                value={density}
                onChange={(event) => setDensity(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-400"
              >
                <option value="comfortable">{t('comfortable')}</option>
                <option value="compact">{t('compact')}</option>
              </select>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <label className={`block text-xs uppercase tracking-[0.16em] ${textMutedClass}`}>{t('layout')}</label>
                <HelpHint text="Foco reduz largura para concentração. Expandido abre espaço para mais comparação em tela grande." />
              </div>
              <select
                value={layoutMode}
                onChange={(event) => setLayoutMode(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-400"
              >
                <option value="balanced">{t('balancedLayout')}</option>
                <option value="focus">{t('focusLayout')}</option>
                <option value="expanded">{t('expandedLayout')}</option>
              </select>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <label className={`block text-xs uppercase tracking-[0.16em] ${textMutedClass}`}>{t('user')}</label>
                <HelpHint text="Filtre o painel para ver transações de uma pessoa específica ou o total do grupo." />
              </div>
              <select
                value={ownerFilter}
                onChange={(event) => onOwnerFilterChange(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-400"
              >
                {users.map((item) => (
                  <option key={item} value={item}>
                    {item === 'Todos' ? t('coupleTotal') : item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <section className={`rounded-2xl border ${isCompact ? 'p-3' : 'p-4'} ${surfaceClass}`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Configuração de grupos</h3>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-300'}`}>
            {isOwner ? 'Owner' : 'Membro'}
          </span>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className={`rounded-xl border ${isCompact ? 'p-3' : 'p-4'} ${surfaceSoftClass}`}>
            <p className={`text-xs uppercase tracking-[0.16em] ${textMutedClass}`}>Grupo atual</p>
            <p className={`mt-1 text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{group?.name || 'Sem nome definido'}</p>
            <p className={`mt-1 flex items-center gap-1.5 text-xs ${textMutedClass}`}>
              <span className="break-all">ID: {profile?.group_id || 'Não informado'}</span>
              {profile?.group_id && (
                <button
                  type="button"
                  title="Copiar ID do grupo"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(profile.group_id)
                      toast.success('ID do grupo copiado!')
                    } catch {
                      toast.error('Não consegui copiar — copie manualmente.')
                    }
                  }}
                  className="shrink-0 rounded-md border border-slate-600/40 p-1 transition hover:border-slate-400"
                >
                  <Copy size={12} />
                </button>
              )}
            </p>

            {isOwner ? (
              <form className="mt-3 space-y-2" onSubmit={handleGroupRename}>
                <input
                  type="text"
                  value={groupNameDraft}
                  onChange={(event) => setGroupNameDraft(event.target.value)}
                  placeholder="Nome do grupo"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  required
                />
                <button
                  type="submit"
                  disabled={renameSaving}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${accentButtonClass}`}
                >
                  {renameSaving ? 'Salvando...' : 'Salvar nome do grupo'}
                </button>
              </form>
            ) : (
              <p className={`mt-3 text-xs ${textMutedClass}`}>Somente owners podem alterar o nome do grupo.</p>
            )}

            <div className="mt-4">
              <p className={`text-xs uppercase tracking-[0.16em] ${textMutedClass}`}>Membros atuais</p>
              <ul className="mt-2 space-y-1.5">
                {members.length > 0 ? (
                  members.map((member) => (
                    <li key={member.id} className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${surfaceClass}`}>
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="truncate">{member.full_name || 'Membro'}</span>
                        {member.role === 'owner' && (
                          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200">dono</span>
                        )}
                        {member.id === user?.id && (
                          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-200">você</span>
                        )}
                      </span>
                      {isOwner && member.id !== user?.id && (
                        <button
                          type="button"
                          onClick={() => setMemberConfirm({ kind: 'remove', member })}
                          className="shrink-0 rounded-md border border-red-500/25 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/15"
                        >
                          Remover
                        </button>
                      )}
                    </li>
                  ))
                ) : (
                  <li className={`text-xs ${textMutedClass}`}>Nenhum membro listado.</li>
                )}
              </ul>

              <button
                type="button"
                onClick={() => setMemberConfirm({ kind: 'leave' })}
                className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/15"
              >
                Sair do grupo
              </button>
            </div>
          </div>

          <div className={`rounded-xl border ${isCompact ? 'p-3' : 'p-4'} ${surfaceSoftClass}`}>
            <p className={`text-xs uppercase tracking-[0.16em] ${textMutedClass}`}>Convites e seleção de grupos</p>

            {isOwner && (
              <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_96px_auto]" onSubmit={handleInviteSubmit}>
                <input
                  type="text"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  required
                />
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={inviteExpiresIn}
                  onChange={(event) => setInviteExpiresIn(event.target.value)}
                  placeholder="Dias"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  title="Validade em dias"
                />
                <button
                  type="submit"
                  disabled={inviteSending}
                  className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {inviteSending ? 'Enviando...' : 'Convidar'}
                </button>
              </form>
            )}

            <div className="mt-3">
              {isOwner && (
                <>
                  <p className={`text-xs ${textMutedClass}`}>Convites enviados pelo seu grupo:</p>
                  <ul className="mt-2 space-y-2">
                    {groupInvites.length > 0 ? (
                      groupInvites.map((invite) => (
                        <li key={invite.id} className={`rounded-lg border px-3 py-2 ${surfaceClass}`}>
                          <p className={`text-sm font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{invite.invitee_email}</p>
                          <p className={`mt-1 text-[11px] ${textMutedClass}`}>
                            Expira em: {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString('pt-BR') : 'sem prazo'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setPendingRevoke(invite)}
                            className="mt-2 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/15"
                          >
                            Revogar
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className={`text-xs ${textMutedClass}`}>Nenhum convite ativo enviado.</li>
                    )}
                  </ul>
                </>
              )}

              <p className={`mt-3 text-xs ${textMutedClass}`}>Convites recebidos para seu email ({user?.email || 'sem email'}):</p>
              <ul className="mt-2 space-y-2">
                {pendingGroupInvites.length > 0 ? (
                  pendingGroupInvites.map((invite) => (
                    <li key={invite.invite_id} className={`rounded-lg border px-3 py-2 ${surfaceClass}`}>
                      <p className={`text-sm font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{invite.group_name}</p>
                      <p className={`mt-1 text-[11px] ${textMutedClass}`}>
                        Expira em: {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString('pt-BR') : 'sem prazo'}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setMemberConfirm({ kind: 'accept', invite })}
                          className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
                        >
                          Entrar neste grupo
                        </button>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className={`text-xs ${textMutedClass}`}>Nenhum convite pendente.</li>
                )}
              </ul>
            </div>

            <div className="mt-3">
              <label className={`mb-1 block text-[11px] uppercase tracking-[0.14em] ${textMutedClass}`}>Seu nome para ingressar/trocar</label>
              <input
                type="text"
                value={fullNameForSwitch}
                onChange={(event) => setFullNameForSwitch(event.target.value)}
                placeholder="Seu nome completo"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-2xl border ${isCompact ? 'p-3' : 'p-4'} ${surfaceClass}`}>
        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{t('sharedBudgets')}</h3>

        <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]" onSubmit={handleCreateBudget}>
          <div className="flex items-center gap-2 sm:col-span-3">
            <span className={`text-[11px] uppercase tracking-[0.16em] ${textMutedClass}`}>Ajuda</span>
            <HelpHint text="Crie limites por categoria para controlar melhor os gastos do grupo ao longo do mês." />
          </div>
          <select
            value={budgetCategory}
            onChange={(event) => setBudgetCategory(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
          >
            {availableCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Limite (R$)"
            value={budgetLimit}
            onChange={(event) => setBudgetLimit(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            required
          />

          <button
            type="submit"
            disabled={budgetSaving}
            className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {budgetSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>

        <ul className="mt-3 space-y-2">
          {budgets.length > 0 ? (
            budgets.map((budget) => (
              <li key={budget.id} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${surfaceSoftClass}`}>
                <div>
                  <p className={`text-sm font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{budget.category}</p>
                  <p className={`text-xs ${textMutedClass}`}>
                    Limite: {formatCurrency(budget.limit)} • Mês: {formatMonthYearBR(budget.monthStart)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingBudget(budget)}
                  className="rounded-full border border-red-500/25 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/15"
                  title="Remover orçamento compartilhado"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-500">Nenhum orçamento compartilhado cadastrado.</li>
          )}
        </ul>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => exportTransactionsCsv(transactions)}
          className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${accentButtonClass}`}
        >
          <FileSpreadsheet size={16} />
          Exportar transacoes (CSV)
        </button>

        <button
          type="button"
          onClick={() => printMonthlyPdfReport(transactions, summary)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/15"
        >
          <Download size={16} />
          Gerar relatorio mensal (PDF)
        </button>
      </div>

      <section className={`rounded-2xl border ${isCompact ? 'p-3' : 'p-4'} ${surfaceClass}`}>
        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{t('history')}</h3>
        <ul className="mt-3 space-y-2">
          {activityLogs.length > 0 ? (
            activityLogs.slice(0, 8).map((item) => (
              <li key={item.id} className={`rounded-xl border px-3 py-2 ${surfaceSoftClass}`}>
                <p className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {actionLabels[item.action] || item.action}
                </p>
                <p className={`mt-1 text-[11px] ${textMutedClass}`}>
                  {item.author} • {new Date(item.createdAt).toLocaleString('pt-BR')}
                </p>
              </li>
            ))
          ) : (
            <li className={`text-xs ${textMutedClass}`}>Sem alterações registradas ainda.</li>
          )}
        </ul>
      </section>

      <button
        type="button"
        onClick={onSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"
      >
        <LogOut size={16} />
        Sair da conta
      </button>

      <ConfirmDialog
        open={Boolean(memberConfirm)}
        title={memberConfirmContent.title}
        message={memberConfirmContent.message}
        confirmLabel={memberConfirmContent.confirmLabel}
        danger={memberConfirmContent.danger}
        busy={memberActionBusy}
        onConfirm={handleMemberConfirm}
        onCancel={() => setMemberConfirm(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingBudget)}
        danger
        title="Remover orçamento compartilhado?"
        message={pendingBudget ? `O limite de "${pendingBudget.category}" será removido. Os lançamentos não são apagados.` : ''}
        confirmLabel="Remover"
        busy={confirmBusy}
        onConfirm={handleConfirmBudgetDelete}
        onCancel={() => setPendingBudget(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingRevoke)}
        danger
        title="Revogar convite?"
        message={pendingRevoke ? `O convite para ${pendingRevoke.invitee_email} deixa de valer na hora. A pessoa não consegue mais entrar por esse link.` : ''}
        confirmLabel="Revogar"
        busy={confirmBusy}
        onConfirm={handleConfirmRevoke}
        onCancel={() => setPendingRevoke(null)}
      />
    </section>
  )
}