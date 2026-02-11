import { createServerFn } from '@tanstack/react-start'
import { listAvailableModels } from '@/lib/llm/providerRegistry'
import type { KnownProvider } from '@/lib/llm/types'

export async function getLlmModelsOnServer(
  provider: KnownProvider,
): Promise<string[]> {
  return listAvailableModels(provider)
}

export const getLlmModelsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { provider: KnownProvider }) => data)
  .handler(async ({ data }) => getLlmModelsOnServer(data.provider))
