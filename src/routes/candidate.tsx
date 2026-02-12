import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'

export const Route = createFileRoute('/candidate')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/candidate') {
      throw redirect({ to: '/candidate/fit' })
    }
  },
  component: CandidateLayout,
})

function CandidateLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isProfileRoute = pathname.startsWith('/candidate/profile')
  const isFitRoute = pathname.startsWith('/candidate/fit')

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <nav className="mb-6 flex items-center gap-2" aria-label="Candidate section">
        <Link
          to="/candidate/profile"
          className={`rounded-md px-2.5 py-1.5 text-sm transition ${
            isProfileRoute
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Profile
        </Link>
        <Link
          to="/candidate/fit"
          className={`rounded-md px-2.5 py-1.5 text-sm transition ${
            isFitRoute
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Role Fit
        </Link>
      </nav>
      <Outlet />
    </div>
  )
}
