export type LlmRequest = {
  system: string
  user: string
  model?: string
  temperature?: number
}

export type KnownProvider = 'mock' | 'openai' | 'cursor' | 'ollama'

export type LlmRuntimeSettings = {
  provider?: KnownProvider
  fallbackProviders?: KnownProvider[]
  model?: string
  temperature?: number
}

export type LlmResponse = {
  text: string
  raw?: unknown
}

export interface LlmProvider {
  name: string
  generate(input: LlmRequest): Promise<LlmResponse>
}
