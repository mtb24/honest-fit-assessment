import { createFileRoute } from '@tanstack/react-router'
import { ProfileActions } from '@/components/profile/ProfileActions'
import { ResumeToProfileSection } from '@/components/profile/ResumeToProfileSection'
import { ExperienceSection } from '@/components/profile/ExperienceSection'
import { ProfileHeaderSection } from '@/components/profile/ProfileHeaderSection'
import { ProfileStoriesSection } from '@/components/profile/ProfileStoriesSection'
import { ProfileOnboarding } from '@/components/profile/ProfileOnboarding'
import { Card } from '@/components/ui/card'
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ProfileHeaderSection
          name={activeProfile.name}
          headline={activeProfile.headline}
          subHeadline={activeProfile.subHeadline}
        />
        <ProfileActions />
      </div>

      <Card className="mb-6 ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Candidate Summary</h2>
        <p className="mt-2 text-sm text-slate-700">{activeProfile.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeProfile.coreStrengths.map((strength) => (
            <span
              key={strength}
              className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700"
            >
              {strength}
            </span>
          ))}
        </div>
      </Card>

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
