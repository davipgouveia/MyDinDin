import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const FinanceContext = createContext(undefined)

const withTimeout = async (promise, timeoutMs, timeoutMessage) => {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

const mapTransactionRow = (row) => ({
  id: row.id,
  profileId: row.profile_id,
  description: row.note ?? 'Sem descricao',
  amount: Number(row.amount),
  type: row.type,
  category: row.category?.name ?? 'Outros',
  owner: row.profile?.full_name ?? 'Membro',
  date: row.transaction_date,
  transaction_date: row.transaction_date,
  createdAt: row.created_at,
  created_at: row.created_at,
  dueDate: row.due_date ?? null,
  isPaid: row.is_paid ?? true,
  paymentStatus: row.payment_status ?? null,
})

export function FinanceProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [group, setGroup] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [members, setMembers] = useState([])
  const [groupInvites, setGroupInvites] = useState([])
  const [pendingGroupInvites, setPendingGroupInvites] = useState([])
  const [budgets, setBudgets] = useState([])
  const [transactionComments, setTransactionComments] = useState({})
  const [activityLogs, setActivityLogs] = useState([])
  const [ownerFilter, setOwnerFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const user = session?.user ?? null

  const loadProfile = useCallback(async (userId) => {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, group_id, full_name, role')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw profileError
    setProfile(data ?? null)
    return data
  }, [])

  const loadGroup = useCallback(async (groupId) => {
    if (!groupId) {
      setGroup(null)
      return null
    }

    const { data, error: groupError } = await supabase
      .from('family_groups')
      .select('id, name, created_by, created_at')
      .eq('id', groupId)
      .maybeSingle()

    if (groupError) throw groupError
    setGroup(data ?? null)
    return data
  }, [])

  const loadPendingGroupInvites = useCallback(async () => {
    const { data, error: invitesError } = await supabase.rpc('list_my_pending_group_invites')
    if (invitesError) {
      if (invitesError.code === '42883') {
        setPendingGroupInvites([])
        return
      }
      throw invitesError
    }

    setPendingGroupInvites(data ?? [])
  }, [])

  const loadGroupInvites = useCallback(async (groupId) => {
    if (!groupId) {
      setGroupInvites([])
      return
    }

    const { data, error: invitesError } = await supabase
      .from('group_invites')
      .select('id, group_id, invitee_email, status, created_at, expires_at')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (invitesError) {
      if (invitesError.code === '42P01') {
        setGroupInvites([])
        return
      }
      throw invitesError
    }

    setGroupInvites(data ?? [])
  }, [])

  const loadMembers = useCallback(async (groupId) => {
    const { data, error: membersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('group_id', groupId)
      .order('full_name', { ascending: true })

    if (membersError) throw membersError
    setMembers(data ?? [])
  }, [])

  const loadTransactions = useCallback(async (groupId) => {
    const { data, error: txError } = await supabase
      .from('transactions')
      .select('id, profile_id, amount, type, transaction_date, due_date, is_paid, payment_status, note, created_at, profile:profiles(full_name), category:categories(name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (txError) throw txError
    setTransactions((data ?? []).map(mapTransactionRow))
  }, [])

  const loadBudgets = useCallback(async (groupId) => {
    if (!groupId || !isSupabaseConfigured || !supabase) return

    const { data, error: budgetsError } = await supabase
      .from('budgets')
      .select('id, limit_amount, month_start, alert_threshold_percent, created_at, category:categories(name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (budgetsError) throw budgetsError

    setBudgets((data ?? []).map((item) => ({
      id: item.id,
      category: item.category?.name ?? 'Outros',
      limit: Number(item.limit_amount) || 0,
      period: 'mensal',
      monthStart: item.month_start,
      alertThresholdPercent: item.alert_threshold_percent ?? 80,
      createdAt: item.created_at,
    })))
  }, [])

  const loadTransactionComments = useCallback(async (groupId) => {
    if (!groupId || !isSupabaseConfigured || !supabase) return

    const { data, error: commentsError } = await supabase
      .from('transaction_comments')
      .select('id, transaction_id, content, created_at, profile:profiles(full_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (commentsError) {
      if (commentsError.code !== '42P01') throw commentsError
      return
    }

    const grouped = (data ?? []).reduce((acc, item) => {
      const key = item.transaction_id
      if (!acc[key]) acc[key] = []
      acc[key].push({
        id: item.id,
        content: item.content,
        createdAt: item.created_at,
        author: item.profile?.full_name ?? 'Membro',
      })
      return acc
    }, {})

    setTransactionComments(grouped)
  }, [])

  const loadActivityLogs = useCallback(async (groupId) => {
    if (!groupId || !isSupabaseConfigured || !supabase) return

    const { data, error: logsError } = await supabase
      .from('app_activity_logs')
      .select('id, action, metadata, transaction_id, created_at, profile:profiles(full_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(60)

    if (logsError) {
      if (logsError.code !== '42P01') throw logsError
      return
    }

    setActivityLogs((data ?? []).map((item) => ({
      id: item.id,
      action: item.action,
      metadata: item.metadata ?? {},
      transactionId: item.transaction_id,
      createdAt: item.created_at,
      author: item.profile?.full_name ?? 'Membro',
    })))
  }, [])

  const logActivity = useCallback(async ({ action, transactionId = null, metadata = {} }) => {
    if (!user?.id || !profile?.group_id || !isSupabaseConfigured || !supabase) return

    const { error: logError } = await supabase.from('app_activity_logs').insert({
      group_id: profile.group_id,
      profile_id: user.id,
      created_by: user.id,
      transaction_id: transactionId,
      action,
      metadata,
    })

    if (logError && logError.code !== '42P01') {
      console.warn('Falha ao registrar atividade:', logError.message)
      return
    }

    await loadActivityLogs(profile.group_id)
  }, [loadActivityLogs, profile?.group_id, user?.id])

  const refreshWorkspace = useCallback(async (currentUser) => {
    if (!currentUser || !isSupabaseConfigured || !supabase) return

    setError(null)
    await loadPendingGroupInvites()

    const currentProfile = await loadProfile(currentUser.id)
    if (!currentProfile?.group_id) {
      setGroup(null)
      setTransactions([])
      setMembers([])
      setGroupInvites([])
      setBudgets([])
      setTransactionComments({})
      setActivityLogs([])
      return
    }

    await Promise.all([
      loadGroup(currentProfile.group_id),
      loadMembers(currentProfile.group_id),
      loadGroupInvites(currentProfile.group_id),
      loadTransactions(currentProfile.group_id),
      loadBudgets(currentProfile.group_id),
      loadTransactionComments(currentProfile.group_id),
      loadActivityLogs(currentProfile.group_id),
    ])
  }, [loadActivityLogs, loadBudgets, loadGroup, loadGroupInvites, loadMembers, loadPendingGroupInvites, loadProfile, loadTransactionComments, loadTransactions])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    const bootstrap = async () => {
      const startedAt = Date.now()
      try {
        if (mounted) setLoading(true)

        const { data } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'Tempo limite ao verificar sessao do Supabase.',
        )

        if (!mounted) return

        setSession(data.session)

        if (data.session?.user) {
          await withTimeout(
            refreshWorkspace(data.session.user),
            10000,
            'Tempo limite ao carregar dados iniciais do workspace.',
          )
        }
      } catch (bootstrapError) {
        if (mounted) setError(bootstrapError.message)
      } finally {
        const elapsed = Date.now() - startedAt
        const minimumVisibleMs = 900
        if (elapsed < minimumVisibleMs) {
          await wait(minimumVisibleMs - elapsed)
        }
        if (mounted) setLoading(false)
      }
    }

    bootstrap()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      const startedAt = Date.now()
      setLoading(true)
      setSession(nextSession)
      setError(null)

      if (!nextSession?.user) {
        setProfile(null)
        setGroup(null)
        setMembers([])
        setGroupInvites([])
        setPendingGroupInvites([])
        setTransactions([])
        setBudgets([])
        setTransactionComments({})
        setActivityLogs([])
        setLoading(false)
        return
      }

      try {
        await withTimeout(
          refreshWorkspace(nextSession.user),
          10000,
          'Tempo limite ao atualizar dados da sessao.',
        )
      } catch (refreshError) {
        setError(refreshError.message)
      } finally {
        const elapsed = Date.now() - startedAt
        const minimumVisibleMs = 450
        if (elapsed < minimumVisibleMs) {
          await wait(minimumVisibleMs - elapsed)
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [refreshWorkspace])

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured || !supabase) return
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (signInError) throw signInError
  }

  const signUp = async ({ email, password }) => {
    if (!isSupabaseConfigured || !supabase) return
    setSubmitting(true)
    setError(null)
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)
    if (signUpError) throw signUpError
  }

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) return
    setSubmitting(true)
    setError(null)
    const { error: signOutError } = await supabase.auth.signOut()
    setSubmitting(false)
    if (signOutError) throw signOutError
  }

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured || !supabase) return

    setSubmitting(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setSubmitting(false)
    if (resetError) throw resetError
  }

  const bootstrapFamilyGroup = async ({ groupName, fullName }) => {
    if (!user || !isSupabaseConfigured || !supabase) return

    setSubmitting(true)
    setError(null)

    const { error: bootstrapError } = await supabase.rpc('bootstrap_family_group', {
      group_name: groupName,
      user_full_name: fullName,
    })

    if (bootstrapError) {
      setSubmitting(false)
      throw bootstrapError
    }

    await refreshWorkspace(user)
    setSubmitting(false)
  }

  const updateGroupSettings = async ({ name }) => {
    if (!profile?.group_id || !user || !isSupabaseConfigured || !supabase) return
    if (profile.role !== 'owner') {
      throw new Error('Apenas o owner pode alterar configuracoes do grupo.')
    }

    const normalizedName = (name || '').trim()
    if (!normalizedName) {
      throw new Error('Informe um nome valido para o grupo.')
    }

    setSubmitting(true)
    setError(null)

    const { error: updateGroupError } = await supabase
      .from('family_groups')
      .update({ name: normalizedName })
      .eq('id', profile.group_id)

    if (updateGroupError) {
      setSubmitting(false)
      throw updateGroupError
    }

    await loadGroup(profile.group_id)
    setSubmitting(false)
  }

  const inviteGroupMember = async ({ email, expiresInDays = 7 }) => {
    if (!profile?.group_id || !user || !isSupabaseConfigured || !supabase) return
    if (profile.role !== 'owner') {
      throw new Error('Apenas o owner pode convidar novos membros.')
    }

    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Informe um email valido para convite.')
    }

    setSubmitting(true)
    setError(null)

    const { data, error: inviteError } = await supabase.rpc('create_group_invite', {
      p_group_id: profile.group_id,
      p_invitee_email: normalizedEmail,
      p_expires_in_days: Math.max(1, Number(expiresInDays) || 7),
    })

    if (inviteError) {
      setSubmitting(false)
      if (inviteError.code === '42883') {
        throw new Error('Funcao create_group_invite nao encontrada. Aplique as migrations mais recentes no Supabase.')
      }
      throw inviteError
    }

    await Promise.all([
      loadPendingGroupInvites(),
      loadGroupInvites(profile.group_id),
    ])
    setSubmitting(false)
    return data
  }

  const revokeGroupInvite = async (inviteId) => {
    if (!profile?.group_id || !user || !isSupabaseConfigured || !supabase) return
    if (profile.role !== 'owner') {
      throw new Error('Apenas o owner pode revogar convites.')
    }

    if (!inviteId) {
      throw new Error('Convite invalido.')
    }

    setSubmitting(true)
    setError(null)

    const { error: revokeError } = await supabase.rpc('revoke_group_invite', {
      p_invite_id: inviteId,
    })

    if (revokeError) {
      setSubmitting(false)
      if (revokeError.code === '42883') {
        throw new Error('Funcao revoke_group_invite nao encontrada. Aplique as migrations mais recentes no Supabase.')
      }
      throw revokeError
    }

    await Promise.all([
      loadPendingGroupInvites(),
      loadGroupInvites(profile.group_id),
    ])
    setSubmitting(false)
  }

  const acceptGroupInvite = async ({ inviteId, fullName }) => {
    if (!user || !isSupabaseConfigured || !supabase) return
    if (!inviteId) {
      throw new Error('Selecione um convite para continuar.')
    }

    setSubmitting(true)
    setError(null)

    const { error: acceptError } = await supabase.rpc('accept_group_invite', {
      p_invite_id: inviteId,
      p_full_name: (fullName || '').trim() || null,
    })

    if (acceptError) {
      setSubmitting(false)
      if (acceptError.code === '42883') {
        throw new Error('Funcao accept_group_invite nao encontrada. Aplique as migrations mais recentes no Supabase.')
      }
      throw acceptError
    }

    await refreshWorkspace(user)
    setSubmitting(false)
  }

  const users = useMemo(() => {
    if (members.length === 0) return ['Todos']
    return ['Todos', ...members.map((member) => member.full_name || 'Membro')]
  }, [members])

  const visibleTransactions = useMemo(() => {
    if (ownerFilter === 'Todos') return transactions
    return transactions.filter((tx) => tx.owner === ownerFilter)
  }, [ownerFilter, transactions])

  const summary = useMemo(() => {
    const income = visibleTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const expense = visibleTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)

    return {
      income,
      expense,
      balance: income - expense,
    }
  }, [visibleTransactions])

  const categoryChart = useMemo(() => {
    const grouped = visibleTransactions.reduce((acc, tx) => {
      const key = tx.category || 'Outros'
      if (!acc[key]) acc[key] = 0
      acc[key] += tx.amount
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [visibleTransactions])

  const addTransaction = async (data) => {
    if (!user || !profile || !isSupabaseConfigured || !supabase) return

    setSubmitting(true)
    setError(null)

    const parsedAmount = Number(data.amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSubmitting(false)
      throw new Error('Informe um valor valido maior que zero.')
    }

    if (!data.type || (data.type !== 'expense' && data.type !== 'income')) {
      setSubmitting(false)
      throw new Error('Tipo de transacao invalido.')
    }

    const categoryName = (data.category || 'Outros').trim()
    const normalizedCategory = categoryName.length > 0 ? categoryName : 'Outros'

    const { data: existingCategory, error: categoryLookupError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('group_id', profile.group_id)
      .eq('name', normalizedCategory)
      .maybeSingle()

    if (categoryLookupError) {
      setSubmitting(false)
      throw categoryLookupError
    }

    let categoryId = existingCategory?.id ?? null

    if (!categoryId) {
      const { data: createdCategory, error: categoryInsertError } = await supabase
        .from('categories')
        .insert({
          group_id: profile.group_id,
          name: normalizedCategory,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (categoryInsertError) {
        setSubmitting(false)
        throw categoryInsertError
      }

      categoryId = createdCategory.id
    }

    const transactionDate = (() => {
      const candidate = data.transaction_date || data.created_at || data.date
      if (!candidate) return new Date().toISOString().slice(0, 10)

      const parsed = new Date(candidate)
      return Number.isNaN(parsed.getTime())
        ? new Date().toISOString().slice(0, 10)
        : parsed.toISOString().slice(0, 10)
    })()

    const { data: insertedTransaction, error: insertError } = await supabase
      .from('transactions')
      .insert({
        group_id: profile.group_id,
        profile_id: user.id,
        category_id: categoryId,
        amount: parsedAmount,
        type: data.type,
        transaction_date: transactionDate,
        due_date: data.dueDate || null,
        is_paid: data.isPaid ?? true,
        payment_status: data.isPaid ? 'paid' : 'pending',
        note: data.description,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      setSubmitting(false)
      throw insertError
    }

    await loadTransactions(profile.group_id)
    await logActivity({
      action: 'transaction_created',
      transactionId: insertedTransaction?.id ?? null,
      metadata: {
        amount: parsedAmount,
        type: data.type,
        category: normalizedCategory,
      },
    })
    setSubmitting(false)
  }

  const deleteTransaction = async (id) => {
    if (!profile || !user || !isSupabaseConfigured || !supabase) return

    setSubmitting(true)
    setError(null)

    const currentTx = transactions.find((item) => item.id === id)
    const canDelete = profile.role === 'owner' || currentTx?.profileId === user.id
    if (!canDelete) {
      setSubmitting(false)
      throw new Error('Voce nao tem permissao para excluir esta transacao.')
    }

    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id)

    if (deleteError) {
      setSubmitting(false)
      throw deleteError
    }

    await loadTransactions(profile.group_id)
    await loadTransactionComments(profile.group_id)
    await logActivity({
      action: 'transaction_deleted',
      transactionId: id,
      metadata: {
        description: currentTx?.description || null,
      },
    })
    setSubmitting(false)
  }

  const addTransactionComment = async (transactionId, content) => {
    if (!user || !profile || !isSupabaseConfigured || !supabase) return

    const trimmedContent = (content || '').trim()
    if (!trimmedContent) {
      throw new Error('Comentario vazio.')
    }

    const { error: commentError } = await supabase.from('transaction_comments').insert({
      group_id: profile.group_id,
      transaction_id: transactionId,
      profile_id: user.id,
      created_by: user.id,
      content: trimmedContent,
    })

    if (commentError) {
      if (commentError.code === '42P01') {
        throw new Error('Tabela de comentarios nao aplicada. Rode as migrations no Supabase.')
      }
      throw commentError
    }

    await loadTransactionComments(profile.group_id)
    await logActivity({
      action: 'transaction_commented',
      transactionId,
      metadata: { contentPreview: trimmedContent.slice(0, 120) },
    })
  }

  const createSharedBudget = async (categoryName, limitAmount, period = 'mensal') => {
    if (!user || !profile || !isSupabaseConfigured || !supabase) return

    const parsedLimit = Number(limitAmount)
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      throw new Error('Informe um limite valido maior que zero.')
    }

    if (period !== 'mensal') {
      throw new Error('No momento, apenas periodo mensal e suportado.')
    }

    const normalizedCategory = (categoryName || 'Outros').trim() || 'Outros'
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: existingCategory, error: categoryLookupError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('group_id', profile.group_id)
      .eq('name', normalizedCategory)
      .maybeSingle()

    if (categoryLookupError) throw categoryLookupError

    let categoryId = existingCategory?.id
    if (!categoryId) {
      const { data: createdCategory, error: categoryInsertError } = await supabase
        .from('categories')
        .insert({
          group_id: profile.group_id,
          name: normalizedCategory,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (categoryInsertError) throw categoryInsertError
      categoryId = createdCategory.id
    }

    const { error: budgetInsertError } = await supabase.from('budgets').upsert({
      group_id: profile.group_id,
      category_id: categoryId,
      month_start: monthStart.toISOString().slice(0, 10),
      limit_amount: parsedLimit,
      alert_threshold_percent: 80,
      created_by: user.id,
    }, { onConflict: 'group_id,category_id,month_start' })

    if (budgetInsertError) throw budgetInsertError

    await loadBudgets(profile.group_id)
    await logActivity({
      action: 'budget_shared',
      metadata: {
        category: normalizedCategory,
        limit: parsedLimit,
      },
    })
  }

  const deleteSharedBudget = async (budgetId) => {
    if (!profile || !user || !isSupabaseConfigured || !supabase) return

    if (profile.role !== 'owner') {
      throw new Error('Apenas o owner pode remover orcamentos compartilhados.')
    }

    const { error: deleteBudgetError } = await supabase.from('budgets').delete().eq('id', budgetId)
    if (deleteBudgetError) throw deleteBudgetError

    await loadBudgets(profile.group_id)
    await logActivity({
      action: 'budget_deleted',
      metadata: { budgetId },
    })
  }

  const value = {
    isSupabaseConfigured,
    loading,
    submitting,
    error,
    setError,
    user,
    profile,
    group,
    members,
    groupInvites,
    pendingGroupInvites,
    transactions,
    visibleTransactions,
    budgets,
    transactionComments,
    activityLogs,
    summary,
    categoryChart,
    users,
    ownerFilter,
    setOwnerFilter,
    signIn,
    signUp,
    signOut,
    resetPassword,
    bootstrapFamilyGroup,
    updateGroupSettings,
    inviteGroupMember,
    revokeGroupInvite,
    acceptGroupInvite,
    addTransaction,
    deleteTransaction,
    addTransactionComment,
    createSharedBudget,
    deleteSharedBudget,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de FinanceProvider')
  }
  return context
}
