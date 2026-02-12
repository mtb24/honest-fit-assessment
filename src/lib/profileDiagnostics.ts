import type { CandidateProfile } from '@/data/types'

export type DiagnosticLevel = 'none' | 'minimal' | 'needs-improvement' | 'strong'

export type DiagnosticCheck = {
  id: string
  label: string
  passed: boolean
  details?: string
}

export type ProfileDiagnostics = {
  level: DiagnosticLevel
  checks: DiagnosticCheck[]
}

export function getProfileDiagnostics(profile: CandidateProfile | null): ProfileDiagnostics {
  if (!profile) {
    return { level: 'none', checks: [] }
  }

  const experienceCount = profile.experience?.length ?? 0
  const storyCount = profile.stories?.length ?? 0
  const skills = profile.skills ?? {}
  const designSystemsSkillCount = skills.designSystems?.length ?? 0
  const aiToolsCount = skills.aiTools?.length ?? 0

  const summary = (profile.summary ?? '').toLowerCase()
  const coreStrengths = (profile.coreStrengths ?? []).map((strength) => strength.toLowerCase())

  const experienceText = (profile.experience ?? [])
    .flatMap((experience) => [experience.domain ?? '', ...(experience.highlights ?? [])])
    .join(' ')
    .toLowerCase()

  const storiesText = (profile.stories ?? [])
    .map((story) => `${story.summary} ${(story.takeaways ?? []).join(' ')}`)
    .join(' ')
    .toLowerCase()

  const designSystemsSignals = ['design system', 'component library', 'design tokens']
  const aiSignals = ['ai', 'llm', 'cursor', 'chatgpt', 'claude', 'genai', 'gpt']

  const hasDesignSystemsExperience =
    designSystemsSkillCount > 0 ||
    designSystemsSignals.some((signal) => summary.includes(signal) || experienceText.includes(signal))

  const hasAiExperience =
    aiToolsCount > 0 ||
    aiSignals.some(
      (signal) =>
        summary.includes(signal) ||
        experienceText.includes(signal) ||
        storiesText.includes(signal) ||
        coreStrengths.some((strength) => strength.includes(signal)),
    )

  const checks: DiagnosticCheck[] = [
    {
      id: 'core_experience',
      label: `Core experience (${experienceCount} role${experienceCount === 1 ? '' : 's'})`,
      passed: experienceCount >= 3,
      details: experienceCount >= 3 ? undefined : 'Consider adding more roles or projects.',
    },
    {
      id: 'stories',
      label: `Stories (${storyCount} included)`,
      passed: storyCount >= 2,
      details: storyCount >= 2 ? undefined : 'Add at least 2 short stories that show impact.',
    },
    {
      id: 'design_systems',
      label: 'Design systems / component libraries',
      passed: hasDesignSystemsExperience,
      details: hasDesignSystemsExperience
        ? undefined
        : 'If relevant, highlight any shared UI or design system work.',
    },
    {
      id: 'ai_usage',
      label: 'AI usage in your workflow',
      passed: hasAiExperience,
      details: hasAiExperience
        ? undefined
        : 'If you use tools like Cursor or LLMs, add a story or note in your summary.',
    },
  ]

  const passedCount = checks.filter((check) => check.passed).length

  let level: DiagnosticLevel = 'minimal'
  if (passedCount > 0 && passedCount <= 2) level = 'needs-improvement'
  if (passedCount >= 3) level = 'strong'

  return { level, checks }
}
