"use client";

import { createTimestampedStorage, generateId } from "@/app/shared/lib/storageFactory";
import {
    ContributionStorage,
    ActiveContribution,
    CompletedContribution,
    ContributionStatus,
    ContributionEvent,
    ContributionPreferences,
    CONTRIBUTION_STORAGE_KEY,
    CONTRIBUTION_VERSION,
} from "./types";

function getDefaultStorage(): ContributionStorage {
    return {
        version: CONTRIBUTION_VERSION,
        lastUpdated: new Date().toISOString(),
        activeContributions: [],
        completedContributions: [],
        preferences: {
            showCompletedInDashboard: true,
            autoTrackPRStatus: true,
            reminderFrequencyDays: 3,
        },
    };
}

const contributionStorage = createTimestampedStorage<ContributionStorage>({
    storageKey: CONTRIBUTION_STORAGE_KEY,
    getDefault: getDefaultStorage,
    version: CONTRIBUTION_VERSION,
    migrate: (oldData: unknown) => {
        const data = oldData as Partial<ContributionStorage>;
        return {
            ...getDefaultStorage(),
            activeContributions: data?.activeContributions || [],
            completedContributions: data?.completedContributions || [],
        };
    },
});

export function getContributionStorage(): ContributionStorage {
    return contributionStorage.get();
}

export function saveContributionStorage(data: ContributionStorage): void {
    contributionStorage.save(data);
}

// Active contributions
export function getActiveContributions(): ActiveContribution[] {
    return getContributionStorage().activeContributions;
}

export function getActiveContribution(id: string): ActiveContribution | undefined {
    return getActiveContributions().find(c => c.id === id);
}

export function addActiveContribution(
    contribution: Omit<ActiveContribution, "id" | "timeline" | "claimedAt" | "lastUpdatedAt">
): ActiveContribution {
    const storage = getContributionStorage();
    const now = new Date().toISOString();

    const newContribution: ActiveContribution = {
        ...contribution,
        id: generateId(),
        claimedAt: now,
        lastUpdatedAt: now,
        timeline: [
            {
                id: generateId(),
                type: "claimed",
                timestamp: now,
                description: "Claimed this issue",
            },
        ],
    };

    storage.activeContributions = [newContribution, ...storage.activeContributions];
    saveContributionStorage(storage);

    return newContribution;
}

export function updateContributionStatus(
    id: string,
    status: ContributionStatus,
    metadata?: Record<string, unknown>
): ActiveContribution | null {
    const storage = getContributionStorage();
    const index = storage.activeContributions.findIndex(c => c.id === id);

    if (index === -1) return null;

    const now = new Date().toISOString();
    const contribution = storage.activeContributions[index];

    // Create event based on status change
    const eventType = getEventTypeForStatus(status);
    const event: ContributionEvent = {
        id: generateId(),
        type: eventType,
        timestamp: now,
        description: getEventDescription(status, metadata),
        metadata,
    };

    contribution.status = status;
    contribution.lastUpdatedAt = now;
    contribution.timeline = [...contribution.timeline, event];

    if (metadata?.prUrl) contribution.prUrl = metadata.prUrl as string;
    if (metadata?.prNumber) contribution.prNumber = metadata.prNumber as number;

    storage.activeContributions[index] = contribution;
    saveContributionStorage(storage);

    return contribution;
}

export function addContributionNote(id: string, note: string): ActiveContribution | null {
    const storage = getContributionStorage();
    const index = storage.activeContributions.findIndex(c => c.id === id);

    if (index === -1) return null;

    const now = new Date().toISOString();
    const contribution = storage.activeContributions[index];

    contribution.notes = note;
    contribution.lastUpdatedAt = now;
    contribution.timeline = [
        ...contribution.timeline,
        {
            id: generateId(),
            type: "note_added",
            timestamp: now,
            description: "Updated notes",
        },
    ];

    storage.activeContributions[index] = contribution;
    saveContributionStorage(storage);

    return contribution;
}

export function completeContribution(
    id: string,
    outcome: "merged" | "closed" | "abandoned",
    skillsGained: string[] = [],
    reflection?: string
): CompletedContribution | null {
    const storage = getContributionStorage();
    const index = storage.activeContributions.findIndex(c => c.id === id);

    if (index === -1) return null;

    const active = storage.activeContributions[index];
    const now = new Date().toISOString();

    const claimedDate = new Date(active.claimedAt);
    const completedDate = new Date(now);
    const totalTimeSpentHours = Math.round(
        (completedDate.getTime() - claimedDate.getTime()) / (1000 * 60 * 60)
    );

    const completed: CompletedContribution = {
        id: active.id,
        issueId: active.issueId,
        issueTitle: active.issueTitle,
        issueUrl: active.issueUrl,
        repositoryName: active.repositoryName,
        repositoryOwner: active.repositoryOwner,
        prUrl: active.prUrl,
        prNumber: active.prNumber,
        outcome,
        claimedAt: active.claimedAt,
        completedAt: now,
        totalTimeSpentHours,
        skillsGained,
        feedbackReceived: [],
        reflection,
    };

    // Remove from active and add to completed
    storage.activeContributions.splice(index, 1);
    storage.completedContributions = [completed, ...storage.completedContributions];
    saveContributionStorage(storage);

    return completed;
}

export function removeActiveContribution(id: string): boolean {
    const storage = getContributionStorage();
    const index = storage.activeContributions.findIndex(c => c.id === id);

    if (index === -1) return false;

    storage.activeContributions.splice(index, 1);
    saveContributionStorage(storage);

    return true;
}

// Completed contributions
export function getCompletedContributions(): CompletedContribution[] {
    return getContributionStorage().completedContributions;
}

// Preferences
export function getPreferences(): ContributionPreferences {
    return getContributionStorage().preferences;
}

export function updatePreferences(updates: Partial<ContributionPreferences>): void {
    const storage = getContributionStorage();
    storage.preferences = { ...storage.preferences, ...updates };
    saveContributionStorage(storage);
}

// Helper functions
function getEventTypeForStatus(status: ContributionStatus): ContributionEvent["type"] {
    switch (status) {
        case "in_progress": return "started_work";
        case "pr_submitted": return "opened_pr";
        case "changes_requested": return "received_review";
        case "approved": return "approved";
        case "merged": return "merged";
        case "closed": return "closed";
        default: return "note_added";
    }
}

function getEventDescription(status: ContributionStatus, metadata?: Record<string, unknown>): string {
    switch (status) {
        case "in_progress": return "Started working on this issue";
        case "pr_submitted": return metadata?.prNumber ? `Opened PR #${metadata.prNumber}` : "Opened pull request";
        case "changes_requested": return "Received review with requested changes";
        case "approved": return "PR approved by maintainer";
        case "merged": return "PR merged successfully!";
        case "closed": return "PR closed";
        default: return "Updated contribution";
    }
}

export function clearAllContributions(): void {
    saveContributionStorage(getDefaultStorage());
}
