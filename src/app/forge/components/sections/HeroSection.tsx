"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForge } from "../../layout";
import { ForgeGlowButton } from "../ForgeGlowButton";

// ============================================================================
// ANIMATED COUNTER HOOK
// ============================================================================

interface UseAnimatedCounterOptions {
    target: number;
    duration?: number;
    increment?: number;
    startOnMount?: boolean;
}

function useAnimatedCounter({
    target,
    duration = 2000,
    increment = 1,
    startOnMount = true,
}: UseAnimatedCounterOptions) {
    const [count, setCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!startOnMount || target === 0) return;

        setIsAnimating(true);
        const startTime = Date.now();
        const startValue = 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);

            // Calculate current value, snapping to increment steps
            const currentValue = Math.floor((startValue + (target - startValue) * eased) / increment) * increment;
            setCount(Math.min(currentValue, target));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setCount(target);
                setIsAnimating(false);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [target, duration, increment, startOnMount]);

    return { count, isAnimating };
}

// ============================================================================
// STATS HOOK
// ============================================================================

interface PlatformStats {
    users: number;
    paths: number;
    chapters: number;
}

function usePlatformStats() {
    const [stats, setStats] = useState<PlatformStats>({ users: 0, paths: 0, chapters: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/stats");
                if (response.ok) {
                    const data = await response.json();
                    setStats({
                        users: data.users || 0,
                        paths: data.paths || 0,
                        chapters: data.chapters || 0,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, isLoading };
}

// ============================================================================
// STAT ITEM COMPONENT
// ============================================================================

interface StatItemProps {
    value: number;
    label: string;
    suffix?: string;
    increment?: number;
    isLoading?: boolean;
}

function StatItem({ value, label, suffix = "", increment = 1, isLoading = false }: StatItemProps) {
    const { count } = useAnimatedCounter({
        target: value,
        duration: 2500,
        increment,
        startOnMount: !isLoading && value > 0,
    });

    const displayValue = isLoading ? "..." : value > 0 ? `${count.toLocaleString()}${suffix}` : "0";

    return (
        <div className="text-center">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-[var(--forge-text-secondary)]">
                {displayValue}
            </div>
            <div className="text-sm text-[var(--forge-text-muted)]">{label}</div>
        </div>
    );
}

// ============================================================================
// HERO SECTION
// ============================================================================

export function HeroSection() {
    const { isNewUser } = useForge();
    const { stats, isLoading } = usePlatformStats();

    return (
        <section className="relative pt-24 sm:pt-32 pb-16">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
                    >
                        Content Forged by{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ember)] via-[var(--gold)] to-[var(--ember-glow)]">
                            Your Decision
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg sm:text-xl text-[var(--forge-text-secondary)] mb-10 max-w-2xl mx-auto"
                    >
                        Courses platform generating content per your need in real-time,
                        adapting to your skill level and goals.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
                    >
                        <ForgeGlowButton href={isNewUser ? "/forge/onboarding" : "/forge"}>
                            {isNewUser ? "Start Learning" : "Continue Learning"}
                        </ForgeGlowButton>
                        <Link
                            href="/forge/projects"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm border border-[var(--forge-border-subtle)] text-[var(--forge-text-primary)] font-medium hover:border-[var(--ember)]/30 transition-all"
                        >
                            Explore Courses
                        </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-[var(--forge-border-subtle)]"
                    >
                        <div className="text-center">
                            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-[var(--forge-text-secondary)]">
                                AI-Powered
                            </div>
                            <div className="text-sm text-[var(--forge-text-muted)]">Course Generation</div>
                        </div>
                        <StatItem
                            value={stats.paths}
                            label="Learning Paths"
                            suffix="+"
                            increment={1}
                            isLoading={isLoading}
                        />
                        <StatItem
                            value={stats.users}
                            label="Learners"
                            suffix="+"
                            increment={1}
                            isLoading={isLoading}
                        />
                        <StatItem
                            value={stats.chapters}
                            label="Chapters"
                            suffix="+"
                            increment={10}
                            isLoading={isLoading}
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
