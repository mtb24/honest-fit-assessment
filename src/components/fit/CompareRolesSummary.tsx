import type { RecentRole } from '@/lib/recentRoles'

type CompareRolesSummaryProps = {
  roles: RecentRole[]
}

type RoleFitLevel = 'strong' | 'moderate' | 'weak' | 'unknown'

function getFitLevel(role: RecentRole): RoleFitLevel {
  const level = role.fit?.fit
  if (level === 'strong' || level === 'moderate' || level === 'weak') {
    return level
  }
  return 'unknown'
}

export function CompareRolesSummary({ roles }: CompareRolesSummaryProps) {
  if (!roles.length) {
    return null
  }

  let strong = 0
  let moderate = 0
  let weak = 0
  let unknown = 0

  for (const role of roles) {
    const level = getFitLevel(role)
    if (level === 'strong') strong += 1
    else if (level === 'moderate') moderate += 1
    else if (level === 'weak') weak += 1
    else unknown += 1
  }

  const bestMatch =
    roles.find((role) => getFitLevel(role) === 'strong') ??
    roles.find((role) => getFitLevel(role) === 'moderate') ??
    roles.find((role) => getFitLevel(role) === 'weak') ??
    null

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          Compare roles
        </h2>
        <span className="text-[11px] text-slate-500">
          Roles evaluated: <span className="font-semibold text-slate-900">{roles.length}</span>
        </span>
      </div>

      <div className="text-[11px] text-slate-600">
        {strong > 0 && (
          <span className="mr-2 inline-flex items-center">
            <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
            <span>{strong} strong</span>
          </span>
        )}
        {moderate > 0 && (
          <span className="mr-2 inline-flex items-center">
            <span className="mr-1 h-2 w-2 rounded-full bg-amber-400" />
            <span>{moderate} moderate</span>
          </span>
        )}
        {weak > 0 && (
          <span className="mr-2 inline-flex items-center">
            <span className="mr-1 h-2 w-2 rounded-full bg-red-400" />
            <span>{weak} weak</span>
          </span>
        )}
        {unknown > 0 && (
          <span className="inline-flex items-center">
            <span className="mr-1 h-2 w-2 rounded-full bg-slate-400" />
            <span>{unknown} unknown</span>
          </span>
        )}
      </div>

      {bestMatch && (
        <p className="mt-1 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-900">Best match:</span>{' '}
          <span className="text-slate-900">{bestMatch.label}</span>
        </p>
      )}
    </section>
  )
}
