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
        <ExportProfileButton profile={activeProfile} />
        <ImportProfileButton
          onProfileImported={handleProfileImported}
          onImportError={setProfileImportError}
        />
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
