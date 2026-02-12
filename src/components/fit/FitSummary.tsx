import { useMemo, useState } from 'react'
import type { FitResult } from '@/data/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/context/ToastContext'

type FitSummaryProps = {
  fit: FitResult
}

export function FitSummary({ fit }: FitSummaryProps) {
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const summary = useMemo(() => buildFitSummary(fit), [fit])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      showToast('Copied to clipboard')
      window.setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy summary', error)
      showToast('Failed to copy')
    }
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm leading-relaxed text-slate-800">{summary}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="whitespace-nowrap"
        onClick={handleCopy}
      >
        {copied ? 'Copied' : 'Copy summary'}
      </Button>
    </div>
  )
}

function buildFitSummary(fit: FitResult): string {
  const requirements = fit.requirements ?? []
  const coreRequirements = requirements.filter((item) => item.importance === 'core')
  const coreMatches = coreRequirements.filter((item) => item.evidenceLevel === 'match')
  const corePartials = coreRequirements.filter((item) => item.evidenceLevel === 'partial')
  const coreMisses = coreRequirements.filter((item) => item.evidenceLevel === 'none')

  const summaryLines: string[] = []
  summaryLines.push(
    `Honest fit: ${fit.fit.toUpperCase()} (${coreMatches.length} strong matches, ${corePartials.length} partial matches, ${coreMisses.length} core gaps).`,
  )

  if (fit.strengths.length > 0) {
    summaryLines.push(`Key strengths: ${fit.strengths.slice(0, 3).join('; ')}.`)
  }

  if (fit.gaps.length > 0) {
    summaryLines.push(`Areas to discuss or ramp up: ${fit.gaps.slice(0, 2).join('; ')}.`)
  }

  if (summaryLines.length === 1 && fit.summary.trim()) {
    summaryLines.push(fit.summary.trim())
  }

  return summaryLines.join(' ')
}
