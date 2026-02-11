import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Input({
  className,
  type = 'text',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'h-9 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30',
        className,
      )}
      {...props}
    />
  )
}
