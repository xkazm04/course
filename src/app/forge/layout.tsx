"use client";

import React, { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Hammer,
    LayoutDashboard,
    FolderGit2,
    Target,
    Trophy,
    User,
    LogOut,
    Menu,
    X,
    Github,
    Flame,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { mockCurrentUser, mockNewUser } from "./lib/mockData";
import type { UserProfile, OnboardingState } from "./lib/types";

// ============================================================================
// CONTEXT
// ============================================================================

interface ForgeContextType {
    user: UserProfile;
    setUser: (user: UserProfile) => void;
    isNewUser: boolean;
    setIsNewUser: (isNew: boolean) => void;
}

const ForgeContext = createContext<ForgeContextType | null>(null);

export function useForge() {
    const ctx = useContext(ForgeContext);
    if (!ctx) throw new Error("useForge must be used within ForgeLayout");
    return ctx;
}

// ============================================================================
// NAV ITEMS
// ============================================================================

const navItems = [
    { href: "/forge", label: "Home", icon: Hammer },
    { href: "/forge/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/forge/projects", label: "Projects", icon: FolderGit2 },
    { href: "/forge/challenges", label: "Challenges", icon: Target },
    { href: "/forge/leaderboard", label: "Leaderboard", icon: Trophy },
];

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

export default function ForgeLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [user, setUser] = useState<UserProfile>(isNewUser ? mockNewUser : mockCurrentUser);

    // Check if on onboarding
    const isOnboarding = pathname?.includes("/onboarding");

    return (
        <ForgeContext.Provider value={{ user, setUser, isNewUser, setIsNewUser }}>
            <div className="min-h-screen bg-[var(--surface-base)]">
                {/* Top Navigation */}
                {!isOnboarding && (
                    <nav className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[var(--surface-elevated)]">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6">
                            <div className="flex items-center justify-between h-16">
                                {/* Logo */}
                                <Link href="/forge" className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                                        <Hammer size={18} className="text-white" />
                                    </div>
                                    <span className="text-lg font-bold text-[var(--text-primary)]">
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
                                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay)]"
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
                                    {/* Streak */}
                                    {user.currentStreak > 0 && (
                                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium">
                                            <Flame size={ICON_SIZES.sm} />
                                            {user.currentStreak}
                                        </div>
                                    )}

                                    {/* XP */}
                                    <div className="hidden sm:flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="text-xs text-[var(--text-muted)]">Level {user.level}</div>
                                            <div className="text-sm font-medium text-[var(--text-primary)]">
                                                {user.xp.toLocaleString()} XP
                                            </div>
                                        </div>
                                        <div className="w-12 h-1.5 rounded-full bg-[var(--surface-overlay)]">
                                            <div
                                                className="h-full rounded-full bg-[var(--accent-primary)]"
                                                style={{ width: `${(user.xp / (user.xp + user.xpToNextLevel)) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Profile */}
                                    <Link
                                        href="/forge/profile"
                                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface-overlay)] transition-colors"
                                    >
                                        <img
                                            src={user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                                            alt={user.displayName}
                                            className="w-8 h-8 rounded-full bg-[var(--surface-overlay)]"
                                        />
                                    </Link>

                                    {/* Mobile Menu Toggle */}
                                    <button
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                        className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-overlay)]"
                                    >
                                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div className="md:hidden border-t border-[var(--border-subtle)]">
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
                                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay)]"
                                                )}
                                            >
                                                <Icon size={ICON_SIZES.md} />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </nav>
                )}

                {/* Page Content */}
                <main>{children}</main>

                {/* Demo Controls - For switching between new/existing user */}
                <div className="fixed bottom-4 right-4 z-50">
                    <div className="bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-lg p-3 shadow-lg">
                        <div className="text-xs text-[var(--text-muted)] mb-2">Demo Mode</div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsNewUser(false);
                                    setUser(mockCurrentUser);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                                    !isNewUser
                                        ? "bg-[var(--accent-primary)] text-white"
                                        : "bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                Existing User
                            </button>
                            <button
                                onClick={() => {
                                    setIsNewUser(true);
                                    setUser(mockNewUser);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                                    isNewUser
                                        ? "bg-[var(--accent-primary)] text-white"
                                        : "bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                New User
                            </button>
                        </div>
                        {isNewUser && (
                            <Link
                                href="/forge/onboarding"
                                className="flex items-center justify-center gap-1 mt-2 px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-500 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                            >
                                Start Onboarding
                                <ChevronRight size={14} />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </ForgeContext.Provider>
    );
}
