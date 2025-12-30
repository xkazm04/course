'use client';

import { motion } from 'framer-motion';
import { Question } from '../../lib/oracleQuestions';

interface StepQuestionProps {
  question: Question;
  selectedAnswer?: string | string[];
  onSelect: (answer: string | string[]) => void;
}

export function StepQuestion({ question, selectedAnswer, onSelect }: StepQuestionProps) {
  const isMultiSelect = question.type === 'multi-select';
  const selectedArray = Array.isArray(selectedAnswer) ? selectedAnswer : selectedAnswer ? [selectedAnswer] : [];

  const handleSelect = (optionId: string) => {
    if (isMultiSelect) {
      const maxSelections = question.maxSelections || Infinity;
      if (selectedArray.includes(optionId)) {
        // Remove if already selected
        onSelect(selectedArray.filter(id => id !== optionId));
      } else if (selectedArray.length < maxSelections) {
        // Add if under limit
        onSelect([...selectedArray, optionId]);
      }
    } else {
      onSelect(optionId);
    }
  };

  const isSelected = (optionId: string) => {
    if (isMultiSelect) {
      return selectedArray.includes(optionId);
    }
    return selectedAnswer === optionId;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">{question.question}</h3>
        {question.subtitle && (
          <p className="text-sm text-[var(--forge-text-secondary)]">{question.subtitle}</p>
        )}
        {isMultiSelect && question.maxSelections && (
          <p className="text-xs text-[var(--ember)] mt-2">
            Select up to {question.maxSelections} options
          </p>
        )}
      </div>

      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const selected = isSelected(option.id);
          return (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                w-full p-4 rounded-xl text-left transition-all duration-200
                ${selected
                  ? 'bg-[var(--ember)]/20 border-2 border-[var(--ember)]'
                  : 'bg-[var(--forge-bg-anvil)] border-2 border-[var(--forge-border-subtle)] hover:border-[var(--forge-border-default)] hover:bg-[var(--forge-bg-elevated)]/50'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-xl
                  ${selected ? 'bg-[var(--ember)]/30' : 'bg-[var(--forge-bg-elevated)]'}
                `}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${selected ? 'text-[var(--ember)]' : 'text-white'}`}>
                    {option.label}
                  </h4>
                  <p className="text-sm text-[var(--forge-text-secondary)] mt-0.5">
                    {option.description}
                  </p>
                  {option.note && (
                    <p className="text-xs text-[var(--forge-text-muted)] mt-1 italic">
                      {option.note}
                    </p>
                  )}
                </div>
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${selected
                    ? 'border-[var(--ember)] bg-[var(--ember)]'
                    : 'border-[var(--forge-border-default)]'
                  }
                `}>
                  {selected && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 text-white"
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
