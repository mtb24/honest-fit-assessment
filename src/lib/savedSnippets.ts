export type SavedSnippet = {
  id: string
  label: string
  roleLabel?: string
  text: string
  createdAt: string
}

const STORAGE_KEY = 'hfa_saved_snippets'

export function loadSavedSnippets(): SavedSnippet[] {
  if (typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) return []

    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isSavedSnippet)
  } catch {
    return []
  }
}

export function saveSavedSnippets(snippets: SavedSnippet[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
}

export function addSavedSnippet(
  snippets: SavedSnippet[],
  snippet: SavedSnippet,
  maxCount = 50,
): SavedSnippet[] {
  const next = [snippet, ...snippets]
  return next.slice(0, Math.max(1, maxCount))
}

export function removeSavedSnippet(snippets: SavedSnippet[], id: string): SavedSnippet[] {
  return snippets.filter((snippet) => snippet.id !== id)
}

function isSavedSnippet(value: unknown): value is SavedSnippet {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.label === 'string' &&
    typeof record.text === 'string' &&
    typeof record.createdAt === 'string' &&
    (record.roleLabel === undefined || typeof record.roleLabel === 'string')
  )
}
