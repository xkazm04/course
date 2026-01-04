"use client";

/**
 * StateMachineDebugger - Visual debugging component for state machines
 *
 * Shows the current state, available transitions, history timeline,
 * and context in a collapsible debug panel.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMachineVisualization } from "../lib/useMachine";
import type {
  StateId,
  EventId,
  MachineContext,
  MachineDefinition,
  MachineInstance,
} from "../lib/types";

interface StateMachineDebuggerProps<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> {
  /** Machine definition */
  definition: MachineDefinition<TState, TContext, TEvent>;
  /** Machine instance */
  machine: MachineInstance<TState, TContext, TEvent>;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
  /** Position of the debugger */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Optional title */
  title?: string;
}

export function StateMachineDebugger<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>({
  definition,
  machine,
  defaultCollapsed = true,
  position = "bottom-right",
  title,
}: StateMachineDebuggerProps<TState, TContext, TEvent>) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeTab, setActiveTab] = useState<"state" | "history" | "context">("state");

  const { visualization, timeline, progress } = useMachineVisualization(definition, machine);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const displayTitle = title ?? definition.name;
  const currentMeta = machine.getStateMeta();

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50`}
      data-testid="state-machine-debugger"
    >
      <motion.div
        layout
        className="bg-[var(--forge-bg-elevated)] border border-[var(--forge-border)] rounded-xl shadow-xl overflow-hidden"
        style={{ maxWidth: isCollapsed ? "auto" : "400px" }}
      >
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--forge-bg-void)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
          data-testid="debugger-toggle-btn"
        >
          <div className="text-lg">{currentMeta.icon}</div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--forge-text-primary)]">
              {displayTitle}
            </div>
            <div className="text-xs text-[var(--forge-text-secondary)]">
              {currentMeta.label}
            </div>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${
              progress.isCompleted
                ? "bg-[var(--forge-success)]"
                : progress.isBlocked
                ? "bg-[var(--forge-error)]"
                : "bg-[var(--ember)]"
            }`}
          />
          <svg
            className={`w-4 h-4 text-[var(--forge-text-secondary)] transition-transform ${
              isCollapsed ? "" : "rotate-180"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tabs */}
              <div className="flex border-b border-[var(--forge-border)]">
                {(["state", "history", "context"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? "text-[var(--ember)] border-b-2 border-[var(--ember)]"
                        : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)]"
                    }`}
                    data-testid={`debugger-tab-${tab}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 max-h-80 overflow-y-auto">
                {activeTab === "state" && (
                  <StateView
                    visualization={visualization}
                    machine={machine}
                    progress={progress}
                  />
                )}
                {activeTab === "history" && (
                  <HistoryView timeline={timeline} />
                )}
                {activeTab === "context" && (
                  <ContextView context={machine.getContext()} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function StateView<TState extends StateId, TEvent extends EventId>({
  visualization,
  machine,
  progress,
}: {
  visualization: ReturnType<typeof useMachineVisualization>["visualization"];
  machine: MachineInstance<TState, MachineContext, EventId>;
  progress: ReturnType<typeof useMachineVisualization>["progress"];
}) {
  const currentNode = visualization.nodes.find((n) => n.isCurrent);
  const availableTransitions = machine.getAvailableTransitions();

  return (
    <div className="space-y-4">
      {/* Current State */}
      <div>
        <div className="text-xs font-medium text-[var(--forge-text-secondary)] mb-2">
          Current State
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--forge-bg-void)]">
          <div className="text-2xl">{currentNode?.icon}</div>
          <div>
            <div className="font-medium text-[var(--forge-text-primary)]">
              {currentNode?.label}
            </div>
            <div className="text-xs text-[var(--forge-text-secondary)]">
              {currentNode?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-[var(--forge-bg-void)]">
          <div className="text-lg font-bold text-[var(--ember)]">
            {progress.totalTransitions}
          </div>
          <div className="text-xs text-[var(--forge-text-secondary)]">Transitions</div>
        </div>
        <div className="p-2 rounded-lg bg-[var(--forge-bg-void)]">
          <div className="text-lg font-bold text-[var(--forge-info)]">
            {Math.round(progress.statesVisitedPercent)}%
          </div>
          <div className="text-xs text-[var(--forge-text-secondary)]">Coverage</div>
        </div>
        <div className="p-2 rounded-lg bg-[var(--forge-bg-void)]">
          <div className="text-lg font-bold text-[var(--gold)]">
            {formatDuration(progress.timeInCurrentState)}
          </div>
          <div className="text-xs text-[var(--forge-text-secondary)]">In State</div>
        </div>
      </div>

      {/* Available Transitions */}
      {availableTransitions.length > 0 && (
        <div>
          <div className="text-xs font-medium text-[var(--forge-text-secondary)] mb-2">
            Available Transitions
          </div>
          <div className="space-y-1">
            {availableTransitions.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--forge-bg-void)] text-sm"
              >
                <span className="text-[var(--forge-text-secondary)]">{t.event}</span>
                <svg
                  className="w-3 h-3 text-[var(--forge-text-muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[var(--forge-text-primary)]">{t.target}</span>
                {t.description && (
                  <span className="text-xs text-[var(--forge-text-muted)] ml-auto">
                    {t.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All States */}
      <div>
        <div className="text-xs font-medium text-[var(--forge-text-secondary)] mb-2">
          All States
        </div>
        <div className="flex flex-wrap gap-1">
          {visualization.nodes.map((node) => (
            <div
              key={node.id}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                node.isCurrent
                  ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                  : node.visitCount > 0
                  ? "bg-[var(--forge-success)]/10 text-[var(--forge-success)]"
                  : "bg-[var(--forge-bg-void)] text-[var(--forge-text-secondary)]"
              }`}
            >
              <span>{node.icon}</span>
              <span>{node.label}</span>
              {node.visitCount > 0 && (
                <span className="opacity-60">({node.visitCount})</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryView({
  timeline,
}: {
  timeline: ReturnType<typeof useMachineVisualization>["timeline"];
}) {
  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--forge-text-secondary)]">
        No transitions yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...timeline].reverse().map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-2 p-2 rounded-lg bg-[var(--forge-bg-void)] text-sm"
        >
          <div className="flex items-center gap-1">
            <span>{event.from.icon}</span>
            <span className="text-[var(--forge-text-secondary)]">{event.from.label}</span>
          </div>
          <svg
            className="w-3 h-3 text-[var(--ember)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex items-center gap-1">
            <span>{event.to.icon}</span>
            <span className="text-[var(--forge-text-primary)]">{event.to.label}</span>
          </div>
          <span className="ml-auto text-xs text-[var(--forge-text-muted)]">
            {event.relativeTime}
          </span>
        </div>
      ))}
    </div>
  );
}

function ContextView({ context }: { context: MachineContext }) {
  const formattedContext = useMemo(() => {
    try {
      return JSON.stringify(context, null, 2);
    } catch {
      return "Unable to serialize context";
    }
  }, [context]);

  return (
    <pre className="text-xs font-mono bg-[var(--forge-bg-void)] p-3 rounded-lg overflow-x-auto text-[var(--forge-text-secondary)]">
      {formattedContext}
    </pre>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
