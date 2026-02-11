import { callWithProviders, resolveLlmProviders } from '@/lib/llm/providerRegistry'
import type { LlmRuntimeSettings } from '@/lib/llm/types'

type LlmPromptArgs = {
  system: string
  user: string
  settings?: LlmRuntimeSettings
}

type LlmJsonArgs<T> = LlmPromptArgs & {
  parse: (value: unknown) => T | null
  errorMessage?: string
}

export async function callLlmText({
  system,
  user,
  settings,
}: LlmPromptArgs): Promise<string> {
  console.log('LLM system prompt:', system.slice(0, 200) + '...')
  console.log('LLM user prompt:', user.slice(0, 200) + '...')

  const providers = resolveLlmProviders(settings)
  return callWithProviders(
    {
      system,
      user,
      model: settings?.model ?? process.env.LLM_MODEL,
      temperature:
        settings?.temperature ?? Number(process.env.LLM_TEMPERATURE ?? 0.2),
    },
    providers,
  )
}

export async function callLlmJson<T>({
  system,
  user,
  settings,
  parse,
  errorMessage = 'LLM did not return valid JSON.',
}: LlmJsonArgs<T>): Promise<T> {
  const raw = await callLlmText({ system, user, settings })
  const parsed = parseJsonFromText(raw)

  if (!parsed) {
    throw new Error(errorMessage)
  }

  const normalized = parse(parsed)
  if (!normalized) {
    throw new Error(errorMessage)
  }

  return normalized
}

function parseJsonFromText(raw: string): unknown | null {
  const candidates: string[] = [raw]

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) candidates.push(fenced[1])

  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(raw.slice(firstBrace, lastBrace + 1))
  }

  const firstBracket = raw.indexOf('[')
  const lastBracket = raw.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    candidates.push(raw.slice(firstBracket, lastBracket + 1))
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      // Keep trying candidates.
    }
  }

  return null
}
