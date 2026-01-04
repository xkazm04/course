'use client';

import { motion } from 'framer-motion';
import { Sparkles, MessageSquare } from 'lucide-react';
import { FREE_INPUT_QUESTION } from '../../lib/oracleQuestions';

interface StepFreeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function StepFreeInput({ value, onChange }: StepFreeInputProps) {
  const question = FREE_INPUT_QUESTION;
  const charCount = value.length;
  const maxLength = question.maxLength || 500;
  const hasContent = charCount > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-[var(--oracle-text-heading)] mb-2">{question.question}</h3>
        {question.subtitle && (
          <p className="text-sm text-[var(--forge-text-secondary)]">{question.subtitle}</p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Textarea with enhanced styling */}
        <div className={`
          relative rounded-xl overflow-hidden transition-all duration-300
          ${hasContent ? 'ring-2 ring-[var(--ember)]/30' : ''}
        `}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
            placeholder={question.placeholder}
            rows={6}
            className="w-full p-4 pb-8 bg-[var(--forge-bg-anvil)] border-2 border-[var(--forge-border-subtle)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] resize-none focus:outline-none focus:border-[var(--ember)] transition-colors rounded-xl"
          />

          {/* Character count indicator */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {hasContent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Sparkles size={12} className="text-[var(--ember)]" />
              </motion.div>
            )}
            <span className={`text-xs transition-colors ${
              charCount > maxLength * 0.8
                ? 'text-[var(--ember)]'
                : 'text-[var(--forge-text-muted)]'
            }`}>
              {charCount}/{maxLength}
            </span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-2 h-0.5 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
            initial={{ width: 0 }}
            animate={{ width: `${(charCount / maxLength) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </motion.div>

      {/* Prompts for inspiration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <p className="text-xs text-[var(--forge-text-muted)] text-center mb-3">
          Need inspiration? Consider mentioning:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['specific goals', 'project ideas', 'interests', 'constraints'].map((prompt, i) => (
            <motion.span
              key={prompt}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="px-3 py-1 text-xs rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] border border-[var(--forge-border-subtle)]"
            >
              {prompt}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
