// Contribution tracking types

export type ContributionStatus =
    | "claimed"
    | "in_progress"
    | "pr_submitted"
    | "changes_requested"
    | "approved"
    | "merged"
    | "closed";

export interface ActiveContribution {
    id: string;
    issueId: string;
    issueTitle: string;
    issueUrl: string;
    repositoryId: string;
    repositoryName: string;
    repositoryOwner: string;
    status: ContributionStatus;
    claimedAt: string;
    lastUpdatedAt: string;
    prUrl?: string;
    prNumber?: number;
    branchName?: string;
    timeline: ContributionEvent[];
    notes: string;
    estimatedHoursRemaining?: number;
}

export interface CompletedContribution {
    id: string;
    issueId: string;
    issueTitle: string;
    issueUrl: string;
    repositoryName: string;
    repositoryOwner: string;
    prUrl?: string;
    prNumber?: number;
    outcome: "merged" | "closed" | "abandoned";
    claimedAt: string;
    completedAt: string;
    totalTimeSpentHours: number;
    skillsGained: string[];
    feedbackReceived: ReviewFeedback[];
    reflection?: string;
}

export interface ContributionEvent {
    id: string;
    type: ContributionEventType;
    timestamp: string;
    description: string;
    metadata?: Record<string, unknown>;
}

export type ContributionEventType =
    | "claimed"
    | "started_work"
    | "pushed_commit"
    | "opened_pr"
    | "received_review"
    | "made_changes"
    | "approved"
    | "merged"
    | "closed"
    | "abandoned"
    | "note_added";

export interface ReviewFeedback {
    id: string;
    author: string;
    type: "comment" | "approval" | "changes_requested";
    body: string;
    timestamp: string;
    resolved: boolean;
}

export interface ContributionStats {
    totalContributions: number;
    mergedCount: number;
    pendingCount: number;
    closedCount: number;
    avgTimeToMergeHours: number;
    topRepositories: { name: string; count: number }[];
    skillsGained: { skill: string; count: number }[];
}

// Storage types
export interface ContributionStorage {
    version: string;
    lastUpdated: string;
    activeContributions: ActiveContribution[];
    completedContributions: CompletedContribution[];
    preferences: ContributionPreferences;
}

export interface ContributionPreferences {
    showCompletedInDashboard: boolean;
    autoTrackPRStatus: boolean;
    reminderFrequencyDays: number;
}

// Status configuration for UI
export const STATUS_CONFIG: Record<ContributionStatus, {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    description: string;
}> = {
    claimed: {
        label: "Claimed",
        color: "text-[var(--forge-text-muted)]",
        bgColor: "bg-[var(--forge-bg-elevated)]",
        icon: "Flag",
        description: "Issue claimed, not yet started",
    },
    in_progress: {
        label: "In Progress",
        color: "text-[var(--forge-info)]",
        bgColor: "bg-[var(--forge-info)]/20",
        icon: "Code",
        description: "Actively working on the solution",
    },
    pr_submitted: {
        label: "PR Submitted",
        color: "text-[var(--ember-glow)]",
        bgColor: "bg-[var(--ember-glow)]/20",
        icon: "GitPullRequest",
        description: "Pull request opened for review",
    },
    changes_requested: {
        label: "Changes Requested",
        color: "text-[var(--forge-warning)]",
        bgColor: "bg-[var(--forge-warning)]/20",
        icon: "MessageSquare",
        description: "Maintainer requested changes",
    },
    approved: {
        label: "Approved",
        color: "text-[var(--forge-success)]",
        bgColor: "bg-[var(--forge-success)]/20",
        icon: "CheckCircle",
        description: "PR approved, awaiting merge",
    },
    merged: {
        label: "Merged",
        color: "text-[var(--forge-success)]",
        bgColor: "bg-[var(--forge-success)]/20",
        icon: "GitMerge",
        description: "Successfully merged!",
    },
    closed: {
        label: "Closed",
        color: "text-[var(--forge-error)]",
        bgColor: "bg-[var(--forge-error)]/20",
        icon: "XCircle",
        description: "PR closed without merge",
    },
};

// Mock data for demo
export const MOCK_CONTRIBUTIONS: ActiveContribution[] = [
    {
        id: "contrib-1",
        issueId: "issue-1",
        issueTitle: "Add compound components pattern example",
        issueUrl: "https://github.com/kentcdodds/react-patterns/issues/1234",
        repositoryId: "repo-1",
        repositoryName: "react-patterns",
        repositoryOwner: "kentcdodds",
        status: "in_progress",
        claimedAt: "2024-12-20T10:00:00Z",
        lastUpdatedAt: "2024-12-24T14:30:00Z",
        branchName: "feature/compound-components",
        notes: "Started with Menu component implementation",
        estimatedHoursRemaining: 3,
        timeline: [
            { id: "e1", type: "claimed", timestamp: "2024-12-20T10:00:00Z", description: "Claimed this issue" },
            { id: "e2", type: "started_work", timestamp: "2024-12-21T09:00:00Z", description: "Started implementation" },
            { id: "e3", type: "pushed_commit", timestamp: "2024-12-24T14:30:00Z", description: "Added Menu component structure" },
        ],
    },
    {
        id: "contrib-2",
        issueId: "issue-2",
        issueTitle: "Fix keyboard shortcut conflict with browser",
        issueUrl: "https://github.com/excalidraw/excalidraw/issues/5678",
        repositoryId: "repo-6",
        repositoryName: "excalidraw",
        repositoryOwner: "excalidraw",
        status: "pr_submitted",
        claimedAt: "2024-12-22T11:00:00Z",
        lastUpdatedAt: "2024-12-24T16:00:00Z",
        branchName: "fix/keyboard-shortcut",
        prUrl: "https://github.com/excalidraw/excalidraw/pull/9999",
        prNumber: 9999,
        notes: "Simple fix, waiting for review",
        timeline: [
            { id: "e1", type: "claimed", timestamp: "2024-12-22T11:00:00Z", description: "Claimed this issue" },
            { id: "e2", type: "started_work", timestamp: "2024-12-22T11:30:00Z", description: "Started investigation" },
            { id: "e3", type: "opened_pr", timestamp: "2024-12-24T16:00:00Z", description: "Opened PR #9999" },
        ],
    },
];

export const CONTRIBUTION_STORAGE_KEY = "oss-contributions";
export const CONTRIBUTION_VERSION = "1.0.0";
