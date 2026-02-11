import type { ChangeEvent } from 'react'
import type { CandidateProfile } from '@/data/types'
import { parseExportedProfileJson } from '@/lib/profileSerialization'

type ImportProfileButtonProps = {
  onProfileImported: (profile: CandidateProfile) => void
  onImportError: (message: string | null) => void
}

export function ImportProfileButton({
  onProfileImported,
  onImportError,
}: ImportProfileButtonProps) {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()

    try {
      const profile = parseExportedProfileJson(text)
      onImportError(null)
      onProfileImported(profile)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to import profile JSON.'
      onImportError(message)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <label className="inline-flex cursor-pointer items-center">
      <span className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-slate-100">
        Import profile JSON
      </span>
      <input
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />
    </label>
  )
}
