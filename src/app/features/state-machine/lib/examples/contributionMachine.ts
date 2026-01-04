/**
 * Contribution Status State Machine - Example Definition
 *
 * Demonstrates how to convert the existing ContributionStatus machine
 * to use the declarative state machine engine.
 *
 * States: claimed → in_progress → pr_submitted → changes_requested → approved → merged (or closed)
 */

import { defineMachine } from "../createMachine";
import type { EffectFn } from "../types";

// ============================================================================
// Types
// ============================================================================

export type ContributionState =
  | "claimed"
  | "in_progress"
  | "pr_submitted"
  | "changes_requested"
  | "approved"
  | "merged"
  | "closed";

export type ContributionEvent =
  | "START_WORK"
  | "SUBMIT_PR"
  | "RECEIVE_REVIEW"
  | "REQUEST_CHANGES"
  | "APPROVE"
  | "MERGE"
  | "CLOSE"
  | "ABANDON";

export interface ContributionContext {
  [key: string]: unknown;
  issueId: string;
  issueTitle: string;
  repositoryName: string;
  prUrl?: string;
  prNumber?: number;
  branchName?: string;
  claimedAt: number;
  lastUpdatedAt: number;
  notes: string;
  estimatedHoursRemaining?: number;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: string;
  timestamp: number;
  description: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Status Configuration
// ============================================================================

export const STATUS_CONFIG: Record<
  ContributionState,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    description: string;
  }
> = {
  claimed: {
    label: "Claimed",
    color: "text-[var(--forge-text-muted)]",
    bgColor: "bg-[var(--forge-bg-elevated)]",
    icon: "🚩",
    description: "Issue claimed, not yet started",
  },
  in_progress: {
    label: "In Progress",
    color: "text-[var(--forge-info)]",
    bgColor: "bg-[var(--forge-info)]/20",
    icon: "💻",
    description: "Actively working on the solution",
  },
  pr_submitted: {
    label: "PR Submitted",
    color: "text-[var(--ember-glow)]",
    bgColor: "bg-[var(--ember-glow)]/20",
    icon: "📤",
    description: "Pull request opened for review",
  },
  changes_requested: {
    label: "Changes Requested",
    color: "text-[var(--forge-warning)]",
    bgColor: "bg-[var(--forge-warning)]/20",
    icon: "📝",
    description: "Maintainer requested changes",
  },
  approved: {
    label: "Approved",
    color: "text-[var(--forge-success)]",
    bgColor: "bg-[var(--forge-success)]/20",
    icon: "✅",
    description: "PR approved, awaiting merge",
  },
  merged: {
    label: "Merged",
    color: "text-[var(--forge-success)]",
    bgColor: "bg-[var(--forge-success)]/20",
    icon: "🎉",
    description: "Successfully merged!",
  },
  closed: {
    label: "Closed",
    color: "text-[var(--forge-error)]",
    bgColor: "bg-[var(--forge-error)]/20",
    icon: "❌",
    description: "PR closed without merge",
  },
};

// ============================================================================
// Timeline Event Generators
// ============================================================================

function generateTimelineId(): string {
  return `tl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createTimelineEvent(
  type: string,
  description: string,
  metadata?: Record<string, unknown>
): TimelineEvent {
  return {
    id: generateTimelineId(),
    type,
    timestamp: Date.now(),
    description,
    metadata,
  };
}

// ============================================================================
// Actions
// ============================================================================

function addTimelineEntry(
  type: string,
  description: string
): (ctx: ContributionContext) => ContributionContext {
  return (ctx) => ({
    ...ctx,
    lastUpdatedAt: Date.now(),
    timeline: [...ctx.timeline, createTimelineEvent(type, description)],
  });
}

function setPrInfo(prUrl: string, prNumber: number): (ctx: ContributionContext) => ContributionContext {
  return (ctx) => ({
    ...ctx,
    prUrl,
    prNumber,
    lastUpdatedAt: Date.now(),
  });
}

// ============================================================================
// Machine Definition
// ============================================================================

export const contributionMachine = defineMachine<
  ContributionState,
  ContributionContext,
  ContributionEvent
>({
  id: "contribution",
  name: "Contribution Tracker",
  description: "Tracks the status of an open source contribution through its lifecycle",
  version: "1.0.0",
  initialState: "claimed",

  createInitialContext: () => ({
    issueId: "",
    issueTitle: "",
    repositoryName: "",
    claimedAt: Date.now(),
    lastUpdatedAt: Date.now(),
    notes: "",
    timeline: [createTimelineEvent("claimed", "Claimed this issue")],
  }),

  states: {
    claimed: {
      id: "claimed",
      meta: {
        label: STATUS_CONFIG.claimed.label,
        description: STATUS_CONFIG.claimed.description,
        icon: STATUS_CONFIG.claimed.icon,
        style: {
          text: STATUS_CONFIG.claimed.color,
          bg: STATUS_CONFIG.claimed.bgColor,
          border: "border-[var(--forge-border)]",
        },
      },
      on: {
        START_WORK: {
          target: "in_progress",
          description: "Start working on the issue",
          actions: [addTimelineEntry("started_work", "Started working on this issue")],
        },
        ABANDON: {
          target: "closed",
          description: "Abandon the contribution",
          actions: [addTimelineEntry("abandoned", "Abandoned this contribution")],
        },
      },
    },

    in_progress: {
      id: "in_progress",
      meta: {
        label: STATUS_CONFIG.in_progress.label,
        description: STATUS_CONFIG.in_progress.description,
        icon: STATUS_CONFIG.in_progress.icon,
        style: {
          text: STATUS_CONFIG.in_progress.color,
          bg: STATUS_CONFIG.in_progress.bgColor,
          border: "border-[var(--forge-info)]/30",
        },
      },
      on: {
        SUBMIT_PR: {
          target: "pr_submitted",
          description: "Submit a pull request",
          actions: [
            (ctx, _event, payload) => {
              const { prUrl, prNumber } = payload as { prUrl: string; prNumber: number };
              return {
                ...ctx,
                prUrl,
                prNumber,
                lastUpdatedAt: Date.now(),
                timeline: [
                  ...ctx.timeline,
                  createTimelineEvent("opened_pr", `Opened PR #${prNumber}`, { prUrl, prNumber }),
                ],
              };
            },
          ],
        },
        ABANDON: {
          target: "closed",
          description: "Abandon the contribution",
          actions: [addTimelineEntry("abandoned", "Abandoned this contribution")],
        },
      },
    },

    pr_submitted: {
      id: "pr_submitted",
      meta: {
        label: STATUS_CONFIG.pr_submitted.label,
        description: STATUS_CONFIG.pr_submitted.description,
        icon: STATUS_CONFIG.pr_submitted.icon,
        style: {
          text: STATUS_CONFIG.pr_submitted.color,
          bg: STATUS_CONFIG.pr_submitted.bgColor,
          border: "border-[var(--ember-glow)]/30",
        },
      },
      on: {
        REQUEST_CHANGES: {
          target: "changes_requested",
          description: "Maintainer requests changes",
          actions: [addTimelineEntry("received_review", "Received review with requested changes")],
        },
        APPROVE: {
          target: "approved",
          description: "PR is approved",
          actions: [addTimelineEntry("approved", "PR approved by maintainer")],
        },
        CLOSE: {
          target: "closed",
          description: "PR is closed without merge",
          actions: [addTimelineEntry("closed", "PR closed")],
        },
      },
    },

    changes_requested: {
      id: "changes_requested",
      meta: {
        label: STATUS_CONFIG.changes_requested.label,
        description: STATUS_CONFIG.changes_requested.description,
        icon: STATUS_CONFIG.changes_requested.icon,
        style: {
          text: STATUS_CONFIG.changes_requested.color,
          bg: STATUS_CONFIG.changes_requested.bgColor,
          border: "border-[var(--forge-warning)]/30",
        },
      },
      on: {
        SUBMIT_PR: {
          target: "pr_submitted",
          description: "Submit updated PR",
          actions: [addTimelineEntry("made_changes", "Pushed changes to address feedback")],
        },
        APPROVE: {
          target: "approved",
          description: "Changes approved",
          actions: [addTimelineEntry("approved", "Changes approved by maintainer")],
        },
        CLOSE: {
          target: "closed",
          description: "PR is closed",
          actions: [addTimelineEntry("closed", "PR closed")],
        },
      },
    },

    approved: {
      id: "approved",
      meta: {
        label: STATUS_CONFIG.approved.label,
        description: STATUS_CONFIG.approved.description,
        icon: STATUS_CONFIG.approved.icon,
        style: {
          text: STATUS_CONFIG.approved.color,
          bg: STATUS_CONFIG.approved.bgColor,
          border: "border-[var(--forge-success)]/30",
        },
      },
      on: {
        MERGE: {
          target: "merged",
          description: "PR is merged",
          actions: [addTimelineEntry("merged", "PR merged successfully!")],
        },
        REQUEST_CHANGES: {
          target: "changes_requested",
          description: "Additional changes requested",
          actions: [addTimelineEntry("received_review", "Additional changes requested")],
        },
        CLOSE: {
          target: "closed",
          description: "PR is closed without merge",
          actions: [addTimelineEntry("closed", "PR closed")],
        },
      },
    },

    merged: {
      id: "merged",
      meta: {
        label: STATUS_CONFIG.merged.label,
        description: STATUS_CONFIG.merged.description,
        icon: STATUS_CONFIG.merged.icon,
        style: {
          text: STATUS_CONFIG.merged.color,
          bg: STATUS_CONFIG.merged.bgColor,
          border: "border-[var(--forge-success)]/30",
        },
      },
      isFinal: true,
      // No outgoing transitions - final state
    },

    closed: {
      id: "closed",
      meta: {
        label: STATUS_CONFIG.closed.label,
        description: STATUS_CONFIG.closed.description,
        icon: STATUS_CONFIG.closed.icon,
        style: {
          text: STATUS_CONFIG.closed.color,
          bg: STATUS_CONFIG.closed.bgColor,
          border: "border-[var(--forge-error)]/30",
        },
      },
      isFinal: true,
      // No outgoing transitions - final state
    },
  },
});

// ============================================================================
// Helper: Calculate time spent
// ============================================================================

export function calculateTimeSpent(context: ContributionContext): {
  hours: number;
  formatted: string;
} {
  const now = Date.now();
  const hours = Math.round((now - context.claimedAt) / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  let formatted: string;
  if (days > 0) {
    formatted = `${days}d ${remainingHours}h`;
  } else {
    formatted = `${hours}h`;
  }

  return { hours, formatted };
}

// ============================================================================
// Helper: Get progress through workflow
// ============================================================================

export function getWorkflowProgress(currentState: ContributionState): {
  step: number;
  totalSteps: number;
  percentage: number;
} {
  const stateOrder: ContributionState[] = [
    "claimed",
    "in_progress",
    "pr_submitted",
    "changes_requested",
    "approved",
    "merged",
  ];

  // Handle closed state specially
  if (currentState === "closed") {
    return { step: 0, totalSteps: 6, percentage: 0 };
  }

  const step = stateOrder.indexOf(currentState);
  return {
    step: step + 1,
    totalSteps: stateOrder.length,
    percentage: ((step + 1) / stateOrder.length) * 100,
  };
}
