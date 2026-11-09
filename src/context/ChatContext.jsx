import React, { createContext, useContext, useEffect, useState } from 'react'

const ChatContext = createContext()

// Histórico do chat salvo no aparelho (localStorage): sem isso, a
// conversa vivia só na memória e sumia a cada recarregamento do app.
// Guarda as últimas 60 mensagens — o suficiente pra retomar a conversa
// sem pesar no armazenamento local.
const STORAGE_KEY = 'mydindin_ai_chat_history'
const MAX_STORED_MESSAGES = 60

function loadStoredMessages() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item.text === 'string' && (item.role === 'user' || item.role === 'assistant'))
  } catch {
    return []
  }
}

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState(loadStoredMessages)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
    } catch {
      // Armazenamento cheio ou indisponível: a conversa segue só na sessão.
    }
  }, [messages])

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat deve ser usado dentro de ChatProvider')
  return ctx
}
