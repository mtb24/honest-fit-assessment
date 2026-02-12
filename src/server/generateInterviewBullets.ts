import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { candidateProfileSchema } from '@/data/candidateProfile.schema'
import type { CandidateProfile, FitResult, InterviewBulletsResult } from '@/data/types'
import { callLlmText } from '@/lib/llm/client'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import { fitResultSchema, llmSettingsSchema } from '@/server/fitSchemas'

const interviewBulletsInputSchema = z.object({
  jobDescription: z.string().min(40),
  profile: candidateProfileSchema,
  fit: fitResultSchema,
  llmSettings: llmSettingsSchema,
})

export async function generateInterviewBulletsOnServer(params: {
  jobDescription: string
  profile: CandidateProfile
  fit: FitResult
  llmSettings?: LlmRuntimeSettings
}): Promise<InterviewBulletsResult> {
  const systemPrompt = `
You help a candidate prepare for interviews with concise, honest talking points.
Generate 5-7 bullet points the candidate can use when asked:
- "Why are you a strong fit for this role?"
- "Where would you expect to ramp up?"

Requirements:
- Include 3-5 "good fit" bullets grounded in profile + fit evidence.
- Include 1-2 constructive "ramp-up / questions to ask" bullets based on real gaps.
- Do not invent experience, tools, or outcomes not present in the profile/fit.
- Avoid generic fluff and avoid repeating the job description verbatim.

Return ONLY the bullet list, one bullet per line.
  `.trim()

  const userPrompt = `
Job description:
${params.jobDescription}

Candidate profile (JSON):
${JSON.stringify(params.profile, null, 2)}

Fit assessment result (JSON):
${JSON.stringify(params.fit, null, 2)}
  `.trim()

  let rawResponse: string
  try {
    rawResponse = await callLlmText({
      system: systemPrompt,
      user: userPrompt,
      settings: params.llmSettings,
    })
  } catch (error) {
    throw mapLlmErrorToFriendlyMessage(error)
  }

  const bullets = parseInterviewBullets(rawResponse)
  if (bullets.length < 5) {
    throw new Error('The AI did not return enough interview bullets. Please try again.')
  }

  return { bullets: bullets.slice(0, 7) }
}

export const generateInterviewBulletsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => interviewBulletsInputSchema.parse(data))
  .handler(async ({ data }) => generateInterviewBulletsOnServer(data))

function parseInterviewBullets(raw: string): string[] {
  const fromLines = raw
    .split('\n')
    .map((line) => line.trim())
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)

  const normalizedLineBullets = Array.from(new Set(fromLines))
  if (normalizedLineBullets.length >= 5) {
    return normalizedLineBullets
  }

  const fromSentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .map((part) => part.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((part) => part.length > 0)

  return Array.from(new Set([...normalizedLineBullets, ...fromSentences]))
}

function mapLlmErrorToFriendlyMessage(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const normalized = message.toLowerCase()

  if (
    normalized.includes('all llm providers failed') ||
    normalized.includes('fetch failed') ||
    normalized.includes('network') ||
    normalized.includes('http') ||
    normalized.includes('timeout') ||
    normalized.includes('econn') ||
    normalized.includes('enotfound')
  ) {
    return new Error(
      'The AI provider is not available. Please check your settings or try again later.',
    )
  }

  if (
    normalized.includes('did not return a valid') ||
    normalized.includes('valid json') ||
    normalized.includes('json parse') ||
    normalized.includes('unexpected token')
  ) {
    return new Error(
      'The AI response was not in the expected format. Try again, or simplify the job description.',
    )
  }

  return error instanceof Error
    ? error
    : new Error('Something went wrong while contacting the AI provider.')
}
