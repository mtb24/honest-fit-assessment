import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { CandidateProfile, ChatMessage } from '@/data/types'
import { chatAboutCandidateFn } from '@/server/chatAboutCandidate'
import type { LlmRuntimeSettings } from '@/lib/llm/types'
import { useProfileContext } from '@/contexts/ProfileContext'
import { LlmSettingsSidebar } from '@/components/settings/LlmSettingsSidebar'
import { useUiLlmSettings } from '@/lib/useUiLlmSettings'
import { toRuntimeSettings } from '@/lib/llmRuntimeSettings'
import { CandidateChatSection } from '@/components/profile/CandidateChatSection'
import { ReviewerProfileCard } from '@/components/reviewer/ReviewerProfileCard'
import { ReviewerProfileControls } from '@/components/reviewer/ReviewerProfileControls'
import { Card } from '@/components/ui/card'
import { getTopProfileHighlights } from '@/lib/profileHighlights'

export const Route = createFileRoute('/reviewer')({
  component: ReviewerPage,
})

const REVIEWER_QUESTIONS = [
  'What are this candidate’s strongest technical skills?',
  'What kind of team environment would maximize this candidate’s impact?',
  'Where might this candidate need onboarding support?',
]

const REVIEWER_QA_GUIDANCE = [
  'How does this candidate approach design systems and component libraries?',
  'What kinds of roles do they seem best suited for?',
  'Tell me about a project where they owned the system end-to-end.',
]

function ReviewerPage() {
  const {
    activeProfile,
    hasProfile,
  } = useProfileContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const {
    llmSettings,
    setLlmSettings,
    availableModels,
    modelLoadError,
    modelsQuery,
    resetSettings,
  } = useUiLlmSettings()
  const runtimeSettings = toRuntimeSettings(llmSettings)
  const chatAboutCandidate = chatAboutCandidateFn as unknown as (args: {
    data: {
      profile: CandidateProfile
      userMessages: ChatMessage[]
      llmSettings?: LlmRuntimeSettings
    }
  }) => Promise<{ messages: ChatMessage[] }>

  const chatMutation = useMutation({
    mutationFn: (msgs: ChatMessage[]) => {
      if (!activeProfile) {
        throw new Error('Load a candidate profile to start reviewer chat.')
      }
      return chatAboutCandidate({
        data: {
          profile: activeProfile,
          userMessages: msgs,
          llmSettings: runtimeSettings,
        },
      })
    },
    onSuccess: (data) => setMessages(data.messages),
  })

  useEffect(() => {
    setMessages([])
    setChatInput('')
  }, [activeProfile])

  const modelHintMissing = !llmSettings.provider || !llmSettings.model.trim()

  const handleSendMessage = (text: string) => {
    if (!activeProfile) return
    const trimmed = text.trim()
    if (!trimmed) return
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setChatInput('')
    chatMutation.mutate(nextMessages)
  }

  const firstName = activeProfile
    ? activeProfile.name.split(' ')[0] || activeProfile.name
    : 'candidate'
  const highlights = activeProfile ? getTopProfileHighlights(activeProfile, 5) : []

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
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="space-y-4">
          <ReviewerProfileControls llmSettings={runtimeSettings} />
          {hasProfile && activeProfile && (
          <div className="space-y-4">
            <ReviewerProfileCard profile={activeProfile} />
            {highlights.length > 0 && (
              <Card className="ring-1 ring-slate-200">
                <h2 className="text-base font-semibold text-slate-900">Profile highlights</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </Card>
            )}
            <div>
              {modelHintMissing && (
                <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Choose a provider and model in Settings before starting candidate Q&A.
                </p>
              )}
              <CandidateChatSection
                firstName={firstName}
                contextNotice={null}
                suggestedQuestions={REVIEWER_QUESTIONS}
                messages={messages}
                chatInput={chatInput}
                onChatInputChange={setChatInput}
                onSendMessage={handleSendMessage}
                chatPending={chatMutation.isPending}
                guidanceExamples={REVIEWER_QA_GUIDANCE}
                chatError={
                  chatMutation.isError
                    ? chatMutation.error instanceof Error
                      ? chatMutation.error.message
                      : 'Something went wrong.'
                    : null
                }
              />
            </div>
          </div>
          )}
        </div>
      </div>
    </>
  )
}
