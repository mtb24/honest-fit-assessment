import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { candidateProfile } from '@/data/currentProfile'
import type { CandidateProfile } from '@/data/types'
import { exportProfileToJson, parseExportedProfileJson } from '@/lib/profileSerialization'

const PROFILE_STORAGE_KEY = 'honest-fit:active-profile'

type ProfileContextValue = {
  activeProfile: CandidateProfile
  setActiveProfile: (profile: CandidateProfile) => void
  profileImportError: string | null
  setProfileImportError: (message: string | null) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<CandidateProfile>(candidateProfile)
  const [profileStorageReady, setProfileStorageReady] = useState(false)
  const [profileImportError, setProfileImportError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (savedProfile) {
      try {
        const profile = parseExportedProfileJson(savedProfile)
        setActiveProfileState(profile)
        setProfileImportError(null)
      } catch {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY)
      }
    }
    setProfileStorageReady(true)
  }, [])

  useEffect(() => {
    if (!profileStorageReady) return
    if (typeof window === 'undefined') return
    window.localStorage.setItem(PROFILE_STORAGE_KEY, exportProfileToJson(activeProfile))
  }, [activeProfile, profileStorageReady])

  const setActiveProfile = useCallback((profile: CandidateProfile) => {
    setActiveProfileState(profile)
  }, [])

  const value = useMemo<ProfileContextValue>(
    () => ({
      activeProfile,
      setActiveProfile,
      profileImportError,
      setProfileImportError,
    }),
    [activeProfile, setActiveProfile, profileImportError],
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
