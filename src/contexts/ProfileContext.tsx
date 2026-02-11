import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { candidateProfile as exampleCandidateProfile } from '@/data/currentProfile'
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
  const [activeProfile, setActiveProfileState] = useState<CandidateProfile | null>(null)
  const [profileImportError, setProfileImportError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!savedProfile) return

    try {
      const profile = parseExportedProfileJson(savedProfile)
      setActiveProfileState(profile)
    } catch (error) {
      console.error('Failed to parse stored profile', error)
      setProfileImportError('Stored profile is invalid. Please re-import or rebuild your profile.')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!activeProfile) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(PROFILE_STORAGE_KEY, exportProfileToJson(activeProfile))
  }, [activeProfile])

  const setActiveProfile = useCallback((profile: CandidateProfile | null) => {
    setProfileImportError(null)
    setActiveProfileState(profile)
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
