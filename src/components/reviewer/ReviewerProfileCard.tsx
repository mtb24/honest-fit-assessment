import type { CandidateProfile } from '@/data/types'
import { Card } from '@/components/ui/card'

type ReviewerProfileCardProps = {
  profile: CandidateProfile
}

export function ReviewerProfileCard({ profile }: ReviewerProfileCardProps) {
  return (
    <Card className="ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold text-slate-900">{profile.name}</h1>
      <p className="mt-1 text-sm font-medium text-slate-800">{profile.headline}</p>
      {profile.subHeadline && <p className="mt-1 text-sm text-slate-600">{profile.subHeadline}</p>}
      <p className="mt-3 text-sm text-slate-700">{profile.summary}</p>
    </Card>
  )
}
