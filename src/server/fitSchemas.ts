import { z } from 'zod'

export const fitResultSchema = z.object({
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

export const llmSettingsSchema = z
  .object({
    provider: z.enum(['mock', 'openai', 'cursor', 'ollama']).optional(),
    fallbackProviders: z
      .array(z.enum(['mock', 'openai', 'cursor', 'ollama']))
      .optional(),
    model: z.string().optional(),
    temperature: z.number().optional(),
  })
  .optional()
