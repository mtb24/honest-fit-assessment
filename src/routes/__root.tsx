/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'
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
      <ToastProvider>
        <ProfileProvider>
          <RootDocument>
            <Outlet />
          </RootDocument>
        </ProfileProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-bg text-text">
        <div className="flex min-h-screen flex-col">
          <AppHeader />

          <main className="flex-1">{children}</main>

          <AppFooter />
        </div>
        <Scripts />
      </body>
    </html>
  )
}
