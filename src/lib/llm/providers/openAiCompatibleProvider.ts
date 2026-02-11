import type { LlmProvider, LlmRequest, LlmResponse } from '@/lib/llm/types'

type ProviderConfig = {
  name: string
  apiKey: string
  baseUrl: string
  defaultModel: string
}

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
}

export function createOpenAiCompatibleProvider(
  config: ProviderConfig,
): LlmProvider {
  const normalizedBaseUrl = config.baseUrl.replace(/\/$/, '')

  return {
    name: config.name,
    async generate(input: LlmRequest): Promise<LlmResponse> {
      const messages: ChatCompletionMessage[] = [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user },
      ]

      const response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: input.model ?? config.defaultModel,
          temperature: input.temperature ?? 0.2,
          messages,
        }),
      })

      const raw = (await response.json()) as ChatCompletionResponse
      if (!response.ok) {
        throw new Error(
          `${config.name} request failed (${response.status}): ${JSON.stringify(raw).slice(0, 500)}`,
        )
      }

      const text = extractText(raw)
      if (!text) {
        throw new Error(`${config.name} returned no text content.`)
      }

      return { text, raw }
    },
  }
}

function extractText(raw: ChatCompletionResponse): string {
  const content = raw.choices?.[0]?.message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim()
  }
  return ''
}
