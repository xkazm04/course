"use client";

/**
 * StateIndicator - Compact state display component
 *
 * Shows the current state of a machine with icon and label.
 * Optionally shows progress toward next state.
 */

import { motion } from "framer-motion";
import type {
  StateId,
  MachineContext,
  EventId,
  MachineInstance,
  StateMetadata,
} from "../lib/types";

interface StateIndicatorProps<TState extends StateId> {
  /** Current state metadata */
  stateMeta: StateMetadata;
  /** Optional click handler */
  onClick?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show pulse animation */
  pulse?: boolean;
  /** Additional class names */
  className?: string;
}

export function StateIndicator<TState extends StateId>({
  stateMeta,
  onClick,
  size = "md",
  pulse = false,
  className = "",
}: StateIndicatorProps<TState>) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      onClick={onClick}
      className={`
        inline-flex items-center rounded-lg
        ${stateMeta.style.bg} ${stateMeta.style.border} border
        ${sizeClasses[size]}
        ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
        ${className}
      `}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      data-testid="state-indicator"
    >
      <span className={`${iconSizes[size]} relative`}>
        {stateMeta.icon}
        {pulse && (
          <span className="absolute inset-0 animate-ping opacity-75">
            {stateMeta.icon}
          </span>
        )}
      </span>
      <span className={stateMeta.style.text}>{stateMeta.label}</span>
    </Component>
  );
}

// ============================================================================
// StateProgress - Shows progress toward next state
// ============================================================================

interface StateProgressProps {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Current state label */
  currentState: string;
  /** Next state label */
  nextState?: string;
  /** Requirements to reach next state */
  requirements?: string[];
  /** Size variant */
  size?: "sm" | "md";
}

export function StateProgress({
  progress,
  currentState,
  nextState,
  requirements = [],
  size = "md",
}: StateProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`${size === "sm" ? "space-y-1" : "space-y-2"}`}
      data-testid="state-progress"
    >
      {/* Labels */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--forge-text-secondary)]">{currentState}</span>
        {nextState && (
          <>
            <span className="text-[var(--forge-text-muted)]">→</span>
            <span className="text-[var(--forge-text-primary)]">{nextState}</span>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--forge-bg-void)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Requirements */}
      {requirements.length > 0 && size === "md" && (
        <div className="space-y-1">
          {requirements.map((req, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-xs text-[var(--forge-text-secondary)]"
            >
              <div className="w-1 h-1 rounded-full bg-[var(--forge-text-muted)]" />
              {req}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// StateTransitionMessage - Shows transition feedback
// ============================================================================

interface StateTransitionMessageProps {
  /** Title of the transition */
  title: string;
  /** Message describing the transition */
  message: string;
  /** Encouragement or next steps */
  encouragement?: string;
  /** Whether to show celebration */
  celebration?: boolean;
  /** Auto-hide after ms (0 = don't auto-hide) */
  autoHideMs?: number;
  /** Callback when hidden */
  onHide?: () => void;
}

export function StateTransitionMessage({
  title,
  message,
  encouragement,
  celebration = false,
  autoHideMs = 5000,
  onHide,
}: StateTransitionMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      onAnimationComplete={() => {
        if (autoHideMs > 0 && onHide) {
          setTimeout(onHide, autoHideMs);
        }
      }}
      className={`
        p-4 rounded-xl border
        ${celebration
          ? "bg-gradient-to-br from-[var(--gold)]/20 to-[var(--ember)]/20 border-[var(--gold)]/30"
          : "bg-[var(--forge-bg-elevated)] border-[var(--forge-border)]"
        }
      `}
      data-testid="state-transition-message"
    >
      <div className="flex items-start gap-3">
        {celebration && (
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="text-2xl"
          >
            🎉
          </motion.div>
        )}
        <div className="flex-1">
          <div className={`font-semibold ${celebration ? "text-[var(--gold)]" : "text-[var(--forge-text-primary)]"}`}>
            {title}
          </div>
          <div className="text-sm text-[var(--forge-text-secondary)] mt-0.5">
            {message}
          </div>
          {encouragement && (
            <div className="text-xs text-[var(--forge-text-muted)] mt-2 italic">
              {encouragement}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// StateTimeline - Compact timeline visualization
// ============================================================================

interface StateTimelineProps<TState extends StateId> {
  /** Timeline events */
  events: {
    id: string;
    from: { label: string; icon: string };
    to: { label: string; icon: string };
    relativeTime: string;
  }[];
  /** Maximum events to show */
  maxEvents?: number;
  /** Size variant */
  size?: "sm" | "md";
}

export function StateTimeline<TState extends StateId>({
  events,
  maxEvents = 5,
  size = "md",
}: StateTimelineProps<TState>) {
  const displayEvents = events.slice(-maxEvents).reverse();

  if (displayEvents.length === 0) {
    return (
      <div className="text-sm text-[var(--forge-text-muted)] text-center py-4" data-testid="state-timeline-empty">
        No transitions yet
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="state-timeline">
      {displayEvents.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`
            flex items-center gap-2 p-2 rounded-lg bg-[var(--forge-bg-void)]
            ${size === "sm" ? "text-xs" : "text-sm"}
          `}
        >
          <span>{event.from.icon}</span>
          <span className="text-[var(--forge-text-muted)]">→</span>
          <span>{event.to.icon}</span>
          <span className="text-[var(--forge-text-primary)]">{event.to.label}</span>
          <span className="ml-auto text-[var(--forge-text-muted)]">
            {event.relativeTime}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
