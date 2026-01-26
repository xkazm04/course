"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FolderGit2,
    Target,
    Menu,
    X,
    Flame,
    Hexagon,
    LogIn,
    LogOut,
    TrendingUp,
    Users,
    Home,
    LayoutGrid,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ForgeBackground, SignInModal } from "./components";
import { ThemeToggle } from "@/app/features/theme";
import { ProgressNotificationsProvider } from "./components/ProgressNotifications";
import { ForgeProvider, useForge } from "./components/ForgeProvider";

// Re-export types and useForge from ForgeProvider
export { useForge } from "./components/ForgeProvider";
export type { ForgeUser, UserLearningPath } from "./components/ForgeProvider";

// ============================================================================
// NAV ITEMS
// ============================================================================

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/forge", label: "Forge", icon: Flame, exact: true },
    { href: "/forge/progress", label: "My Progress", icon: TrendingUp },
    { href: "/forge/community", label: "Community", icon: Users },
    { href: "/forge/map", label: "Map", icon: Hexagon },
    { href: "/forge/territories", label: "Territories", icon: LayoutGrid },
    { href: "/forge/projects", label: "Projects", icon: FolderGit2 },
    { href: "/forge/challenges", label: "Challenges", icon: Target },
];

// ============================================================================
// LAYOUT CONTENT (uses ForgeContext)
// ============================================================================

function ForgeLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [signInModalOpen, setSignInModalOpen] = useState(false);
    const { user: forgeUser, isAuthenticated, signOut } = useForge();

    // Check if on onboarding
    const isOnboarding = pathname?.includes("/onboarding");

    return (
        <div className="min-h-screen relative">
            {/* Background with mesh gradients */}
            <ForgeBackground showNoise />

            {/* Top Navigation */}
            {!isOnboarding && (
                <nav className="sticky top-0 z-50 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/90 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center justify-between h-16">
                            {/* Desktop Nav - Left aligned */}
                            <div className="hidden md:flex items-center gap-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = (item as any).exact
                                        ? pathname === item.href
                                        : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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
                                {isAuthenticated && forgeUser ? (
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
                                            onClick={signOut}
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
                                            onClick={() => setSignInModalOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ember)] text-[var(--oracle-text-on-ember)] text-sm font-medium hover:bg-[var(--ember)]/90 transition-colors shadow-md shadow-[var(--ember)]/20"
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
                                    const isActive = (item as any).exact
                                        ? pathname === item.href
                                        : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

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

                                {isAuthenticated && (
                                    <button
                                        onClick={() => {
                                            signOut();
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

            {/* Page Content with Progress Notifications */}
            <ProgressNotificationsProvider>
                <main className="relative z-10">{children}</main>
            </ProgressNotificationsProvider>

            {/* Sign In Modal */}
            <SignInModal
                isOpen={signInModalOpen}
                onClose={() => setSignInModalOpen(false)}
                redirectPath={pathname || "/forge"}
            />
        </div>
    );
}

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

export default function ForgeLayout({ children }: { children: React.ReactNode }) {
    return (
        <ForgeProvider redirectPath="/forge">
            <ForgeLayoutContent>{children}</ForgeLayoutContent>
        </ForgeProvider>
    );
}
