/**
 * Learning DNA Storage
 *
 * Client-side persistence for Learning DNA profile and platform connections.
 * Uses localStorage with automatic serialization.
 */

import type {
    LearningDNAProfile,
    PlatformConnection,
    ExternalPlatform,
    PlatformSyncStatus,
    LEARNING_DNA_STORAGE_KEY,
    PLATFORM_CONNECTIONS_KEY,
} from './types';
import { createInitialPlatformConnection, getAllPlatformConfigs } from './platformConfig';

// Storage keys
const DNA_STORAGE_KEY = 'openforge_learning_dna';
const CONNECTIONS_STORAGE_KEY = 'openforge_platform_connections';
const SYNC_STATUS_KEY = 'openforge_platform_sync_status';

// ============================================================================
// LEARNING DNA PROFILE STORAGE
// ============================================================================

/**
 * Save Learning DNA profile to localStorage
 */
export function saveLearningDNAProfile(profile: LearningDNAProfile): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
        console.error('[LearningDNA] Failed to save profile:', error);
    }
}

/**
 * Load Learning DNA profile from localStorage
 */
export function loadLearningDNAProfile(): LearningDNAProfile | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(DNA_STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored) as LearningDNAProfile;
    } catch (error) {
        console.error('[LearningDNA] Failed to load profile:', error);
        return null;
    }
}

/**
 * Clear Learning DNA profile from localStorage
 */
export function clearLearningDNAProfile(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DNA_STORAGE_KEY);
}

// ============================================================================
// PLATFORM CONNECTIONS STORAGE
// ============================================================================

/**
 * Get initial platform connections (all disconnected)
 */
export function getInitialPlatformConnections(): PlatformConnection[] {
    return getAllPlatformConfigs().map(config =>
        createInitialPlatformConnection(config.id)
    );
}

/**
 * Save platform connections to localStorage
 */
export function savePlatformConnections(connections: PlatformConnection[]): void {
    if (typeof window === 'undefined') return;

    try {
        // Don't store tokens in localStorage for security
        const sanitized = connections.map(conn => ({
            ...conn,
            accessToken: undefined,
            refreshToken: undefined,
        }));
        localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch (error) {
        console.error('[LearningDNA] Failed to save connections:', error);
    }
}

/**
 * Load platform connections from localStorage
 */
export function loadPlatformConnections(): PlatformConnection[] {
    if (typeof window === 'undefined') return getInitialPlatformConnections();

    try {
        const stored = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
        if (!stored) return getInitialPlatformConnections();

        const loaded = JSON.parse(stored) as PlatformConnection[];

        // Merge with initial connections to handle new platforms
        const initial = getInitialPlatformConnections();
        const merged = initial.map(init => {
            const existing = loaded.find(l => l.platform === init.platform);
            return existing ? { ...init, ...existing } : init;
        });

        return merged;
    } catch (error) {
        console.error('[LearningDNA] Failed to load connections:', error);
        return getInitialPlatformConnections();
    }
}

/**
 * Update a single platform connection
 */
export function updatePlatformConnection(
    platform: ExternalPlatform,
    updates: Partial<PlatformConnection>
): PlatformConnection[] {
    const connections = loadPlatformConnections();
    const updated = connections.map(conn =>
        conn.platform === platform ? { ...conn, ...updates } : conn
    );
    savePlatformConnections(updated);
    return updated;
}

/**
 * Disconnect a platform
 */
export function disconnectPlatform(platform: ExternalPlatform): PlatformConnection[] {
    return updatePlatformConnection(platform, {
        status: 'disconnected',
        username: undefined,
        accessToken: undefined,
        refreshToken: undefined,
        lastSyncedAt: undefined,
        errorMessage: undefined,
    });
}

// ============================================================================
// SYNC STATUS STORAGE
// ============================================================================

/**
 * Get initial sync status for all platforms
 */
export function getInitialSyncStatus(): Record<ExternalPlatform, PlatformSyncStatus> {
    const configs = getAllPlatformConfigs();
    return configs.reduce((acc, config) => {
        acc[config.id] = {
            platform: config.id,
            status: 'idle',
            signalsCount: 0,
        };
        return acc;
    }, {} as Record<ExternalPlatform, PlatformSyncStatus>);
}

/**
 * Save sync status to localStorage
 */
export function saveSyncStatus(status: Record<ExternalPlatform, PlatformSyncStatus>): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
        console.error('[LearningDNA] Failed to save sync status:', error);
    }
}

/**
 * Load sync status from localStorage
 */
export function loadSyncStatus(): Record<ExternalPlatform, PlatformSyncStatus> {
    if (typeof window === 'undefined') return getInitialSyncStatus();

    try {
        const stored = localStorage.getItem(SYNC_STATUS_KEY);
        if (!stored) return getInitialSyncStatus();
        return JSON.parse(stored);
    } catch (error) {
        console.error('[LearningDNA] Failed to load sync status:', error);
        return getInitialSyncStatus();
    }
}

/**
 * Update sync status for a platform
 */
export function updateSyncStatus(
    platform: ExternalPlatform,
    updates: Partial<PlatformSyncStatus>
): void {
    const status = loadSyncStatus();
    status[platform] = { ...status[platform], ...updates };
    saveSyncStatus(status);
}

// ============================================================================
// MOCK DATA FOR DEMO
// ============================================================================

/**
 * Generate mock Learning DNA profile for demonstration
 */
export function generateMockLearningDNAProfile(userId: string): LearningDNAProfile {
    const now = new Date().toISOString();

    return {
        userId,
        overallScore: 72,
        dimensions: {
            contribution: 78,
            problemSolving: 65,
            learning: 80,
            community: 58,
            breadth: 75,
            depth: 70,
        },
        connectedPlatforms: [
            {
                platform: 'github',
                displayName: 'GitHub',
                status: 'connected',
                username: 'developer123',
                supportsOAuth: true,
                icon: 'Github',
                color: '#181717',
                lastSyncedAt: now,
            },
            {
                platform: 'leetcode',
                displayName: 'LeetCode',
                status: 'connected',
                username: 'dev_123',
                supportsOAuth: false,
                icon: 'Code2',
                color: '#FFA116',
                lastSyncedAt: now,
            },
        ],
        signals: [
            {
                id: 'gh_1',
                platform: 'github',
                category: 'contribution',
                title: 'GitHub Contributions',
                description: '847 contributions in the last year',
                rawValue: 847,
                normalizedScore: 75,
                skills: ['typescript', 'react', 'node'],
                earnedAt: now,
            },
            {
                id: 'gh_2',
                platform: 'github',
                category: 'contribution',
                title: 'Open Source Contributor',
                description: 'Contributed to 12 repositories',
                rawValue: 12,
                normalizedScore: 60,
                skills: ['open-source', 'collaboration', 'git'],
                earnedAt: now,
            },
            {
                id: 'lc_1',
                platform: 'leetcode',
                category: 'problem_solving',
                title: 'Problem Solver',
                description: '234 problems solved (120E/89M/25H)',
                rawValue: 234,
                normalizedScore: 65,
                skills: ['algorithms', 'data-structures', 'problem-solving'],
                earnedAt: now,
            },
        ],
        derivedSkills: [
            {
                skillId: 'typescript',
                skillName: 'TypeScript',
                confidence: 85,
                proficiency: 'advanced',
                sources: [
                    { platform: 'github', signalType: 'contribution', evidence: 'Primary language', weight: 1.5 },
                ],
                lastUpdated: now,
            },
            {
                skillId: 'react',
                skillName: 'React',
                confidence: 78,
                proficiency: 'advanced',
                sources: [
                    { platform: 'github', signalType: 'contribution', evidence: 'Framework usage', weight: 1.5 },
                ],
                lastUpdated: now,
            },
            {
                skillId: 'algorithms',
                skillName: 'Algorithms',
                confidence: 70,
                proficiency: 'intermediate',
                sources: [
                    { platform: 'leetcode', signalType: 'problem_solving', evidence: 'Problem solving', weight: 1.3 },
                ],
                lastUpdated: now,
            },
        ],
        platformData: {
            github: {
                publicRepos: 28,
                followers: 156,
                contributionsLastYear: 847,
                totalPRs: 89,
                mergedPRs: 72,
                totalIssues: 45,
                languages: { TypeScript: 65, JavaScript: 20, Python: 10, CSS: 5 },
                totalStars: 234,
                contributedRepos: 12,
                commitStreak: 34,
            },
            leetcode: {
                totalSolved: 234,
                easySolved: 120,
                mediumSolved: 89,
                hardSolved: 25,
                ranking: 45678,
                contestRating: 1567,
                contestsAttended: 12,
                acceptanceRate: 68.5,
                streak: 15,
            },
            courses: [],
        },
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
    };
}
