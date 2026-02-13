import { candidateProfileSchema } from '@/data/candidateProfile.schema'
import type { CandidateProfile } from '@/data/types'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import { parseResumeToProfileFn } from '@/server/parseResumeToProfile'

const parseResumeToProfile = parseResumeToProfileFn as unknown as (args: {
  data: {
    resumeText: string
    llmSettings?: LlmRuntimeSettings
  }
}) => Promise<CandidateProfile>

export async function buildProfileFromResumeText(
  resumeText: string,
  llmSettings?: LlmRuntimeSettings,
): Promise<CandidateProfile> {
  const profile = await parseResumeToProfile({
    data: {
      resumeText,
      llmSettings,
    },
  })

  const validated = candidateProfileSchema.safeParse(profile)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(
      firstIssue
        ? `Generated profile invalid at "${firstIssue.path.join('.') || 'root'}": ${firstIssue.message}`
        : 'Generated profile JSON is invalid.',
    )
  }

  return validated.data
}
