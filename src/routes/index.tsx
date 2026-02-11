import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type {
  CandidateProfile,
  ChatMessage,
  FitResult,
  RequirementMatch,
} from '@/data/types'
import { assessFitFn } from '@/server/assessFit'
import { chatAboutCandidateFn } from '@/server/chatAboutCandidate'
import { generateApplicationBlurbFn } from '../server/generateApplicationBlurb'
import { getLlmModelsFn } from '@/server/llmModels'
import type { KnownProvider, LlmRuntimeSettings } from '@/lib/llm/types'
import { useProfileContext } from '@/contexts/ProfileContext'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ProfileHeaderSection } from '@/components/profile/ProfileHeaderSection'
import { ProfileActions } from '@/components/profile/ProfileActions'
import { JobDescriptionFitSection } from '@/components/profile/JobDescriptionFitSection'
import { CandidateChatSection } from '@/components/profile/CandidateChatSection'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const SUGGESTED_QUESTIONS = [
  'What are this candidate’s strongest technical skills?',
  'What roles or titles would be the best fit?',
  'Are there any notable gaps for a senior frontend role?',
]

const SETTINGS_STORAGE_KEY = 'honest-fit:llm-settings'

type UiLlmSettings = {
  provider: KnownProvider
  model: string
  temperature: string
  fallbackProvidersCsv: string
  showFitDebug: boolean
}

const DEFAULT_UI_SETTINGS: UiLlmSettings = {
  provider: 'mock',
  model: 'gpt-4o-mini',
  temperature: '0.2',
  fallbackProvidersCsv: '',
  showFitDebug: false,
}

function HomePage() {
  const { activeProfile, hasProfile } = useProfileContext()
  const [jobDescription, setJobDescription] = useState('')
  const [lastEvaluatedJobDescription, setLastEvaluatedJobDescription] = useState('')
  const [fitResult, setFitResult] = useState<FitResult | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [applicationParagraph, setApplicationParagraph] = useState('')
  const sidebarRef = useRef<HTMLElement | null>(null)
  const [llmSettings, setLlmSettings] = useState<UiLlmSettings>(
    DEFAULT_UI_SETTINGS,
  )
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
  const getLlmModels = getLlmModelsFn as unknown as (args: {
    data: { provider: KnownProvider }
  }) => Promise<string[]>
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
    const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Partial<UiLlmSettings>
      setLlmSettings((prev) => ({
        ...prev,
        ...parsed,
      }))
    } catch {
      // Ignore invalid saved settings and keep defaults.
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(llmSettings))
  }, [llmSettings])

  useEffect(() => {
    if (!settingsOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen])

  useEffect(() => {
    const onToggle = () => setSettingsOpen((prev) => !prev)
    window.addEventListener('toggle-settings-sidebar', onToggle)
    return () => window.removeEventListener('toggle-settings-sidebar', onToggle)
  }, [])

  useEffect(() => {
    if (!settingsOpen || !sidebarRef.current) return
    const container = sidebarRef.current
    const focusable = getFocusableElements(container)
    focusable[0]?.focus()

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const candidates = getFocusableElements(container)
      if (!candidates.length) return
      const first = candidates[0]
      const last = candidates[candidates.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last || !container.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', trapFocus)
    return () => container.removeEventListener('keydown', trapFocus)
  }, [settingsOpen])

  const runtimeSettings = toRuntimeSettings(llmSettings)

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
      setFitResult(data)
      setLastEvaluatedJobDescription(jd.trim())
      setApplicationParagraph('')
    },
  })

  const currentJobDescription = jobDescription.trim()
  const hasFreshRoleContext = Boolean(
    fitResult?.requirements?.length &&
      currentJobDescription &&
      currentJobDescription === lastEvaluatedJobDescription,
  )

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

  const modelsQuery = useQuery({
    queryKey: ['llm-models', llmSettings.provider],
    queryFn: () =>
      getLlmModels({
        data: { provider: llmSettings.provider },
      }),
    staleTime: 5 * 60 * 1000,
  })
  const availableModels = modelsQuery.data ?? []
  const modelLoadError =
    modelsQuery.error instanceof Error
      ? modelsQuery.error.message
      : modelsQuery.error
        ? 'Failed to load models.'
        : null

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

  const handleCopyApplicationAnswer = async () => {
    if (!applicationParagraph) return
    await navigator.clipboard.writeText(applicationParagraph)
  }

  useEffect(() => {
    if (!availableModels.length) return
    setLlmSettings((prev) =>
      availableModels.includes(prev.model) ? prev : { ...prev, model: availableModels[0] },
    )
  }, [availableModels])

  if (!hasProfile || !activeProfile) {
    return (
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
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 ${
          settingsOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSettingsOpen(false)}
      />

      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-border bg-surface shadow-2xl transition-transform duration-300 ${
          settingsOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Settings sidebar"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Settings</h3>
              <p className="text-xs text-muted">Model and provider configuration</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="rounded-md border border-border bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-800">Current model settings</p>
              <p className="mt-1 text-slate-600">
                Provider: <strong>{llmSettings.provider}</strong>
              </p>
              <p className="text-slate-600">
                Model: <strong>{llmSettings.model || 'default'}</strong>
              </p>
            </div>

            <label className="grid gap-1 text-sm text-slate-700">
              Provider
              <select
                className="h-9 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30"
                value={llmSettings.provider}
                onChange={(e) =>
                  setLlmSettings((prev) => ({
                    ...prev,
                    provider: e.target.value as KnownProvider,
                  }))
                }
              >
                <option value="mock">mock</option>
                <option value="openai">openai</option>
                <option value="cursor">cursor</option>
                <option value="ollama">ollama (local)</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm text-slate-700">
              Model
              <select
                className="h-9 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                value={llmSettings.model}
                onChange={(e) =>
                  setLlmSettings((prev) => ({
                    ...prev,
                    model: e.target.value,
                  }))
                }
                disabled={modelsQuery.isFetching}
              >
                {availableModels.length === 0 && (
                  <option value={llmSettings.model || ''}>
                    {modelsQuery.isFetching
                      ? 'Loading models...'
                      : 'No models loaded'}
                  </option>
                )}
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              {modelLoadError && (
                <p className="text-xs text-red-700">
                  {modelLoadError}
                </p>
              )}
              <Input
                type="text"
                placeholder="Or enter model id manually"
                value={llmSettings.model}
                onChange={(e) =>
                  setLlmSettings((prev) => ({
                    ...prev,
                    model: e.target.value,
                  }))
                }
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-700">
              Temperature
              <Input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={llmSettings.temperature}
                onChange={(e) =>
                  setLlmSettings((prev) => ({
                    ...prev,
                    temperature: e.target.value,
                  }))
                }
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-700">
              Fallback providers (comma separated)
              <Input
                type="text"
                placeholder="mock,openai"
                value={llmSettings.fallbackProvidersCsv}
                onChange={(e) =>
                  setLlmSettings((prev) => ({
                    ...prev,
                    fallbackProvidersCsv: e.target.value,
                  }))
                }
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                checked={llmSettings.showFitDebug}
                onChange={(e) =>
                  setLlmSettings((prev) => ({
                    ...prev,
                    showFitDebug: e.target.checked,
                  }))
                }
              />
              Show Fit debug details
            </label>
          </div>

          <div className="border-t border-border p-5">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setLlmSettings(DEFAULT_UI_SETTINGS)
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
                }
              }}
            >
              Reset to defaults
            </Button>
          </div>
        </div>
      </aside>

      <div className="mx-auto max-w-3xl px-4 py-8">
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

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
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
