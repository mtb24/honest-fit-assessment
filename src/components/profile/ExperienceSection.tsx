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

            {exp.links && exp.links.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {exp.links.map((link) => (
                  <li key={`${link.url}-${link.label}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${link.label} (opens in new tab)`}
                      className="underline underline-offset-2 hover:text-slate-800"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </Card>
  )
}

function formatExperienceDateRange(start: string, end: string): string {
  return `${formatMonthYear(start)} - ${formatMonthYear(end)}`
}

function formatMonthYear(value: string): string {
  if (value.toLowerCase() === 'present') return 'Present'
  const [year, month] = value.split('-')
  const monthIndex = Number(month) - 1
  if (!year || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return value
  }
  const date = new Date(Date.UTC(Number(year), monthIndex, 1))
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}
