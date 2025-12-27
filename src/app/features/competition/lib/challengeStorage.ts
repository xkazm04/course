// Challenge Storage - Local storage for competition data

import {
    createLocalStorage,
    createArrayStorage,
    generateId,
} from "@/app/shared/lib/storageFactory";
import {
    Challenge,
    Submission,
    Leaderboard,
    TierProgression,
    SkillTier,
    UserCompetitionStats,
} from "./types";

// User competition stats storage
interface CompetitionState {
    userId: string;
    displayName: string;
    tier: SkillTier;
    points: number;
    progression: TierProgression;
    activeChallengeIds: string[];
    lastUpdated: string;
}

const defaultProgression: TierProgression = {
    currentTier: "bronze",
    currentPoints: 0,
    pointsToNextTier: 1000,
    seasonalRank: 0,
    allTimeRank: 0,
    challengesCompleted: 0,
    winRate: 0,
};

const defaultState: CompetitionState = {
    userId: "current-user",
    displayName: "You",
    tier: "bronze",
    points: 0,
    progression: defaultProgression,
    activeChallengeIds: [],
    lastUpdated: new Date().toISOString(),
};

export const competitionStateStorage = createLocalStorage<CompetitionState>({
    storageKey: "competition-state",
    getDefault: () => defaultState,
});

// Submissions storage
export const submissionsStorage = createArrayStorage<Submission>({
    storageKey: "competition-submissions",
});

// Saved challenge drafts (code in progress)
interface ChallengeDraft {
    id: string;
    challengeId: string;
    code: string;
    lastSaved: string;
}

export const draftStorage = createArrayStorage<ChallengeDraft>({
    storageKey: "competition-drafts",
});

// Helper functions
export function getSubmissionsForChallenge(challengeId: string): Submission[] {
    return submissionsStorage.getAll().filter((s) => s.challengeId === challengeId);
}

export function getUserSubmission(challengeId: string): Submission | null {
    const state = competitionStateStorage.get();
    return (
        submissionsStorage
            .getAll()
            .find((s) => s.challengeId === challengeId && s.userId === state.userId) ||
        null
    );
}

export function saveDraft(challengeId: string, code: string): void {
    const existing = draftStorage.getAll().find((d) => d.challengeId === challengeId);

    if (existing) {
        draftStorage.updateEntity(existing.id, {
            code,
            lastSaved: new Date().toISOString(),
        });
    } else {
        draftStorage.add({
            challengeId,
            code,
            lastSaved: new Date().toISOString(),
        });
    }
}

export function getDraft(challengeId: string): string | null {
    const draft = draftStorage.getAll().find((d) => d.challengeId === challengeId);
    return draft?.code || null;
}

export function updateUserPoints(pointsToAdd: number): TierProgression {
    const state = competitionStateStorage.get();
    const newPoints = state.points + pointsToAdd;

    // Calculate new tier
    const tierThresholds = [
        { tier: "master" as SkillTier, min: 25000 },
        { tier: "diamond" as SkillTier, min: 10000 },
        { tier: "platinum" as SkillTier, min: 5000 },
        { tier: "gold" as SkillTier, min: 2500 },
        { tier: "silver" as SkillTier, min: 1000 },
        { tier: "bronze" as SkillTier, min: 0 },
    ];

    let newTier: SkillTier = "bronze";
    let pointsToNextTier = 1000;

    for (const threshold of tierThresholds) {
        if (newPoints >= threshold.min) {
            newTier = threshold.tier;
            const currentIndex = tierThresholds.findIndex((t) => t.tier === newTier);
            if (currentIndex > 0) {
                pointsToNextTier = tierThresholds[currentIndex - 1].min - newPoints;
            } else {
                pointsToNextTier = 0;
            }
            break;
        }
    }

    const newProgression: TierProgression = {
        ...state.progression,
        currentTier: newTier,
        currentPoints: newPoints,
        pointsToNextTier,
        challengesCompleted: state.progression.challengesCompleted + 1,
    };

    competitionStateStorage.save({
        ...state,
        tier: newTier,
        points: newPoints,
        progression: newProgression,
        lastUpdated: new Date().toISOString(),
    });

    return newProgression;
}

export function getUserStats(): UserCompetitionStats {
    const state = competitionStateStorage.get();
    const submissions = submissionsStorage
        .getAll()
        .filter((s) => s.userId === state.userId);

    return {
        userId: state.userId,
        displayName: state.displayName,
        tier: state.tier,
        progression: state.progression,
        submissions,
        activeChallenges: state.activeChallengeIds,
    };
}

export function joinChallenge(challengeId: string): void {
    competitionStateStorage.update((state) => ({
        ...state,
        activeChallengeIds: [...new Set([...state.activeChallengeIds, challengeId])],
        lastUpdated: new Date().toISOString(),
    }));
}

export function leaveChallenge(challengeId: string): void {
    competitionStateStorage.update((state) => ({
        ...state,
        activeChallengeIds: state.activeChallengeIds.filter((id) => id !== challengeId),
        lastUpdated: new Date().toISOString(),
    }));
}
