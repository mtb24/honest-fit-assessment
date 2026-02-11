import { z } from 'zod'
import { candidateProfileSchema } from '@/data/candidateProfile.schema'

export const CANDIDATE_PROFILE_SCHEMA_VERSION = 'candidateProfile.v1' as const

export type CandidateProfileSchemaVersion = typeof CANDIDATE_PROFILE_SCHEMA_VERSION

export type ExportedCandidateProfileFile = {
  schemaVersion: CandidateProfileSchemaVersion
  exportedAt: string
  profile: z.infer<typeof candidateProfileSchema>
}

export const exportedCandidateProfileFileSchema = z.object({
  schemaVersion: z.literal(CANDIDATE_PROFILE_SCHEMA_VERSION),
  exportedAt: z.string(),
  profile: candidateProfileSchema,
})
