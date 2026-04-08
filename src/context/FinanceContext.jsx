import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const FinanceContext = createContext(undefined)

const mapTransactionRow = (row) => ({
  id: row.id,
  description: row.note ?? 'Sem descricao',
  amount: Number(row.amount),
  type: row.type,
  category: row.category?.name ?? 'Outros',
  owner: row.profile?.full_name ?? 'Membro',
  date: row.transaction_date,
})

export function FinanceProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [members, setMembers] = useState([])
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
      .select('id, amount, type, transaction_date, note, profile:profiles(full_name), category:categories(name)')
      .eq('group_id', groupId)
      .order('transaction_date', { ascending: false })
      .limit(200)

    if (txError) throw txError
    setTransactions((data ?? []).map(mapTransactionRow))
  }, [])

  const refreshWorkspace = useCallback(async (currentUser) => {
    if (!currentUser || !isSupabaseConfigured || !supabase) return

    setError(null)
    const currentProfile = await loadProfile(currentUser.id)
    if (!currentProfile?.group_id) {
      setTransactions([])
      setMembers([])
      return
    }

    await Promise.all([
      loadMembers(currentProfile.group_id),
      loadTransactions(currentProfile.group_id),
    ])
  }, [loadMembers, loadProfile, loadTransactions])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return

        setSession(data.session)
        if (data.session?.user) {
          await refreshWorkspace(data.session.user)
        }
      } catch (bootstrapError) {
        if (mounted) setError(bootstrapError.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    bootstrap()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      setError(null)

      if (!nextSession?.user) {
        setProfile(null)
        setMembers([])
        setTransactions([])
        return
      }

      try {
        await refreshWorkspace(nextSession.user)
      } catch (refreshError) {
        setError(refreshError.message)
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

    const { error: insertError } = await supabase.from('transactions').insert({
      group_id: profile.group_id,
      profile_id: user.id,
      category_id: categoryId,
      amount: Number(data.amount),
      type: data.type,
      transaction_date: new Date().toISOString().slice(0, 10),
      note: data.description,
      created_by: user.id,
    })

    if (insertError) {
      setSubmitting(false)
      throw insertError
    }

    await loadTransactions(profile.group_id)
    setSubmitting(false)
  }

  const deleteTransaction = async (id) => {
    if (!profile || !isSupabaseConfigured || !supabase) return

    setSubmitting(true)
    setError(null)

    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id)

    if (deleteError) {
      setSubmitting(false)
      throw deleteError
    }

    await loadTransactions(profile.group_id)
    setSubmitting(false)
  }

  const value = {
    isSupabaseConfigured,
    loading,
    submitting,
    error,
    setError,
    user,
    profile,
    transactions,
    visibleTransactions,
    summary,
    categoryChart,
    users,
    ownerFilter,
    setOwnerFilter,
    signIn,
    signUp,
    signOut,
    bootstrapFamilyGroup,
    addTransaction,
    deleteTransaction,
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
