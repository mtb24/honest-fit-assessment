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
const PROFILE_SOURCE_STORAGE_KEY = 'honest-fit:profile-source'

export type ProfileSource = 'demo' | 'importedJson' | 'resume' | 'manual' | 'unknown'

type ProfileContextValue = {
  activeProfile: CandidateProfile | null
  profileSource: ProfileSource
  setActiveProfile: (profile: CandidateProfile | null, source?: ProfileSource) => void
  profileImportError: string | null
  setProfileImportError: (message: string | null) => void
  hasProfile: boolean
  clearProfile: () => void
  loadExampleProfile: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [initialState] = useState(loadInitialState)
  const [activeProfile, setActiveProfileState] = useState<CandidateProfile | null>(
    initialState.activeProfile,
  )
  const [profileSource, setProfileSource] = useState<ProfileSource>(initialState.profileSource)
  const [profileImportError, setProfileImportError] = useState<string | null>(null)

  const setActiveProfile = useCallback(
    (profile: CandidateProfile | null, source?: ProfileSource) => {
      setProfileImportError(null)
      setActiveProfileState(profile)

      const nextSource: ProfileSource = profile
        ? source ?? (activeProfile ? profileSource : 'manual')
        : 'unknown'
      setProfileSource(nextSource)

      if (typeof window === 'undefined') return
      if (!profile) {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY)
        window.localStorage.removeItem(PROFILE_SOURCE_STORAGE_KEY)
        return
      }

      window.localStorage.setItem(PROFILE_STORAGE_KEY, exportProfileToJson(profile))
      window.localStorage.setItem(PROFILE_SOURCE_STORAGE_KEY, nextSource)
    },
    [activeProfile, profileSource],
  )

  const clearProfile = useCallback(() => {
    setActiveProfile(null)
  }, [setActiveProfile])

  const loadExampleProfile = useCallback(() => {
    setActiveProfile(exampleCandidateProfile, 'manual')
  }, [setActiveProfile])

  const value = useMemo<ProfileContextValue>(
    () => ({
      activeProfile,
      profileSource,
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
      profileSource,
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

function loadInitialState(): {
  activeProfile: CandidateProfile | null
  profileSource: ProfileSource
} {
  if (typeof window === 'undefined') {
    return {
      activeProfile: initialCandidateProfile,
      profileSource: initialCandidateProfile ? 'unknown' : 'unknown',
    }
  }

  const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!savedProfile) {
    return {
      activeProfile: initialCandidateProfile,
      profileSource: initialCandidateProfile ? 'unknown' : 'unknown',
    }
  }

  try {
    const profile = parseExportedProfileJson(savedProfile)
    const rawSource = window.localStorage.getItem(PROFILE_SOURCE_STORAGE_KEY)
    return {
      activeProfile: profile,
      profileSource: isProfileSource(rawSource) ? rawSource : 'unknown',
    }
  } catch (error) {
    console.error('Failed to parse stored profile', error)
    window.localStorage.removeItem(PROFILE_STORAGE_KEY)
    window.localStorage.removeItem(PROFILE_SOURCE_STORAGE_KEY)
    return {
      activeProfile: initialCandidateProfile,
      profileSource: initialCandidateProfile ? 'unknown' : 'unknown',
    }
  }
}

function isProfileSource(value: string | null): value is ProfileSource {
  return (
    value === 'demo' ||
    value === 'importedJson' ||
    value === 'resume' ||
    value === 'manual' ||
    value === 'unknown'
  )
}
