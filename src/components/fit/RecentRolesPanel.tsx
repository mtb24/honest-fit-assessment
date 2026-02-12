import type { RecentRole } from '@/lib/recentRoles'

type RecentRolesPanelProps = {
  roles: RecentRole[]
  activeRoleId?: string | null
  onSelect: (role: RecentRole) => void
  onClear?: () => void
}

export function RecentRolesPanel({
  roles,
  activeRoleId,
  onSelect,
  onClear,
}: RecentRolesPanelProps) {
  if (!roles.length) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-700">
            Recent roles
          </span>
        </div>
        <p className="mt-1">
          Run a fit assessment and we will keep the last few roles you checked here.
        </p>
      </aside>
    )
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold uppercase tracking-wide text-slate-700">
          Recent roles
        </span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      <ul className="space-y-1.5">
        {roles.map((role) => {
          const fitLabel =
            role.fit.fit === 'strong'
              ? 'Strong fit'
              : role.fit.fit === 'moderate'
                ? 'Moderate fit'
                : 'Weak fit'

          const fitColor =
            role.fit.fit === 'strong'
              ? 'bg-emerald-100 text-emerald-800'
              : role.fit.fit === 'moderate'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'

          const isActive = activeRoleId === role.id

          return (
            <li key={role.id}>
              <button
                type="button"
                onClick={() => onSelect(role)}
                className={`flex w-full items-start justify-between gap-2 rounded-md px-2 py-1 text-left transition ${
                  isActive ? 'bg-slate-100' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex-1">
                  <div className="truncate text-[13px] font-medium text-slate-900">
                    {role.label}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(role.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${fitColor}`}
                >
                  {fitLabel}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
