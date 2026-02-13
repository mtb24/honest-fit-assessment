# Honest Fit Assessment

Honest Fit Assessment is an AI-powered tool for stress-testing how well a candidate actually fits a job description.

Paste a candidate profile, paste a JD, and the app will:

- Extract role requirements from the job description
- Score the candidate profile against those requirements
- Highlight mapped strengths and gaps (Strong / Moderate / Weak fit)
- Generate recruiter-facing talking points and application blurbs
- Answer follow-up Q&A about the candidate

It has two main modes:

- **Candidate** – build/import a profile, run “Honest Fit” checks in a two-column fit dashboard, keep a recent roles list, and generate interview/application copy.
- **Reviewer** – load a candidate profile (demo/import/resume builder) and ask AI questions like a hiring manager  
  (e.g. “Where might this person need onboarding support?”).

Under the hood it’s a **TanStack Start** app that uses LLMs behind a clean UI. Profiles are stored locally and can be imported/exported as JSON, so you can use it as a personal “fit lab” or demo it live in interviews without exposing private data.

---

## Features

- 🧑‍💻 **Candidate profile builder**
  - Import from JSON or generate from a pasted resume
  - Inline editing for headline, summary, strengths, and experience
  - Profile completeness indicator

- 📄 **Job Description Fit**
  - Paste any JD and run a structured fit assessment
  - Strengths / gaps mapped directly to the JD requirements
  - Compact “Evaluating fit for <name>” header with quick profile edit link
  - Two-column layout: JD + fit on the left, role tools/helpers/snippets on the right
  - Recent roles panel with cached results and comparison strip
  - Interview bullets + application blurb generator
  - Saved snippets for quick reuse

- 🧑‍⚖️ **Reviewer mode**
  - Load demo or imported profiles without touching candidate workflows
  - Expandable “Build profile from resume” flow that only appears when toggled
  - Profile highlights card (top 3–5 things to know)
  - “Ask AI about <candidate>” chat with suggested questions
  - Answers formatted for readable, recruiter-friendly output

- ⚙️ **LLM-agnostic**
  - Pluggable providers (`mock`, `openai`, `cursor`, `ollama`)
  - Per-user model/temperature settings stored locally
  - Mock provider for offline/demo use

---

## Tech Stack

- **TanStack Start** (React + Router + Query)
- **Vite** + **TypeScript**
- **Tailwind CSS**
- **Zod** (runtime validation)
- LocalStorage for profile + UI state

---

## Requirements

- Node.js 20+
- pnpm

---

## Getting Started

```bash
pnpm install
pnpm dev

App runs on http://localhost:3000 by default.

⸻

Scripts
	•	pnpm dev – start development server
	•	pnpm lint – TypeScript typecheck (tsc --noEmit)
	•	pnpm build – production build
	•	pnpm preview – preview production build

⸻

Environment Configuration

Copy env.example to .env.local and set values as needed.

Common variables:
	•	LLM_PROVIDER (mock, openai, cursor, ollama)
	•	LLM_FALLBACK_PROVIDERS
	•	LLM_MODEL
	•	LLM_TEMPERATURE
	•	OPENAI_API_KEY
	•	CURSOR_API_KEY
	•	OLLAMA_BASE_URL

⸻

Project Structure

src/
  components/        UI and page components
  contexts/          shared app state (profile, toasts, etc.)
  data/              profile data, schemas, domain types
  lib/               client logic, LLM helpers, utilities
  routes/            TanStack file-based routes
  server/            server functions (fit, chat, parsing, models)


⸻

Core Flows

Candidate
	•	Build or import a profile (JSON or resume-to-profile)
	•	Edit summary, strengths, and experience inline
	•	Paste a job description and run fit evaluation
	•	Review strengths/gaps and recent roles
	•	Generate application blurbs & interview bullets
	•	Save useful AI snippets for reuse

Reviewer
	•	Load demo, import profile JSON, or expand resume builder when needed
	•	See profile highlights and source (resume/import/demo/manual)
	•	Use “Ask AI about <candidate>” for targeted Q&A
	•	Copy answers/snippets for use in notes or feedback

⸻

Notes
	•	Candidate profile state is shared via ProfileProvider and persisted to localStorage.
	•	LLM runtime settings (provider/model/temperature) live in a shared settings sidebar and are also persisted locally.
	•	The mock provider is useful for local/demo workflows without calling a real model.
