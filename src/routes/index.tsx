import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type {
  CandidateProfile,
  ChatMessage,
  FitResult,
  RequirementMatch,
} from '@/data/types'
import { assessFitFn } from '@/server/assessFit'
import { chatAboutCandidateFn } from '@/server/chatAboutCandidate'
import { generateApplicationBlurbFn } from '../server/generateApplicationBlurb'
import type { KnownProvider, LlmRuntimeSettings } from '@/lib/llm/types'
import { useProfileContext } from '@/contexts/ProfileContext'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProfileHeaderSection } from '@/components/profile/ProfileHeaderSection'
import { ProfileActions } from '@/components/profile/ProfileActions'
import { JobDescriptionFitSection } from '@/components/profile/JobDescriptionFitSection'
import { CandidateChatSection } from '@/components/profile/CandidateChatSection'
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
import { LlmSettingsSidebar } from '@/components/settings/LlmSettingsSidebar'
import { type UiLlmSettings, useUiLlmSettings } from '@/lib/useUiLlmSettings'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const SUGGESTED_QUESTIONS = [
  'What are this candidate’s strongest technical skills?',
  'What roles or titles would be the best fit?',
  'Are there any notable gaps for a senior frontend role?',
]

function HomePage() {
  const { activeProfile, hasProfile } = useProfileContext()
  const [jobDescription, setJobDescription] = useState('')
  const [lastEvaluatedJobDescription, setLastEvaluatedJobDescription] = useState('')
  const [fitResult, setFitResult] = useState<FitResult | null>(null)
  const [recentRoles, setRecentRoles] = useState<RecentRole[]>([])
  const [activeRecentRoleId, setActiveRecentRoleId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [applicationParagraph, setApplicationParagraph] = useState('')
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
  const chatAboutCandidate = chatAboutCandidateFn as unknown as (args: {
    data: {
      profile: CandidateProfile
      userMessages: ChatMessage[]
      requirements?: RequirementMatch[]
      llmSettings?: LlmRuntimeSettings
    }
  }) => Promise<{ messages: ChatMessage[] }>
  const generateApplicationBlurb = generateApplicationBlurbFn as unknown as (args: {
    data: {
      jobDescription: string
      profile: CandidateProfile
      fit: FitResult
      llmSettings?: LlmRuntimeSettings
    }
  }) => Promise<{ paragraph: string }>

  useEffect(() => {
    if (typeof window === 'undefined') return
    setRecentRoles(loadRecentRoles())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    saveRecentRoles(recentRoles)
  }, [recentRoles])

  const runtimeSettings = toRuntimeSettings(llmSettings)

  const handleFitSuccess = (fit: FitResult, evaluatedJobDescription: string) => {
    setFitResult(fit)
    setLastEvaluatedJobDescription(evaluatedJobDescription.trim())
    setApplicationParagraph('')

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

  const currentJobDescription = jobDescription.trim()
  const hasFreshRoleContext = Boolean(
    fitResult?.requirements?.length &&
      currentJobDescription &&
      currentJobDescription === lastEvaluatedJobDescription,
  )
  const activeRecentRole =
    recentRoles.find((role) => role.id === activeRecentRoleId) ?? null
  const activeRecentRoleIndex = activeRecentRole
    ? recentRoles.findIndex((role) => role.id === activeRecentRole.id)
    : -1

  const chatMutation = useMutation({
    mutationFn: (msgs: ChatMessage[]) => {
      if (!activeProfile) {
        throw new Error('Please create or import a profile first.')
      }
      return chatAboutCandidate({
        data: {
          profile: activeProfile,
          userMessages: msgs,
          requirements: hasFreshRoleContext ? fitResult?.requirements : undefined,
          llmSettings: runtimeSettings,
        },
      })
    },
    onSuccess: (data) => setMessages(data.messages),
  })

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

  const firstName = activeProfile
    ? activeProfile.name.split(' ')[0] || activeProfile.name
    : 'candidate'
  const topHighlights = activeProfile ? getTopProfileHighlights(activeProfile) : []

  const handleAssess = () => {
    if (!activeProfile) return
    assessMutation.mutate(jobDescription)
  }

  const handleProfileImported = (_profile: CandidateProfile) => {
    setFitResult(null)
    setMessages([])
    setLastEvaluatedJobDescription('')
  }

  const handleSendMessage = (text: string) => {
    if (!activeProfile) return
    if (!text.trim()) return
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text.trim() },
    ]
    setMessages(newMessages)
    setChatInput('')
    chatMutation.mutate(newMessages)
  }

  const handleGenerateApplicationAnswer = () => {
    applicationBlurbMutation.mutate()
  }

  const handleSelectRecentRole = (role: RecentRole) => {
    setJobDescription(role.jobDescription)
    setFitResult(role.fit)
    setLastEvaluatedJobDescription(role.jobDescription.trim())
    setApplicationParagraph('')
    setActiveRecentRoleId(role.id)
    assessMutation.reset()
  }

  const handleClearRecentRoles = () => {
    setRecentRoles([])
    setActiveRecentRoleId(null)
  }

  const handleCopyApplicationAnswer = async () => {
    if (!applicationParagraph) return
    await navigator.clipboard.writeText(applicationParagraph)
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
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Card className="ring-1 ring-slate-200">
            <h1 className="text-xl font-semibold text-slate-900">Honest Fit Assessment</h1>
            <p className="mt-2 text-sm text-slate-700">
              To get an honest fit assessment, you first need a candidate profile.
            </p>
            <div className="mt-4">
              <Link to="/candidate-profile" className={buttonVariants()}>
                Set up my profile
              </Link>
            </div>
          </Card>
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
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <ProfileHeaderSection
            name={activeProfile.name}
            headline={activeProfile.headline}
            subHeadline={activeProfile.subHeadline}
          />
          <ProfileActions onProfileImported={handleProfileImported} />
        </div>

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr),minmax(240px,1fr)] md:items-start">
          <section>
            <JobDescriptionFitSection
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              onAssess={handleAssess}
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
            />

            <CandidateChatSection
              firstName={firstName}
              hasFreshRoleContext={hasFreshRoleContext}
              suggestedQuestions={SUGGESTED_QUESTIONS}
              messages={messages}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              onSendMessage={handleSendMessage}
              chatPending={chatMutation.isPending}
              chatError={
                chatMutation.isError
                  ? chatMutation.error instanceof Error
                    ? chatMutation.error.message
                    : 'Something went wrong.'
                  : null
              }
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
          </div>
        </div>
      </div>
    </>
  )
}

function toRuntimeSettings(input: UiLlmSettings): LlmRuntimeSettings {
  const fallbackProviders = parseFallbackProviders(input.fallbackProvidersCsv)
  const temperature = Number(input.temperature)
  return {
    provider: input.provider,
    model: input.model.trim() || undefined,
    temperature: Number.isFinite(temperature) ? temperature : undefined,
    fallbackProviders,
  }
}

function parseFallbackProviders(csv: string): KnownProvider[] {
  return csv
    .split(',')
    .map((value) => value.trim())
    .filter(
      (value): value is KnownProvider =>
        value === 'mock' ||
        value === 'openai' ||
        value === 'cursor' ||
        value === 'ollama',
    )
}

function getTopProfileHighlights(profile: CandidateProfile): string[] {
  const candidateHighlights = [
    ...profile.experience.flatMap((entry) => entry.highlights),
    ...profile.stories.flatMap((story) => story.takeaways),
    ...profile.coreStrengths,
  ]
    .map((value) => value.trim())
    .filter(Boolean)

  return Array.from(new Set(candidateHighlights)).slice(0, 3)
}
