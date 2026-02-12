import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { CandidateProfile, FitResult, InterviewBulletsResult } from '@/data/types'
import { assessFitFn } from '@/server/assessFit'
import { generateApplicationBlurbFn } from '@/server/generateApplicationBlurb'
import { generateInterviewBulletsFn } from '@/server/generateInterviewBullets'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import { useProfileContext } from '@/contexts/ProfileContext'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProfileHeaderSection } from '@/components/profile/ProfileHeaderSection'
import { ProfileActions } from '@/components/profile/ProfileActions'
import { JobDescriptionFitSection } from '@/components/profile/JobDescriptionFitSection'
import { RecentRolesPanel } from '@/components/fit/RecentRolesPanel'
import { CompareRolesSummary } from '@/components/fit/CompareRolesSummary'
import { RecentRoleDetails } from '@/components/fit/RecentRoleDetails'
import {
  addRecentRole,
  createRoleLabelFromJobDescription,
  loadRecentRoles,
  saveRecentRoles,
  type RecentRole,
} from '@/lib/recentRoles'
import {
  addSavedSnippet,
  loadSavedSnippets,
  removeSavedSnippet,
  saveSavedSnippets,
  type SavedSnippet,
} from '@/lib/savedSnippets'
import { LlmSettingsSidebar } from '@/components/settings/LlmSettingsSidebar'
import { useUiLlmSettings } from '@/lib/useUiLlmSettings'
import { toRuntimeSettings } from '@/lib/llmRuntimeSettings'
import { getTopProfileHighlights } from '@/lib/profileHighlights'
import { useToast } from '@/context/ToastContext'

export const Route = createFileRoute('/candidate/fit')({
  component: CandidateFitPage,
})

function CandidateFitPage() {
  const { activeProfile, hasProfile } = useProfileContext()
  const { showToast } = useToast()
  const [jobDescription, setJobDescription] = useState('')
  const [fitResult, setFitResult] = useState<FitResult | null>(null)
  const [recentRoles, setRecentRoles] = useState<RecentRole[]>([])
  const [activeRecentRoleId, setActiveRecentRoleId] = useState<string | null>(null)
  const [applicationParagraph, setApplicationParagraph] = useState('')
  const [interviewBullets, setInterviewBullets] = useState<string[]>([])
  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>([])
  const {
    llmSettings,
    setLlmSettings,
    availableModels,
    modelLoadError,
    modelsQuery,
    resetSettings,
  } = useUiLlmSettings()
  const assessFit = assessFitFn as unknown as (args: {
    data: {
      jobDescription: string
      profile: CandidateProfile
      llmSettings?: LlmRuntimeSettings
    }
  }) => Promise<FitResult>
  const generateApplicationBlurb = generateApplicationBlurbFn as unknown as (args: {
    data: {
      jobDescription: string
      profile: CandidateProfile
      fit: FitResult
      llmSettings?: LlmRuntimeSettings
    }
  }) => Promise<{ paragraph: string }>
  const generateInterviewBullets = generateInterviewBulletsFn as unknown as (args: {
    data: {
      jobDescription: string
      profile: CandidateProfile
      fit: FitResult
      llmSettings?: LlmRuntimeSettings
    }
  }) => Promise<InterviewBulletsResult>

  useEffect(() => {
    if (typeof window === 'undefined') return
    setRecentRoles(loadRecentRoles())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    saveRecentRoles(recentRoles)
  }, [recentRoles])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setSavedSnippets(loadSavedSnippets())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    saveSavedSnippets(savedSnippets)
  }, [savedSnippets])

  const runtimeSettings = toRuntimeSettings(llmSettings)

  const handleFitSuccess = (fit: FitResult, evaluatedJobDescription: string) => {
    setFitResult(fit)
    setApplicationParagraph('')
    setInterviewBullets([])

    const label = createRoleLabelFromJobDescription(evaluatedJobDescription)
    setRecentRoles((prev) => {
      const next = addRecentRole(prev, {
        label,
        jobDescription: evaluatedJobDescription,
        fit,
      })
      setActiveRecentRoleId(next[0]?.id ?? null)
      return next
    })
  }

  const assessMutation = useMutation({
    mutationFn: (jd: string) => {
      if (!activeProfile) {
        throw new Error('Please create or import a profile first.')
      }
      return assessFit({
        data: {
          jobDescription: jd,
          profile: activeProfile,
          llmSettings: runtimeSettings,
        },
      })
    },
    onSuccess: (data, jd) => {
      handleFitSuccess(data, jd)
    },
  })

  const activeRecentRole =
    recentRoles.find((role) => role.id === activeRecentRoleId) ?? null
  const activeRecentRoleIndex = activeRecentRole
    ? recentRoles.findIndex((role) => role.id === activeRecentRole.id)
    : -1

  const applicationBlurbMutation = useMutation({
    mutationFn: () => {
      if (!activeProfile) {
        throw new Error('Please create or import a profile first.')
      }
      if (!fitResult) {
        throw new Error('Run an Honest Fit assessment before generating an application answer.')
      }
      const trimmedJobDescription = jobDescription.trim()
      if (trimmedJobDescription.length < 40) {
        throw new Error('Please include the job description used for this fit assessment.')
      }

      return generateApplicationBlurb({
        data: {
          jobDescription: trimmedJobDescription,
          profile: activeProfile,
          fit: fitResult,
          llmSettings: runtimeSettings,
        },
      })
    },
    onSuccess: (data) => {
      setApplicationParagraph(data.paragraph)
    },
  })

  const interviewBulletsMutation = useMutation({
    mutationFn: () => {
      if (!activeProfile) {
        throw new Error('Please create or import a profile first.')
      }
      if (!fitResult) {
        throw new Error('Run an Honest Fit assessment before generating interview bullets.')
      }
      const trimmedJobDescription = jobDescription.trim()
      if (trimmedJobDescription.length < 40) {
        throw new Error('Please include the job description used for this fit assessment.')
      }

      return generateInterviewBullets({
        data: {
          jobDescription: trimmedJobDescription,
          profile: activeProfile,
          fit: fitResult,
          llmSettings: runtimeSettings,
        },
      })
    },
    onSuccess: (data) => {
      setInterviewBullets(data.bullets)
    },
  })

  const topHighlights = activeProfile ? getTopProfileHighlights(activeProfile) : []
  const canAssessWithProfile = Boolean(activeProfile)
  const missingProfileAssessHint =
    'Create a profile first so the AI has something to compare this job to.'

  const handleAssess = () => {
    if (!activeProfile) return
    assessMutation.mutate(jobDescription)
  }

  const handleProfileImported = (_profile: CandidateProfile) => {
    setFitResult(null)
    setInterviewBullets([])
  }

  const handleGenerateApplicationAnswer = () => {
    applicationBlurbMutation.mutate()
  }

  const handleGenerateInterviewBullets = () => {
    interviewBulletsMutation.mutate()
  }

  const handleSelectRecentRole = (role: RecentRole) => {
    setJobDescription(role.jobDescription)
    setFitResult(role.fit)
    setApplicationParagraph('')
    setInterviewBullets([])
    setActiveRecentRoleId(role.id)
    assessMutation.reset()
  }

  const handleClearRecentRoles = () => {
    setRecentRoles([])
    setActiveRecentRoleId(null)
  }

  const handleCopyApplicationAnswer = async () => {
    if (!applicationParagraph) return
    try {
      await navigator.clipboard.writeText(applicationParagraph)
      showToast('Copied to clipboard')
    } catch {
      showToast('Failed to copy')
    }
  }

  const handleSaveApplicationSnippet = () => {
    const currentBlurbText = applicationParagraph.trim()
    if (!currentBlurbText) return

    const defaultLabel = activeRecentRole?.label
      ? `${activeRecentRole.label} - application blurb`
      : 'Application blurb'
    const promptedLabel = window.prompt('Label for this snippet', defaultLabel)
    if (promptedLabel === null) return

    const label = promptedLabel.trim() || defaultLabel
    const snippet: SavedSnippet = {
      id: crypto.randomUUID(),
      label,
      roleLabel: activeRecentRole?.label,
      text: currentBlurbText,
      createdAt: new Date().toISOString(),
    }

    setSavedSnippets((prev) => addSavedSnippet(prev, snippet))
  }

  const handleCopySavedSnippet = async (snippetText: string) => {
    try {
      await navigator.clipboard.writeText(snippetText)
      showToast('Copied to clipboard')
    } catch {
      showToast('Failed to copy')
    }
  }

  const handleCopyInterviewBullets = async () => {
    if (interviewBullets.length === 0) return
    const payload = interviewBullets.map((bullet) => `• ${bullet}`).join('\n')
    try {
      await navigator.clipboard.writeText(payload)
      showToast('Copied to clipboard')
    } catch {
      showToast('Failed to copy')
    }
  }

  const handleDeleteSavedSnippet = (snippetId: string) => {
    setSavedSnippets((prev) => removeSavedSnippet(prev, snippetId))
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
      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {activeProfile ? (
            <ProfileHeaderSection
              name={activeProfile.name}
              headline={activeProfile.headline}
              subHeadline={activeProfile.subHeadline}
            />
          ) : (
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Honest Fit Assessment</h1>
              <p className="mt-1 text-sm text-slate-700">
                Paste a job description now, then set up your profile to run fit analysis.
              </p>
            </div>
          )}
          <ProfileActions onProfileImported={handleProfileImported} />
        </div>

        {!hasProfile && (
          <Card className="mb-6 border border-amber-200 bg-amber-50 ring-0">
            <h2 className="text-base font-semibold text-amber-900">
              Set up your profile to use Honest Fit
            </h2>
            <p className="mt-1 text-sm text-amber-900/90">
              Before assessing jobs, create a candidate profile from your resume or import
              one on the Profile page.
            </p>
            <div className="mt-3">
              <Link to="/candidate/profile" className={buttonVariants()}>
                Go to profile setup
              </Link>
            </div>
          </Card>
        )}

        {activeProfile && (
          <Card className="mb-6 ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Candidate Snapshot</h2>
            <p className="mt-1 text-sm text-slate-600">{activeProfile.location}</p>
            <p className="mt-2 text-sm text-slate-700">{activeProfile.summary}</p>

            {topHighlights.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-800">Top 3 highlights</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {topHighlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr),minmax(240px,1fr)] md:items-start">
          <section>
            <JobDescriptionFitSection
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              onAssess={handleAssess}
              canAssess={canAssessWithProfile}
              cannotAssessMessage={missingProfileAssessHint}
              assessPending={assessMutation.isPending}
              assessError={
                assessMutation.isError
                  ? assessMutation.error instanceof Error
                    ? assessMutation.error.message
                    : 'Something went wrong.'
                  : null
              }
              fitResult={fitResult}
              showFitDebug={llmSettings.showFitDebug}
              onGenerateApplicationAnswer={handleGenerateApplicationAnswer}
              generateApplicationPending={applicationBlurbMutation.isPending}
              generateApplicationError={
                applicationBlurbMutation.isError
                  ? applicationBlurbMutation.error instanceof Error
                    ? applicationBlurbMutation.error.message
                    : 'Failed to generate application answer.'
                  : null
              }
              applicationParagraph={applicationParagraph}
              onCopyApplicationAnswer={handleCopyApplicationAnswer}
              onSaveApplicationSnippet={handleSaveApplicationSnippet}
              onGenerateInterviewBullets={handleGenerateInterviewBullets}
              generateInterviewBulletsPending={interviewBulletsMutation.isPending}
              generateInterviewBulletsError={
                interviewBulletsMutation.isError
                  ? interviewBulletsMutation.error instanceof Error
                    ? interviewBulletsMutation.error.message
                    : 'Failed to generate interview bullets.'
                  : null
              }
              interviewBullets={interviewBullets}
              onCopyInterviewBullets={handleCopyInterviewBullets}
            />
          </section>

          <div className="space-y-4">
            <RecentRolesPanel
              roles={recentRoles}
              activeRoleId={activeRecentRoleId}
              demoMode={llmSettings.demoMode}
              onSelect={handleSelectRecentRole}
              onClear={handleClearRecentRoles}
            />
            <CompareRolesSummary roles={recentRoles} demoMode={llmSettings.demoMode} />
            <RecentRoleDetails
              role={activeRecentRole}
              demoMode={llmSettings.demoMode}
              roleIndex={activeRecentRoleIndex >= 0 ? activeRecentRoleIndex : undefined}
            />
            <Card className="ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Saved snippets</h2>
              {savedSnippets.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No snippets saved yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {savedSnippets.map((snippet) => (
                    <div
                      key={snippet.id}
                      className="rounded-md border border-slate-200 bg-white p-3"
                    >
                      <p className="text-sm font-medium text-slate-900">{snippet.label}</p>
                      {snippet.roleLabel && (
                        <p className="mt-0.5 text-xs text-slate-500">{snippet.roleLabel}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Saved {formatSavedDate(snippet.createdAt)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopySavedSnippet(snippet.text)}
                        >
                          Copy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSavedSnippet(snippet.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function formatSavedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toLocaleDateString()
}
