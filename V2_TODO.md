# Honest Fit Assessment V2.0 TODO

For near-term non-V2 milestones (provider reliability, UX polish, QA), see `ROADMAP.md`.

## Goal

Remove hardcoded candidate profile imports in app runtime, and derive `CandidateProfile` objects from uploaded resumes.

Current state:
- Placeholder profile is in `src/data/candidateProfile.local.ts`.
- Real profile source data is in `src/data/personalProfile.ts`.

Important:
- Keep `src/data/personalProfile.ts` untouched as backup/source reference.

## V2 Architecture (High Level)

1. User uploads resume (`pdf`, `docx`, `txt`).
2. Server extracts raw text + structured sections.
3. LLM converts extracted content to strict `CandidateProfile` JSON.
4. Runtime validation enforces schema shape and safe defaults.
5. User reviews/edits generated profile in UI.
6. Approved profile is stored in DB/object storage.
7. `assessFitOnServer` and `chatAboutCandidateOnServer` load profile from storage, not TS data files.

## Data Contract

Primary typed target:
- `src/data/types.ts` -> `CandidateProfile`

Notes:
- Prefer one canonical profile type for runtime.
- `personalProfile.ts` can be used to seed migration, tests, and prompts.

## V2 Implementation Checklist

### Phase 1 - Ingestion Pipeline

- [ ] Add server endpoint/function for resume upload (`FormData`).
- [ ] Support file types: `pdf`, `docx`, `txt`.
- [ ] Implement text extraction:
  - [ ] PDF parser
  - [ ] DOCX parser
  - [ ] Plain text path
- [ ] Return normalized extraction payload:
  - [ ] `rawText`
  - [ ] sectioned content (experience, skills, summary candidates)
  - [ ] parser metadata/errors

### Phase 2 - LLM Profile Derivation

- [ ] Add `buildCandidateProfileFromResumeText()` server utility.
- [ ] Prompt constraints:
  - [ ] Use only provided text
  - [ ] Do not invent details
  - [ ] Unknown values -> empty arrays/defaults
- [ ] Request strict JSON output matching `CandidateProfile`.
- [ ] Parse and validate output with runtime schema (recommended: `zod`).
- [ ] Retry once on schema failure with validation feedback.

### Phase 3 - Validation, Normalization, and Guardrails

- [ ] Normalize date formats (`YYYY-MM` where possible).
- [ ] Dedupe arrays (skills, strengths, domains).
- [ ] Canonicalize role/domain labels.
- [ ] Preserve uncertain fields as explicit unknown/empty (no guessing).
- [ ] Add confidence metadata by section/field (optional but recommended).

### Phase 4 - Review + Approval UX

- [ ] Add route/page for profile review.
- [ ] Show generated profile in editable form by section:
  - [ ] identity + summary
  - [ ] preferences
  - [ ] skills
  - [ ] experience
  - [ ] stories
- [ ] Allow user edits before approval.
- [ ] Show source snippets for traceability where possible.

### Phase 5 - Persistence

- [ ] Add storage layer (DB preferred) for profiles.
- [ ] Suggested record shape:
  - [ ] `id`, `userId`
  - [ ] `profileJson` (`CandidateProfile`)
  - [ ] `version`
  - [ ] `updatedAt`
  - [ ] optional `rawExtraction`
  - [ ] optional `generationMetadata`
- [ ] Keep audit trail:
  - [ ] extracted text hash
  - [ ] generated draft
  - [ ] approved final

### Phase 6 - Runtime Integration

- [ ] Replace static import in `src/server/assessFit.ts`:
  - [ ] from `candidateProfile` constant
  - [ ] to `loadCandidateProfile(user/session)`
- [ ] Replace static import in `src/server/chatAboutCandidate.ts` similarly.
- [ ] Keep temporary fallback to local profile only in dev mode.

### Phase 7 - Quality + Ops

- [ ] Add tests for:
  - [ ] parser outputs
  - [ ] schema validation
  - [ ] normalizer behavior
  - [ ] server functions with persisted profile
- [ ] Add rate limits and upload size limits.
- [ ] Add PII/security handling policy:
  - [ ] encryption at rest
  - [ ] retention policy
  - [ ] delete/export profile data flows

## Migration Plan (Safe, Incremental)

1. Keep existing hardcoded flow working.
2. Add upload + draft generation behind feature flag.
3. Add review/approve and store final profile.
4. Switch server logic to stored profile reads.
5. Keep `personalProfile.ts` as backup fixture for tests and prompt tuning.

## Suggested New Files (V2)

- `src/server/profileIngestion.ts`
- `src/server/profileStore.ts`
- `src/lib/resumeParser.ts`
- `src/lib/profileDeriver.ts`
- `src/lib/profileSchema.ts` (runtime schema)
- `src/routes/profile.review.tsx` (or similar review page)

