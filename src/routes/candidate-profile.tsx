import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ProfileHeaderEditor } from '@/components/profile/ProfileHeaderEditor'
import { ProfileActions } from '@/components/profile/ProfileActions'
import { ResumeToProfileSection } from '@/components/profile/ResumeToProfileSection'
import { ExperienceSection } from '@/components/profile/ExperienceSection'
import { ProfileStoriesSection } from '@/components/profile/ProfileStoriesSection'
import { ProfileOnboarding } from '@/components/profile/ProfileOnboarding'
import { ProfileCompleteness } from '@/components/profile/ProfileCompleteness'
import { useProfileContext } from '@/contexts/ProfileContext'
import { LlmSettingsSidebar } from '@/components/settings/LlmSettingsSidebar'
import { useUiLlmSettings } from '@/lib/useUiLlmSettings'
import { demoCandidateProfile } from '@/data/candidateProfile.demo'
import { demoRecentRoles } from '@/data/demoRecentRoles'
import { saveRecentRoles } from '@/lib/recentRoles'

export const Route = createFileRoute('/candidate-profile')({
  component: CandidateProfilePage,
})

function CandidateProfilePage() {
  const {
    activeProfile,
    hasProfile,
    setActiveProfile,
    setProfileImportError,
  } = useProfileContext()
  const {
    llmSettings,
    setLlmSettings,
    availableModels,
    modelLoadError,
    modelsQuery,
    resetSettings,
  } = useUiLlmSettings()
  const [showResumeBuildSuccess, setShowResumeBuildSuccess] = useState(false)

  const handleLoadDemoProfile = () => {
    setActiveProfile(demoCandidateProfile)
    setProfileImportError(null)
    saveRecentRoles(demoRecentRoles)
  }

  if (!hasProfile || !activeProfile) {
    return (
      <>
        <LlmSettingsSidebar
          llmSettings={llmSettings}
          setLlmSettings={setLlmSettings}
          availableModels={availableModels}
          isLoadingModels={modelsQuery.isFetching}
          modelLoadError={modelLoadError}
          onReset={resetSettings}
        />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-4 flex items-center justify-end gap-2">
            <span className="text-xs text-slate-500">Safe local demo data</span>
            <button
              type="button"
              onClick={handleLoadDemoProfile}
              className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-slate-100"
            >
              Load demo profile &amp; roles
            </button>
          </div>
          <ProfileOnboarding
            onResumeProfileBuilt={() => {
              setShowResumeBuildSuccess(true)
            }}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <LlmSettingsSidebar
        llmSettings={llmSettings}
        setLlmSettings={setLlmSettings}
        availableModels={availableModels}
        isLoadingModels={modelsQuery.isFetching}
        modelLoadError={modelLoadError}
        onReset={resetSettings}
      />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {showResumeBuildSuccess && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Profile created from your resume. Review your headline and summary, then
            run your first fit.
          </div>
        )}
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-slate-500">Safe local demo data</span>
          <button
            type="button"
            onClick={handleLoadDemoProfile}
            className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-slate-100"
          >
            Load demo profile &amp; roles
          </button>
          <ProfileActions />
        </div>

        <ProfileHeaderEditor profile={activeProfile} onSave={setActiveProfile} />

        <ProfileCompleteness profile={activeProfile} />

        <ResumeToProfileSection
          onProfileImported={setActiveProfile}
          onImportError={setProfileImportError}
        />

        <ExperienceSection experience={activeProfile.experience} />
        <ProfileStoriesSection stories={activeProfile.stories} />

        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-slate-400">
            View raw profile JSON (debug)
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-950 p-2 text-[11px] text-slate-200">
            {JSON.stringify(activeProfile, null, 2)}
          </pre>
        </details>
      </div>
    </>
  )
}
