import { createServerFn } from '@tanstack/react-start'
import type {
  CandidateProfile,
  ChatMessage,
  ChatResponse,
  RequirementMatch,
} from '@/data/types'
import { callLlmText } from '@/lib/llm/client'
import type { LlmRuntimeSettings } from '@/lib/llm/types'

export async function chatAboutCandidateOnServer(
  profile: CandidateProfile,
  userMessages: ChatMessage[],
  requirements?: RequirementMatch[],
  llmSettings?: LlmRuntimeSettings,
): Promise<ChatResponse> {
  if (!userMessages.length) {
    throw new Error('No messages provided.')
  }

  const lastUserMessage = userMessages[userMessages.length - 1]
  const roleContext =
    requirements && requirements.length > 0
      ? `For the current role, here are the extracted requirements and how the candidate mapped to them:
${JSON.stringify(requirements, null, 2)}`
      : 'No specific role context was provided; answer based only on the general candidate profile.'

  const systemPrompt = `
You are an assistant that honestly answers questions about a specific job candidate.
Candidate name: ${profile.name}
You MUST:
  • Base your answers ONLY on the provided candidate profile.
  • If something is not in the profile, say you don't know instead of guessing.
  • Highlight both strengths and gaps where relevant.
  • Answer in a way that is useful to a recruiter or hiring manager evaluating fit.
  • When role context is provided, anchor your answer to that requirement mapping.
  • Keep answers concise but specific (2–6 sentences is usually enough).
Candidate profile (JSON):
${JSON.stringify(profile, null, 2)}
Role context:
${roleContext}
`

  const llmResponseText = await callLlmText({
    system: systemPrompt,
    user: lastUserMessage.content,
    settings: llmSettings,
  })

  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: llmResponseText,
  }

  return {
    messages: [...userMessages, assistantMessage],
  }
}

export const chatAboutCandidateFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      profile: CandidateProfile
      userMessages: ChatMessage[]
      requirements?: RequirementMatch[]
      llmSettings?: LlmRuntimeSettings
    }) =>
      data,
  )
  .handler(async ({ data }) =>
    chatAboutCandidateOnServer(
      data.profile,
      data.userMessages,
      data.requirements,
      data.llmSettings,
    ),
  )
