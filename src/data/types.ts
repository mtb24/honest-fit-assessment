export type FitLevel = 'strong' | 'moderate' | 'weak'

export type FitResult = {
  fit: FitLevel
  summary: string
  strengths: string[]
  gaps: string[]
  verdict: string
  requirements?: RequirementMatch[]
  debug?: {
    parseStage: 'first' | 'repair' | 'fallback'
    rawFirstResponse: string
    rawRepairResponse?: string
  }
}

export type CandidateExperience = {
  company: string
  role: string
  location: string
  start: string
  end: string
  domain: string
  stack: string[]
  highlights: string[]
  links?: {
    label: string;
    url: string;
  }[];
}

export type CandidateStory = {
  id: string
  title: string
  summary: string
  takeaways: string[]
}

export type CandidateProfile = {
  name: string
  headline: string
  subHeadline: string
  location: string
  summary: string
  preferences: {
    roleTitlesPreferred: string[]
    roleTitlesAvoid: string[]
    workMode: {
      remoteOnly: boolean
      remoteRegions: string[]
      willingToTravelOccasionally: boolean
      hybridRequired: boolean
    }
    compensation: {
      minBaseSalaryUsd?: number
      minContractRateUsdPerHour?: number
    }
    domainsPreferred: string[]
    domainsAvoid: string[]
  }
  coreStrengths: string[]
  skills: {
    frontend?: string[]
    backendAndApis?: string[]
    designSystems?: string[]
    infrastructureAndOps?: string[]
    aiTools?: string[]
    languagesMisc?: string[]
    [category: string]: string[] | undefined
  }
  experience: CandidateExperience[]
  stories: CandidateStory[]
  meta?: {
    profileVersion?: string
    lastUpdated?: string
  }
}

export type RequirementMatch = {
  id: string
  text: string
  importance: 'core' | 'nice'
  evidenceLevel: 'match' | 'partial' | 'none'
  evidence?: string
}

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type ChatResponse = {
  messages: ChatMessage[]
}
