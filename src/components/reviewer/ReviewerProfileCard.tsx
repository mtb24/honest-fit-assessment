import type { CandidateProfile } from '@/data/types'
import { Card } from '@/components/ui/card'

type ReviewerProfileCardProps = {
  profile: CandidateProfile
  highlights: string[]
}

export function ReviewerProfileCard({ profile, highlights }: ReviewerProfileCardProps) {
  return (
    <Card className="ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold text-slate-900">{profile.name}</h1>
      <p className="mt-1 text-sm font-medium text-slate-800">{profile.headline}</p>
      {profile.subHeadline && <p className="mt-1 text-sm text-slate-600">{profile.subHeadline}</p>}
      <p className="mt-3 text-sm text-slate-700">{profile.summary}</p>

      {highlights.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-slate-900">Highlights</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
