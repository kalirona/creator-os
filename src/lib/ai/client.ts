import { db } from '@/lib/db'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AiProviderConfig {
  id: string
  name: string
  slug: string
  apiKey: string
  baseUrl: string
  isActive: boolean
  priority: number
}

interface AiModelConfig {
  id: string
  providerId: string
  name: string
  displayName: string
  contextWindow: number
  isDefault: boolean
  isActive: boolean
  costMultiplier: number
}

async function getActiveProvider(): Promise<{ provider: AiProviderConfig; model: AiModelConfig } | null> {
  const providers = await db.aiProvider.findMany({
    where: { isActive: true },
    include: { models: { where: { isActive: true } } },
    orderBy: { priority: 'asc' },
  })

  for (const provider of providers) {
    const defaultModel = provider.models.find((m) => m.isDefault) || provider.models[0]
    if (defaultModel) {
      return {
        provider: {
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          isActive: provider.isActive,
          priority: provider.priority,
        },
        model: {
          id: defaultModel.id,
          providerId: defaultModel.providerId,
          name: defaultModel.name,
          displayName: defaultModel.displayName,
          contextWindow: defaultModel.contextWindow,
          isDefault: defaultModel.isDefault,
          isActive: defaultModel.isActive,
          costMultiplier: defaultModel.costMultiplier,
        },
      }
    }
  }

  return null
}

export async function callAi(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
    modelName?: string
  }
): Promise<string> {
  const config = await getActiveProvider()
  if (!config) {
    throw new Error('No active AI provider configured. Contact your admin.')
  }

  const { provider, model } = config
  const temperature = options?.temperature ?? 0.7
  const maxTokens = options?.maxTokens ?? 4000
  const modelName = options?.modelName ?? model.name

  const isGoogle = provider.slug === 'google' || provider.slug === 'gemini'
  const isOpenRouter = provider.slug === 'openrouter'

  let url: string
  let headers: Record<string, string>
  let body: unknown

  if (isGoogle) {
    url = `${provider.baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${modelName}:generateContent?key=${provider.apiKey}`
    headers = { 'Content-Type': 'application/json' }
    body = {
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }
  } else {
    url = `${provider.baseUrl || 'https://openrouter.ai/api/v1'}/chat/completions`
    headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
      ...(isOpenRouter ? { 'HTTP-Referer': 'https://creatoros.io', 'X-Title': 'CreatorOS' } : {}),
    }
    body = {
      model: modelName,
      messages,
      temperature,
      max_tokens: maxTokens,
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`AI provider error (${response.status}): ${errorBody.slice(0, 200)}`)
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  if (isGoogle) {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return text
  }

  return data.choices?.[0]?.message?.content ?? ''
}

export async function callAiStructured<T>(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
    modelName?: string
  }
): Promise<T> {
  const text = await callAi(messages, options)
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('AI did not return valid JSON')
  return JSON.parse(cleaned.slice(start, end + 1)) as T
}