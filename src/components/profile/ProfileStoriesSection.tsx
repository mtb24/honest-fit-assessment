import type { CandidateStory } from '@/data/types'
import { Card } from '@/components/ui/card'

type ProfileStoriesSectionProps = {
  stories: CandidateStory[]
}

export function ProfileStoriesSection({ stories }: ProfileStoriesSectionProps) {
  return (
    <Card className="mb-6 ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Stories</h2>
      {stories.length === 0 ? (
        <p className="text-sm text-slate-600">No candidate stories available.</p>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <article key={story.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{story.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{story.summary}</p>
              {story.takeaways.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {story.takeaways.map((takeaway) => (
                    <li key={takeaway}>{takeaway}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}
