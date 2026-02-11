import type { LlmProvider, LlmRequest } from '@/lib/llm/types'

export function createMockProvider(name = 'mock'): LlmProvider {
  return {
    name,
    async generate(input: LlmRequest) {
      const promptPreview = input.user.slice(0, 200)
      return {
        text: `LLM stub (${name}): plug in a real model provider. Prompt preview: ${promptPreview}...`,
      }
    },
  }
}
