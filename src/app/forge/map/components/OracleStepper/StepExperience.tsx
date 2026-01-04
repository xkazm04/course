'use client';

import { motion } from 'framer-motion';
import { ExperienceLevel, Question } from '../../lib/oracleQuestions';

interface StepExperienceProps {
  question: Question;
  selectedExperience: ExperienceLevel | null;
  onSelect: (experience: ExperienceLevel) => void;
}

export function StepExperience({ question, selectedExperience, onSelect }: StepExperienceProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--ember)]/20 to-[var(--ember-glow)]/20 mb-4"
        >
          <span className="text-2xl">🎯</span>
        </motion.div>
        <h3 className="text-xl font-semibold text-[var(--oracle-text-heading)] mb-2">{question.question}</h3>
        {question.subtitle && (
          <p className="text-sm text-[var(--forge-text-secondary)]">{question.subtitle}</p>
        )}
      </div>

      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isSelected = selectedExperience === option.id;
          return (
            <motion.button
              key={option.id}
              onClick={() => onSelect(option.id as ExperienceLevel)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full p-4 rounded-xl text-left transition-all duration-200 relative overflow-hidden group
                ${isSelected
                  ? 'bg-gradient-to-r from-[var(--ember)]/20 to-[var(--ember-glow)]/20 border-2 border-[var(--ember)]'
                  : 'bg-[var(--forge-bg-anvil)] border-2 border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/50 hover:bg-[var(--forge-bg-elevated)]/50'
                }
              `}
            >
              {/* Selection highlight effect */}
              {isSelected && (
                <motion.div
                  layoutId="experience-selection"
                  className="absolute inset-0 bg-gradient-to-r from-[var(--ember)]/5 to-transparent"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative flex items-center gap-4">
                <motion.div
                  animate={{
                    scale: isSelected ? 1.1 : 1,
                    rotate: isSelected ? [0, -5, 5, 0] : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                    ${isSelected ? 'bg-[var(--ember)]/30' : 'bg-[var(--forge-bg-elevated)] group-hover:bg-[var(--forge-bg-workshop)]'}
                    transition-colors duration-200
                  `}
                >
                  {option.icon}
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold transition-colors ${isSelected ? 'text-[var(--ember)]' : 'text-[var(--forge-text-primary)]'}`}>
                      {option.label}
                    </h4>
                  </div>
                  <p className="text-sm text-[var(--forge-text-primary)] mt-0.5">
                    {option.description}
                  </p>
                  {option.note && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xs text-[var(--forge-text-muted)] mt-1"
                    >
                      {option.note}
                    </motion.p>
                  )}
                </div>
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected
                    ? 'border-[var(--ember)] bg-[var(--ember)]'
                    : 'border-[var(--forge-border-default)] group-hover:border-[var(--ember)]/50'
                  }
                `}>
                  {isSelected && (
                    <motion.svg
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-3.5 h-3.5 text-[var(--oracle-text-on-ember)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Helpful tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 justify-center text-xs text-[var(--forge-text-muted)]"
      >
        <span>💡</span>
        <span>Don't worry, all paths include foundational concepts when needed</span>
      </motion.div>
    </div>
  );
}
