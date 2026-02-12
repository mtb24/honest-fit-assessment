import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { KnownProvider } from '@/lib/llm/types'
import type { UiLlmSettings } from '@/lib/useUiLlmSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LlmSettingsSidebarProps = {
  llmSettings: UiLlmSettings
  setLlmSettings: Dispatch<SetStateAction<UiLlmSettings>>
  availableModels: string[]
  isLoadingModels: boolean
  modelLoadError: string | null
  onReset: () => void
}

export function LlmSettingsSidebar({
  llmSettings,
  setLlmSettings,
  availableModels,
  isLoadingModels,
  modelLoadError,
  onReset,
}: LlmSettingsSidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onToggle = () => setSettingsOpen((prev) => !prev)
    window.addEventListener('toggle-settings-sidebar', onToggle)
    return () => window.removeEventListener('toggle-settings-sidebar', onToggle)
  }, [])

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
                disabled={isLoadingModels}
              >
                {availableModels.length === 0 && (
                  <option value={llmSettings.model || ''}>
                    {isLoadingModels ? 'Loading models...' : 'No models loaded'}
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

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                checked={llmSettings.demoMode}
                onChange={(e) =>
                  setLlmSettings((prev) => ({
                    ...prev,
                    demoMode: e.target.checked,
                  }))
                }
              />
              Demo mode (anonymize role labels)
            </label>
          </div>

          <div className="border-t border-border p-5">
            <Button variant="secondary" className="w-full" onClick={onReset}>
              Reset to defaults
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
  )
}
