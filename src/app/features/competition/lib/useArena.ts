"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { LeaderboardEntry } from "./types";
import {
    ArenaCompetitor,
    ArenaState,
    ArenaViewMode,
    VRConfig,
    getArenaPositionForRank,
    getRankChangeAnimation,
    TIER_ARMOR_CONFIGS,
} from "./arenaTypes";

interface UseArenaOptions {
    entries: LeaderboardEntry[];
    initialViewMode?: ArenaViewMode;
    onCompetitorSelect?: (userId: string) => void;
    autoAnimateRankChanges?: boolean;
}

interface UseArenaReturn {
    state: ArenaState;
    competitors: ArenaCompetitor[];
    selectedCompetitor: ArenaCompetitor | null;
    // Actions
    setViewMode: (mode: ArenaViewMode) => void;
    selectCompetitor: (userId: string | null) => void;
    toggleVR: () => void;
    updateVRConfig: (config: Partial<VRConfig>) => void;
    refreshPositions: () => void;
    triggerCelebration: (userId: string) => void;
}

export function useArena(options: UseArenaOptions): UseArenaReturn {
    const {
        entries,
        initialViewMode = "podium",
        onCompetitorSelect,
        autoAnimateRankChanges = true,
    } = options;

    // Arena state
    const [viewMode, setViewMode] = useState<ArenaViewMode>(initialViewMode);
    const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
    const [vrConfig, setVrConfig] = useState<VRConfig>({
        enabled: false,
        handTracking: true,
        teleportEnabled: true,
        interactionDistance: 5,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [animatingCompetitors, setAnimatingCompetitors] = useState<Set<string>>(new Set());
    const [celebratingCompetitors, setCelebratingCompetitors] = useState<Set<string>>(new Set());

    // Previous entries for detecting rank changes
    const [previousEntries, setPreviousEntries] = useState<Map<string, LeaderboardEntry>>(new Map());

    // Convert entries to arena competitors with animations
    const competitors = useMemo(() => {
        return entries.map((entry) => {
            const position = getArenaPositionForRank(entry.rank, entries.length);
            const previousEntry = previousEntries.get(entry.userId);
            const animation = autoAnimateRankChanges
                ? getRankChangeAnimation(entry, previousEntry?.rank)
                : null;

            return {
                ...entry,
                position,
                armor: TIER_ARMOR_CONFIGS[entry.tier],
                animation,
                isAnimating: animatingCompetitors.has(entry.userId),
            };
        });
    }, [entries, previousEntries, autoAnimateRankChanges, animatingCompetitors]);

    // Update previous entries when entries change
    useEffect(() => {
        const newPrevious = new Map<string, LeaderboardEntry>();
        entries.forEach((entry) => {
            newPrevious.set(entry.userId, entry);
        });

        // Detect rank changes and trigger animations
        if (autoAnimateRankChanges) {
            const newAnimating = new Set<string>();
            entries.forEach((entry) => {
                const prev = previousEntries.get(entry.userId);
                if (prev && prev.rank !== entry.rank) {
                    newAnimating.add(entry.userId);

                    // Clear animation after duration
                    setTimeout(() => {
                        setAnimatingCompetitors((current) => {
                            const next = new Set(current);
                            next.delete(entry.userId);
                            return next;
                        });
                    }, 2000);

                    // Trigger celebration for top 3
                    if (entry.rank <= 3 && prev.rank > 3) {
                        setCelebratingCompetitors((current) => {
                            const next = new Set(current);
                            next.add(entry.userId);
                            return next;
                        });

                        setTimeout(() => {
                            setCelebratingCompetitors((current) => {
                                const next = new Set(current);
                                next.delete(entry.userId);
                                return next;
                            });
                        }, 3000);
                    }
                }
            });
            setAnimatingCompetitors(newAnimating);
        }

        setPreviousEntries(newPrevious);
    }, [entries, autoAnimateRankChanges]);

    // Get selected competitor
    const selectedCompetitor = useMemo(() => {
        return competitors.find((c) => c.userId === selectedCompetitorId) || null;
    }, [competitors, selectedCompetitorId]);

    // Actions
    const selectCompetitor = useCallback(
        (userId: string | null) => {
            setSelectedCompetitorId(userId);
            if (userId && onCompetitorSelect) {
                onCompetitorSelect(userId);
            }
        },
        [onCompetitorSelect]
    );

    const toggleVR = useCallback(() => {
        setVrConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
    }, []);

    const updateVRConfig = useCallback((config: Partial<VRConfig>) => {
        setVrConfig((prev) => ({ ...prev, ...config }));
    }, []);

    const refreshPositions = useCallback(() => {
        setIsLoading(true);
        // Recalculate all positions
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    const triggerCelebration = useCallback((userId: string) => {
        setCelebratingCompetitors((current) => {
            const next = new Set(current);
            next.add(userId);
            return next;
        });

        setTimeout(() => {
            setCelebratingCompetitors((current) => {
                const next = new Set(current);
                next.delete(userId);
                return next;
            });
        }, 3000);
    }, []);

    // Camera position based on view mode
    const cameraPosition = useMemo(() => {
        switch (viewMode) {
            case "podium":
                return { x: 0, y: 8, z: 15, rotation: 0 };
            case "stadium":
                return { x: 0, y: 25, z: 35, rotation: 0 };
            case "orbital":
                return { x: 20, y: 15, z: 20, rotation: 0 };
            default:
                return { x: 0, y: 8, z: 15, rotation: 0 };
        }
    }, [viewMode]);

    // Construct state object
    const state: ArenaState = {
        competitors,
        viewMode,
        vrConfig,
        selectedCompetitor: selectedCompetitorId,
        cameraPosition,
        isLoading,
    };

    return {
        state,
        competitors,
        selectedCompetitor,
        setViewMode,
        selectCompetitor,
        toggleVR,
        updateVRConfig,
        refreshPositions,
        triggerCelebration,
    };
}

export default useArena;
