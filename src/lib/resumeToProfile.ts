import { candidateProfileSchema } from '@/data/candidateProfile.schema'
import type { CandidateExperience, CandidateProfile, CandidateStory } from '@/data/types'
import { callLlmJson } from '@/lib/llm/client'
import type { KnownProvider, LlmRuntimeSettings } from '@/lib/llm/types'
import { CANDIDATE_PROFILE_SCHEMA_VERSION } from '@/lib/profileFormats'

export async function parseResumeToProfileWithLLM(params: {
  resumeText: string
  llmSettings?: LlmRuntimeSettings
}): Promise<CandidateProfile> {
  const { resumeText, llmSettings } = params
  const systemPrompt = `
You extract candidate profile data from raw resume text.

Return ONLY one JSON object that matches this shape:
{
  "name": string,
  "headline": string,
  "subHeadline": string,
  "location": string,
  "summary": string,
  "preferences": {
    "roleTitlesPreferred": string[],
    "roleTitlesAvoid": string[],
    "workMode": {
      "remoteOnly": boolean,
      "remoteRegions": string[],
      "willingToTravelOccasionally": boolean,
      "hybridRequired": boolean
    },
    "compensation": {
      "minBaseSalaryUsd": number?,
      "minContractRateUsdPerHour": number?
    },
    "domainsPreferred": string[],
    "domainsAvoid": string[]
  },
  "coreStrengths": string[],
  "skills": Record<string, string[]>,
  "experience": [
    {
      "company": string,
      "role": string,
      "location": string,
      "start": string,
      "end": string | null,
      "domain": string,
      "stack": string[],
      "highlights": string[],
      "links": [{ "label": string, "url": string }]
    }
  ],
  "stories": [
    {
      "id": string,
      "title": string,
      "summary": string,
      "takeaways": string[]
    }
  ],
  "meta": {
    "profileVersion": string,
    "lastUpdated": string
  }
}

Rules:
- Use only information present or strongly implied in the resume.
- Be truthful. Do not invent companies, roles, projects, tools, impact, years, or achievements.
- If a field is unknown, use safe defaults: empty arrays, false booleans, and neutral strings.
- Always provide a complete object that follows the full shape above, including stories.
- Build 2-4 stories that reflect real resume evidence and cover:
  1) end-to-end ownership of complex systems or products,
  2) design system or component library work (if present),
  3) B2B SaaS or internal tool outcomes (if present),
  4) one "sole owner" or "force multiplier" example where supported.
- Keep stories concise and grounded in notable accomplishments.

Mapping guidance:
- If the resume shows multi-year React/TypeScript SPA delivery, map that into:
  - coreStrengths such as "React + TypeScript single-page apps",
  - skills.frontend including React, TypeScript, and SPA architecture,
  - experience highlights that mention concrete frontend ownership.
- If design systems or component libraries are mentioned, emphasize:
  - coreStrengths entries related to design systems/component libraries,
  - a skills.designSystems bucket,
  - experience highlights tied to real design system outcomes.
- If AI tools (Cursor, Copilot, ChatGPT, etc.) are mentioned:
  - add AI-related strengths where justified,
  - add skills.aiTools entries,
  - include at least one experience highlight describing real usage.
- For older infrastructure/IT roles (data center, networking, telephony, etc.):
  - compress details into concise entries focused on systems ownership and business impact,
  - avoid listing every low-level technology unless it is clearly relevant.
- Prefer concise, high-signal wording over exhaustive bullet dumps.
- Do not include markdown, explanation text, or code fences.
`.trim()

  const userPrompt = `
Resume text/markdown:
${resumeText}

Task:
1) Extract a best-effort candidate profile.
2) Return valid JSON only.
`.trim()

  return callLlmJson<CandidateProfile>({
    system: systemPrompt,
    user: userPrompt,
    settings: llmSettings,
    parse: tryParseCandidateProfile,
    errorMessage: 'LLM did not return a valid candidate profile JSON object.',
  })
}

function tryParseCandidateProfile(value: unknown): CandidateProfile | null {
  const normalized = normalizeCandidateProfile(value)
  if (!normalized) return null

  const validated = candidateProfileSchema.safeParse(normalized)
  if (!validated.success) return null

  return validated.data
}

function normalizeCandidateProfile(value: unknown): CandidateProfile | null {
  const today = new Date().toISOString().slice(0, 10)
  const base = defaultProfile(today)
  const record = unwrapProfileRecord(value)
  if (!record) return null

  const experience = normalizeExperience(record.experience)
  const stories = normalizeStories(record.stories)
  const preferences = normalizePreferences(record.preferences)
  const skills = normalizeSkills(record.skills)
  const lastUpdated = asString(record.meta && asRecord(record.meta)?.lastUpdated) || today

  return {
    name: asString(record.name) || base.name,
    headline: asString(record.headline) || base.headline,
    subHeadline: asString(record.subHeadline) || base.subHeadline,
    location: asString(record.location) || base.location,
    summary: asString(record.summary) || base.summary,
    preferences,
    coreStrengths: asStringArray(record.coreStrengths),
    skills,
    experience,
    stories,
    meta: {
      profileVersion:
        asString(record.meta && asRecord(record.meta)?.profileVersion) ||
        CANDIDATE_PROFILE_SCHEMA_VERSION,
      lastUpdated,
    },
  }
}

function defaultProfile(today: string): CandidateProfile {
  return {
    name: 'Unknown Candidate',
    headline: 'Candidate Profile Draft',
    subHeadline: 'Draft generated from resume text.',
    location: 'Unknown',
    summary: 'Generated draft profile. Review and edit as needed.',
    preferences: {
      roleTitlesPreferred: [],
      roleTitlesAvoid: [],
      workMode: {
        remoteOnly: false,
        remoteRegions: [],
        willingToTravelOccasionally: false,
        hybridRequired: false,
      },
      compensation: {},
      domainsPreferred: [],
      domainsAvoid: [],
    },
    coreStrengths: [],
    skills: {},
    experience: [],
    stories: [],
    meta: {
      profileVersion: CANDIDATE_PROFILE_SCHEMA_VERSION,
      lastUpdated: today,
    },
  }
}

function unwrapProfileRecord(value: unknown): Record<string, unknown> | null {
  const direct = asRecord(value)
  if (!direct) return null
  const nested = asRecord(direct.profile)
  return nested ?? direct
}

function normalizePreferences(value: unknown): CandidateProfile['preferences'] {
  const record = asRecord(value)
  const workMode = asRecord(record?.workMode)
  const compensation = asRecord(record?.compensation)

  return {
    roleTitlesPreferred: asStringArray(record?.roleTitlesPreferred),
    roleTitlesAvoid: asStringArray(record?.roleTitlesAvoid),
    workMode: {
      remoteOnly: asBoolean(workMode?.remoteOnly),
      remoteRegions: asStringArray(workMode?.remoteRegions),
      willingToTravelOccasionally: asBoolean(workMode?.willingToTravelOccasionally),
      hybridRequired: asBoolean(workMode?.hybridRequired),
    },
    compensation: {
      minBaseSalaryUsd: asNumber(compensation?.minBaseSalaryUsd),
      minContractRateUsdPerHour: asNumber(compensation?.minContractRateUsdPerHour),
    },
    domainsPreferred: asStringArray(record?.domainsPreferred),
    domainsAvoid: asStringArray(record?.domainsAvoid),
  }
}

function normalizeSkills(value: unknown): CandidateProfile['skills'] {
  const record = asRecord(value)
  if (!record) return {}

  const entries = Object.entries(record).map(([key, raw]) => [key, asStringArray(raw)] as const)
  return Object.fromEntries(entries)
}

function normalizeExperience(value: unknown): CandidateExperience[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item): CandidateExperience | null => {
      const record = asRecord(item)
      if (!record) return null

      const company = asString(record.company) || 'Unknown company'
      const role = asString(record.role) || 'Unknown role'
      const start = asString(record.start) || 'Unknown'
      const end = record.end == null ? null : asString(record.end) || null
      const domain = asString(record.domain)
      const links = normalizeLinks(record.links)

      return {
        company,
        role,
        location: asString(record.location),
        start,
        end,
        domain,
        stack: asStringArray(record.stack),
        highlights: asStringArray(record.highlights),
        links: links.length ? links : undefined,
      }
    })
    .filter((entry): entry is CandidateExperience => Boolean(entry))
}

function normalizeLinks(value: unknown): Array<{ label: string; url: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const record = asRecord(item)
      if (!record) return null
      const label = asString(record.label)
      const url = asString(record.url)
      if (!label || !url) return null
      return { label, url }
    })
    .filter((entry): entry is { label: string; url: string } => Boolean(entry))
}

function normalizeStories(value: unknown): CandidateStory[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index): CandidateStory | null => {
      const record = asRecord(item)
      if (!record) return null
      const title = asString(record.title)
      const summary = asString(record.summary)
      if (!title || !summary) return null

      const id = asString(record.id) || `story-${toSlug(title)}-${index + 1}`
      return {
        id,
        title,
        summary,
        takeaways: asStringArray(record.takeaways),
      }
    })
    .filter((entry): entry is CandidateStory => Boolean(entry))
}

function toSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'item'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(asString).filter(Boolean)
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === 'yes') return true
    if (normalized === 'false' || normalized === 'no') return false
  }
  return false
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export function parseUiSettingsToRuntimeSettings(value: unknown): LlmRuntimeSettings | undefined {
  const record = asRecord(value)
  if (!record) return undefined

  const provider = normalizeProvider(record.provider)
  const model = asString(record.model)
  const temperature = asNumber(record.temperature)
  const fallbackProviders = parseFallbackProviders(
    asString(record.fallbackProvidersCsv),
  )

  return {
    provider,
    model: model || undefined,
    temperature,
    fallbackProviders: fallbackProviders.length ? fallbackProviders : undefined,
  }
}

function parseFallbackProviders(csv: string): KnownProvider[] {
  return csv
    .split(',')
    .map((value) => value.trim())
    .filter(
      (value): value is KnownProvider =>
        value === 'mock' ||
        value === 'openai' ||
        value === 'cursor' ||
        value === 'ollama',
    )
}

function normalizeProvider(value: unknown): KnownProvider | undefined {
  if (
    value === 'mock' ||
    value === 'openai' ||
    value === 'cursor' ||
    value === 'ollama'
  ) {
    return value
  }
  return undefined
}
