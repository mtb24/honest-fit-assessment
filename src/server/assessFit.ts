import { createServerFn } from '@tanstack/react-start'
import type { CandidateProfile, FitResult } from '@/data/types'
import { assessFitWithLLM } from '@/lib/fitAssessment'
import type { LlmRuntimeSettings } from '@/lib/llm/types'

export async function assessFitOnServer(
  jobDescription: string,
  profile: CandidateProfile,
  llmSettings?: LlmRuntimeSettings,
): Promise<FitResult> {
  if (!jobDescription || jobDescription.trim().length < 40) {
    throw new Error('Please paste a reasonably complete job description.')
  }

  try {
    return assessFitWithLLM({
      jobDescription,
      profile,
      llmSettings,
    })
  } catch (error) {
    throw mapLlmErrorToFriendlyMessage(error)
  }
}

export const assessFitFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      jobDescription: string
      profile: CandidateProfile
      llmSettings?: LlmRuntimeSettings
    }) => data,
  )
  .handler(async ({ data }) =>
    assessFitOnServer(data.jobDescription, data.profile, data.llmSettings),
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
