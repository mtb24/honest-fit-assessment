import type { CandidateExperience } from '@/data/types'
import { Card } from '@/components/ui/card'

type ExperienceSectionProps = {
  experience: CandidateExperience[]
}

export function ExperienceSection({ experience }: ExperienceSectionProps) {
  return (
    <Card className="mb-6 ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Experience</h2>
      <div className="space-y-3">
        {experience.map((exp) => (
          <article
            key={`${exp.company}-${exp.role}-${exp.start}`}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{exp.role}</h3>
                <p className="text-sm text-slate-700">{exp.company}</p>
                <p className="text-xs text-slate-500">{exp.location}</p>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {formatExperienceDateRange(exp.start, exp.end)}
              </p>
            </div>

            <p className="mt-2 text-xs text-slate-500">{exp.domain}</p>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {exp.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>

            {exp.links?.length ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {exp.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-slate-800 px-2 py-[2px] text-[10px] text-slate-100 hover:bg-slate-700"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </Card>
  )
}

function formatExperienceDateRange(start: string, end?: string | null): string {
  return `${formatMonthYear(start)} - ${formatMonthYear(end)}`
}

function formatMonthYear(value?: string | null): string {
  if (!value) return 'Present'
  if (value.toLowerCase() === 'present') return 'Present'
  const [year, month] = value.split('-')
  const monthIndex = Number(month) - 1
  if (!year || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return value
  }
  const date = new Date(Date.UTC(Number(year), monthIndex, 1))
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}
