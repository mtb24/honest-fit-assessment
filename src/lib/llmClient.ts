import type {
  CandidateProfile,
  FitLevel,
  FitResult,
  RequirementMatch,
} from '@/data/types'
import { callWithProviders, resolveLlmProviders } from '@/lib/llm/providerRegistry'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import { z } from 'zod'

type LlmArgs = {
  system: string
  user: string
  settings?: LlmRuntimeSettings
}

const RequirementMatchSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  importance: z.enum(['core', 'nice']),
  evidenceLevel: z.enum(['match', 'partial', 'none']),
  evidence: z.string().optional(),
})

const RequirementMatchArraySchema = z.array(RequirementMatchSchema).min(1)

/** Stub: replace with real OpenAI/Anthropic/etc. call. */
export async function callYourLlm({
  system,
  user,
  settings,
}: LlmArgs): Promise<string> {
  console.log('LLM system prompt:', system.slice(0, 200) + '...')
  console.log('LLM user prompt:', user.slice(0, 200) + '...')

  const providers = resolveLlmProviders(settings)
  return callWithProviders(
    {
      system,
      user,
      model: settings?.model ?? process.env.LLM_MODEL,
      temperature:
        settings?.temperature ?? Number(process.env.LLM_TEMPERATURE ?? 0.2),
    },
    providers,
  )
}

export async function analyzeRequirementsWithLLM(params: {
  jobDescription: string
  profile: CandidateProfile
  llmSettings?: LlmRuntimeSettings
}): Promise<RequirementMatch[]> {
  const { jobDescription, profile, llmSettings } = params

  const systemPrompt = `
You are helping evaluate how well a candidate matches a job description.

Your ONLY task in this step is to:
- Extract the most important requirements/responsibilities from the job description.
- For each requirement, classify whether the candidate profile shows:
  - "match" (clear or strong implied evidence),
  - "partial" (some related/adjacent evidence), or
  - "none" (no meaningful evidence).
- Mark whether each requirement is "core" or "nice".
- Provide a short "evidence" string when evidence exists, grounded explicitly in the profile.

IMPORTANT INTERPRETATION RULES:

- You MUST use semantic reasoning, not exact string matching.
  - If the profile shows multi-year React/TypeScript SPA work, that counts as expert-level React/TypeScript unless the job requires something very different.
  - If the profile shows SSR / Next.js experience, that supports requirements mentioning Next.js or SEO-aware rendering.
  - If the profile mentions B2B SaaS, ecommerce, or public-facing SPAs, that counts as at least a partial match for "high-traffic SaaS or startup websites".
  - If the profile includes bullets like "Collaborated with product and backend engineers" or soft skills like "Cross-functional collaboration", that is evidence for collaboration with cross-functional teams.
  - If the profile lists "Team leadership and mentoring" or similar, that is evidence for mentoring and setting standards.

- When in doubt between "partial" and "none", choose "partial".
  Reserve "none" only when you truly have no reasonable evidence from the profile.

- Focus CORE requirements on capabilities and experience that are central to doing the job:
  examples: owning a marketing site, React/TypeScript/Next.js proficiency, web performance/accessibility, collaborating with design/marketing, mentoring.
  Soft requirements like "has a portfolio", "is highly opinionated", or "strong communicator" should usually be "nice" unless the job explicitly frames them as must-haves.

- Limit the number of "core" requirements to at most 6. Everything else should be marked "nice".

You must NOT invent gaps that contradict the profile.
For example, if the profile clearly shows React/TypeScript and multiple years of frontend SPA work, you MUST NOT say they lack React or TypeScript experience.

Return ONLY a JSON array of objects with shape:

[
  {
    "id": "short-stable-id",
    "text": "requirement text in your own words",
    "importance": "core" | "nice",
    "evidenceLevel": "match" | "partial" | "none",
    "evidence": "short explanation or quote from the profile, or empty string"
  }
]
`.trim()

  const userPrompt = `
Candidate profile (JSON):
${JSON.stringify(profile, null, 2)}

Job description:
${jobDescription}

Steps:
1) Identify 5-10 key requirements.
2) Mark at most 6 as "core", the rest as "nice".
3) For each, classify evidenceLevel using the rules above, erring towards "partial" when anything related appears in the profile.
4) Return the JSON array with NO extra commentary.
`.trim()

  const raw = await callYourLlm({
    system: systemPrompt,
    user: userPrompt,
    settings: llmSettings,
  })
  console.log('LLM raw requirements response:', raw)

  const parsed = tryParseRequirementMatches(raw)
  if (!parsed) {
    throw new Error('LLM did not return valid requirements JSON')
  }
  return parsed
}

export async function assessFitWithLLM(params: {
  jobDescription: string
  profile: CandidateProfile
  llmSettings?: LlmRuntimeSettings
}): Promise<FitResult> {
  const { jobDescription, profile, llmSettings } = params

  const requirements = await analyzeRequirementsWithLLM({
    jobDescription,
    profile,
    llmSettings,
  })

  console.log('Requirement matches:', requirements)
  return computeFitFromRequirements(requirements, profile)
}

function computeFitFromRequirements(
  requirements: RequirementMatch[],
  profile: CandidateProfile,
): FitResult {
  const core = requirements.filter((req) => req.importance === 'core')
  const nice = requirements.filter((req) => req.importance === 'nice')

  const coreMatch = core.filter((req) => req.evidenceLevel === 'match').length
  const corePartial = core.filter((req) => req.evidenceLevel === 'partial').length
  const coreTotal = core.length || 1

  const score = (coreMatch + 0.5 * corePartial) / coreTotal

  let fit: FitLevel
  if (score >= 0.75) fit = 'strong'
  else if (score >= 0.45) fit = 'moderate'
  else fit = 'weak'

  const strengths: string[] = []
  const gaps: string[] = []

  for (const req of [...core, ...nice]) {
    if (req.evidenceLevel === 'match' || req.evidenceLevel === 'partial') {
      strengths.push(
        `Matches: ${req.text} (${req.evidence || "see profile"})`
      );
    }
  }

  for (const req of core) {
    if (req.evidenceLevel === 'none') {
      gaps.push(
        `Job requires: ${req.text} - profile shows no explicit evidence for this requirement.`,
      )
    }
  }

  const summary = `Based on the mapped requirements for ${profile.name}, the candidate matches ${coreMatch}/${coreTotal} core requirements and partially aligns with ${corePartial}. Overall this yields a ${fit} fit for the role.`

  const verdictParts: string[] = []
  if (fit === 'strong') {
    verdictParts.push(
      'The candidate appears well-suited for this role and should be able to succeed with a normal onboarding period.',
    )
  } else if (fit === 'moderate') {
    verdictParts.push(
      'The candidate could be a good hire if the team is open to some ramp-up in the areas marked as gaps or partial matches.',
    )
  } else {
    verdictParts.push(
      'The candidate has relevant strengths but is missing several core requirements; they may be better suited for a different role.',
    )
  }

  if (gaps.length === 0) {
    verdictParts.push(
      'No major gaps were identified beyond normal domain-specific ramp-up.',
    )
  }

  return {
    fit,
    summary,
    strengths,
    gaps,
    verdict: verdictParts.join(' '),
    requirements,
  }
}

function tryParseRequirementMatches(raw: string): RequirementMatch[] | null {
  const parsed = parseJsonArrayLike(raw)
  if (!parsed) return null

  const normalized = normalizeRequirementMatches(parsed)
  if (!normalized) return null

  const validated = RequirementMatchArraySchema.safeParse(normalized)
  if (!validated.success) return null

  return validated.data
}

function parseJsonArrayLike(raw: string): unknown[] | null {
  const candidates: string[] = [raw]

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) candidates.push(fenced[1])

  const firstBracket = raw.indexOf('[')
  const lastBracket = raw.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    candidates.push(raw.slice(firstBracket, lastBracket + 1))
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // Keep trying candidates.
    }
  }

  return null
}

function normalizeRequirementMatches(value: unknown): RequirementMatch[] | null {
  if (!Array.isArray(value)) return null

  const result: RequirementMatch[] = []

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>

    const text = asString(record.text)
    const importance = normalizeImportance(record.importance)
    const evidenceLevel = normalizeEvidenceLevel(record.evidenceLevel)
    if (!text || !importance || !evidenceLevel) continue

    const id = asString(record.id) || toStableRequirementId(text, index)
    const evidence = asString(record.evidence)

    result.push({
      id,
      text,
      importance,
      evidenceLevel,
      evidence: evidence || undefined,
    })
  }

  return result.length ? result : null
}

function normalizeImportance(value: unknown): RequirementMatch['importance'] | null {
  if (value === 'core' || value === 'nice') return value

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim()
    if (normalized === 'must' || normalized === 'required') return 'core'
    if (normalized === 'optional' || normalized === 'preferred') return 'nice'
  }

  return null
}

function normalizeEvidenceLevel(
  value: unknown,
): RequirementMatch['evidenceLevel'] | null {
  if (value === 'match' || value === 'partial' || value === 'none') return value

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim()
    if (normalized === 'no-evidence' || normalized === 'no evidence') return 'none'
    if (normalized === 'full' || normalized === 'strong') return 'match'
    if (normalized === 'some') return 'partial'
  }

  return null
}

function asString(value: unknown): string {
  if (typeof value !== 'string') return ''
  return cleanText(value)
}

function cleanText(text: string): string {
  return text
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
}

function toStableRequirementId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  return slug ? `req-${slug}` : `req-${index + 1}`
}

