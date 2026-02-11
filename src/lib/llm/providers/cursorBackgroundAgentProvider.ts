import type { LlmProvider, LlmRequest, LlmResponse } from '@/lib/llm/types'

type CursorProviderConfig = {
  apiKey: string
  baseUrl: string
  defaultModel: string
}

type CursorLaunchResponse = {
  id?: string
  agentId?: string
  agent_id?: string
}

export function createCursorBackgroundAgentProvider(
  config: CursorProviderConfig,
): LlmProvider {
  const normalizedBaseUrl = config.baseUrl.replace(/\/$/, '')

  return {
    name: 'cursor',
    async generate(input: LlmRequest): Promise<LlmResponse> {
      const model = input.model ?? config.defaultModel
      const prompt = `System:\n${input.system}\n\nUser:\n${input.user}`

      const launchResponse = await fetch(`${normalizedBaseUrl}/v0/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
        }),
      })

      const launchRaw = (await launchResponse.json()) as CursorLaunchResponse
      if (!launchResponse.ok) {
        throw new Error(
          `cursor launch failed (${launchResponse.status}): ${JSON.stringify(launchRaw).slice(0, 500)}`,
        )
      }

      const agentId = launchRaw.id ?? launchRaw.agentId ?? launchRaw.agent_id
      if (!agentId) {
        throw new Error('cursor launch returned no agent id.')
      }

      await waitForAgentCompletion({
        baseUrl: normalizedBaseUrl,
        apiKey: config.apiKey,
        agentId,
      })

      const conversation = await fetch(
        `${normalizedBaseUrl}/v0/agents/${agentId}/conversation`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        },
      )
      const conversationRaw = await conversation.json()
      if (!conversation.ok) {
        throw new Error(
          `cursor conversation failed (${conversation.status}): ${JSON.stringify(conversationRaw).slice(0, 500)}`,
        )
      }

      const text = extractAssistantText(conversationRaw)
      if (!text) {
        throw new Error('cursor returned no assistant text in conversation.')
      }

      return { text, raw: conversationRaw }
    },
  }
}

async function waitForAgentCompletion(params: {
  baseUrl: string
  apiKey: string
  agentId: string
}) {
  const { baseUrl, apiKey, agentId } = params
  const maxPolls = 30
  for (let i = 0; i < maxPolls; i++) {
    const res = await fetch(`${baseUrl}/v0/agents/${agentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    const raw = await res.json()
    if (!res.ok) {
      throw new Error(
        `cursor agent status failed (${res.status}): ${JSON.stringify(raw).slice(0, 500)}`,
      )
    }

    const status = String(
      raw?.status ?? raw?.state ?? raw?.agent?.status ?? '',
    ).toLowerCase()
    if (['completed', 'complete', 'succeeded', 'done'].includes(status)) {
      return
    }
    if (['failed', 'error', 'cancelled', 'canceled', 'stopped'].includes(status)) {
      throw new Error(`cursor agent ended with status: ${status}`)
    }

    await sleep(1000)
  }

  throw new Error('cursor agent did not complete in time.')
}

function extractAssistantText(raw: unknown): string {
  const messages = extractMessages(raw)
  const assistantMessages = messages.filter(
    (msg) => String(msg?.role ?? '').toLowerCase() === 'assistant',
  )
  const lastAssistant = assistantMessages[assistantMessages.length - 1]
  if (!lastAssistant) return ''
  const content = lastAssistant.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === 'string'
          ? part
          : typeof part?.text === 'string'
            ? part.text
            : '',
      )
      .join('')
      .trim()
  }
  return ''
}

function extractMessages(raw: unknown): Array<{ role?: string; content?: unknown }> {
  if (!raw || typeof raw !== 'object') return []
  const obj = raw as Record<string, unknown>
  const candidateArrays = [obj.messages, obj.conversation, obj.items]
  for (const value of candidateArrays) {
    if (Array.isArray(value)) {
      return value as Array<{ role?: string; content?: unknown }>
    }
  }
  return []
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
