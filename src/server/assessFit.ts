import { createServerFn } from '@tanstack/react-start'
import type { CandidateProfile, FitResult } from '@/data/types'
import { assessFitWithLLM } from '@/lib/llmClient'
import type { LlmRuntimeSettings } from '@/lib/llm/types'

export async function assessFitOnServer(
  jobDescription: string,
  profile: CandidateProfile,
  llmSettings?: LlmRuntimeSettings,
): Promise<FitResult> {
  if (!jobDescription || jobDescription.trim().length < 40) {
    throw new Error('Please paste a reasonably complete job description.')
  }

  return assessFitWithLLM({
    jobDescription,
    profile,
    llmSettings,
  })
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
