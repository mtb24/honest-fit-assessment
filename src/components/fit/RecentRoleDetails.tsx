import { getDisplayLabelForRole, type RecentRole } from '@/lib/recentRoles'
import { InlineCopyButton } from '@/components/common/InlineCopyButton'

type RecentRoleDetailsProps = {
  role: RecentRole | null
  demoMode?: boolean
  roleIndex?: number
}

function getFitBadgeStyle(
  fit: RecentRole['fit'] | undefined,
): { label: string; className: string } {
  if (fit?.fit === 'strong') {
    return {
      label: 'Strong fit',
      className: 'bg-emerald-100 text-emerald-800',
    }
  }

  if (fit?.fit === 'moderate') {
    return {
      label: 'Moderate fit',
      className: 'bg-amber-100 text-amber-800',
    }
  }

  if (fit?.fit === 'weak') {
    return {
      label: 'Weak fit',
      className: 'bg-red-100 text-red-800',
    }
  }

  return {
    label: 'Fit unknown',
    className: 'bg-slate-100 text-slate-700',
  }
}

export function RecentRoleDetails({
  role,
  demoMode = false,
  roleIndex,
}: RecentRoleDetailsProps) {
  if (!role) {
    return (
      <section className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-200">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          Role details
        </h2>
        <p>Select a role from the list to see a quick fit summary.</p>
      </section>
    )
  }

  const fit = role.fit
  const displayLabel = getDisplayLabelForRole(role, { demoMode, index: roleIndex })
  const fitBadge = getFitBadgeStyle(fit)
  const strengths = fit?.strengths ?? []
  const gaps = fit?.gaps ?? []

  const summaryLines: string[] = []
  summaryLines.push(`${displayLabel}: ${fitBadge.label}`)

  if (strengths.length) {
    summaryLines.push(`Strengths: ${strengths.slice(0, 3).join('; ')}`)
  }

  if (gaps.length) {
    summaryLines.push(`Gaps: ${gaps.slice(0, 2).join('; ')}`)
  }

  const summaryText = summaryLines.join(' | ')

  return (
    <section className="relative rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">
      <InlineCopyButton text={summaryText} ariaLabel="Copy recent role summary" />
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            Role details
          </h2>
          <p className="mt-1 text-[13px] font-medium text-slate-900">{displayLabel}</p>
          <p className="text-[11px] text-slate-500">
            {new Date(role.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <span
          className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${fitBadge.className}`}
        >
          {fitBadge.label}
        </span>
      </div>

      {strengths.length > 0 && (
        <div className="mb-2">
          <h3 className="mb-1 text-[11px] font-semibold text-emerald-700">Top strengths</h3>
          <ul className="space-y-1">
            {strengths.slice(0, 4).map((strength, index) => (
              <li key={`${strength}-${index}`} className="flex gap-2">
                <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {gaps.length > 0 && (
        <div className="mb-2">
          <h3 className="mb-1 text-[11px] font-semibold text-amber-700">Potential gaps</h3>
          <ul className="space-y-1">
            {gaps.slice(0, 3).map((gap, index) => (
              <li key={`${gap}-${index}`} className="flex gap-2">
                <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[11px] text-slate-700">{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
