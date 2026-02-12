import type { CandidateProfile } from './types'

/**
 * Initial candidate profile for the app.
 *
 * We deliberately start with `null` so the user must:
 * - Build a profile from their resume,
 * - Import a profile JSON,
 * - Or load an example profile via the UI.
 *
 * The ProfileContext is responsible for loading any saved profile
 * from localStorage and falling back to this value.
 */
export const initialCandidateProfile: CandidateProfile | null = null
