"use client";

import React, { useState, createContext, useContext, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Hammer,
    FolderGit2,
    Target,
    Menu,
    X,
    Flame,
    ChevronRight,
    Hexagon,
    LogIn,
    LogOut,
    Loader2,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useAuth } from "@/app/shared/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { ForgeBackground } from "./components";
import { ThemeToggle } from "@/app/features/theme";

// ============================================================================
// TYPES
// ============================================================================

type DBUserProfile = Tables<"user_profiles">;
type DBLearningPath = Tables<"learning_paths">;

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
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const ForgeContext = createContext<ForgeContextType | null>(null);

export function useForge() {
    const ctx = useContext(ForgeContext);
    if (!ctx) throw new Error("useForge must be used within ForgeLayout");
    return ctx;
}

// ============================================================================
// XP CALCULATION
// ============================================================================

function calculateLevel(xp: number): { level: number; xpToNextLevel: number } {
    // XP needed per level: 100, 200, 300, 400... (100 * level)
    let level = 1;
    let totalXpForLevel = 100;

    while (xp >= totalXpForLevel) {
        xp -= totalXpForLevel;
        level++;
        totalXpForLevel = level * 100;
    }

    return {
        level,
        xpToNextLevel: totalXpForLevel - xp,
    };
}

// ============================================================================
// NAV ITEMS
// ============================================================================

const navItems = [
    { href: "/forge", label: "Home", icon: Hammer },
    { href: "/forge/map", label: "Map", icon: Hexagon },
    { href: "/forge/projects", label: "Projects", icon: FolderGit2 },
    { href: "/forge/challenges", label: "Challenges", icon: Target },
];

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

export default function ForgeLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const auth = useAuth();

    // ForgeUser state derived from auth profile
    const [forgeUser, setForgeUser] = useState<ForgeUser | null>(null);
    const [learningPaths, setLearningPaths] = useState<UserLearningPath[]>([]);

    // Fetch user's learning path enrollments
    const fetchLearningPaths = useCallback(async (userId: string) => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from("learning_path_enrollments")
            .select(`
                id,
                learning_path_id,
                status,
                progress_percent,
                started_at,
                completed_at,
                learning_paths (
                    id,
                    title,
                    description
                )
            `)
            .eq("user_id", userId)
            .order("started_at", { ascending: false });

        if (error) {
            console.error("Error fetching learning paths:", error);
            return [];
        }

        return (data || []).map((enrollment: any) => ({
            id: enrollment.id,
            pathId: enrollment.learning_path_id,
            title: enrollment.learning_paths?.title || "Unknown Path",
            description: enrollment.learning_paths?.description || null,
            status: enrollment.status,
            progressPercent: enrollment.progress_percent,
            startedAt: enrollment.started_at,
            completedAt: enrollment.completed_at,
        }));
    }, []);

    // Build ForgeUser from auth profile
    useEffect(() => {
        const buildForgeUser = async () => {
            if (!auth.profile) {
                setForgeUser(null);
                setLearningPaths([]);
                return;
            }

            const paths = await fetchLearningPaths(auth.profile.id);
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
        if (auth.profile) {
            const paths = await fetchLearningPaths(auth.profile.id);
            setLearningPaths(paths);
            if (forgeUser) {
                setForgeUser(prev => prev ? { ...prev, learningPaths: paths } : null);
            }
        }
    }, [auth, fetchLearningPaths, forgeUser]);

    // Check if on onboarding
    const isOnboarding = pathname?.includes("/onboarding");

    return (
        <ForgeContext.Provider
            value={{
                user: forgeUser,
                isLoading: auth.isLoading,
                isAuthenticated: auth.isAuthenticated,
                signInWithGoogle: () => auth.signInWithGoogle("/forge"),
                signOut: auth.signOut,
                refreshUser,
            }}
        >
            <div className="min-h-screen relative">
                {/* Background with mesh gradients */}
                <ForgeBackground showNoise />

                {/* Top Navigation */}
                {!isOnboarding && (
                    <nav className="sticky top-0 z-50 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/90 backdrop-blur-xl">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6">
                            <div className="flex items-center justify-between h-16">
                                {/* Logo */}
                                <Link href="/forge" className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center shadow-md shadow-[var(--ember)]/30">
                                        <Hammer size={18} className="text-white" />
                                    </div>
                                    <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                                        OpenForge
                                    </span>
                                </Link>

                                {/* Desktop Nav */}
                                <div className="hidden md:flex items-center gap-1">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href ||
                                            (item.href !== "/forge" && pathname?.startsWith(item.href));

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-[var(--ember)]/10 text-[var(--ember)] shadow-sm"
                                                        : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)]/60"
                                                )}
                                            >
                                                <Icon size={ICON_SIZES.sm} />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* User Section */}
                                <div className="flex items-center gap-4">
                                    {auth.isLoading ? (
                                        <Loader2 size={20} className="animate-spin text-[var(--forge-text-muted)]" />
                                    ) : auth.isAuthenticated && forgeUser ? (
                                        <>
                                            {/* Streak */}
                                            {forgeUser.currentStreak > 0 && (
                                                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-sm font-medium border border-orange-200/50">
                                                    <Flame size={ICON_SIZES.sm} />
                                                    {forgeUser.currentStreak}
                                                </div>
                                            )}

                                            {/* XP */}
                                            <div className="hidden sm:flex items-center gap-2">
                                                <div className="text-right">
                                                    <div className="text-xs text-[var(--forge-text-secondary)]">Level {forgeUser.level}</div>
                                                    <div className="text-sm font-medium text-[var(--forge-text-primary)]">
                                                        {forgeUser.xp.toLocaleString()} XP
                                                    </div>
                                                </div>
                                                <div className="w-12 h-1.5 rounded-full bg-[var(--forge-border-subtle)]">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                                                        style={{ width: `${Math.max(5, (forgeUser.xp / (forgeUser.xp + forgeUser.xpToNextLevel)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Theme Toggle */}
                                            <ThemeToggle />

                                            {/* Profile */}
                                            <Link
                                                href="/forge/profile"
                                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--forge-bg-bench)]/60 transition-colors"
                                            >
                                                <img
                                                    src={forgeUser.avatarUrl}
                                                    alt={forgeUser.displayName}
                                                    className="w-8 h-8 rounded-full bg-[var(--forge-bg-elevated)] ring-2 ring-[var(--forge-border-subtle)]"
                                                />
                                            </Link>

                                            {/* Sign Out */}
                                            <button
                                                onClick={auth.signOut}
                                                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)]/60 transition-colors"
                                            >
                                                <LogOut size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Theme Toggle */}
                                            <ThemeToggle />

                                            {/* Sign In */}
                                            <button
                                                onClick={() => auth.signInWithGoogle("/forge")}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ember)] text-white text-sm font-medium hover:bg-[var(--ember)]/90 transition-colors shadow-md shadow-[var(--ember)]/20"
                                            >
                                                <LogIn size={16} />
                                                Sign In
                                            </button>
                                        </>
                                    )}

                                    {/* Mobile Menu Toggle */}
                                    <button
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                        className="md:hidden p-2 rounded-lg hover:bg-[var(--forge-bg-bench)]/60 text-[var(--forge-text-secondary)]"
                                    >
                                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div className="md:hidden border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/90 backdrop-blur-xl">
                                <div className="p-4 space-y-1">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                                        : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)]/60"
                                                )}
                                            >
                                                <Icon size={ICON_SIZES.md} />
                                                {item.label}
                                            </Link>
                                        );
                                    })}

                                    {auth.isAuthenticated && (
                                        <button
                                            onClick={() => {
                                                auth.signOut();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)]/60 transition-all duration-200"
                                        >
                                            <LogOut size={ICON_SIZES.md} />
                                            Sign Out
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </nav>
                )}

                {/* Page Content */}
                <main className="relative z-10">{children}</main>
            </div>
        </ForgeContext.Provider>
    );
}
