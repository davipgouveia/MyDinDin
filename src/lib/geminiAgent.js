// src/lib/geminiAgent.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Coloque sua chave no .env (ex: NEXT_PUBLIC_GEMINI_API_KEY ou VITE_GEMINI_API_KEY)
const apiKey =
  typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GEMINI_API_KEY
    ? process.env.NEXT_PUBLIC_GEMINI_API_KEY
    : (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY)
      ? import.meta.env.VITE_GEMINI_API_KEY
      : undefined;

if (!apiKey) throw new Error('API Key do Gemini não configurada. Defina NEXT_PUBLIC_GEMINI_API_KEY no .env.');
const genAI = new GoogleGenerativeAI(apiKey);

// 1. DEFINIÇÃO DAS FERRAMENTAS (O que o agente pode fazer)
const tools = [
  {
    functionDeclarations: [
      {
        name: "add_budget",
        description: "Cria um novo limite de orçamento para uma categoria de gastos específica.",
        parameters: {
          type: "OBJECT",
          properties: {
            category: {
              type: "STRING",
              description: "A categoria da despesa em minúsculas (ex: alimentacao, transporte, lazer, contas, shopping)."
            },
            limit: {
              type: "NUMBER",
              description: "O valor limite do orçamento em reais."
            }
          },
          required: ["category", "limit"]
        }
      },
      {
        name: "add_category",
        description: "Cria uma nova categoria de despesa ou receita.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "Nome da categoria (ex: Pet, Farmácia, Cursos)."
            },
            type: {
              type: "STRING",
              enum: ["expense", "income"],
              description: "Tipo da categoria: 'expense' para despesa ou 'income' para receita."
            }
          },
          required: ["name", "type"]
        }
      }
    ]
  }
];

export async function askGemini(userMessage, systemPrompt) {
  // Inicializamos o modelo passando o System Prompt e as Tools
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Recomendo o flash para respostas rápidas de chat
    systemInstruction: systemPrompt,
    tools: tools
  });

  const chat = model.startChat();
  const result = await chat.sendMessage(userMessage);
  const response = result.response;

  // Verifica se o Gemini decidiu chamar a função em vez de responder com texto
  const functionCalls = response.functionCalls();
  if (functionCalls && functionCalls.length > 0) {
    return {
      isFunction: true,
      functionCall: functionCalls[0]
    };
  }

  // Se não chamou função, retorna o texto amigável
  return {
    isFunction: false,
    text: response.text()
  };
}