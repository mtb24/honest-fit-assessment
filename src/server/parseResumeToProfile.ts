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

  return parseResumeToProfileWithLLM({
    resumeText,
    llmSettings,
  })
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
