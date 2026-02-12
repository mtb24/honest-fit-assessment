import type { CandidateProfile } from './types'

export const demoCandidateProfile: CandidateProfile = {
  name: 'Alex Rivera',
  headline: 'Senior Frontend Engineer - Design Systems & B2B SaaS',
  subHeadline:
    'Design-system focused engineer who builds accessible component libraries and data-heavy product UIs.',
  location: 'Remote (US-based, demo)',
  summary:
    'Demo profile: experienced frontend engineer with strong React/TypeScript background, design systems depth, and practical AI-assisted delivery habits.',
  preferences: {
    roleTitlesPreferred: [
      'Senior Frontend Engineer',
      'Design Systems Engineer',
      'UI Platform Engineer',
    ],
    roleTitlesAvoid: ['Pure Backend Engineer'],
    workMode: {
      remoteOnly: true,
      remoteRegions: ['USA'],
      willingToTravelOccasionally: true,
      hybridRequired: false,
    },
    compensation: {
      minBaseSalaryUsd: 170000,
      minContractRateUsdPerHour: 90,
    },
    domainsPreferred: ['B2B SaaS', 'Design Systems', 'Internal Tools'],
    domainsAvoid: ['Crypto / NFTs', 'Gambling'],
  },
  coreStrengths: [
    'React and TypeScript single-page applications',
    'Design systems and component libraries used across teams',
    'Data-heavy, operational UIs (dashboards, queues, review tools)',
    'AI-assisted development workflow with human oversight',
  ],
  skills: {
    frontend: [
      'React',
      'TypeScript',
      'Next.js',
      'CSS3/SCSS',
      'Storybook',
      'Figma',
    ],
    backendAndApis: ['Node.js', 'REST APIs', 'GraphQL'],
    designSystems: ['Component libraries', 'Design tokens', 'Documentation'],
    infrastructureAndOps: ['AWS', 'CI/CD'],
    aiTools: ['Cursor', 'ChatGPT/Claude-style LLMs'],
    testing: ['Jest', 'Cypress', 'React Testing Library'],
    languagesMisc: ['JavaScript', 'TypeScript', 'PHP'],
  },
  experience: [
    {
      company: 'Northstar Metrics (Demo)',
      role: 'Senior Frontend Engineer',
      location: 'Remote (demo)',
      start: '2022-01',
      end: null,
      domain: 'Analytics SaaS, Design Systems',
      stack: ['React', 'TypeScript', 'Design System', 'Storybook'],
      highlights: [
        'Owned a React/TypeScript design system adopted across multiple product teams.',
        'Improved UI consistency and reduced implementation drift with shared component standards.',
      ],
      links: [],
    },
    {
      company: 'Compliance Cloud (Demo)',
      role: 'Frontend Platform Engineer',
      location: 'Remote (demo)',
      start: '2020-03',
      end: '2021-12',
      domain: 'Security SaaS, Internal Tools',
      stack: ['React', 'TypeScript', 'Node.js', 'REST APIs'],
      highlights: [
        'Built review queues and dashboard tooling used by operations and customer success teams.',
        'Partnered with design to formalize UI patterns and reusable form and table primitives.',
      ],
      links: [],
    },
    {
      company: 'LedgerOps (Demo)',
      role: 'Senior Product Engineer',
      location: 'Remote (demo)',
      start: '2018-06',
      end: '2020-02',
      domain: 'Fintech Infrastructure, B2B Workflows',
      stack: ['React', 'TypeScript', 'GraphQL'],
      highlights: [
        'Delivered complex onboarding and policy workflows for high-volume business users.',
        'Focused on reliability, accessibility, and clear error and loading states in critical paths.',
      ],
      links: [],
    },
  ],
  stories: [
    {
      id: 'demo_design_system',
      title: 'Design System as a Force Multiplier',
      summary:
        'Led a design system initiative that accelerated frontend delivery and improved consistency across product teams.',
      takeaways: [
        'Understands shared UI platform governance and adoption challenges.',
        'Balances flexibility and guardrails for downstream product teams.',
      ],
    },
    {
      id: 'demo_operational_ui',
      title: 'Operational UI for Cross-Functional Teams',
      summary:
        'Built data-heavy workflows that helped non-technical teams process complex cases with confidence.',
      takeaways: [
        'Comfortable with dense, high-stakes interfaces and workflow simplification.',
        'Strong collaborator with product, design, and operations stakeholders.',
      ],
    },
  ],
  meta: {
    profileVersion: 'demo-0.1',
    lastUpdated: '2026-02-11',
  },
}
