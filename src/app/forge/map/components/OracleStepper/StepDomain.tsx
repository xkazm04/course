'use client';

import { motion } from 'framer-motion';
import { DomainId, DOMAIN_QUESTION } from '../../lib/oracleQuestions';

interface StepDomainProps {
  selectedDomain: DomainId | null;
  onSelect: (domain: DomainId) => void;
}

export function StepDomain({ selectedDomain, onSelect }: StepDomainProps) {
  const question = DOMAIN_QUESTION;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">{question.question}</h3>
        {question.subtitle && (
          <p className="text-sm text-[var(--forge-text-secondary)]">{question.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.options?.map((option, index) => {
          const isSelected = selectedDomain === option.id;
          return (
            <motion.button
              key={option.id}
              onClick={() => onSelect(option.id as DomainId)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative p-4 rounded-xl text-left transition-all duration-200
                ${isSelected
                  ? 'bg-[var(--ember)]/20 border-2 border-[var(--ember)] shadow-lg shadow-[var(--ember)]/10'
                  : 'bg-[var(--forge-bg-anvil)] border-2 border-[var(--forge-border-subtle)] hover:border-[var(--forge-border-default)] hover:bg-[var(--forge-bg-elevated)]/50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${isSelected ? 'text-[var(--ember)]' : 'text-white'}`}>
                    {option.label}
                  </h4>
                  <p className="text-xs text-[var(--forge-text-secondary)] mt-0.5 line-clamp-2">
                    {option.description}
                  </p>
                  {option.examples && (
                    <p className="text-xs text-[var(--forge-text-muted)] mt-1 italic">
                      {option.examples}
                    </p>
                  )}
                </div>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--ember)] flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
