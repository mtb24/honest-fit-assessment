import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { exampleCandidateProfile } from '@/data/candidateProfile.example'
import { initialCandidateProfile } from '@/data/currentProfile'
import type { CandidateProfile } from '@/data/types'
import { exportProfileToJson, parseExportedProfileJson } from '@/lib/profileSerialization'

const PROFILE_STORAGE_KEY = 'honest-fit:active-profile'

type ProfileContextValue = {
  activeProfile: CandidateProfile | null
  setActiveProfile: (profile: CandidateProfile | null) => void
  profileImportError: string | null
  setProfileImportError: (message: string | null) => void
  hasProfile: boolean
  clearProfile: () => void
  loadExampleProfile: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<CandidateProfile | null>(
    loadInitialActiveProfile,
  )
  const [profileImportError, setProfileImportError] = useState<string | null>(null)

  const setActiveProfile = useCallback((profile: CandidateProfile | null) => {
    setProfileImportError(null)
    setActiveProfileState(profile)
    if (typeof window === 'undefined') return
    if (!profile) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(PROFILE_STORAGE_KEY, exportProfileToJson(profile))
  }, [])

  const clearProfile = useCallback(() => {
    setActiveProfile(null)
  }, [setActiveProfile])

  const loadExampleProfile = useCallback(() => {
    setActiveProfile(exampleCandidateProfile)
  }, [setActiveProfile])

  const value = useMemo<ProfileContextValue>(
    () => ({
      activeProfile,
      setActiveProfile,
      profileImportError,
      setProfileImportError,
      hasProfile: Boolean(activeProfile),
      clearProfile,
      loadExampleProfile,
    }),
    [
      activeProfile,
      clearProfile,
      loadExampleProfile,
      profileImportError,
      setActiveProfile,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfileContext(): ProfileContextValue {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfileContext must be used inside ProfileProvider.')
  }
  return context
}

function loadInitialActiveProfile(): CandidateProfile | null {
  if (typeof window === 'undefined') return initialCandidateProfile
  const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!savedProfile) return initialCandidateProfile

  try {
    return parseExportedProfileJson(savedProfile)
  } catch (error) {
    console.error('Failed to parse stored profile', error)
    window.localStorage.removeItem(PROFILE_STORAGE_KEY)
    return initialCandidateProfile
  }
}
