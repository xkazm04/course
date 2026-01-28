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
    Zap,
    Flame,
    Trophy,
    Target,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../layout";
import { forgeEasing, staggerDelay } from "../lib/animations";
import { useAnimatedCounter } from "../lib/useAnimatedCounter";

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
            transition={{ ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl overflow-hidden"
        >
            {/* Header gradient with pattern */}
            <div className="h-28 bg-gradient-to-r from-[var(--ember)] via-[var(--ember-glow)] to-[var(--gold)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2" />
                </div>
            </div>

            {/* Avatar & Info */}
            <div className="px-6 pb-6 -mt-14">
                <div className="flex items-end gap-4 mb-4">
                    {/* Avatar with gradient border */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, ease: forgeEasing }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] rounded-2xl blur-sm" />
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="relative w-24 h-24 rounded-2xl border-4 border-[var(--forge-bg-daylight)] shadow-lg"
                        />
                        {/* Level badge */}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-[var(--forge-bg-daylight)]">
                            {user.level}
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, ease: forgeEasing }}
                        className="mb-2"
                    >
                        <h1 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                            {user.displayName}
                        </h1>
                        {user.email && (
                            <p className="text-sm text-[var(--forge-text-muted)]">{user.email}</p>
                        )}
                    </motion.div>
                </div>

                {/* Animated Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ease: forgeEasing }}
                    className="grid grid-cols-3 gap-3 mb-4"
                >
                    <ProfileStatMini icon={Zap} label="XP" value={user.xp} color="text-[var(--gold)]" />
                    <ProfileStatMini icon={Flame} label="Streak" value={user.currentStreak} suffix=" days" color="text-[var(--ember)]" />
                    <ProfileStatMini icon={Trophy} label="Level" value={user.level} color="text-[var(--forge-success)]" />
                </motion.div>

                {/* View Progress Link */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, ease: forgeEasing }}
                >
                    <Link
                        href="/forge/progress"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium hover:shadow-lg hover:shadow-[var(--ember)]/30 transition-all"
                    >
                        <TrendingUp size={16} />
                        View My Progress
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
}

// Mini stat for profile header
function ProfileStatMini({
    icon: Icon,
    label,
    value,
    suffix = "",
    color,
}: {
    icon: typeof Zap;
    label: string;
    value: number;
    suffix?: string;
    color: string;
}) {
    const { count } = useAnimatedCounter({ target: value, duration: 1000 });

    return (
        <div className="p-3 rounded-xl bg-[var(--forge-bg-elevated)]/50 border border-[var(--forge-border-subtle)] text-center">
            <Icon size={14} className={cn("mx-auto mb-1", color)} />
            <div className="text-lg font-bold text-[var(--forge-text-primary)]">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-wider">{label}</div>
        </div>
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

    const settingsItems = [
        { icon: User, title: "Edit Profile", description: "Update your display name and avatar", disabled: true },
        { icon: Mail, title: "Email Preferences", description: "Manage email notifications and updates", disabled: true },
        { icon: Bell, title: "Notifications", description: "Configure push and in-app notifications", disabled: true },
        { icon: Palette, title: "Appearance", description: "Customize theme and display settings", disabled: true },
        { icon: Shield, title: "Privacy & Security", description: "Manage your data and security settings", disabled: true },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden"
        >
            <div className="p-5 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--forge-bg-elevated)] flex items-center justify-center">
                        <Settings size={16} className="text-[var(--forge-text-secondary)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                        Account Settings
                    </h2>
                </div>
            </div>

            <div className="p-2">
                {settingsItems.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: staggerDelay(index, 0.05) + 0.3, ease: forgeEasing }}
                    >
                        <SettingsItem
                            icon={item.icon}
                            title={item.title}
                            description={item.description}
                            disabled={item.disabled}
                            action={
                                <span className="text-xs px-2 py-1 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]">
                                    Coming Soon
                                </span>
                            }
                        />
                    </motion.div>
                ))}

                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, ease: forgeEasing }}
                    className="border-t border-[var(--forge-border-subtle)] mt-2 pt-2"
                >
                    <SettingsItem
                        icon={LogOut}
                        title="Sign Out"
                        description="Sign out of your account"
                        onClick={signOut}
                        action={
                            <ExternalLink size={16} className="text-[var(--forge-text-muted)]" />
                        }
                    />
                </motion.div>
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
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ease: forgeEasing }}
                className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl p-8 relative overflow-hidden"
            >
                {/* Decorative background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--ember)]/20 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[var(--gold)]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, ease: forgeEasing }}
                    className="relative w-20 h-20 mx-auto mb-6"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] rounded-2xl blur-md opacity-50" />
                    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center shadow-lg">
                        <LogIn size={32} className="text-white" />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, ease: forgeEasing }}
                    className="relative text-2xl font-bold text-[var(--forge-text-primary)] mb-2"
                >
                    Sign In to OpenForge
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, ease: forgeEasing }}
                    className="relative text-[var(--forge-text-muted)] mb-6"
                >
                    Track your progress, earn XP, and personalize your learning journey.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ease: forgeEasing }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={signInWithGoogle}
                    className="relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[var(--ember)] text-white font-medium hover:shadow-lg hover:shadow-[var(--ember)]/30 transition-all"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                </motion.button>
            </motion.div>
        </div>
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
