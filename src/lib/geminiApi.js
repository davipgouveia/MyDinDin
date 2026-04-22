// src/lib/geminiApi.js
// Utilitário para integração com Google Gemini API

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export async function fetchGeminiChatReply({ prompt, apiKey }) {
  if (!apiKey) throw new Error('API Key do Gemini não configurada')
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
    }),
  })
  if (!res.ok) throw new Error('Erro ao chamar Gemini: ' + res.status)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return text.trim()
}
