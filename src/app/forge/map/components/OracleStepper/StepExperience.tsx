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
        <h3 className="text-xl font-semibold text-white mb-2">{question.question}</h3>
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
              className={`
                w-full p-4 rounded-xl text-left transition-all duration-200 relative overflow-hidden
                ${isSelected
                  ? 'bg-gradient-to-r from-[var(--ember)]/20 to-[var(--ember-glow)]/20 border-2 border-[var(--ember)]'
                  : 'bg-[var(--forge-bg-anvil)] border-2 border-[var(--forge-border-subtle)] hover:border-[var(--forge-border-default)]'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                  ${isSelected ? 'bg-[var(--ember)]/30' : 'bg-[var(--forge-bg-elevated)]'}
                `}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${isSelected ? 'text-[var(--ember)]' : 'text-white'}`}>
                      {option.label}
                    </h4>
                  </div>
                  <p className="text-sm text-[var(--forge-text-primary)] mt-0.5">
                    {option.description}
                  </p>
                  {option.note && (
                    <p className="text-xs text-[var(--forge-text-muted)] mt-1">
                      {option.note}
                    </p>
                  )}
                </div>
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected
                    ? 'border-[var(--ember)] bg-[var(--ember)]'
                    : 'border-[var(--forge-border-default)]'
                  }
                `}>
                  {isSelected && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3.5 h-3.5 text-white"
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
    </div>
  );
}
