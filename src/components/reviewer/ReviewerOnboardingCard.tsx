import { ImportProfileButton } from '@/components/profile/ImportProfileButton'
import type { CandidateProfile } from '@/data/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type ReviewerOnboardingCardProps = {
  profileImportError: string | null
  onImportError: (message: string | null) => void
  onProfileImported: (profile: CandidateProfile) => void
  onLoadDemoCandidate: () => void
}

export function ReviewerOnboardingCard({
  profileImportError,
  onImportError,
  onProfileImported,
  onLoadDemoCandidate,
}: ReviewerOnboardingCardProps) {
  return (
    <Card className="ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold text-slate-900">No candidate profile loaded</h1>
      <p className="mt-2 text-sm text-slate-700">
        To use Reviewer mode, load a candidate profile using one of the options below.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onLoadDemoCandidate}>
          Load demo candidate
        </Button>
        <ImportProfileButton
          onProfileImported={onProfileImported}
          onImportError={onImportError}
        />
      </div>
      {profileImportError && <p className="mt-3 text-xs text-red-700">{profileImportError}</p>}
    </Card>
  )
}
