import type { CandidateProfile } from '@/data/types'
import { useProfileContext } from '@/contexts/ProfileContext'
import { ExportProfileButton } from '@/components/profile/ExportProfileButton'
import { ImportProfileButton } from '@/components/profile/ImportProfileButton'

type ProfileActionsProps = {
  onProfileImported?: (profile: CandidateProfile) => void
}

export function ProfileActions({ onProfileImported }: ProfileActionsProps) {
  const {
    activeProfile,
    setActiveProfile,
    hasProfile,
    clearProfile,
    profileImportError,
    setProfileImportError,
  } = useProfileContext()

  const handleProfileImported = (profile: CandidateProfile) => {
    setActiveProfile(profile)
    onProfileImported?.(profile)
  }

  return (
    <div className="flex shrink-0 flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {activeProfile && <ExportProfileButton profile={activeProfile} />}
        <ImportProfileButton
          onProfileImported={handleProfileImported}
          onImportError={setProfileImportError}
        />
        {hasProfile && (
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-slate-100"
            onClick={clearProfile}
          >
            Clear profile
          </button>
        )}
      </div>
      {profileImportError && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-red-600">{profileImportError}</p>
          <button
            type="button"
            className="text-xs text-slate-600 underline underline-offset-2 hover:text-slate-800"
            onClick={() => setProfileImportError(null)}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
