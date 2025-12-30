'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, ThumbsUp, ThumbsDown } from 'lucide-react'
import { ICON_SIZES } from '@/app/shared/lib/iconSizes'
import { scaleIn } from '@/app/shared/lib/animations'
import { AI_RESPONSES } from './config'
import type { AIAssistanceModalProps } from './types'

export function AIAssistanceModal({ type, context, onClose, onRate }: AIAssistanceModalProps) {
  const [rated, setRated] = useState(false)

  const handleRate = (helpful: boolean) => {
    onRate('current', helpful)
    setRated(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        {...scaleIn}
        className="w-full max-w-lg bg-[var(--forge-bg-elevated)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <ModalHeader context={context} />
        <ModalResponse type={type} />
        {!rated ? (
          <RatingSection onRate={handleRate} />
        ) : (
          <ThankYouSection />
        )}
        <CloseButton onClose={onClose} />
      </motion.div>
    </div>
  )
}

function ModalHeader({ context }: { context: string }) {
  return (
    <div className="p-4 border-b border-[var(--forge-border-default)] flex items-center gap-3">
      <div className="w-10 h-10 bg-[var(--ember)]/10 rounded-xl flex items-center justify-center">
        <Bot size={ICON_SIZES.md} className="text-[var(--ember)]" />
      </div>
      <div>
        <h3 className="font-bold text-[var(--forge-text-primary)]">AI Mentor</h3>
        <p className="text-sm text-[var(--forge-text-secondary)]">{context}</p>
      </div>
    </div>
  )
}

function ModalResponse({ type }: { type: AIAssistanceModalProps['type'] }) {
  return (
    <div className="p-4 max-h-96 overflow-y-auto">
      <div className="prose prose-sm dark:prose-invert">
        <pre className="whitespace-pre-wrap text-sm text-[var(--forge-text-secondary)] bg-[var(--forge-bg-anvil)] p-4 rounded-xl">
          {AI_RESPONSES[type]}
        </pre>
      </div>
    </div>
  )
}

function RatingSection({ onRate }: { onRate: (helpful: boolean) => void }) {
  return (
    <div className="p-4 border-t border-[var(--forge-border-default)]">
      <p className="text-sm text-[var(--forge-text-secondary)] mb-3">Was this helpful?</p>
      <div className="flex gap-2">
        <button
          onClick={() => onRate(true)}
          data-testid="rate-helpful-btn"
          className="flex-1 py-2 bg-[var(--forge-success)]/10 text-[var(--forge-success)] rounded-xl font-medium hover:bg-[var(--forge-success)]/20 transition-colors flex items-center justify-center gap-2"
        >
          <ThumbsUp size={ICON_SIZES.sm} />
          Yes
        </button>
        <button
          onClick={() => onRate(false)}
          data-testid="rate-not-helpful-btn"
          className="flex-1 py-2 bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)] rounded-xl font-medium hover:bg-[var(--forge-bg-workshop)] transition-colors flex items-center justify-center gap-2"
        >
          <ThumbsDown size={ICON_SIZES.sm} />
          No
        </button>
      </div>
    </div>
  )
}

function ThankYouSection() {
  return (
    <div className="p-4 border-t border-[var(--forge-border-default)] text-center">
      <p className="text-sm text-[var(--forge-success)]">Thanks for your feedback!</p>
    </div>
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-4 border-t border-[var(--forge-border-default)]">
      <button
        onClick={onClose}
        data-testid="close-ai-modal-btn"
        className="w-full py-3 bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)] font-medium rounded-xl hover:bg-[var(--forge-bg-workshop)] transition-colors"
      >
        Close
      </button>
    </div>
  )
}
