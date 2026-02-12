import type {
  CandidateProfile,
  FitLevel,
  FitResult,
  RequirementMatch,
} from '@/data/types'
import { callLlmJson } from '@/lib/llm/client'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import { z } from 'zod'

const RequirementMatchSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  importance: z.enum(['core', 'nice']),
  evidenceLevel: z.enum(['match', 'partial', 'none']),
  evidence: z.string().optional(),
})

const RequirementMatchArraySchema = z.array(RequirementMatchSchema).min(1)

function deriveProfileFacts(profile: CandidateProfile): string[] {
  const facts: string[] = []
  const skillBuckets = profile.skills ?? {}
  const allSkillValues = Object.values(skillBuckets).flatMap((values) => values ?? [])

  const hasSkill = (pattern: RegExp, keys?: string[]) => {
    const source =
      keys && keys.length > 0
        ? keys.flatMap((key) => skillBuckets[key] ?? [])
        : allSkillValues
    return source.some((value) => pattern.test(value))
  }

  const hasExperienceText = (pattern: RegExp) => {
    return profile.experience.some((exp) => {
      const stackText = (exp.stack ?? []).join(' ')
      const highlightsText = (exp.highlights ?? []).join(' ')
      const combined = `${exp.domain ?? ''} ${exp.role ?? ''} ${stackText} ${highlightsText}`
      return pattern.test(combined)
    })
  }

  if (hasSkill(/react/i, ['frontend']) || hasExperienceText(/\breact\b/i)) {
    facts.push('Candidate has significant experience building SPAs with React.')
  }
  if (hasSkill(/typescript/i, ['frontend']) || hasExperienceText(/\btypescript|\bts\b/i)) {
    facts.push('Candidate is comfortable using TypeScript in production.')
  }
  if (
    hasSkill(/next\.?js|ssr|server[- ]side rendering/i, ['frontend']) ||
    hasExperienceText(/next\.?js|ssr|server[- ]side rendering/i)
  ) {
    facts.push('Candidate has experience with Next.js and/or SSR rendering patterns.')
  }
  if (
    hasSkill(/design system|component librar/i, ['designSystems']) ||
    hasExperienceText(/design system|component librar/i)
  ) {
    facts.push('Candidate has hands-on experience with design systems and component libraries.')
  }
  if (hasExperienceText(/\bb2b saas\b/i)) {
    facts.push('Candidate has worked on B2B SaaS products.')
  }
  if (hasSkill(/jest/i, ['testing']) || hasExperienceText(/\bjest\b/i)) {
    facts.push('Candidate has written tests with Jest.')
  }
  if (
    hasSkill(/cypress|playwright/i, ['testing']) ||
    hasExperienceText(/\bcypress\b|\bplaywright\b/i)
  ) {
    facts.push('Candidate has written end-to-end tests (for example Cypress or Playwright).')
  }
  if (hasSkill(/storybook/i, ['designSystems', 'frontend']) || hasExperienceText(/storybook/i)) {
    facts.push('Candidate has used Storybook or similar tooling for UI development.')
  }
  if (
    hasSkill(/accessibility|a11y|wcag/i, ['frontend']) ||
    hasExperienceText(/accessibility|a11y|wcag/i)
  ) {
    facts.push('Candidate has applied accessibility practices in frontend work.')
  }
  if (
    hasSkill(/mentor|lead|leadership/i) ||
    hasExperienceText(/mentor|mentoring|lead|leadership/)
  ) {
    facts.push('Candidate has experience with mentoring or technical leadership responsibilities.')
  }
  if (
    hasSkill(/cursor|chatgpt|claude|llm|ai/i, ['aiTools']) ||
    hasExperienceText(/cursor|chatgpt|claude|llm|ai/i)
  ) {
    facts.push(
      'Candidate regularly uses AI tools (for example Cursor and LLM assistants) as part of the development workflow.',
    )
  }

  return facts
}

export async function analyzeRequirementsWithLLM(params: {
  jobDescription: string
  profile: CandidateProfile
  llmSettings?: LlmRuntimeSettings
}): Promise<RequirementMatch[]> {
  const { jobDescription, profile, llmSettings } = params
  const profileFacts = deriveProfileFacts(profile)
  const factsSection =
    profileFacts.length > 0
      ? `- ${profileFacts.join('\n- ')}`
      : '- No additional derived facts available; rely on the profile JSON.'

  const systemPrompt = `
You are helping evaluate how well a candidate matches a job description.
You are given a set of FACTS about the candidate derived from profile data.

Your ONLY task in this step is to:
- Extract the most important requirements/responsibilities from the job description.
- For each requirement, classify whether the candidate profile shows:
  - "match" (clear or strong implied evidence),
  - "partial" (some related/adjacent evidence), or
  - "none" (no meaningful evidence).
- Mark whether each requirement is "core" or "nice".
- Provide a short "evidence" string when evidence exists, grounded explicitly in the profile.

IMPORTANT INTERPRETATION RULES:

- Treat the provided FACTS section as ground truth.
- You MUST NOT claim "no evidence" for any capability that appears in the FACTS list.
- For adjacent requirements (for example B2B SaaS vs marketing sites, or design systems vs broader frontend ownership), describe transferability as "partial" when not identical, rather than "none".

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

FACTS ABOUT THIS CANDIDATE (treat these as ground truth; do not claim the opposite of these):
${factsSection}

Job description:
${jobDescription}

Steps:
1) Identify 5-10 key requirements.
2) Mark at most 6 as "core", the rest as "nice".
3) For each, classify evidenceLevel using the rules above, erring towards "partial" when anything related appears in the profile.
4) Return the JSON array with NO extra commentary.
`.trim()

  const requirements = await callLlmJson<RequirementMatch[]>({
    system: systemPrompt,
    user: userPrompt,
    settings: llmSettings,
    parse: tryParseRequirementMatches,
    errorMessage: 'LLM did not return valid requirements JSON',
  })

  console.log('Requirement matches:', requirements)
  return requirements
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
      strengths.push(`Matches: ${req.text} (${req.evidence || 'see profile'})`)
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

function tryParseRequirementMatches(value: unknown): RequirementMatch[] | null {
  const normalized = normalizeRequirementMatches(value)
  if (!normalized) return null

  const validated = RequirementMatchArraySchema.safeParse(normalized)
  if (!validated.success) return null

  return validated.data
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
