'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { ICON_SIZES } from '@/app/shared/lib/iconSizes'
import type { CheckpointCardProps } from './types'

export function CheckpointCard({ checkpoint }: CheckpointCardProps) {
  const passed = checkpoint.passed

  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        passed
          ? 'border-[var(--forge-success)]/30 bg-[var(--forge-success)]/10'
          : 'border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)]'
      )}
    >
      <CheckpointHeader title={checkpoint.title} passed={passed} />
      <CheckpointContent checkpoint={checkpoint} />
    </div>
  )
}

function CheckpointHeader({ title, passed }: { title: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      {passed ? (
        <CheckCircle2 size={ICON_SIZES.md} className="text-[var(--forge-success)]" />
      ) : (
        <Circle size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
      )}
      <h3
        className={cn(
          'font-semibold',
          passed ? 'text-[var(--forge-success)]' : 'text-[var(--forge-text-primary)]'
        )}
      >
        {title}
      </h3>
    </div>
  )
}

function CheckpointContent({ checkpoint }: CheckpointCardProps) {
  return (
    <div className="ml-8">
      <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
        Verification Criteria
      </h4>
      <ul className="space-y-1 mb-3">
        {checkpoint.verificationCriteria.map((criteria, i) => (
          <li
            key={i}
            className="text-sm text-[var(--forge-text-secondary)] flex items-start gap-2"
          >
            <span className="text-[var(--forge-text-muted)] mt-1">•</span>
            {criteria}
          </li>
        ))}
      </ul>

      <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
        Self Assessment
      </h4>
      <ul className="space-y-1">
        {checkpoint.selfAssessment.map((question, i) => (
          <li key={i} className="text-sm text-[var(--ember)] italic">
            {question}
          </li>
        ))}
      </ul>
    </div>
  )
}
