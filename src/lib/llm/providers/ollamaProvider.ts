import type { LlmProvider, LlmRequest, LlmResponse } from '@/lib/llm/types'

type OllamaConfig = {
  baseUrl: string
  defaultModel: string
}

type OllamaChatResponse = {
  message?: {
    content?: string
  }
}

export function createOllamaProvider(config: OllamaConfig): LlmProvider {
  const normalizedBaseUrl = config.baseUrl.replace(/\/$/, '')

  return {
    name: 'ollama',
    async generate(input: LlmRequest): Promise<LlmResponse> {
      const model = input.model ?? config.defaultModel
      const response = await fetch(`${normalizedBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: false,
          options: {
            temperature: input.temperature ?? 0.2,
          },
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.user },
          ],
        }),
      })

      const raw = (await response.json()) as OllamaChatResponse
      if (!response.ok) {
        throw new Error(
          `ollama request failed (${response.status}): ${JSON.stringify(raw).slice(0, 500)}`,
        )
      }

      const text = raw.message?.content?.trim()
      if (!text) {
        throw new Error('ollama returned no text content.')
      }

      return { text, raw }
    },
  }
}
