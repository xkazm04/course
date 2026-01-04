'use client';

/**
 * ModeSelector - Learning Mode Toggle Component
 *
 * Allows students to switch between Manual, Browser IDE, and AI-Assisted modes.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Code2, Sparkles, Check } from 'lucide-react';
import type { HomeworkMode, ModeConfig } from '../lib/types';
import { MODE_CONFIGS } from '../lib/mockHomeworkData';

export interface ModeSelectorProps {
  currentMode: HomeworkMode;
  onModeChange: (mode: HomeworkMode) => void;
  disabled?: boolean;
  className?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  terminal: <Terminal className="w-5 h-5" />,
  code: <Code2 className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
};

export function ModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
  className = '',
}: ModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<HomeworkMode | null>(null);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider">
          Learning Mode
        </span>
      </div>

      <div className="space-y-2">
        {MODE_CONFIGS.map((config) => {
          const isSelected = currentMode === config.id;
          const isHovered = hoveredMode === config.id;

          return (
            <button
              key={config.id}
              onClick={() => !disabled && onModeChange(config.id)}
              onMouseEnter={() => setHoveredMode(config.id)}
              onMouseLeave={() => setHoveredMode(null)}
              disabled={disabled}
              className={`
                relative w-full p-3 rounded-xl border transition-all duration-200
                text-left group
                ${
                  isSelected
                    ? 'border-[var(--ember)] bg-[var(--ember)]/5'
                    : 'border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 hover:border-[var(--forge-border-subtle)] hover:bg-[var(--forge-bg-bench)]/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                    ${
                      isSelected
                        ? 'bg-[var(--ember)] text-white'
                        : 'bg-[var(--forge-bg-bench)] text-[var(--forge-text-secondary)] group-hover:text-[var(--forge-text-primary)]'
                    }
                  `}
                >
                  {ICONS[config.icon]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium text-sm ${
                        isSelected
                          ? 'text-[var(--ember)]'
                          : 'text-[var(--forge-text-primary)]'
                      }`}
                    >
                      {config.label}
                    </h3>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-[var(--ember)] flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-xs text-[var(--forge-text-muted)] mt-0.5">
                    {config.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature list for selected mode */}
      <ModeFeatureList mode={currentMode} configs={MODE_CONFIGS} />
    </div>
  );
}

interface ModeFeatureListProps {
  mode: HomeworkMode;
  configs: ModeConfig[];
}

function ModeFeatureList({ mode, configs }: ModeFeatureListProps) {
  const config = configs.find((c) => c.id === mode);
  if (!config) return null;

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-3 rounded-lg bg-[var(--forge-bg-bench)]/30 border border-[var(--forge-border-subtle)]"
    >
      <ul className="space-y-1.5">
        {config.features.map((feature, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-xs text-[var(--forge-text-secondary)]"
          >
            <span className="w-1 h-1 rounded-full bg-[var(--ember)]" />
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default ModeSelector;
