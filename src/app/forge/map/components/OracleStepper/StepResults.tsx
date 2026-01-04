'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { OraclePath, PathNode } from '../../lib/oracleApi';
import { PathTree } from './PathTree';

interface StepResultsProps {
  paths: OraclePath[];
  selectedPathId: string | null;
  onSelectPath: (pathId: string) => void;
  onReset: () => void;
  onAcceptPath?: (path: OraclePath) => Promise<void>;
  onNavigateToNode?: (node: PathNode) => void;
}

const pathColors = [
  { bg: 'from-[var(--ember)]/20 to-[var(--ember-glow)]/20', border: 'border-[var(--ember)]', accent: 'text-[var(--ember)]' },
  { bg: 'from-[var(--forge-info)]/20 to-[var(--forge-info)]/20', border: 'border-[var(--forge-info)]', accent: 'text-[var(--forge-info)]' },
  { bg: 'from-[var(--forge-success)]/20 to-[var(--forge-success)]/20', border: 'border-[var(--forge-success)]', accent: 'text-[var(--forge-success)]' },
];

export function StepResults({
  paths,
  selectedPathId,
  onSelectPath,
  onReset,
  onAcceptPath,
  onNavigateToNode
}: StepResultsProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const selectedPath = useMemo(() => {
    return paths.find(p => p.id === selectedPathId || `path-${paths.indexOf(p)}` === selectedPathId);
  }, [paths, selectedPathId]);

  const handleAccept = async () => {
    if (!selectedPath || !onAcceptPath) return;
    setIsAccepting(true);
    try {
      await onAcceptPath(selectedPath);
    } finally {
      setIsAccepting(false);
    }
  };

  if (paths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="w-16 h-16 rounded-full bg-[var(--forge-bg-elevated)] flex items-center justify-center">
          <span className="text-3xl">😕</span>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[var(--oracle-text-heading)] mb-2">No paths generated</h3>
          <p className="text-sm text-[var(--forge-text-secondary)]">Something went wrong. Please try again.</p>
        </div>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-workshop)] transition-colors"
        >
          Start Over
        </button>
      </div>
    );
  }

  // Detail view when path is selected
  if (viewMode === 'detail' && selectedPath) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => setViewMode('list')}
          className="flex items-center gap-2 text-sm text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to paths
        </button>

        {/* Path tree */}
        <PathTree
          path={selectedPath}
          onNavigateToNode={onNavigateToNode}
          onAccept={onAcceptPath ? handleAccept : undefined}
          isAccepting={isAccepting}
        />

        {/* Reset option */}
        <div className="text-center pt-2">
          <button
            onClick={onReset}
            className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
          >
            Choose a different path
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] mb-4"
        >
          <span className="text-3xl">✨</span>
        </motion.div>
        <h3 className="text-xl font-semibold text-[var(--oracle-text-heading)] mb-2">Your Personalized Paths</h3>
        <p className="text-sm text-[var(--forge-text-secondary)]">
          Based on your profile, here are {paths.length} recommended learning paths
        </p>
      </div>

      <div className="space-y-4">
        {paths.map((path, index) => {
          const colors = pathColors[index % pathColors.length];
          const isSelected = selectedPathId === path.id;

          return (
            <motion.button
              key={path.id || index}
              onClick={() => onSelectPath(path.id || `path-${index}`)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                w-full p-5 rounded-xl text-left transition-all duration-200
                bg-gradient-to-r ${colors.bg}
                ${isSelected
                  ? `border-2 ${colors.border} shadow-lg`
                  : 'border-2 border-[var(--forge-border-subtle)] hover:border-[var(--forge-border-default)]'
                }
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-semibold ${colors.accent}`}>
                      Path {index + 1}
                    </span>
                    {path.confidence && path.confidence > 0.8 && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--forge-success)]/20 text-[var(--forge-success)] text-xs">
                        Best Match
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--oracle-text-heading)] mb-1">
                    {path.name}
                  </h4>
                  {path.description && (
                    <p className="text-sm text-[var(--forge-text-primary)] mb-3">
                      {path.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-[var(--forge-text-secondary)]">
                    {path.estimated_weeks && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~{path.estimated_weeks} weeks
                      </span>
                    )}
                    {path.node_ids && path.node_ids.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {path.node_ids.length} modules
                      </span>
                    )}
                  </div>

                  {path.reasoning && (
                    <p className="text-xs text-[var(--forge-text-muted)] mt-3 italic">
                      "{path.reasoning}"
                    </p>
                  )}
                </div>

                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? `${colors.border} bg-white/10` : 'border-[var(--forge-border-default)]'}
                `}>
                  {isSelected && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-4 h-4 ${colors.accent}`}
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

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg text-sm text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
        >
          Start Over
        </button>
        {selectedPathId && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setViewMode('detail')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-[var(--oracle-text-on-ember)] hover:opacity-90 transition-all shadow-lg shadow-[var(--ember)]/20"
          >
            View Path Details
          </motion.button>
        )}
      </div>
    </div>
  );
}
