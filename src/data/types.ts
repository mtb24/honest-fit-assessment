import type { z } from 'zod'
import type {
  candidateExperienceSchema,
  candidateProfileSchema,
  candidateStorySchema,
} from '@/data/candidateProfile.schema'

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

export type CandidateExperience = z.infer<typeof candidateExperienceSchema>

export type CandidateStory = z.infer<typeof candidateStorySchema>

export type CandidateProfile = z.infer<typeof candidateProfileSchema>

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

export type InterviewBulletsResult = {
  bullets: string[]
}
