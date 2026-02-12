import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useProfileContext } from '@/contexts/ProfileContext'
import {
  DEFAULT_UI_SETTINGS,
  LLM_SETTINGS_UPDATED_EVENT,
  SETTINGS_STORAGE_KEY,
} from '@/lib/useUiLlmSettings'

export function AppHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isCandidateRoute = pathname.startsWith('/candidate')
  const isReviewerRoute = pathname.startsWith('/reviewer')
  const showSettingsButton = isCandidateRoute || isReviewerRoute

  const toggleSettingsSidebar = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('toggle-settings-sidebar'))
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            <Link to="/" className="rounded-sm hover:text-slate-700 focus:outline-none">
              Honest Fit Assistant
            </Link>
          </h1>
          <nav className="flex items-center gap-2" aria-label="Primary">
            <Link
              to="/candidate/fit"
              className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                isCandidateRoute
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Candidate
            </Link>
            <Link
              to="/reviewer"
              className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                isReviewerRoute
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Reviewer
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ActiveProfileMeta />
          {showSettingsButton && (
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm transition hover:bg-slate-100"
              aria-label="Open settings sidebar"
              onClick={toggleSettingsSidebar}
            >
              ⚙
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function ActiveProfileMeta() {
  const { activeProfile, hasProfile } = useProfileContext()
  const [providerModel, setProviderModel] = useState(
    `${DEFAULT_UI_SETTINGS.provider}/${DEFAULT_UI_SETTINGS.model}`,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const syncProviderModel = () => {
      const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!saved) {
        setProviderModel(`${DEFAULT_UI_SETTINGS.provider}/${DEFAULT_UI_SETTINGS.model}`)
        return
      }

      try {
        const parsed = JSON.parse(saved) as Partial<{
          provider: string
          model: string
        }>
        const provider = parsed.provider?.trim() || DEFAULT_UI_SETTINGS.provider
        const model = parsed.model?.trim() || DEFAULT_UI_SETTINGS.model
        setProviderModel(`${provider}/${model}`)
      } catch {
        setProviderModel(`${DEFAULT_UI_SETTINGS.provider}/${DEFAULT_UI_SETTINGS.model}`)
      }
    }
    const onSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<
        Partial<{
          provider: string
          model: string
        }>
      >
      const provider = customEvent.detail?.provider?.trim()
      const model = customEvent.detail?.model?.trim()
      if (provider || model) {
        setProviderModel(
          `${provider || DEFAULT_UI_SETTINGS.provider}/${model || DEFAULT_UI_SETTINGS.model}`,
        )
        return
      }
      syncProviderModel()
    }

    syncProviderModel()
    window.addEventListener(LLM_SETTINGS_UPDATED_EVENT, onSettingsUpdated)
    return () => {
      window.removeEventListener(LLM_SETTINGS_UPDATED_EVENT, onSettingsUpdated)
    }
  }, [])

  if (!hasProfile || !activeProfile) return null

  return (
    <div className="flex flex-col items-start">
      <p className="max-w-[30rem] truncate text-xs text-slate-600">
        Active profile: <span className="font-medium">{activeProfile.name}</span>
      </p>
      <p className="max-w-[30rem] truncate text-xs text-slate-600">
        Current model: <span className="font-medium">{providerModel}</span>
      </p>
    </div>
  )
}
