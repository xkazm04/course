"use client";

import React, { useState, createContext, useContext, useEffect, useCallback } from "react";
import { useAuth } from "@/app/shared/hooks/useAuth";
import { getLevelInfo } from "@/app/api/progress/lib/xpCalculator";

// ============================================================================
// TYPES
// ============================================================================

export interface UserLearningPath {
    id: string;
    pathId: string;
    title: string;
    description: string | null;
    status: string;
    progressPercent: number;
    startedAt: string;
    completedAt: string | null;
}

export interface ForgeUser {
    id: string;
    email: string | null;
    displayName: string;
    avatarUrl: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    currentStreak: number;
    longestStreak: number;
    learningPaths: UserLearningPath[];
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ForgeContextType {
    user: ForgeUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isNewUser: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const ForgeContext = createContext<ForgeContextType | null>(null);

export function useForge() {
    const ctx = useContext(ForgeContext);
    if (!ctx) throw new Error("useForge must be used within ForgeProvider");
    return ctx;
}

// ============================================================================
// XP CALCULATION
// ============================================================================

function calculateLevel(xp: number): { level: number; xpToNextLevel: number } {
    const levelInfo = getLevelInfo(xp);
    return {
        level: levelInfo.level,
        xpToNextLevel: levelInfo.xpToNextLevel,
    };
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ForgeProviderProps {
    children: React.ReactNode;
    redirectPath?: string;
}

export function ForgeProvider({ children, redirectPath = "/" }: ForgeProviderProps) {
    const auth = useAuth();

    // ForgeUser state derived from auth profile
    const [forgeUser, setForgeUser] = useState<ForgeUser | null>(null);
    const [learningPaths, setLearningPaths] = useState<UserLearningPath[]>([]);

    // Fetch user's learning path enrollments via API
    const fetchLearningPaths = useCallback(async (): Promise<UserLearningPath[]> => {
        try {
            const response = await fetch("/api/user/learning-paths");
            if (!response.ok) {
                console.error("Error fetching learning paths:", response.statusText);
                return [];
            }
            const data = await response.json();
            return data.learningPaths || [];
        } catch (error) {
            console.error("Error fetching learning paths:", error);
            return [];
        }
    }, []);

    // Build ForgeUser from auth profile
    useEffect(() => {
        const buildForgeUser = async () => {
            if (!auth.profile) {
                setForgeUser(null);
                setLearningPaths([]);
                return;
            }

            const paths = await fetchLearningPaths();
            setLearningPaths(paths);

            const { level, xpToNextLevel } = calculateLevel(auth.profile.total_xp);

            setForgeUser({
                id: auth.profile.id,
                email: auth.profile.email,
                displayName: auth.profile.display_name || "User",
                avatarUrl: auth.profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.profile.id}`,
                level,
                xp: auth.profile.total_xp,
                xpToNextLevel,
                currentStreak: auth.profile.current_streak,
                longestStreak: auth.profile.longest_streak,
                learningPaths: paths,
            });
        };

        buildForgeUser();
    }, [auth.profile, fetchLearningPaths]);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        await auth.refreshProfile();
        const paths = await fetchLearningPaths();
        setLearningPaths(paths);
        setForgeUser(prev => prev ? { ...prev, learningPaths: paths } : null);
    }, [auth, fetchLearningPaths]);

    // User is "new" if not authenticated or has no learning paths
    const isNewUser = !auth.isAuthenticated || !forgeUser || forgeUser.learningPaths.length === 0;

    return (
        <ForgeContext.Provider
            value={{
                user: forgeUser,
                isLoading: auth.isLoading,
                isAuthenticated: auth.isAuthenticated,
                isNewUser,
                signInWithGoogle: () => auth.signInWithGoogle(redirectPath),
                signOut: auth.signOut,
                refreshUser,
            }}
        >
            {children}
        </ForgeContext.Provider>
    );
}
