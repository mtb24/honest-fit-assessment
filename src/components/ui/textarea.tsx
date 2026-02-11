import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-32 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30',
        className,
      )}
      {...props}
    />
  )
}
