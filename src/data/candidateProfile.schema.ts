import { z } from 'zod'

export const profileLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
})

export const candidateExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional().default(''),
  start: z.string().min(1),
  end: z.string().optional().nullable(),
  domain: z.string().optional().default(''),
  stack: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  links: z.array(profileLinkSchema).optional(),
})

export const candidateStorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  takeaways: z.array(z.string()),
})

export const candidateProfileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  subHeadline: z.string(),
  location: z.string(),
  summary: z.string().min(1),
  preferences: z.object({
    roleTitlesPreferred: z.array(z.string()),
    roleTitlesAvoid: z.array(z.string()),
    workMode: z.object({
      remoteOnly: z.boolean(),
      remoteRegions: z.array(z.string()),
      willingToTravelOccasionally: z.boolean(),
      hybridRequired: z.boolean(),
    }),
    compensation: z.object({
      minBaseSalaryUsd: z.number().optional(),
      minContractRateUsdPerHour: z.number().optional(),
    }),
    domainsPreferred: z.array(z.string()),
    domainsAvoid: z.array(z.string()),
  }),
  coreStrengths: z.array(z.string()),
  skills: z.record(z.string(), z.array(z.string()).optional()),
  experience: z.array(candidateExperienceSchema),
  stories: z.array(candidateStorySchema),
  meta: z
    .object({
      profileVersion: z.string().optional(),
      lastUpdated: z.string().optional(),
    })
    .optional(),
})
