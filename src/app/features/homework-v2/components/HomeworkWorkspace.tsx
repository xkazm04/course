'use client';

/**
 * HomeworkWorkspace - Main Homework Container Component
 *
 * The primary workspace for homework assignments with mode selection,
 * split-pane layout, Claude CLI panel, and AI decision log.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Eye,
  EyeOff,
  Lightbulb,
  Send,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeft,
  Clock,
  Award,
} from 'lucide-react';
import type {
  HomeworkDefinition,
  HomeworkSession,
  HomeworkMode,
  WorkspaceSettings,
} from '../lib/types';
import { DEFAULT_WORKSPACE_SETTINGS } from '../lib/mockHomeworkData';
import { ModeSelector } from './ModeSelector';
import { ClaudeCliPanel } from './ClaudeCliPanel';
import { AIDecisionLog } from './AIDecisionLog';
import { GitHubIssueCard } from './GitHubIssueCard';
import { LearningObjectives } from './LearningObjectives';

export interface HomeworkWorkspaceProps {
  homework: HomeworkDefinition;
  session?: HomeworkSession;
  onModeChange?: (mode: HomeworkMode) => void;
  onSubmit?: () => void;
  className?: string;
}

export function HomeworkWorkspace({
  homework,
  session,
  onModeChange,
  onSubmit,
  className = '',
}: HomeworkWorkspaceProps) {
  const [settings, setSettings] = useState<WorkspaceSettings>(
    DEFAULT_WORKSPACE_SETTINGS
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDecisionLogExpanded, setIsDecisionLogExpanded] = useState(true);

  // Use session data or mock defaults
  const currentMode = session?.mode || settings.mode;
  const claudeSession = session?.claudeSession;
  const decisionLog = session?.decisionLog || {
    sessionId: 'mock',
    steps: [],
    currentStepIndex: 0,
    isVisible: settings.showDecisionLog,
  };

  const handleModeChange = useCallback(
    (mode: HomeworkMode) => {
      setSettings((prev) => ({ ...prev, mode }));
      onModeChange?.(mode);
    },
    [onModeChange]
  );

  const toggleDecisionLogVisibility = useCallback(() => {
    setSettings((prev) => ({ ...prev, showDecisionLog: !prev.showDecisionLog }));
  }, []);

  const handlePromptSubmit = useCallback((prompt: string) => {
    console.log('Prompt submitted:', prompt);
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <WorkspaceHeader
        homework={homework}
        settings={settings}
        isSettingsOpen={isSettingsOpen}
        onSettingsToggle={() => setIsSettingsOpen(!isSettingsOpen)}
      />

      {/* Settings panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-[var(--forge-border-subtle)] overflow-y-auto bg-[var(--forge-bg-elevated)]/30"
            >
              <div className="p-4 space-y-4">
                {/* Mode selector */}
                <ModeSelector
                  currentMode={currentMode}
                  onModeChange={handleModeChange}
                  disabled={session?.status === 'in_progress'}
                />

                {/* GitHub issue */}
                <GitHubIssueCard
                  issue={homework.githubIssue}
                  branch={session?.branch}
                  pr={session?.pr}
                />

                {/* Learning objectives */}
                <LearningObjectives objectives={homework.learningObjectives} />

                {/* Hints section */}
                {homework.starterHints.length > 0 && (
                  <HintsSection hints={homework.starterHints} />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="flex-shrink-0 w-8 flex items-center justify-center border-r border-[var(--forge-border-subtle)] hover:bg-[var(--forge-bg-bench)]/50 transition-colors text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
          title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Main workspace area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* AI-Assisted mode content */}
          {currentMode === 'ai_assisted' && claudeSession && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Claude CLI Panel */}
              <div
                className={`flex-1 overflow-hidden ${
                  isDecisionLogExpanded ? 'max-h-[60%]' : ''
                }`}
              >
                <ClaudeCliPanel
                  session={claudeSession}
                  onPromptSubmit={handlePromptSubmit}
                  showThinkingBlocks={settings.showThinkingBlocks}
                  showToolCalls={settings.showToolCalls}
                  className="h-full m-4 mb-2"
                />
              </div>

              {/* AI Decision Log */}
              {settings.showDecisionLog && decisionLog.steps.length > 0 && (
                <div className="flex-shrink-0 px-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setIsDecisionLogExpanded(!isDecisionLogExpanded)}
                      className="flex items-center gap-1.5 text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                    >
                      {isDecisionLogExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                      {isDecisionLogExpanded ? 'Collapse' : 'Expand'} Decision Log
                    </button>
                  </div>
                  <AnimatePresence>
                    {isDecisionLogExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <AIDecisionLog
                          log={{
                            ...decisionLog,
                            isVisible: settings.showDecisionLog,
                          }}
                          onToggleVisibility={toggleDecisionLogVisibility}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Browser IDE mode */}
          {currentMode === 'browser' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-[var(--forge-text-muted)]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--forge-bg-bench)]/50 flex items-center justify-center">
                  <span className="text-2xl">💻</span>
                </div>
                <p className="text-lg font-medium text-[var(--forge-text-primary)] mb-2">Browser IDE Mode</p>
                <p className="text-sm text-[var(--forge-text-secondary)]">
                  CodePlayground component would be integrated here
                </p>
              </div>
            </div>
          )}

          {/* Manual mode */}
          {currentMode === 'manual' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <ManualModeInstructions homework={homework} />
            </div>
          )}
        </main>
      </div>

      {/* Footer with submit button */}
      <WorkspaceFooter
        session={session}
        onSubmit={onSubmit}
        hintsRevealed={session?.hintsRevealed || 0}
        xpReward={homework.xpReward}
      />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface WorkspaceHeaderProps {
  homework: HomeworkDefinition;
  settings: WorkspaceSettings;
  isSettingsOpen: boolean;
  onSettingsToggle: () => void;
}

function WorkspaceHeader({
  homework,
  settings,
  isSettingsOpen,
  onSettingsToggle,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-semibold text-[var(--forge-text-primary)]">
          {homework.title}
        </h1>
        <div className="flex items-center gap-4 mt-1.5">
          <DifficultyBadge difficulty={homework.difficulty} />
          <span className="flex items-center gap-1.5 text-xs text-[var(--forge-text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            ~{homework.estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--ember)]">
            <Award className="w-3.5 h-3.5" />
            {homework.xpReward} XP
          </span>
        </div>
      </div>

      <button
        onClick={onSettingsToggle}
        className={`p-2.5 rounded-lg transition-all duration-200 ${
          isSettingsOpen
            ? 'bg-[var(--ember)] text-white shadow-lg shadow-[var(--ember)]/20'
            : 'hover:bg-[var(--forge-bg-bench)]/60 text-[var(--forge-text-secondary)]'
        }`}
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
}

interface SettingsPanelProps {
  settings: WorkspaceSettings;
  onSettingsChange: (settings: WorkspaceSettings) => void;
  onClose: () => void;
}

function SettingsPanel({
  settings,
  onSettingsChange,
}: SettingsPanelProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]/30 overflow-hidden"
    >
      <div className="p-5">
        <h3 className="text-sm font-medium text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--ember)]" />
          AI Transparency Settings
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ToggleSetting
            label="Thinking Blocks"
            description="Show Claude's reasoning"
            checked={settings.showThinkingBlocks}
            onChange={(checked) =>
              onSettingsChange({ ...settings, showThinkingBlocks: checked })
            }
          />
          <ToggleSetting
            label="Decision Log"
            description="Show step-by-step plan"
            checked={settings.showDecisionLog}
            onChange={(checked) =>
              onSettingsChange({ ...settings, showDecisionLog: checked })
            }
          />
          <ToggleSetting
            label="Tool Calls"
            description="Show file operations"
            checked={settings.showToolCalls}
            onChange={(checked) =>
              onSettingsChange({ ...settings, showToolCalls: checked })
            }
          />
          <ToggleSetting
            label="Auto-expand"
            description="Auto-expand thinking"
            checked={settings.autoExpandThinking}
            onChange={(checked) =>
              onSettingsChange({ ...settings, autoExpandThinking: checked })
            }
          />
        </div>
      </div>
    </motion.div>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: ToggleSettingProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors ${
            checked ? 'bg-[var(--ember)]' : 'bg-[var(--forge-bg-bench)]'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
              checked ? 'translate-x-5' : ''
            }`}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--forge-text-primary)] group-hover:text-[var(--ember)] transition-colors">
          {label}
        </p>
        <p className="text-xs text-[var(--forge-text-muted)]">{description}</p>
      </div>
    </label>
  );
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty: HomeworkDefinition['difficulty'];
}) {
  const config = {
    beginner: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Beginner' },
    intermediate: {
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      label: 'Intermediate',
    },
    advanced: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Advanced' },
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${config[difficulty].color}`}
    >
      {config[difficulty].label}
    </span>
  );
}

interface HintsSectionProps {
  hints: HomeworkDefinition['starterHints'];
}

function HintsSection({ hints }: HintsSectionProps) {
  const [revealedHints, setRevealedHints] = useState<Set<number>>(
    new Set(hints.filter((h) => h.revealed).map((h) => h.level))
  );

  const revealHint = (level: number) => {
    setRevealedHints((prev) => new Set([...prev, level]));
  };

  return (
    <div className="bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--forge-border-subtle)] flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-[var(--forge-text-primary)]">
          Hints
        </span>
        <span className="text-xs text-[var(--forge-text-muted)]">
          ({revealedHints.size}/{hints.length})
        </span>
      </div>
      <div className="divide-y divide-[var(--forge-border-subtle)]">
        {hints.map((hint) => {
          const isRevealed = revealedHints.has(hint.level);
          return (
            <div key={hint.level} className="px-4 py-3">
              {isRevealed ? (
                <p className="text-sm text-[var(--forge-text-secondary)]">
                  {hint.hint}
                </p>
              ) : (
                <button
                  onClick={() => revealHint(hint.level)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span className="text-sm text-[var(--forge-text-muted)] group-hover:text-[var(--forge-text-primary)] transition-colors">
                    Hint {hint.level}
                  </span>
                  <span className="text-xs text-amber-500 font-medium">
                    -{hint.costPercent}% XP
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ManualModeInstructionsProps {
  homework: HomeworkDefinition;
}

function ManualModeInstructions({ homework }: ManualModeInstructionsProps) {
  return (
    <div className="max-w-lg text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--forge-bg-bench)]/50 flex items-center justify-center">
        <span className="text-2xl">🖥️</span>
      </div>
      <h2 className="text-xl font-semibold text-[var(--forge-text-primary)] mb-3">
        Manual Mode
      </h2>
      <p className="text-[var(--forge-text-secondary)] mb-6">
        Work on this homework in your local IDE. When you&apos;re ready, create
        a PR from your branch.
      </p>
      <div className="bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] p-5 text-left">
        <h3 className="text-sm font-medium text-[var(--forge-text-primary)] mb-3">
          Files to modify:
        </h3>
        <ul className="space-y-2.5">
          {homework.fileScope.map((file) => (
            <li key={file.path} className="text-sm">
              <code className="px-2 py-0.5 rounded bg-[var(--forge-bg-bench)] text-[var(--ember)] font-mono text-xs">
                {file.path}
              </code>
              <span className="text-[var(--forge-text-muted)] ml-2">
                {file.purpose}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface WorkspaceFooterProps {
  session?: HomeworkSession;
  onSubmit?: () => void;
  hintsRevealed: number;
  xpReward: number;
}

function WorkspaceFooter({
  session,
  onSubmit,
  hintsRevealed,
  xpReward,
}: WorkspaceFooterProps) {
  const timeSpent = session?.timeSpentMinutes || 0;

  return (
    <footer className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 backdrop-blur-sm">
      <div className="flex items-center gap-6 text-sm text-[var(--forge-text-muted)]">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {timeSpent} min
        </span>
        <span>Hints: {hintsRevealed}</span>
        <span className="text-[var(--ember)] font-medium">
          {xpReward} XP available
        </span>
      </div>

      <button
        onClick={onSubmit}
        disabled={!onSubmit}
        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ember)] text-white rounded-lg font-medium hover:bg-[var(--ember)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--ember)]/20"
      >
        <Send className="w-4 h-4" />
        Submit PR
      </button>
    </footer>
  );
}

export default HomeworkWorkspace;
