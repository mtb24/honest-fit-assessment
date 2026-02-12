import type { RecentRole } from '@/lib/recentRoles'

const now = Date.now()

export const demoRecentRoles: RecentRole[] = [
  {
    id: 'demo-analytics-design-engineer',
    label: 'Design Engineer - Analytics SaaS',
    jobDescription:
      'We are hiring a Design Engineer to build and evolve a React + TypeScript design system used by multiple analytics products. You will partner closely with design and product to improve consistency, accessibility, and velocity across teams.',
    fit: {
      fit: 'strong',
      summary:
        'Strong fit for a design-system-heavy frontend role with cross-team collaboration.',
      strengths: [
        'Strong React/TypeScript SPA experience',
        'Hands-on design system and component library ownership',
      ],
      gaps: ['Limited direct experience with Figma plugin development'],
      verdict:
        'Excellent match for platform-minded frontend work with immediate delivery potential.',
    },
    createdAt: new Date(now).toISOString(),
  },
  {
    id: 'demo-fintech-design-systems',
    label: 'Design Systems Engineer - Fintech',
    jobDescription:
      'Join our fintech platform team to scale reusable UI primitives, tokens, and frontend standards. This role emphasizes component API design, Storybook docs, and high-confidence release practices for regulated workflows.',
    fit: {
      fit: 'moderate',
      summary:
        'Solid fit for design systems work with modest fintech-specific onboarding needed.',
      strengths: [
        'Experience shipping reusable components to multiple teams',
        'Strong testing and documentation habits for shared UI systems',
      ],
      gaps: ['Less direct exposure to heavily regulated financial environments'],
      verdict:
        'Likely successful with short domain ramp-up while contributing quickly on system quality.',
    },
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'demo-ui-platform-b2b',
    label: 'UI Platform Engineer - B2B SaaS',
    jobDescription:
      'Build internal frontend platform tooling and conventions for multiple product squads. Responsibilities include improving developer ergonomics, reducing duplicate UI work, and strengthening accessibility and performance baselines.',
    fit: {
      fit: 'strong',
      summary:
        'Very strong fit for a UI platform role focused on scalable frontend standards.',
      strengths: [
        'Track record of cross-team frontend platform improvements',
        'Experience with accessibility and performance in data-heavy products',
      ],
      gaps: ['Could deepen direct ownership of internal developer CLI tooling'],
      verdict:
        'High-confidence fit for platform initiatives and reusable frontend architecture.',
    },
    createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
  },
]
