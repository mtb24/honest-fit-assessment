import { useState } from 'react'
import { ImportProfileButton } from '@/components/profile/ImportProfileButton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useProfileContext } from '@/contexts/ProfileContext'
import { demoCandidateProfile } from '@/data/candidateProfile.demo'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import { buildProfileFromResumeText } from '@/lib/profileFromResume'

type ReviewerProfileControlsProps = {
  llmSettings?: LlmRuntimeSettings
}

export function ReviewerProfileControls({ llmSettings }: ReviewerProfileControlsProps) {
  const {
    activeProfile,
    profileSource,
    setActiveProfile,
    clearProfile,
    profileImportError,
    setProfileImportError,
  } = useProfileContext()
  const [showResumeBuilder, setShowResumeBuilder] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const sourceLabel = getProfileSourceLabel(profileSource)
  const canBuildProfile = resumeText.trim().length >= 80

  const handleBuildProfile = async () => {
    setParseError(null)
    setProfileImportError(null)
    setIsParsing(true)
    try {
      const profile = await buildProfileFromResumeText(resumeText, llmSettings)
      setActiveProfile(profile, 'resume')
      setShowResumeBuilder(false)
      setParseError(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to build profile from resume text.'
      setParseError(message)
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <Card className="ring-1 ring-slate-200">
      <h2 className="text-base font-semibold text-slate-900">
        {activeProfile ? 'Reviewer profile controls' : 'Load a candidate profile to start'}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Profile source: {activeProfile ? sourceLabel : 'No profile loaded'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={showResumeBuilder ? 'secondary' : 'primary'}
          onClick={() => {
            setShowResumeBuilder((prev) => !prev)
            setParseError(null)
          }}
        >
          Build profile from resume
        </Button>
        <Button
          type="button"
          onClick={() => {
            setActiveProfile(demoCandidateProfile, 'demo')
            setProfileImportError(null)
            setParseError(null)
          }}
        >
          Load demo profile
        </Button>
        <ImportProfileButton
          onProfileImported={(profile) => setActiveProfile(profile, 'importedJson')}
          onImportError={setProfileImportError}
        />
        <Button type="button" variant="outline" onClick={clearProfile} disabled={!activeProfile}>
          Clear profile
        </Button>
      </div>
      {showResumeBuilder && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-700">
            Paste a resume here and we&apos;ll build a candidate profile JSON from it.
          </p>
          <Textarea
            className="mt-2 min-h-36"
            placeholder="Paste resume text/markdown..."
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
          />
          {parseError && <p className="mt-2 text-xs text-red-700">{parseError}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleBuildProfile}
              disabled={isParsing || !canBuildProfile}
            >
              {isParsing ? 'Building profile...' : 'Build profile'}
            </Button>
            <button
              type="button"
              className="text-xs text-slate-600 underline underline-offset-2 hover:text-slate-800"
              onClick={() => {
                setShowResumeBuilder(false)
                setParseError(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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
