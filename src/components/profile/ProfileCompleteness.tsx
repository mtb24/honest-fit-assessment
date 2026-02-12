import type { CandidateProfile } from '@/data/types'
import { getProfileDiagnostics } from '@/lib/profileDiagnostics'
import { Card } from '@/components/ui/card'

type Props = {
  profile: CandidateProfile | null
}

export function ProfileCompleteness({ profile }: Props) {
  const diagnostics = getProfileDiagnostics(profile)

  if (!profile || diagnostics.level === 'none') {
    return null
  }

  const levelLabel =
    diagnostics.level === 'strong'
      ? 'Strong'
      : diagnostics.level === 'needs-improvement'
        ? 'Needs improvement'
        : 'Minimal'

  const levelColor =
    diagnostics.level === 'strong'
      ? 'bg-emerald-100 text-emerald-800'
      : diagnostics.level === 'needs-improvement'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-200 text-slate-700'

  return (
    <Card className="mb-6 ring-1 ring-slate-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Profile completeness
        </h2>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${levelColor}`}
        >
          {levelLabel}
        </span>
      </div>

      <ul className="space-y-2">
        {diagnostics.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2">
            <span
              className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                check.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
              aria-hidden="true"
            >
              {check.passed ? '✓' : '!'}
            </span>

            <div>
              <div className="text-xs font-medium text-slate-800">{check.label}</div>
              {check.details && !check.passed ? (
                <div className="text-[11px] text-slate-600">{check.details}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
