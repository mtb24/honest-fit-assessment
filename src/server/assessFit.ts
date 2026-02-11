import { createServerFn } from '@tanstack/react-start'
import { candidateProfile } from '@/data/currentProfile'
import type { FitResult } from '@/data/types'
import { assessFitWithLLM } from '@/lib/llmClient'
import type { LlmRuntimeSettings } from '@/lib/llm/types'

export async function assessFitOnServer(
  jobDescription: string,
  llmSettings?: LlmRuntimeSettings,
): Promise<FitResult> {
  if (!jobDescription || jobDescription.trim().length < 40) {
    throw new Error('Please paste a reasonably complete job description.')
  }

  return assessFitWithLLM({
    jobDescription,
    profile: candidateProfile,
    llmSettings,
  })
}

export const assessFitFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { jobDescription: string; llmSettings?: LlmRuntimeSettings }) => data,
  )
  .handler(async ({ data }) =>
    assessFitOnServer(data.jobDescription, data.llmSettings),
  )
