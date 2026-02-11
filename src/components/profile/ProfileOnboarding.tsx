import { useState } from 'react'
import type { CandidateProfile } from '@/data/types'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import { parseUiSettingsToRuntimeSettings } from '@/lib/resumeToProfile'
import { useProfileContext } from '@/contexts/ProfileContext'
import { ImportProfileButton } from '@/components/profile/ImportProfileButton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { parseResumeToProfileFn } from '@/server/parseResumeToProfile'

const SETTINGS_STORAGE_KEY = 'honest-fit:llm-settings'
const MIN_RESUME_LENGTH = 40

const parseResumeToProfile = parseResumeToProfileFn as unknown as (args: {
  data: {
    resumeText: string
    llmSettings?: LlmRuntimeSettings
  }
}) => Promise<CandidateProfile>

export function ProfileOnboarding() {
  const {
    setActiveProfile,
    loadExampleProfile,
    profileImportError,
    setProfileImportError,
  } = useProfileContext()
  const [resumeText, setResumeText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const hasResumeText = resumeText.trim().length >= MIN_RESUME_LENGTH

  const handleUseExample = () => {
    setProfileImportError(null)
    setParseError(null)
    loadExampleProfile()
  }

  const handleProfileImported = (profile: CandidateProfile) => {
    setProfileImportError(null)
    setParseError(null)
    setActiveProfile(profile)
  }

  const handleParseResume = async () => {
    setParseError(null)
    setProfileImportError(null)

    if (!resumeText || resumeText.trim().length < 80) {
      setParseError('Please paste a reasonably complete resume before parsing.')
      return
    }

    setIsParsing(true)
    try {
      const profile = await parseResumeToProfile({
        data: {
          resumeText,
          llmSettings: readRuntimeSettingsFromStorage(),
        },
      })
      setActiveProfile(profile)
    } catch (error) {
      console.error(error)
      setParseError(
        error instanceof Error ? error.message : 'Failed to build profile from resume.',
      )
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <Card className="ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Set up your profile</h2>
      <p className="mt-1 text-sm text-slate-700">
        You don&apos;t have a profile yet. Choose one of:
      </p>

      <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-700">
        <li>Build from resume (LLM)</li>
        <li>Import JSON</li>
        <li>Load example profile</li>
      </ol>

      <div className="mt-4 space-y-2">
        <label className="block text-xs font-medium text-slate-700">
          Paste your resume (text or markdown)
        </label>
        <Textarea
          className="min-h-40 font-mono text-xs"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          placeholder="Paste your resume here to build a profile..."
        />
        <Button
          type="button"
          onClick={handleParseResume}
          disabled={isParsing || !hasResumeText}
        >
          {isParsing ? 'Building profile...' : 'Build profile from resume'}
        </Button>
        <p className="text-[11px] text-slate-500">
          {hasResumeText
            ? 'We will infer a structured profile from your resume text.'
            : 'Paste your resume above to enable this button.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span>Or:</span>
        <ImportProfileButton
          onProfileImported={handleProfileImported}
          onImportError={setProfileImportError}
        />
        <Button type="button" variant="outline" size="sm" onClick={handleUseExample}>
          Load example profile
        </Button>
      </div>

      {(parseError || profileImportError) && (
        <p className="mt-3 text-xs text-red-700">{parseError ?? profileImportError}</p>
      )}
    </Card>
  )
}

function readRuntimeSettingsFromStorage(): LlmRuntimeSettings | undefined {
  if (typeof window === 'undefined') return undefined
  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (!raw) return undefined

  try {
    const parsed = JSON.parse(raw) as unknown
    return parseUiSettingsToRuntimeSettings(parsed)
  } catch {
    return undefined
  }
}
