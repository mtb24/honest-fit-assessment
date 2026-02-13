import { Link } from '@tanstack/react-router'
import { useProfileContext } from '@/contexts/ProfileContext'

export function FitCandidateHeader() {
  const { activeProfile } = useProfileContext()
  if (!activeProfile) return null

  const name = activeProfile.name.trim() || 'Candidate'
  const initial = name.charAt(0).toUpperCase()
  const headline = activeProfile.headline?.trim()

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">Evaluating fit for: {name}</p>
          {headline && <p className="truncate text-xs text-slate-600">{headline}</p>}
        </div>
      </div>
      <Link
        to="/candidate/profile"
        className="shrink-0 text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
      >
        View / edit profile
      </Link>
    </div>
  )
}
