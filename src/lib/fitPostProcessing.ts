import type { RequirementMatch } from '@/data/types'

const TECH_TERMS = [
  'java',
  'spring boot',
  'kubernetes',
  'go',
  'golang',
  'python',
  'react',
  'angular',
  'node.js',
  'nodejs',
  'php',
] as const

const HARD_CONSTRAINT_TERMS = [
  'top secret clearance',
  'ts/sci',
  'secret clearance',
  'security clearance',
  'us citizenship',
  'u.s. citizenship',
  'active clearance',
  "bachelor's degree",
  'bachelors degree',
  "master's degree",
  'masters degree',
  'certification required',
  'required certification',
] as const

function profileMentions(profileText: string, term: string): boolean {
  const normalized = profileText.toLowerCase()
  return normalized.includes(term.toLowerCase())
}

function requirementMentions(requirementText: string, term: string): boolean {
  return requirementText.toLowerCase().includes(term.toLowerCase())
}

function requiredTermsInText(text: string, terms: readonly string[]): string[] {
  return terms.filter((term) => requirementMentions(text, term))
}

export function enforceLiteralEvidenceForRequirement(
  requirementText: string,
  profileText: string,
  llmLevel: RequirementMatch['evidenceLevel'],
): RequirementMatch['evidenceLevel'] {
  if (llmLevel === 'none') return llmLevel

  const techTerms = requiredTermsInText(requirementText, TECH_TERMS)
  if (techTerms.length > 0) {
    const hasAllTechTerms = techTerms.every((term) =>
      profileMentions(profileText, term),
    )
    if (!hasAllTechTerms) return 'none'
  }

  const hardConstraints = requiredTermsInText(
    requirementText,
    HARD_CONSTRAINT_TERMS,
  )
  if (hardConstraints.length > 0) {
    const hasAllConstraints = hardConstraints.every((term) =>
      profileMentions(profileText, term),
    )
    if (!hasAllConstraints) return 'none'
  }

  return llmLevel
}

