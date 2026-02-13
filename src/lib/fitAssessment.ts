import type {
  CandidateProfile,
  FitLevel,
  FitResult,
  RequirementMatch,
} from '@/data/types'
import { enforceLiteralEvidenceForRequirement } from '@/lib/fitPostProcessing'
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
You are an assistant that evaluates how well a candidate fits a specific job description.

Your job is to:
- Extract the key requirements from the job description.
- Compare them against the candidate profile.
- Output a structured analysis of:
  - Which requirements are matched vs. partial vs. gaps
  - Honest, recruiter-friendly reasoning.

CRITICAL RULES (DO NOT VIOLATE):
- Only mark a requirement as "match" when there is clear, explicit evidence in the candidate profile.
- For technology-specific requirements, you MUST see those technologies by name in the profile. Do NOT infer:
  - Node.js or PHP does NOT imply Java Spring Boot.
  - React does NOT imply Angular.
  - "Back-end experience" does NOT imply any specific language or framework unless it is explicitly listed.
- For credentials and constraints, you MUST see them explicitly mentioned to count as matched:
  - If the job requires Top Secret Clearance (or similar) and the profile does not mention it, this is a gap.
  - The same applies for required degrees, specific certifications, or citizenship requirements.
- If the candidate has related but different experience, treat this as a gap and explain the closest relevant experience in your reasoning.
- Never claim the candidate has experience with a technology, clearance, or domain if the profile does not explicitly support it.

FIT LEVEL GUIDANCE:
- Strong fit: Candidate clearly matches the majority of core requirements, including key stack/tooling/role expectations. Only minor or trainable gaps.
- Moderate fit: Candidate matches some important requirements but is missing several others, or their experience is adjacent and would require ramp-up.
- Weak fit: Candidate is missing many fundamental requirements, or is in a very different discipline.

OUTPUT STYLE:
- Be concise, honest, and recruiter-friendly.
- Prefer short sections and bullet points over long paragraphs.
- Avoid exaggeration; it is OK to say the candidate is not a good fit if that is the case.
- When you mention a match, briefly anchor it to something concrete from the profile (title, project, stack, etc.).
- When you mention a gap, say whether the gap is:
  - Hard constraint (for example missing Top Secret Clearance)
  - Stack-specific but adjacent skills exist (for example Node.js vs Java)
  - Domain/scale mismatch (for example no evidence of 10k+ user scale)

Return ONLY a JSON array of objects with shape:
[
  {
    "id": "short-stable-id",
    "text": "requirement text in your own words",
    "importance": "core" | "nice",
    "evidenceLevel": "match" | "partial" | "none",
    "evidence": "short explanation grounded in the profile, or empty string"
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
3) For each, classify evidenceLevel using the literal-evidence rules above.
4) Return the JSON array with NO extra commentary.
`.trim()

  const requirements = await callLlmJson<RequirementMatch[]>({
    system: systemPrompt,
    user: userPrompt,
    settings: llmSettings,
    parse: tryParseRequirementMatches,
    errorMessage: 'LLM did not return valid requirements JSON',
  })

  const profilePlainText = JSON.stringify(profile).toLowerCase()
  const correctedRequirements = requirements.map((requirement) => ({
    ...requirement,
    evidenceLevel: enforceLiteralEvidenceForRequirement(
      requirement.text,
      profilePlainText,
      requirement.evidenceLevel,
    ),
  }))

  console.log('Requirement matches:', correctedRequirements)
  return correctedRequirements
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
