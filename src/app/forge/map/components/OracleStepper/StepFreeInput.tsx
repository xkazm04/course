'use client';

import { motion } from 'framer-motion';
import { FREE_INPUT_QUESTION } from '../../lib/oracleQuestions';

interface StepFreeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function StepFreeInput({ value, onChange }: StepFreeInputProps) {
  const question = FREE_INPUT_QUESTION;
  const charCount = value.length;
  const maxLength = question.maxLength || 500;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">{question.question}</h3>
        {question.subtitle && (
          <p className="text-sm text-[var(--forge-text-secondary)]">{question.subtitle}</p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={question.placeholder}
          rows={6}
          className="w-full p-4 rounded-xl bg-[var(--forge-bg-anvil)] border-2 border-[var(--forge-border-subtle)] text-white placeholder-[var(--forge-text-muted)] resize-none focus:outline-none focus:border-[var(--ember)] transition-colors"
        />
        <div className="absolute bottom-3 right-3 text-xs text-[var(--forge-text-muted)]">
          {charCount}/{maxLength}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-[var(--forge-bg-anvil)]/50 border border-[var(--forge-border-subtle)]"
      >
        <span className="text-xl">💡</span>
        <div>
          <p className="text-sm text-[var(--forge-text-primary)]">This step is optional</p>
          <p className="text-xs text-[var(--forge-text-muted)] mt-1">
            But the more context you share, the better we can personalize your learning path.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
