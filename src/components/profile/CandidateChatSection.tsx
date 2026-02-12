import type { ChatMessage } from '@/data/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type CandidateChatSectionProps = {
  firstName: string
  contextNotice?: string | null
  suggestedQuestions: string[]
  messages: ChatMessage[]
  chatInput: string
  onChatInputChange: (value: string) => void
  onSendMessage: (value: string) => void
  chatPending: boolean
  chatError: string | null
  guidanceExamples?: string[]
}

export function CandidateChatSection({
  firstName,
  contextNotice,
  suggestedQuestions,
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  chatPending,
  chatError,
  guidanceExamples,
}: CandidateChatSectionProps) {
  return (
    <Card className="ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Ask AI about {firstName}</h2>
      {contextNotice && (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {contextNotice}
        </p>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestedQuestions.map((q) => (
          <Button
            key={q}
            variant="outline"
            size="sm"
            className="h-auto py-1.5"
            onClick={() => onSendMessage(q)}
            disabled={chatPending}
          >
            {q}
          </Button>
        ))}
      </div>
      <div
        className="mb-3 min-h-40 max-h-80 overflow-y-auto rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="m-0 text-sm text-slate-500">Ask a question above or type below.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="mb-3">
            <div
              className={`mb-1 text-xs font-semibold uppercase tracking-wide ${
                msg.role === 'user' ? 'text-blue-700' : 'text-slate-700'
              }`}
            >
              {msg.role}
            </div>
            <div>{msg.content}</div>
          </div>
        ))}
        {chatPending && (
          <div className="mb-1">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              assistant
            </div>
            <div className="text-sm text-slate-600">Thinking...</div>
          </div>
        )}
      </div>
      {guidanceExamples && guidanceExamples.length > 0 && (
        <p className="mb-2 text-xs text-slate-500">
          Try asking: {guidanceExamples.join(' | ')}
        </p>
      )}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Ask about this candidate…"
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          readOnly={chatPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !chatPending) onSendMessage(chatInput)
          }}
        />
        <Button
          className="mt-0"
          onClick={() => onSendMessage(chatInput)}
          disabled={!chatInput.trim() || chatPending}
        >
          {chatPending ? 'Thinking...' : 'Send'}
        </Button>
      </div>
      {chatError && <p className="mt-2 text-sm text-red-800">{chatError}</p>}
    </Card>
  )
}
