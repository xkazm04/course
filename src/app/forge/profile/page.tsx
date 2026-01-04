"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Settings,
    LogIn,
    LogOut,
    Loader2,
    User,
    Mail,
    Bell,
    Shield,
    Palette,
    ChevronRight,
    ExternalLink,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../layout";

// ============================================================================
// PROFILE HEADER CARD
// ============================================================================

function ProfileHeaderCard() {
    const { user } = useForge();

    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl overflow-hidden"
        >
            {/* Header gradient */}
            <div className="h-24 bg-gradient-to-r from-[var(--ember)] via-[var(--ember-glow)] to-[var(--ember)]" />

            {/* Avatar & Info */}
            <div className="px-6 pb-6 -mt-12">
                <div className="flex items-end gap-4 mb-4">
                    <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-24 h-24 rounded-2xl border-4 border-[var(--forge-bg-elevated)] shadow-lg"
                    />
                    <div className="mb-2">
                        <h1 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                            {user.displayName}
                        </h1>
                        {user.email && (
                            <p className="text-sm text-[var(--forge-text-muted)]">{user.email}</p>
                        )}
                    </div>
                </div>

                {/* Quick Stats Summary */}
                <div className="flex items-center gap-4 text-sm text-[var(--forge-text-muted)]">
                    <span>Level {user.level}</span>
                    <span>•</span>
                    <span>{user.xp.toLocaleString()} XP</span>
                    <span>•</span>
                    <span>{user.currentStreak} day streak</span>
                </div>

                {/* View Progress Link */}
                <Link
                    href="/?tab=progress"
                    className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium hover:opacity-90 transition-opacity shadow-md shadow-[var(--ember)]/20"
                >
                    <TrendingUp size={16} />
                    View My Progress
                </Link>
            </div>
        </motion.div>
    );
}

// ============================================================================
// SETTINGS SECTION
// ============================================================================

interface SettingsItemProps {
    icon: React.ElementType;
    title: string;
    description: string;
    action?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
}

function SettingsItem({ icon: Icon, title, description, action, onClick, href, disabled }: SettingsItemProps) {
    const content = (
        <div className={cn(
            "flex items-center gap-4 p-4 rounded-xl transition-all",
            disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[var(--forge-bg-elevated)] cursor-pointer"
        )}>
            <div className="w-10 h-10 rounded-xl bg-[var(--forge-bg-elevated)] flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[var(--forge-text-secondary)]" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--forge-text-primary)]">{title}</h3>
                <p className="text-sm text-[var(--forge-text-muted)]">{description}</p>
            </div>
            {action || <ChevronRight size={16} className="text-[var(--forge-text-muted)]" />}
        </div>
    );

    if (href && !disabled) {
        return (
            <Link href={href}>
                {content}
            </Link>
        );
    }

    if (onClick && !disabled) {
        return (
            <button onClick={onClick} className="w-full text-left">
                {content}
            </button>
        );
    }

    return content;
}

function SettingsSection() {
    const { signOut } = useForge();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden"
        >
            <div className="p-6 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    <Settings size={18} className="text-[var(--forge-text-secondary)]" />
                    <h2 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                        Account Settings
                    </h2>
                </div>
            </div>

            <div className="p-2">
                <SettingsItem
                    icon={User}
                    title="Edit Profile"
                    description="Update your display name and avatar"
                    disabled
                    action={
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]">
                            Coming Soon
                        </span>
                    }
                />

                <SettingsItem
                    icon={Mail}
                    title="Email Preferences"
                    description="Manage email notifications and updates"
                    disabled
                    action={
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]">
                            Coming Soon
                        </span>
                    }
                />

                <SettingsItem
                    icon={Bell}
                    title="Notifications"
                    description="Configure push and in-app notifications"
                    disabled
                    action={
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]">
                            Coming Soon
                        </span>
                    }
                />

                <SettingsItem
                    icon={Palette}
                    title="Appearance"
                    description="Customize theme and display settings"
                    disabled
                    action={
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]">
                            Coming Soon
                        </span>
                    }
                />

                <SettingsItem
                    icon={Shield}
                    title="Privacy & Security"
                    description="Manage your data and security settings"
                    disabled
                    action={
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]">
                            Coming Soon
                        </span>
                    }
                />

                <div className="border-t border-[var(--forge-border-subtle)] mt-2 pt-2">
                    <SettingsItem
                        icon={LogOut}
                        title="Sign Out"
                        description="Sign out of your account"
                        onClick={signOut}
                        action={
                            <ExternalLink size={16} className="text-[var(--forge-text-muted)]" />
                        }
                    />
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// SIGN IN PROMPT
// ============================================================================

function SignInPrompt() {
    const { signInWithGoogle } = useForge();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto px-4 py-16 text-center"
        >
            <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center shadow-lg shadow-[var(--ember)]/30">
                    <LogIn size={32} className="text-white" />
                </div>

                <h1 className="text-2xl font-bold text-[var(--forge-text-primary)] mb-2">
                    Sign In to OpenForge
                </h1>
                <p className="text-[var(--forge-text-muted)] mb-6">
                    Track your progress, earn XP, and personalize your learning journey.
                </p>

                <button
                    onClick={signInWithGoogle}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember)]/90 transition-colors shadow-md shadow-[var(--ember)]/20"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                </button>
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProfilePage() {
    const { user, isLoading, isAuthenticated } = useForge();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-[var(--ember)]" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <SignInPrompt />;
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <ProfileHeaderCard />
            <SettingsSection />
        </div>
    );
}
