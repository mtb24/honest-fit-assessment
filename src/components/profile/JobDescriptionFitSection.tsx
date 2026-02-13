import type { FitResult } from '@/data/types'
import { FitSummary } from '@/components/fit/FitSummary'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type JobDescriptionFitSectionProps = {
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  onAssess: () => void
  canAssess: boolean
  cannotAssessMessage?: string
  assessPending: boolean
  assessError: string | null
  fitResult: FitResult | null
  showFitDebug: boolean
}

export function JobDescriptionFitSection({
  jobDescription,
  onJobDescriptionChange,
  onAssess,
  canAssess,
  cannotAssessMessage,
  assessPending,
  assessError,
  fitResult,
  showFitDebug,
}: JobDescriptionFitSectionProps) {
  const hasValidJobDescription =
    Boolean(jobDescription.trim()) && jobDescription.trim().length >= 40
  const isAssessDisabled = !canAssess || !hasValidJobDescription || assessPending

  return (
    <Card className="mb-6 ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Job Description Fit</h2>
      <Textarea
        className="min-h-36 resize-y"
        placeholder="Paste a job description here (at least 40 characters)..."
        value={jobDescription}
        onChange={(e) => onJobDescriptionChange(e.target.value)}
      />
      <Button
        className="mt-3"
        onClick={onAssess}
        disabled={isAssessDisabled}
        title={!canAssess ? cannotAssessMessage : undefined}
      >
        {assessPending ? 'Evaluating…' : 'Evaluate fit'}
      </Button>
      {!canAssess && cannotAssessMessage && (
        <p className="mt-2 text-xs text-slate-600">{cannotAssessMessage}</p>
      )}
      {assessError && <p className="mt-2 text-sm text-red-800">{assessError}</p>}
      {fitResult && (
        <section className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-baseline gap-3">
            <span className="text-sm uppercase tracking-wide text-slate-500">
              Honest Fit Assessment
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                fitResult.fit === 'strong'
                  ? 'bg-emerald-100 text-emerald-800'
                  : fitResult.fit === 'moderate'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
              }`}
              aria-label={`Fit: ${fitResult.fit}`}
            >
              Fit: {fitResult.fit.toUpperCase()}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            <span className="font-semibold">Strong</span> = matches &gt;= ~75% of core
            requirements. <span className="font-semibold">Moderate</span> = roughly 45-75%
            matches with some ramp-up.{' '}
            <span className="font-semibold">Weak</span> = missing several fundamental
            requirements or in a very different discipline.
          </p>

          <FitSummary fit={fitResult} />

          <dl className="text-slate-800">
            <dt className="mt-3 text-sm font-semibold text-slate-700">Summary</dt>
            <dd className="mt-1 text-sm text-slate-800">{fitResult.summary}</dd>
            <dt className="mt-3 text-sm font-semibold text-slate-700">Strengths</dt>
            <dd className="mt-1 text-sm text-slate-800">
              <ul className="list-disc space-y-1 pl-5">
                {fitResult.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </dd>
            <dt className="mt-3 text-sm font-semibold text-slate-700">Gaps</dt>
            <dd className="mt-1 text-sm text-slate-800">
              <ul className="list-disc space-y-1 pl-5">
                {fitResult.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </dd>
            <dt className="mt-3 text-sm font-semibold text-slate-700">Verdict</dt>
            <dd className="mt-1 text-sm text-slate-800">{fitResult.verdict}</dd>
          </dl>

          {fitResult.requirements && fitResult.requirements.length > 0 && (
            <details className="mt-2 text-[11px] text-slate-500">
              <summary className="cursor-pointer select-none">
                How this score was calculated
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {fitResult.requirements.map((req) => (
                  <li key={req.id}>
                    <span className="font-semibold">
                      [{req.importance === 'core' ? 'Core' : 'Nice'} - {req.evidenceLevel}]
                    </span>{' '}
                    {req.text}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {showFitDebug && fitResult.debug && (
            <div className="mt-4 rounded-md border border-slate-300 bg-slate-50 p-3 text-xs">
              <p className="font-semibold text-slate-800">
                Debug · Parse stage: {fitResult.debug.parseStage}
              </p>
              <p className="mt-2 font-medium text-slate-700">Parsed FitResult</p>
              <pre className="mt-1 max-h-44 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px] text-slate-800 ring-1 ring-slate-200">
                {JSON.stringify(fitResult, null, 2)}
              </pre>
              <p className="mt-2 font-medium text-slate-700">Raw first response</p>
              <pre className="mt-1 max-h-44 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px] text-slate-800 ring-1 ring-slate-200">
                {fitResult.debug.rawFirstResponse}
              </pre>
              {fitResult.debug.rawRepairResponse && (
                <>
                  <p className="mt-2 font-medium text-slate-700">Raw repair response</p>
                  <pre className="mt-1 max-h-44 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px] text-slate-800 ring-1 ring-slate-200">
                    {fitResult.debug.rawRepairResponse}
                  </pre>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </Card>
  )
}
