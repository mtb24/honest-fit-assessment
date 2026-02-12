/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
  useRouterState,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ProfileProvider, useProfileContext } from '@/contexts/ProfileContext'
import { Button } from '@/components/ui/button'
import appCss from '~/styles/app.css?url'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Honest Fit Assistant' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = useRouteContext({ from: '__root__' })
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ProfileProvider>
    </QueryClientProvider>
  )
}

function ActiveProfileMeta() {
  const { activeProfile, hasProfile, clearProfile } = useProfileContext()
  if (!hasProfile || !activeProfile) return null

  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-slate-600">
        Active profile: <span className="font-medium">{activeProfile.name}</span> -{' '}
        {activeProfile.headline}
      </p>
      <Button type="button" size="sm" variant="outline" onClick={clearProfile}>
        Clear profile
      </Button>
    </div>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isHomeRoute = pathname === '/'
  const isCandidateRoute = pathname.startsWith('/candidate')
  const isReviewerRoute = pathname.startsWith('/reviewer')
  const showSettingsButton = isCandidateRoute || isReviewerRoute
  const toggleSettingsSidebar = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('toggle-settings-sidebar'))
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-bg text-text">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border bg-surface">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-semibold tracking-wide text-slate-900">
                  Honest Fit Assistant
                </p>
                <nav className="flex items-center gap-2" aria-label="Primary">
                  <Link
                    to="/"
                    activeOptions={{ exact: true }}
                    className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                      isHomeRoute
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/candidate/fit"
                    className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                      isCandidateRoute
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Candidate
                  </Link>
                  <Link
                    to="/reviewer"
                    className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                      isReviewerRoute
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Reviewer
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-3">
                <ActiveProfileMeta />
                {showSettingsButton && (
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm transition hover:bg-slate-100"
                    aria-label="Open settings sidebar"
                    onClick={toggleSettingsSidebar}
                  >
                    ⚙
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-border bg-surface">
            <div className="mx-auto w-full max-w-6xl px-4 py-3 text-xs text-muted">
              Honest Fit Assistant · Internal evaluation tool
            </div>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
