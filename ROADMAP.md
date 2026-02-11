# Honest Fit Assistant Roadmap

## Current Status

### Implemented

- TanStack Start app scaffold with React + TypeScript.
- Core domain types and candidate profile data are in place.
- Fit evaluation and candidate chat flows are functional.
- Multi-provider LLM support is wired:
  - `mock`
  - `openai`
  - `cursor` (background agent flow)
  - `ollama` (local, no-cost option)
- Provider/model settings are available via right-side settings sidebar.
- Model list loading is dynamic by provider (where supported).
- Tailwind CSS and a reusable UI primitive foundation are set up.
- Fit parsing now uses schema validation + one repair retry + fallback.
- Optional fit debug output is available in the UI.

## Near-Term Roadmap (Next 1-2 Sprints)

### Provider Reliability and DX

- [ ] Add "Test provider connection" action in settings:
  - Cursor: `GET /v0/me`
  - Ollama: `GET /api/tags`
  - OpenAI: lightweight auth/model check path
- [ ] Improve provider-specific error messages (auth, timeout, endpoint mismatch).
- [ ] Add request timeout and retry/backoff strategy per provider.
- [ ] Add "Copy debug payload" button for fit debug block.

### Output Quality and UX

- [ ] Tighten fit prompt constraints for cleaner recruiter-ready output.
- [ ] Add output polishing rules (dedupe bullets, cap list lengths).
- [ ] Improve settings UX for model selection:
  - [ ] hide manual model override behind "Advanced"
  - [ ] preserve manual override if model list refreshes
- [ ] Add non-intrusive toast/status messages for settings save/load and model fetch errors.

### QA and Safety

- [ ] Add smoke tests for:
  - [ ] provider switching
  - [ ] model list loading
  - [ ] fit call happy path + parse fallback
  - [ ] chat call happy path
- [ ] Add basic regression checklist for local manual testing.

## Mid-Term Roadmap (V2)

Detailed plan is maintained in `V2_TODO.md`.

Primary V2 objective:
- Derive and persist `CandidateProfile` from uploaded resume files, replacing hardcoded local profile dependency in runtime paths.

## Longer-Term

- [ ] User auth and per-user profile/settings persistence.
- [ ] Evaluation history (store prior JD assessments for comparison).
- [ ] Team-facing review workflows and export/share capabilities.
- [ ] Observability dashboards for provider reliability and parsing quality.

## Operational Notes

- Keep secrets only in `.env.local` (never commit keys).
- Keep `env.example` up to date with supported providers/settings.
- When adding a new provider:
  - update provider registry
  - update model listing path
  - update settings UI provider options
  - add provider smoke test cases
