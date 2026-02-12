import { useMemo } from 'react'
import type { FitResult } from '@/data/types'
import { InlineCopyButton } from '@/components/common/InlineCopyButton'

type FitSummaryProps = {
  fit: FitResult
}

export function FitSummary({ fit }: FitSummaryProps) {
  const summary = useMemo(() => buildFitSummary(fit), [fit])

  return (
    <div className="relative rounded border border-slate-200 bg-slate-50 p-3">
      <InlineCopyButton text={summary} ariaLabel="Copy fit summary" />
      <p className="text-sm leading-relaxed text-slate-800">{summary}</p>
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
