import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { candidateProfileSchema } from '@/data/candidateProfile.schema'
import type { CandidateProfile, FitResult } from '@/data/types'
import { callLlmText } from '@/lib/llm/client'
import type { LlmRuntimeSettings } from '@/lib/llm/types'

const fitResultSchema = z.object({
  fit: z.enum(['strong', 'moderate', 'weak']),
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  verdict: z.string(),
  requirements: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        importance: z.enum(['core', 'nice']),
        evidenceLevel: z.enum(['match', 'partial', 'none']),
        evidence: z.string().optional(),
      }),
    )
    .optional(),
  debug: z
    .object({
      parseStage: z.enum(['first', 'repair', 'fallback']),
      rawFirstResponse: z.string(),
      rawRepairResponse: z.string().optional(),
    })
    .optional(),
})

const llmSettingsSchema = z
  .object({
    provider: z.enum(['mock', 'openai', 'cursor', 'ollama']).optional(),
    fallbackProviders: z
      .array(z.enum(['mock', 'openai', 'cursor', 'ollama']))
      .optional(),
    model: z.string().optional(),
    temperature: z.number().optional(),
  })
  .optional()

const applicationBlurbInputSchema = z.object({
  jobDescription: z.string().min(40),
  profile: candidateProfileSchema,
  fit: fitResultSchema,
  llmSettings: llmSettingsSchema,
})

export async function generateApplicationBlurbOnServer(params: {
  jobDescription: string
  profile: CandidateProfile
  fit: FitResult
  llmSettings?: LlmRuntimeSettings
}): Promise<{ paragraph: string }> {
  const systemPrompt = `
You help a candidate write concise, honest job application answers.
Write exactly one paragraph of 3-5 sentences that:
- explains why they are a strong fit for this role,
- includes 1-2 specific strengths aligned to the job,
- includes one gap or ramp-up area framed constructively.
Be concrete, avoid buzzwords, and do not exaggerate beyond the provided profile and fit evidence.
Return only the paragraph.
  `.trim()

  const userPrompt = `
Job description:
${params.jobDescription}

Candidate profile (JSON):
${JSON.stringify(params.profile, null, 2)}

Fit assessment result (JSON):
${JSON.stringify(params.fit, null, 2)}
  `.trim()

  const paragraph = await callLlmText({
    system: systemPrompt,
    user: userPrompt,
    settings: params.llmSettings,
  })

  return { paragraph: paragraph.replace(/\s+/g, ' ').trim() }
}

export const generateApplicationBlurbFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => applicationBlurbInputSchema.parse(data))
  .handler(async ({ data }) => generateApplicationBlurbOnServer(data))
