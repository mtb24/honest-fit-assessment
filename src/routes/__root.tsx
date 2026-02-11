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
import { ProfileProvider } from '@/contexts/ProfileContext'
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
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          <Outlet />
        </ProfileProvider>
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isFitRoute = pathname === '/'
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
                    className={({ isActive }) =>
                      `rounded-md px-2.5 py-1.5 text-sm transition ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    Fit
                  </Link>
                  <Link
                    to="/candidate-profile"
                    className={({ isActive }) =>
                      `rounded-md px-2.5 py-1.5 text-sm transition ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    Profile
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted">Candidate fit evaluation workspace</p>
                {isFitRoute && (
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
