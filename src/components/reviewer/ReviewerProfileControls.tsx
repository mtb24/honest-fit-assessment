import { ImportProfileButton } from '@/components/profile/ImportProfileButton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useProfileContext } from '@/contexts/ProfileContext'
import { demoCandidateProfile } from '@/data/candidateProfile.demo'

export function ReviewerProfileControls() {
  const {
    activeProfile,
    profileSource,
    setActiveProfile,
    clearProfile,
    profileImportError,
    setProfileImportError,
  } = useProfileContext()

  const sourceLabel = getProfileSourceLabel(profileSource)

  if (!activeProfile) {
    return (
      <Card className="ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">
          Load a candidate profile to start
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Reviewers can load a demo profile for a quick walkthrough, or import a real
          candidate profile JSON.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => {
              setActiveProfile(demoCandidateProfile, 'demo')
              setProfileImportError(null)
            }}
          >
            Load demo profile
          </Button>
          <ImportProfileButton
            onProfileImported={(profile) => setActiveProfile(profile, 'importedJson')}
            onImportError={setProfileImportError}
          />
        </div>
        {profileImportError && <p className="mt-3 text-xs text-red-700">{profileImportError}</p>}
      </Card>
    )
  }

  return (
    <Card className="ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">Profile source: {sourceLabel}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ImportProfileButton
          onProfileImported={(profile) => setActiveProfile(profile, 'importedJson')}
          onImportError={setProfileImportError}
        />
        <Button type="button" variant="outline" onClick={clearProfile}>
          Clear profile
        </Button>
      </div>
      {profileImportError && <p className="mt-3 text-xs text-red-700">{profileImportError}</p>}
    </Card>
  )
}

function getProfileSourceLabel(source: string | undefined): string {
  if (source === 'demo') return 'Demo profile'
  if (source === 'importedJson') return 'Imported JSON'
  if (source === 'resume') return 'Generated from resume (local)'
  return 'Local profile'
}
