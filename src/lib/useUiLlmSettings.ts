import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLlmModelsFn } from '@/server/llmModels'
import type { KnownProvider } from '@/lib/llm/types'

export const SETTINGS_STORAGE_KEY = 'honest-fit:llm-settings'
export const LLM_SETTINGS_UPDATED_EVENT = 'honest-fit:llm-settings-updated'

export type UiLlmSettings = {
  provider: KnownProvider
  model: string
  temperature: string
  fallbackProvidersCsv: string
  showFitDebug: boolean
  demoMode: boolean
}

export const DEFAULT_UI_SETTINGS: UiLlmSettings = {
  provider: 'mock',
  model: 'gpt-4o-mini',
  temperature: '0.2',
  fallbackProvidersCsv: '',
  showFitDebug: false,
  demoMode: false,
}

export function useUiLlmSettings() {
  const [llmSettings, setLlmSettings] = useState<UiLlmSettings>(() => DEFAULT_UI_SETTINGS)
  const [hasHydratedSettings, setHasHydratedSettings] = useState(false)

  const getLlmModels = getLlmModelsFn as unknown as (args: {
    data: { provider: KnownProvider }
  }) => Promise<string[]>

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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<UiLlmSettings>
        setLlmSettings((prev) => ({
          ...prev,
          ...parsed,
        }))
      } catch {
        // Ignore malformed localStorage payloads.
      }
    }

    setHasHydratedSettings(true)
  }, [])

  useEffect(() => {
    if (!hasHydratedSettings) return
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(llmSettings))
    window.dispatchEvent(
      new CustomEvent(LLM_SETTINGS_UPDATED_EVENT, {
        detail: llmSettings,
      }),
    )
  }, [hasHydratedSettings, llmSettings])

  useEffect(() => {
    if (!availableModels.length) return
    setLlmSettings((prev) =>
      availableModels.includes(prev.model) ? prev : { ...prev, model: availableModels[0] },
    )
  }, [availableModels])

  const resetSettings = () => {
    setLlmSettings(DEFAULT_UI_SETTINGS)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
      window.dispatchEvent(
        new CustomEvent(LLM_SETTINGS_UPDATED_EVENT, {
          detail: DEFAULT_UI_SETTINGS,
        }),
      )
    }
  }

  return {
    llmSettings,
    setLlmSettings,
    availableModels,
    modelLoadError,
    modelsQuery,
    resetSettings,
  }
}
