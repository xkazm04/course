/**
 * useLearningDNA Hook
 *
 * React hook for managing Learning DNA profile state,
 * platform connections, and synchronization.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
    LearningDNAProfile,
    PlatformConnection,
    ExternalPlatform,
    PlatformSyncStatus,
    ExternalAchievementSignal,
} from './types';
import {
    loadLearningDNAProfile,
    saveLearningDNAProfile,
    loadPlatformConnections,
    savePlatformConnections,
    updatePlatformConnection,
    disconnectPlatform as storageDiconnectPlatform,
    loadSyncStatus,
    updateSyncStatus,
    generateMockLearningDNAProfile,
    getInitialPlatformConnections,
} from './dnaStorage';
import {
    buildLearningDNAProfile,
    extractGitHubSignals,
    extractLeetCodeSignals,
    extractStackOverflowSignals,
    extractCourseSignals,
} from './dnaCalculator';

interface UseLearningDNAOptions {
    /** User ID for the profile */
    userId?: string;
    /** Auto-load profile on mount */
    autoLoad?: boolean;
    /** Use mock data for demo */
    useMockData?: boolean;
}

interface UseLearningDNAReturn {
    /** Learning DNA profile */
    profile: LearningDNAProfile | null;
    /** Platform connections */
    connections: PlatformConnection[];
    /** Sync status for each platform */
    syncStatus: Record<ExternalPlatform, PlatformSyncStatus>;
    /** Loading state */
    isLoading: boolean;
    /** Syncing state */
    isSyncing: boolean;
    /** Error state */
    error: string | null;
    /** Connect a platform */
    connectPlatform: (platform: ExternalPlatform, username?: string) => Promise<void>;
    /** Disconnect a platform */
    disconnectPlatform: (platform: ExternalPlatform) => void;
    /** Sync all connected platforms */
    syncAll: () => Promise<void>;
    /** Sync a specific platform */
    syncPlatform: (platform: ExternalPlatform) => Promise<void>;
    /** Refresh profile */
    refreshProfile: () => void;
    /** Get top skills */
    topSkills: LearningDNAProfile['derivedSkills'];
    /** Connected platform count */
    connectedCount: number;
}

export function useLearningDNA(options: UseLearningDNAOptions = {}): UseLearningDNAReturn {
    const { userId = 'demo-user', autoLoad = true, useMockData = false } = options;

    const [profile, setProfile] = useState<LearningDNAProfile | null>(null);
    const [connections, setConnections] = useState<PlatformConnection[]>([]);
    const [syncStatus, setSyncStatus] = useState<Record<ExternalPlatform, PlatformSyncStatus>>(
        {} as Record<ExternalPlatform, PlatformSyncStatus>
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        if (!autoLoad) {
            setIsLoading(false);
            return;
        }

        const loadData = () => {
            try {
                // Load connections
                const loadedConnections = loadPlatformConnections();
                setConnections(loadedConnections);

                // Load sync status
                const loadedSyncStatus = loadSyncStatus();
                setSyncStatus(loadedSyncStatus);

                // Load or generate profile
                let loadedProfile = loadLearningDNAProfile();
                if (!loadedProfile && useMockData) {
                    loadedProfile = generateMockLearningDNAProfile(userId);
                    saveLearningDNAProfile(loadedProfile);
                }
                setProfile(loadedProfile);
            } catch (err) {
                console.error('[useLearningDNA] Failed to load data:', err);
                setError('Failed to load Learning DNA profile');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [autoLoad, userId, useMockData]);

    // Connect a platform
    const connectPlatform = useCallback(async (
        platform: ExternalPlatform,
        username?: string
    ) => {
        try {
            // Update connection status
            const updated = updatePlatformConnection(platform, {
                status: 'pending',
                username,
            });
            setConnections(updated);

            // For OAuth platforms, redirect to auth endpoint
            const connection = updated.find(c => c.platform === platform);
            if (connection?.supportsOAuth) {
                // Redirect to OAuth flow
                window.location.href = `/api/learning-dna/auth/${platform}`;
                return;
            }

            // For non-OAuth platforms (manual username entry), sync immediately
            if (username) {
                await syncPlatformData(platform, username);
            }
        } catch (err) {
            console.error(`[useLearningDNA] Failed to connect ${platform}:`, err);
            updatePlatformConnection(platform, {
                status: 'error',
                errorMessage: 'Failed to connect platform',
            });
            setError(`Failed to connect ${platform}`);
        }
    }, []);

    // Disconnect a platform
    const disconnectPlatform = useCallback((platform: ExternalPlatform) => {
        const updated = storageDiconnectPlatform(platform);
        setConnections(updated);

        // Recalculate profile without this platform's signals
        if (profile) {
            const filteredSignals = profile.signals.filter(s => s.platform !== platform);
            const newProfile = buildLearningDNAProfile(
                userId,
                filteredSignals,
                {
                    ...profile.platformData,
                    [platform]: undefined,
                },
                updated.filter(c => c.status === 'connected')
            );
            setProfile(newProfile);
            saveLearningDNAProfile(newProfile);
        }
    }, [profile, userId]);

    // Sync data from a specific platform
    const syncPlatformData = async (platform: ExternalPlatform, username: string) => {
        updateSyncStatus(platform, { status: 'syncing' });
        setSyncStatus(prev => ({
            ...prev,
            [platform]: { ...prev[platform], status: 'syncing' },
        }));

        try {
            // Call API to fetch platform data
            const response = await fetch(`/api/learning-dna/sync/${platform}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            if (!response.ok) {
                throw new Error(`Failed to sync ${platform}`);
            }

            const data = await response.json();

            // Extract signals based on platform
            let newSignals: ExternalAchievementSignal[] = [];
            if (platform === 'github' && data.github) {
                newSignals = extractGitHubSignals(data.github);
            } else if (platform === 'stackoverflow' && data.stackoverflow) {
                newSignals = extractStackOverflowSignals(data.stackoverflow);
            } else if (platform === 'leetcode' && data.leetcode) {
                newSignals = extractLeetCodeSignals(data.leetcode);
            } else if (['coursera', 'udemy', 'pluralsight', 'linkedin'].includes(platform) && data.courses) {
                newSignals = extractCourseSignals(data.courses);
            }

            // Update profile with new signals
            const existingSignals = profile?.signals.filter(s => s.platform !== platform) || [];
            const allSignals = [...existingSignals, ...newSignals];

            const platformData = {
                ...(profile?.platformData || { courses: [] }),
                [platform]: data[platform],
            };

            const updatedConnections = updatePlatformConnection(platform, {
                status: 'connected',
                lastSyncedAt: new Date().toISOString(),
            });
            setConnections(updatedConnections);

            const newProfile = buildLearningDNAProfile(
                userId,
                allSignals,
                platformData,
                updatedConnections.filter(c => c.status === 'connected')
            );
            setProfile(newProfile);
            saveLearningDNAProfile(newProfile);

            updateSyncStatus(platform, {
                status: 'success',
                lastSyncAt: new Date().toISOString(),
                signalsCount: newSignals.length,
            });
            setSyncStatus(prev => ({
                ...prev,
                [platform]: {
                    ...prev[platform],
                    status: 'success',
                    lastSyncAt: new Date().toISOString(),
                    signalsCount: newSignals.length,
                },
            }));
        } catch (err) {
            console.error(`[useLearningDNA] Sync failed for ${platform}:`, err);
            updateSyncStatus(platform, {
                status: 'error',
                errorMessage: `Sync failed: ${err}`,
            });
            setSyncStatus(prev => ({
                ...prev,
                [platform]: {
                    ...prev[platform],
                    status: 'error',
                    errorMessage: `Sync failed`,
                },
            }));
            throw err;
        }
    };

    // Sync a specific platform
    const syncPlatform = useCallback(async (platform: ExternalPlatform) => {
        const connection = connections.find(c => c.platform === platform);
        if (!connection?.username) {
            setError(`No username for ${platform}`);
            return;
        }

        setIsSyncing(true);
        try {
            await syncPlatformData(platform, connection.username);
        } catch (err) {
            // Error already handled in syncPlatformData
        } finally {
            setIsSyncing(false);
        }
    }, [connections]);

    // Sync all connected platforms
    const syncAll = useCallback(async () => {
        const connected = connections.filter(c => c.status === 'connected' && c.username);
        if (connected.length === 0) return;

        setIsSyncing(true);
        setError(null);

        try {
            await Promise.all(
                connected.map(c => syncPlatformData(c.platform, c.username!))
            );
        } catch (err) {
            setError('Some platforms failed to sync');
        } finally {
            setIsSyncing(false);
        }
    }, [connections]);

    // Refresh profile from storage
    const refreshProfile = useCallback(() => {
        const loadedProfile = loadLearningDNAProfile();
        if (loadedProfile) {
            setProfile(loadedProfile);
        }
    }, []);

    // Derived values
    const topSkills = useMemo(() => {
        return profile?.derivedSkills.slice(0, 10) || [];
    }, [profile]);

    const connectedCount = useMemo(() => {
        return connections.filter(c => c.status === 'connected').length;
    }, [connections]);

    return {
        profile,
        connections,
        syncStatus,
        isLoading,
        isSyncing,
        error,
        connectPlatform,
        disconnectPlatform,
        syncAll,
        syncPlatform,
        refreshProfile,
        topSkills,
        connectedCount,
    };
}
