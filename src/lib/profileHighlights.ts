import type { CandidateProfile } from '@/data/types'

export function getTopProfileHighlights(
  profile: CandidateProfile,
  maxCount = 3,
): string[] {
  const candidateHighlights = [
    ...profile.experience.flatMap((entry) => entry.highlights),
    ...profile.stories.flatMap((story) => story.takeaways),
    ...profile.coreStrengths,
  ]
    .map((value) => value.trim())
    .filter(Boolean)

  return Array.from(new Set(candidateHighlights)).slice(0, maxCount)
}
