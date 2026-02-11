import type { CandidateProfile } from '@/data/types'
import {
  CANDIDATE_PROFILE_SCHEMA_VERSION,
  exportedCandidateProfileFileSchema,
  type ExportedCandidateProfileFile,
} from '@/lib/profileFormats'

export function exportProfileToJson(profile: CandidateProfile): string {
  const payload: ExportedCandidateProfileFile = {
    schemaVersion: CANDIDATE_PROFILE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile,
  }

  return JSON.stringify(payload, null, 2)
}

export function parseExportedProfileJson(json: string): CandidateProfile {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON file. Could not parse.')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('schemaVersion' in parsed) ||
    (parsed as { schemaVersion?: unknown }).schemaVersion !==
      CANDIDATE_PROFILE_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported profile file. Expected schemaVersion "${CANDIDATE_PROFILE_SCHEMA_VERSION}".`,
    )
  }

  const validated = exportedCandidateProfileFileSchema.safeParse(parsed)
  if (!validated.success) {
    throw new Error('Invalid profile file contents. Please check required fields.')
  }

  return validated.data.profile
}
