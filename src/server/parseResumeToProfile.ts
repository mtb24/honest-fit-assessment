import { createServerFn } from '@tanstack/react-start'
import type { CandidateProfile } from '@/data/types'
import { parseResumeToProfileWithLLM } from '@/lib/resumeToProfile'
import type { LlmRuntimeSettings } from '@/lib/llm/types'

export async function parseResumeToProfileOnServer(
  resumeText: string,
  llmSettings?: LlmRuntimeSettings,
): Promise<CandidateProfile> {
  if (!resumeText || resumeText.trim().length < 80) {
    throw new Error('Please paste a reasonably complete resume before parsing.')
  }
  if (!llmSettings?.provider || !llmSettings?.model?.trim()) {
    throw new Error(
      'No AI provider/model selected. Open settings and choose a provider before building a profile.',
    )
  }

  try {
    return parseResumeToProfileWithLLM({
      resumeText,
      llmSettings,
    })
  } catch (error) {
    throw mapLlmErrorToFriendlyMessage(error)
  }
}

export const parseResumeToProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      resumeText: string
      llmSettings?: LlmRuntimeSettings
    }) => data,
  )
  .handler(async ({ data }) =>
    parseResumeToProfileOnServer(data.resumeText, data.llmSettings),
  )

function mapLlmErrorToFriendlyMessage(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const normalized = message.toLowerCase()

  if (
    normalized.includes('all llm providers failed') ||
    normalized.includes('fetch failed') ||
    normalized.includes('network') ||
    normalized.includes('http') ||
    normalized.includes('timeout') ||
    normalized.includes('econn') ||
    normalized.includes('enotfound')
  ) {
    return new Error(
      'The AI provider is not available. Please check your settings or try again later.',
    )
  }

  if (
    normalized.includes('did not return a valid') ||
    normalized.includes('valid json') ||
    normalized.includes('json parse') ||
    normalized.includes('unexpected token')
  ) {
    return new Error(
      'The AI response was not in the expected format. Try again, or simplify the job description.',
    )
  }

  return error instanceof Error
    ? error
    : new Error('Something went wrong while contacting the AI provider.')
}
