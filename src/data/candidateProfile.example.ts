import type { CandidateProfile } from './types'

export const exampleCandidateProfile: CandidateProfile = {
  name: 'Example Candidate',
  headline: 'Senior Frontend Engineer - React / TypeScript / Design Systems',
  subHeadline: 'Example profile used for local testing and demos.',
  location: 'Remote, USA',
  summary:
    'Example profile used for local testing and demos. Replace with a real profile at runtime.',
  coreStrengths: ['Example strength'],
  preferences: {
    roleTitlesPreferred: ['Senior Frontend Engineer'],
    roleTitlesAvoid: [],
    workMode: {
      remoteOnly: true,
      remoteRegions: ['USA'],
      willingToTravelOccasionally: true,
      hybridRequired: false,
    },
    compensation: {
      minBaseSalaryUsd: 150000,
    },
    domainsPreferred: ['B2B SaaS'],
    domainsAvoid: [],
  },
  skills: {
    frontend: ['React', 'TypeScript'],
    backendAndApis: [],
    designSystems: [],
    infrastructureAndOps: [],
    aiTools: [],
    testing: [],
    languagesMisc: [],
  },
  experience: [],
  stories: [],
  meta: {
    profileVersion: '0.0',
    lastUpdated: '2026-02-11',
  },
}
