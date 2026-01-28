"use client";

/**
 * Page Hero Component
 *
 * Reusable hero section for all Forge pages with:
 * - Animated gradient title
 * - Subtitle with staggered reveal
 * - Optional stats row with animated counters
 * - Optional badge/tag
 * - Optional CTA buttons
 *
 * Based on gold standard: HeroSection.tsx
 */

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import {
    fadeUpVariants,
    textGradientEmber,
    forgeEasing,
    staggerDelay,
} from "../lib/animations";
import { AnimatedStat } from "../lib/useAnimatedCounter";

// ============================================================================
// TYPES
// ============================================================================

export interface PageHeroStat {
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
    increment?: number;
}

export interface PageHeroAction {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    icon?: LucideIcon;
}

export interface PageHeroProps {
    /** Page title - plain text or with highlight */
    title: string;
    /** Text to highlight with gradient (optional) */
    titleHighlight?: string;
    /** Subtitle/description text */
    subtitle?: string;
    /** Small badge/tag above title */
    badge?: {
        icon?: LucideIcon;
        text: string;
    };
    /** Stats to display below subtitle */
    stats?: PageHeroStat[];
    /** Whether stats are loading */
    statsLoading?: boolean;
    /** CTA buttons */
    actions?: PageHeroAction[];
    /** Center align content (default: true) */
    centered?: boolean;
    /** Compact variant with less padding */
    compact?: boolean;
    /** Additional content below hero */
    children?: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

function HeroBadge({ icon: Icon, text }: { icon?: LucideIcon; text: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: forgeEasing }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm border border-[var(--forge-border-subtle)] mb-6"
        >
            {Icon && <Icon size={16} className="text-[var(--ember)]" />}
            <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
                {text}
            </span>
        </motion.div>
    );
}

function HeroTitle({
    title,
    highlight,
    index = 0,
}: {
    title: string;
    highlight?: string;
    index?: number;
}) {
    // If no highlight, render plain title
    if (!highlight) {
        return (
            <motion.h1
                custom={index}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
            >
                {title}
            </motion.h1>
        );
    }

    // Split title around highlight
    const parts = title.split(highlight);
    const before = parts[0] || "";
    const after = parts[1] || "";

    return (
        <motion.h1
            custom={index}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
        >
            {before}
            <span className={textGradientEmber}>{highlight}</span>
            {after}
        </motion.h1>
    );
}

function HeroSubtitle({ text, index = 1 }: { text: string; index?: number }) {
    return (
        <motion.p
            custom={index}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-base sm:text-lg text-[var(--forge-text-secondary)] mb-8 max-w-2xl"
        >
            {text}
        </motion.p>
    );
}

function HeroStats({
    stats,
    isLoading,
    index = 2,
}: {
    stats: PageHeroStat[];
    isLoading?: boolean;
    index?: number;
}) {
    return (
        <motion.div
            custom={index}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-6 border-t border-[var(--forge-border-subtle)]"
        >
            {stats.map((stat, i) => (
                <AnimatedStat
                    key={stat.label}
                    value={stat.value}
                    label={stat.label}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    increment={stat.increment || 1}
                    isLoading={isLoading}
                    delay={staggerDelay(i) * 1000}
                />
            ))}
        </motion.div>
    );
}

function HeroActions({
    actions,
    index = 2,
}: {
    actions: PageHeroAction[];
    index?: number;
}) {
    return (
        <motion.div
            custom={index}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
            {actions.map((action, i) => {
                const Icon = action.icon;
                const isPrimary = action.variant !== "secondary";

                const className = cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                    isPrimary
                        ? "bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white hover:opacity-90 shadow-lg shadow-[var(--ember)]/20"
                        : "bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm border border-[var(--forge-border-subtle)] text-[var(--forge-text-primary)] hover:border-[var(--ember)]/30"
                );

                if (action.href) {
                    return (
                        <a key={i} href={action.href} className={className}>
                            {Icon && <Icon size={18} />}
                            {action.label}
                        </a>
                    );
                }

                return (
                    <button key={i} onClick={action.onClick} className={className}>
                        {Icon && <Icon size={18} />}
                        {action.label}
                    </button>
                );
            })}
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PageHero({
    title,
    titleHighlight,
    subtitle,
    badge,
    stats,
    statsLoading,
    actions,
    centered = true,
    compact = false,
    children,
    className = "",
}: PageHeroProps) {
    return (
        <section
            className={cn(
                "relative",
                compact ? "pt-8 pb-6" : "pt-12 sm:pt-16 pb-8",
                className
            )}
        >
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                <div
                    className={cn(
                        "max-w-3xl",
                        centered && "mx-auto text-center"
                    )}
                >
                    {/* Badge */}
                    {badge && <HeroBadge icon={badge.icon} text={badge.text} />}

                    {/* Title */}
                    <HeroTitle title={title} highlight={titleHighlight} index={0} />

                    {/* Subtitle */}
                    {subtitle && <HeroSubtitle text={subtitle} index={1} />}

                    {/* Actions */}
                    {actions && actions.length > 0 && (
                        <HeroActions actions={actions} index={2} />
                    )}

                    {/* Stats */}
                    {stats && stats.length > 0 && (
                        <HeroStats
                            stats={stats}
                            isLoading={statsLoading}
                            index={actions ? 3 : 2}
                        />
                    )}

                    {/* Additional content */}
                    {children && (
                        <motion.div
                            custom={stats ? 4 : 3}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                            className="mt-8"
                        >
                            {children}
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactHeroProps {
    title: string;
    subtitle?: string;
    badge?: string;
    className?: string;
}

/**
 * Compact hero for secondary pages
 */
export function CompactHero({ title, subtitle, badge, className = "" }: CompactHeroProps) {
    return (
        <div className={cn("mb-6", className)}>
            <div className="flex items-center gap-3 mb-2">
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl sm:text-3xl font-bold text-[var(--forge-text-primary)]"
                >
                    {title}
                </motion.h1>
                {badge && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="px-2 py-0.5 rounded-full bg-[var(--ember)]/10 text-[var(--ember)] text-xs font-medium border border-[var(--ember)]/20"
                    >
                        {badge}
                    </motion.span>
                )}
            </div>
            {subtitle && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-[var(--forge-text-secondary)]"
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    );
}
