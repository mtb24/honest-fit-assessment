import { createFileRoute } from '@tanstack/react-router'
import { ProfileHeaderEditor } from '@/components/profile/ProfileHeaderEditor'
import { ProfileActions } from '@/components/profile/ProfileActions'
import { ResumeToProfileSection } from '@/components/profile/ResumeToProfileSection'
import { ExperienceSection } from '@/components/profile/ExperienceSection'
import { ProfileStoriesSection } from '@/components/profile/ProfileStoriesSection'
import { ProfileOnboarding } from '@/components/profile/ProfileOnboarding'
import { ProfileCompleteness } from '@/components/profile/ProfileCompleteness'
import { useProfileContext } from '@/contexts/ProfileContext'

export const Route = createFileRoute('/candidate-profile')({
  component: CandidateProfilePage,
})

function CandidateProfilePage() {
  const {
    activeProfile,
    hasProfile,
    setActiveProfile,
    setProfileImportError,
  } = useProfileContext()

  if (!hasProfile || !activeProfile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ProfileOnboarding />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex justify-end">
        <ProfileActions />
      </div>

      <ProfileHeaderEditor profile={activeProfile} onSave={setActiveProfile} />

      <ProfileCompleteness profile={activeProfile} />

      <ResumeToProfileSection
        onProfileImported={setActiveProfile}
        onImportError={setProfileImportError}
      />

      <ExperienceSection experience={activeProfile.experience} />
      <ProfileStoriesSection stories={activeProfile.stories} />

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-slate-400">
          View raw profile JSON (debug)
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-950 p-2 text-[11px] text-slate-200">
          {JSON.stringify(activeProfile, null, 2)}
        </pre>
      </details>
    </div>
  )
}
