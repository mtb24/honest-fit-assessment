import { Link, createFileRoute } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Honest Fit Assistant</h1>
        <p className="mt-2 text-sm text-slate-700">
          Evaluate candidate-role fit with AI, manage profile data, and support reviewer Q&A
          in one shared workflow.
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Choose your workspace below to get started.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link to="/candidate/fit" className={buttonVariants({ size: 'lg' })}>
            I&apos;m a candidate
          </Link>
          <Link
            to="/reviewer"
            className={buttonVariants({ size: 'lg', variant: 'secondary' })}
          >
            I&apos;m a reviewer
          </Link>
        </div>
      </Card>
    </div>
  )
}
