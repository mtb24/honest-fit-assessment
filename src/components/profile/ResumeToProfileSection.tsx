import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { candidateProfileSchema } from '@/data/candidateProfile.schema'
import type { CandidateProfile } from '@/data/types'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import {
  parseUiSettingsToRuntimeSettings,
} from '@/lib/resumeToProfile'
import { exportProfileToJson } from '@/lib/profileSerialization'
import { parseResumeToProfileFn } from '@/server/parseResumeToProfile'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

const SETTINGS_STORAGE_KEY = 'honest-fit:llm-settings'

type ResumeToProfileSectionProps = {
  onProfileImported: (profile: CandidateProfile) => void
  onImportError: (message: string | null) => void
}

export function ResumeToProfileSection({
  onProfileImported,
  onImportError,
}: ResumeToProfileSectionProps) {
  const [resumeText, setResumeText] = useState('')
  const [draftJson, setDraftJson] = useState('')
  const [draftMessage, setDraftMessage] = useState<string | null>(null)

  const parseResumeToProfile = parseResumeToProfileFn as unknown as (args: {
    data: {
      resumeText: string
      llmSettings?: LlmRuntimeSettings
    }
  }) => Promise<CandidateProfile>

  const parseMutation = useMutation({
    mutationFn: (resume: string) =>
      parseResumeToProfile({
        data: {
          resumeText: resume,
          llmSettings: readRuntimeSettingsFromStorage(),
        },
      }),
    onSuccess: (profile) => {
      setDraftJson(JSON.stringify(profile, null, 2))
      setDraftMessage('Draft generated. Review, edit, then apply or export.')
      onImportError(null)
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to parse resume into a draft profile.'
      onImportError(message)
      setDraftMessage(null)
    },
  })

  const canParse = resumeText.trim().length >= 80
  const hasDraft = draftJson.trim().length > 0
  const draftValidationError = useMemo(() => {
    if (!hasDraft) return null
    const parsed = parseDraftJson(draftJson)
    if (!parsed.success) return parsed.error
    return null
  }, [draftJson, hasDraft])

  const handleApplyDraft = () => {
    const parsed = parseDraftJson(draftJson)
    if (!parsed.success) {
      onImportError(parsed.error)
      setDraftMessage(null)
      return
    }

    onImportError(null)
    onProfileImported(parsed.profile)
    setDraftMessage('Draft applied as active profile.')
  }

  const handleExportDraft = () => {
    const parsed = parseDraftJson(draftJson)
    if (!parsed.success) {
      onImportError(parsed.error)
      return
    }

    onImportError(null)
    const json = exportProfileToJson(parsed.profile)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const filename = `${parsed.profile.name.replace(/\s+/g, '_').toLowerCase()}_profile.json`

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    setDraftMessage('Draft exported as profile JSON.')
  }

  return (
    <Card className="mt-4 w-full ring-1 ring-slate-200">
      <h3 className="text-sm font-semibold text-slate-900">
        Generate a draft profile from a resume
      </h3>
      <Textarea
        className="mt-3 min-h-40"
        placeholder="Paste a resume and let AI convert it into a structured profile draft. This won&apos;t automatically merge with your current profile; you can review the draft and manually copy over anything useful before applying it."
        value={resumeText}
        onChange={(event) => setResumeText(event.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => parseMutation.mutate(resumeText)} disabled={!canParse}>
          {parseMutation.isPending ? 'Parsing resume...' : 'Generate draft profile'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setResumeText('')
            setDraftJson('')
            setDraftMessage(null)
            onImportError(null)
          }}
          disabled={parseMutation.isPending && !hasDraft}
        >
          Clear
        </Button>
      </div>

      {hasDraft && (
        <>
          <Textarea
            className="mt-4 min-h-64 font-mono text-xs"
            value={draftJson}
            onChange={(event) => setDraftJson(event.target.value)}
            aria-label="Draft candidate profile JSON"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={handleApplyDraft}>Use draft as active profile</Button>
            <Button variant="outline" onClick={handleExportDraft}>
              Export draft JSON
            </Button>
          </div>
        </>
      )}

      {draftValidationError && (
        <p className="mt-2 text-xs text-red-700">{draftValidationError}</p>
      )}
      {draftMessage && !draftValidationError && (
        <p className="mt-2 text-xs text-emerald-700">{draftMessage}</p>
      )}
    </Card>
  )
}

function parseDraftJson(value: string):
  | { success: true; profile: CandidateProfile }
  | { success: false; error: string } {
  try {
    const parsed = JSON.parse(value) as unknown
    const validated = candidateProfileSchema.safeParse(parsed)
    if (!validated.success) {
      const firstIssue = validated.error.issues[0]
      return {
        success: false,
        error: firstIssue
          ? `Draft profile invalid at "${firstIssue.path.join('.') || 'root'}": ${firstIssue.message}`
          : 'Draft profile JSON is invalid.',
      }
    }

    return { success: true, profile: validated.data }
  } catch {
    return {
      success: false,
      error: 'Draft profile is not valid JSON.',
    }
  }
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
