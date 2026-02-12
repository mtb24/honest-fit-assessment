import type { FitResult } from '@/data/types'

export type RecentRole = {
  id: string
  label: string
  jobDescription: string
  fit: FitResult
  createdAt: string
}

const STORAGE_KEY = 'hfa_recent_roles'
const MAX_RECENT_ROLES = 5

export function loadRecentRoles(): RecentRole[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as RecentRole[]
  } catch {
    return []
  }
}

export function saveRecentRoles(roles: RecentRole[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles))
  } catch {
    // Ignore storage errors so core UX is not blocked.
  }
}

export function addRecentRole(
  roles: RecentRole[],
  entry: Omit<RecentRole, 'id' | 'createdAt'>,
): RecentRole[] {
  const now = new Date().toISOString()
  const id = `${now}-${Math.random().toString(36).slice(2, 8)}`
  const normalizedDescription = entry.jobDescription.trim()

  const filtered = roles.filter(
    (role) => role.jobDescription.trim() !== normalizedDescription,
  )

  const next: RecentRole[] = [{ id, createdAt: now, ...entry }, ...filtered]
  return next.slice(0, MAX_RECENT_ROLES)
}

export function createRoleLabelFromJobDescription(jobDescription: string): string {
  const lines = jobDescription
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) return 'Untitled role'

  const firstLine = lines[0]
  if (firstLine.length > 80) return `${firstLine.slice(0, 77)}...`
  return firstLine
}

export function getDisplayLabelForRole(
  role: RecentRole,
  options?: { demoMode?: boolean; index?: number },
): string {
  const demoMode = options?.demoMode ?? false
  if (!demoMode) return role.label

  const idx = (options?.index ?? 0) + 1
  const fitLevel = role.fit?.fit
  const fitLabel =
    fitLevel === 'strong'
      ? 'Strong fit'
      : fitLevel === 'moderate'
        ? 'Moderate fit'
        : fitLevel === 'weak'
          ? 'Weak fit'
          : 'Fit unknown'

  return `Role #${idx} (${fitLabel})`
}
