import type { CandidateProfile } from './types'
import { exampleCandidateProfile } from './candidateProfile.example'

type CandidateProfileModule = {
  candidateProfile: CandidateProfile
}

const localProfileModules = import.meta.glob<CandidateProfileModule>(
  './candidateProfile.local.ts',
  {
    eager: true,
    import: 'candidateProfile',
  },
)

const localProfile = Object.values(localProfileModules)[0]

export const candidateProfile: CandidateProfile =
  localProfile ?? exampleCandidateProfile
