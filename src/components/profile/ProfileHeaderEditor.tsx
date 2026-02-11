import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CandidateProfile } from '@/data/types'

type ProfileHeaderEditorProps = {
  profile: CandidateProfile
  onSave: (updated: CandidateProfile) => void
}

export function ProfileHeaderEditor({ profile, onSave }: ProfileHeaderEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [headline, setHeadline] = useState(profile.headline)
  const [summary, setSummary] = useState(profile.summary)
  const [coreStrengthsText, setCoreStrengthsText] = useState(profile.coreStrengths.join('\n'))

  useEffect(() => {
    setName(profile.name)
    setHeadline(profile.headline)
    setSummary(profile.summary)
    setCoreStrengthsText(profile.coreStrengths.join('\n'))
  }, [profile])

  const handleCancel = () => {
    setName(profile.name)
    setHeadline(profile.headline)
    setSummary(profile.summary)
    setCoreStrengthsText(profile.coreStrengths.join('\n'))
    setIsEditing(false)
  }

  const handleSave = () => {
    const nextCoreStrengths = coreStrengthsText
      .split('\n')
      .map((strength) => strength.trim())
      .filter(Boolean)

    const updatedProfile: CandidateProfile = {
      ...profile,
      name: name.trim() || profile.name,
      headline: headline.trim() || profile.headline,
      summary: summary.trim() || profile.summary,
      coreStrengths: nextCoreStrengths.length > 0 ? nextCoreStrengths : profile.coreStrengths,
    }

    onSave(updatedProfile)
    setIsEditing(false)
  }

  return (
    <Card className="mb-6 ring-1 ring-slate-200">
      {!isEditing ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <header>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{profile.name}</h1>
              <p className="mt-1 text-base text-slate-600">{profile.headline}</p>
            </header>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit profile
            </Button>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-slate-900">Candidate Summary</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {profile.summary}
          </p>

          {profile.coreStrengths.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.coreStrengths.map((strength) => (
                <span
                  key={strength}
                  className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700"
                >
                  {strength}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Name
            </label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Headline
            </label>
            <Input
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="Senior Frontend Engineer - React, TypeScript, Design Systems"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Summary
            </label>
            <Textarea
              className="min-h-24"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Short overview of your experience and focus..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Core Strengths (One Per Line)
            </label>
            <Textarea
              className="min-h-24 font-mono text-xs"
              value={coreStrengthsText}
              onChange={(event) => setCoreStrengthsText(event.target.value)}
              placeholder={'React + TypeScript single-page applications\nDesign systems and component libraries\nB2B SaaS dashboards and internal tools'}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
