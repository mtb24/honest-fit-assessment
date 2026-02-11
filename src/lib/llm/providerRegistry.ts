import { createOpenAiCompatibleProvider } from '@/lib/llm/providers/openAiCompatibleProvider'
import { createMockProvider } from '@/lib/llm/providers/mockProvider'
import { createCursorBackgroundAgentProvider } from '@/lib/llm/providers/cursorBackgroundAgentProvider'
import { createOllamaProvider } from '@/lib/llm/providers/ollamaProvider'
import type {
  KnownProvider,
  LlmProvider,
  LlmRequest,
  LlmRuntimeSettings,
} from '@/lib/llm/types'

type ProviderResolution = {
  primary: LlmProvider
  fallbacks: LlmProvider[]
}

export function resolveLlmProviders(
  runtimeSettings?: LlmRuntimeSettings,
): ProviderResolution {
  const primaryName = getProviderName(
    runtimeSettings?.provider ?? process.env.LLM_PROVIDER,
  )
  const fallbackNames = (
    runtimeSettings?.fallbackProviders ??
    parseFallbackProviders(process.env.LLM_FALLBACK_PROVIDERS)
  ).map(getProviderName)

  const primary = createProvider(primaryName)
  const fallbacks = fallbackNames
    .filter((name) => name !== primaryName)
    .map(createProvider)

  return { primary, fallbacks }
}

export async function callWithProviders(
  input: LlmRequest,
  providers: ProviderResolution,
): Promise<string> {
  const candidates = [providers.primary, ...providers.fallbacks]
  const errors: string[] = []

  for (const provider of candidates) {
    try {
      const result = await provider.generate(input)
      return result.text
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${provider.name}: ${message}`)
    }
  }

  throw new Error(`All LLM providers failed. ${errors.join(' | ')}`)
}

export async function listAvailableModels(
  provider: KnownProvider,
): Promise<string[]> {
  if (provider === 'mock') {
    return ['mock-model']
  }

  if (provider === 'openai') {
    // OpenAI model listing requires broader account scopes in some setups;
    // keep this lightweight and env-driven for now.
    const envModels = process.env.OPENAI_MODELS
    return envModels
      ? envModels.split(',').map((item) => item.trim()).filter(Boolean)
      : []
  }

  if (provider === 'ollama') {
    const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(
      /\/$/,
      '',
    )
    const response = await fetch(`${baseUrl}/api/tags`)
    const raw = await response.json()
    if (!response.ok) {
      throw new Error(
        `ollama model list failed (${response.status}): ${JSON.stringify(raw).slice(0, 500)}`,
      )
    }
    return normalizeModelList(raw)
  }

  const apiKey = process.env.CURSOR_API_KEY
  if (!apiKey) {
    throw new Error('Missing CURSOR_API_KEY for provider model discovery.')
  }
  const baseUrl = (process.env.CURSOR_BASE_URL || 'https://api.cursor.com').replace(
    /\/$/,
    '',
  )
  const response = await fetch(`${baseUrl}/v0/models`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
  const raw = await response.json()
  if (!response.ok) {
    throw new Error(
      `cursor model list failed (${response.status}): ${JSON.stringify(raw).slice(0, 500)}`,
    )
  }

  return normalizeModelList(raw)
}

function createProvider(name: KnownProvider): LlmProvider {
  if (name === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY for LLM_PROVIDER=openai.')
    }
    return createOpenAiCompatibleProvider({
      name: 'openai',
      apiKey,
      baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
      defaultModel: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    })
  }

  if (name === 'cursor') {
    const apiKey = process.env.CURSOR_API_KEY
    if (!apiKey) {
      throw new Error('Missing CURSOR_API_KEY for LLM_PROVIDER=cursor.')
    }
    const baseUrl = process.env.CURSOR_BASE_URL || 'https://api.cursor.com'
    return createCursorBackgroundAgentProvider({
      apiKey,
      baseUrl,
      defaultModel: process.env.LLM_MODEL ?? 'claude-4-sonnet-thinking',
    })
  }

  if (name === 'ollama') {
    return createOllamaProvider({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      defaultModel: process.env.OLLAMA_MODEL || process.env.LLM_MODEL || 'llama3.2',
    })
  }

  return createMockProvider('mock')
}

function getProviderName(value: string | undefined): KnownProvider {
  if (
    value === 'openai' ||
    value === 'cursor' ||
    value === 'mock' ||
    value === 'ollama'
  ) {
    return value
  }
  return 'mock'
}

function parseFallbackProviders(value: string | undefined): KnownProvider[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(
      (item): item is KnownProvider =>
        item === 'openai' ||
        item === 'cursor' ||
        item === 'mock' ||
        item === 'ollama',
    )
}

function normalizeModelList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item : extractModelName(item)))
      .filter((item): item is string => Boolean(item))
  }

  if (raw && typeof raw === 'object') {
    const models = (raw as { models?: unknown }).models
    if (Array.isArray(models)) {
      return models
        .map((item) => (typeof item === 'string' ? item : extractModelName(item)))
        .filter((item): item is string => Boolean(item))
    }
  }

  return []
}

function extractModelName(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const model = value as Record<string, unknown>
  return (
    (typeof model.id === 'string' && model.id) ||
    (typeof model.name === 'string' && model.name) ||
    (typeof model.display_name === 'string' && model.display_name) ||
    (typeof model.model === 'string' && model.model) ||
    undefined
  )
}
