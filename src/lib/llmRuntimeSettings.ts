import type { KnownProvider, LlmRuntimeSettings } from '@/lib/llm/types'
import type { UiLlmSettings } from '@/lib/useUiLlmSettings'

export function toRuntimeSettings(input: UiLlmSettings): LlmRuntimeSettings {
  const fallbackProviders = parseFallbackProviders(input.fallbackProvidersCsv)
  const temperature = Number(input.temperature)
  return {
    provider: input.provider,
    model: input.model.trim() || undefined,
    temperature: Number.isFinite(temperature) ? temperature : undefined,
    fallbackProviders,
  }
}

function parseFallbackProviders(csv: string): KnownProvider[] {
  return csv
    .split(',')
    .map((value) => value.trim())
    .filter(
      (value): value is KnownProvider =>
        value === 'mock' ||
        value === 'openai' ||
        value === 'cursor' ||
        value === 'ollama',
    )
}
