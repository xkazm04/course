/**
 * Behavior Storage - User Learning Behavior Persistence
 *
 * Handles storage and retrieval of user learning behavior data
 * for the adaptive learning system. Uses localStorage with
 * graceful fallbacks.
 */

import type {
    LearnerProfile,
    LearningSession,
    SkillAssessment,
    CareerObjective,
} from "./types";

// Storage keys
const STORAGE_KEYS = {
    PROFILE: "adaptive-learning-profile",
    SESSIONS: "adaptive-learning-sessions",
    ACTIVE_SESSION: "adaptive-learning-active-session",
} as const;

// Maximum sessions to keep in history
const MAX_SESSIONS = 100;

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const test = "__storage_test__";
        window.localStorage.setItem(test, test);
        window.localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
}

/**
 * Safe JSON parse with fallback
 */
function safeParse<T>(json: string | null, fallback: T): T {
    if (!json) return fallback;
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
}

/**
 * Create a new default learner profile
 */
export function createDefaultProfile(userId?: string): LearnerProfile {
    return {
        userId: userId || `user_${Date.now()}`,
        availableHoursPerWeek: 10,
        preferredTimeOfDay: "evening",
        learningStyle: "mixed",
        skills: [],
        careerGoals: [],
        sessions: [],
        completedNodes: [],
        inProgressNodes: [],
        bookmarkedNodes: [],
        lastActiveAt: new Date(),
        totalLearningHours: 0,
        currentStreak: 0,
        difficultyPreference: "optimal",
    };
}

/**
 * Get the learner profile from storage
 */
export function getLearnerProfile(): LearnerProfile | null {
    if (!isStorageAvailable()) return null;

    const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!stored) return null;

    const profile = safeParse<LearnerProfile | null>(stored, null);
    if (!profile) return null;

    // Convert date strings back to Date objects
    return {
        ...profile,
        lastActiveAt: new Date(profile.lastActiveAt),
        skills: profile.skills.map(s => ({
            ...s,
            lastAssessed: new Date(s.lastAssessed),
        })),
        sessions: profile.sessions.map(s => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: s.endTime ? new Date(s.endTime) : null,
        })),
    };
}

/**
 * Save the learner profile to storage
 */
export function saveLearnerProfile(profile: LearnerProfile): void {
    if (!isStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

/**
 * Update partial learner profile
 */
export function updateLearnerProfile(updates: Partial<LearnerProfile>): LearnerProfile {
    const current = getLearnerProfile() || createDefaultProfile();
    const updated = {
        ...current,
        ...updates,
        lastActiveAt: new Date(),
    };
    saveLearnerProfile(updated);
    return updated;
}

/**
 * Start a new learning session
 */
export function startLearningSession(): LearningSession {
    const session: LearningSession = {
        id: `session_${Date.now()}`,
        startTime: new Date(),
        endTime: null,
        nodesViewed: [],
        timePerNode: {},
        exercisesCompleted: 0,
        quizScores: [],
    };

    if (isStorageAvailable()) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }

    return session;
}

/**
 * Get the active learning session
 */
export function getActiveSession(): LearningSession | null {
    if (!isStorageAvailable()) return null;

    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!stored) return null;

    const session = safeParse<LearningSession | null>(stored, null);
    if (!session) return null;

    return {
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : null,
    };
}

/**
 * Update the active session
 */
export function updateActiveSession(updates: Partial<LearningSession>): LearningSession | null {
    const current = getActiveSession();
    if (!current) return null;

    const updated = { ...current, ...updates };
    if (isStorageAvailable()) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(updated));
    }
    return updated;
}

/**
 * Record a node view in the active session
 */
export function recordNodeView(nodeId: string, durationSeconds: number): void {
    const session = getActiveSession();
    if (!session) return;

    const nodesViewed = session.nodesViewed.includes(nodeId)
        ? session.nodesViewed
        : [...session.nodesViewed, nodeId];

    const timePerNode = {
        ...session.timePerNode,
        [nodeId]: (session.timePerNode[nodeId] || 0) + durationSeconds,
    };

    updateActiveSession({ nodesViewed, timePerNode });
}

/**
 * Record a quiz score
 */
export function recordQuizScore(score: number): void {
    const session = getActiveSession();
    if (!session) return;
    updateActiveSession({ quizScores: [...session.quizScores, score] });
}

/**
 * Record exercise completion
 */
export function recordExerciseCompletion(): void {
    const session = getActiveSession();
    if (!session) return;
    updateActiveSession({ exercisesCompleted: session.exercisesCompleted + 1 });
}

/**
 * End the active learning session and save to history
 */
export function endLearningSession(): LearningSession | null {
    const session = getActiveSession();
    if (!session) return null;

    const completedSession: LearningSession = {
        ...session,
        endTime: new Date(),
    };

    // Add to profile session history
    const profile = getLearnerProfile() || createDefaultProfile();
    const sessions = [completedSession, ...profile.sessions].slice(0, MAX_SESSIONS);

    // Calculate total hours from this session
    const sessionHours = (completedSession.endTime!.getTime() - completedSession.startTime.getTime()) / (1000 * 60 * 60);

    // Update streak
    const lastActive = new Date(profile.lastActiveAt);
    const today = new Date();
    const daysSinceLastActive = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    const newStreak = daysSinceLastActive <= 1 ? profile.currentStreak + (daysSinceLastActive === 1 ? 1 : 0) : 1;

    saveLearnerProfile({
        ...profile,
        sessions,
        totalLearningHours: profile.totalLearningHours + sessionHours,
        currentStreak: newStreak,
        lastActiveAt: new Date(),
    });

    // Clear active session
    if (isStorageAvailable()) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }

    return completedSession;
}

/**
 * Mark a node as completed
 */
export function markNodeCompleted(nodeId: string): void {
    const profile = getLearnerProfile() || createDefaultProfile();
    if (profile.completedNodes.includes(nodeId)) return;

    saveLearnerProfile({
        ...profile,
        completedNodes: [...profile.completedNodes, nodeId],
        inProgressNodes: profile.inProgressNodes.filter(id => id !== nodeId),
    });
}

/**
 * Mark a node as in progress
 */
export function markNodeInProgress(nodeId: string): void {
    const profile = getLearnerProfile() || createDefaultProfile();
    if (profile.inProgressNodes.includes(nodeId) || profile.completedNodes.includes(nodeId)) return;

    saveLearnerProfile({
        ...profile,
        inProgressNodes: [...profile.inProgressNodes, nodeId],
    });
}

/**
 * Toggle a node bookmark
 */
export function toggleNodeBookmark(nodeId: string): boolean {
    const profile = getLearnerProfile() || createDefaultProfile();
    const isBookmarked = profile.bookmarkedNodes.includes(nodeId);

    saveLearnerProfile({
        ...profile,
        bookmarkedNodes: isBookmarked
            ? profile.bookmarkedNodes.filter(id => id !== nodeId)
            : [...profile.bookmarkedNodes, nodeId],
    });

    return !isBookmarked;
}

/**
 * Update skill assessment
 */
export function updateSkillAssessment(assessment: SkillAssessment): void {
    const profile = getLearnerProfile() || createDefaultProfile();
    const existingIndex = profile.skills.findIndex(s => s.skillId === assessment.skillId);

    const skills = existingIndex >= 0
        ? profile.skills.map((s, i) => i === existingIndex ? assessment : s)
        : [...profile.skills, assessment];

    saveLearnerProfile({ ...profile, skills });
}

/**
 * Add or update a career goal
 */
export function setCareerGoal(goal: CareerObjective): void {
    const profile = getLearnerProfile() || createDefaultProfile();
    const existingIndex = profile.careerGoals.findIndex(g => g.id === goal.id);

    const careerGoals = existingIndex >= 0
        ? profile.careerGoals.map((g, i) => i === existingIndex ? goal : g)
        : [...profile.careerGoals, goal];

    saveLearnerProfile({ ...profile, careerGoals });
}

/**
 * Remove a career goal
 */
export function removeCareerGoal(goalId: string): void {
    const profile = getLearnerProfile() || createDefaultProfile();
    saveLearnerProfile({
        ...profile,
        careerGoals: profile.careerGoals.filter(g => g.id !== goalId),
    });
}

/**
 * Update learner preferences
 */
export function updatePreferences(preferences: {
    availableHoursPerWeek?: number;
    preferredTimeOfDay?: LearnerProfile["preferredTimeOfDay"];
    learningStyle?: LearnerProfile["learningStyle"];
    difficultyPreference?: LearnerProfile["difficultyPreference"];
}): void {
    updateLearnerProfile(preferences);
}

/**
 * Clear all adaptive learning data
 */
export function clearAllAdaptiveLearningData(): void {
    if (!isStorageAvailable()) return;
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

/**
 * Export all learning data for backup
 */
export function exportLearningData(): string {
    const profile = getLearnerProfile();
    const activeSession = getActiveSession();

    return JSON.stringify({
        profile,
        activeSession,
        exportedAt: new Date().toISOString(),
    }, null, 2);
}

/**
 * Import learning data from backup
 */
export function importLearningData(jsonString: string): boolean {
    try {
        const data = JSON.parse(jsonString);
        if (data.profile) {
            saveLearnerProfile(data.profile);
        }
        if (data.activeSession && isStorageAvailable()) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(data.activeSession));
        }
        return true;
    } catch {
        return false;
    }
}
