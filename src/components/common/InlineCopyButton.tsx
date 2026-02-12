import { useEffect, useState } from 'react'

type InlineCopyButtonProps = {
  text: string
  ariaLabel?: string
}

export function InlineCopyButton({
  text,
  ariaLabel = 'Copy to clipboard',
}: InlineCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm transition hover:bg-slate-100"
      aria-label={ariaLabel}
      title={copied ? 'Copied' : 'Copy'}
    >
      <span aria-hidden>{copied ? '✓' : '⧉'}</span>
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}
