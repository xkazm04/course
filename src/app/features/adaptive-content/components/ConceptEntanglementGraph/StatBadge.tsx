'use client'

import type { StatBadgeProps } from './types'

export function StatBadge({ count, color, emoji }: StatBadgeProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}
    >
      <span className="text-xs">{emoji}</span>
      <span className="text-xs text-[var(--forge-text-muted)]">{count}</span>
    </div>
  )
}
