"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../../layout";
import { forgeEasing, staggerDelay, textGradientEmber } from "../../lib/animations";

// ============================================================================
// Fire Particle Animation
// ============================================================================

function FireParticle({ delay, index }: { delay: number; index: number }) {
    // Seeded random for deterministic values
    const seed = (n: number) => {
        const x = Math.sin(index * 1000 + n * 999) * 10000;
        return x - Math.floor(x);
    };

    const size = useMemo(() => 3 + seed(1) * 4, [index]);
    const startX = useMemo(() => (seed(2) - 0.5) * 20, [index]);
    const endX = useMemo(() => startX + (seed(3) - 0.5) * 30, [index]);
    const duration = useMemo(() => 0.8 + seed(4) * 0.6, [index]);

    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
                width: size,
                height: size,
                background: `radial-gradient(circle, var(--gold) 0%, var(--ember) 70%, transparent 100%)`,
                boxShadow: `0 0 ${size}px var(--ember)`,
                left: "50%",
                bottom: "50%",
            }}
            initial={{ opacity: 0, y: 0, x: startX, scale: 0 }}
            animate={{
                opacity: [0, 1, 0.8, 0],
                y: [-5, -25, -40],
                x: endX,
                scale: [0, 1, 0.5, 0],
            }}
            transition={{
                duration: duration,
                delay: delay,
                repeat: Infinity,
                ease: "easeOut",
            }}
        />
    );
}

function AnimatedFlame({ size = 24, isActive = true }: { size?: number; isActive?: boolean }) {
    const particles = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

    return (
        <div className="relative">
            {isActive && (
                <div className="absolute inset-0 overflow-visible">
                    {particles.map((_, i) => (
                        <FireParticle key={i} delay={i * 0.15} index={i} />
                    ))}
                </div>
            )}
            <motion.div
                animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
            >
                <Flame size={size} className={isActive ? "text-[var(--ember)]" : "text-[var(--forge-text-muted)]"} />
            </motion.div>
        </div>
    );
}

// ============================================================================
// Day Indicator Component
// ============================================================================

interface DayIndicatorProps {
    day: string;
    isActive: boolean;
    isToday: boolean;
    index: number;
}

function DayIndicator({ day, isActive, isToday, index }: DayIndicatorProps) {
    return (
        <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: staggerDelay(index), duration: 0.3, ease: forgeEasing }}
        >
            <div className={cn(
                "text-xs mb-2 font-medium",
                isToday ? "text-[var(--ember)]" : "text-[var(--forge-text-muted)]"
            )}>
                {day}
            </div>
            <motion.div
                className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center relative",
                    isActive
                        ? "bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)]"
                        : "bg-[var(--forge-bg-elevated)]",
                    isToday && "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--forge-bg-daylight)]"
                )}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
                {isActive ? (
                    <Flame size={16} className="text-white" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-[var(--forge-text-muted)]/30" />
                )}

                {/* Glow effect for active days */}
                {isActive && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-[var(--ember)]"
                        initial={{ opacity: 0.5, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}
            </motion.div>
        </motion.div>
    );
}

// ============================================================================
// Milestone Badge
// ============================================================================

function MilestoneBadge({ streak }: { streak: number }) {
    // Calculate milestone
    const milestone = streak >= 30 ? 30 : streak >= 14 ? 14 : streak >= 7 ? 7 : 0;
    const nextMilestone = milestone === 30 ? null : milestone === 14 ? 30 : milestone === 7 ? 14 : 7;

    if (milestone === 0) return null;

    return (
        <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--gold)]/20 to-[var(--ember)]/20 border border-[var(--gold)]/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
        >
            <Trophy size={14} className="text-[var(--gold)]" />
            <span className="text-xs font-medium text-[var(--gold)]">
                {milestone} Day Milestone!
            </span>
        </motion.div>
    );
}

// ============================================================================
// Main StreakWidget Component
// ============================================================================

export function StreakWidget() {
    const { user } = useForge();
    const days = ["M", "T", "W", "T", "F", "S", "S"];

    // Mock week activity - in real app, get from API
    const activity = [true, true, true, false, true, true, true];
    const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const adjustedTodayIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Adjust to 0 = Monday

    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AnimatedFlame size={20} isActive={user.currentStreak > 0} />
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">Streak</h3>
                </div>
                <motion.div
                    className={`text-2xl font-bold ${textGradientEmber}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                    {user.currentStreak} days
                </motion.div>
            </div>

            {/* Milestone badge */}
            {user.currentStreak >= 7 && (
                <div className="mb-4">
                    <MilestoneBadge streak={user.currentStreak} />
                </div>
            )}

            {/* Week view */}
            <div className="flex justify-between">
                {days.map((day, i) => (
                    <DayIndicator
                        key={i}
                        day={day}
                        isActive={activity[i]}
                        isToday={i === adjustedTodayIndex}
                        index={i}
                    />
                ))}
            </div>

            {/* Encouragement message */}
            <motion.div
                className="mt-4 pt-4 border-t border-[var(--forge-border-subtle)] flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <Sparkles size={14} className="text-[var(--gold)]" />
                <span className="text-xs text-[var(--forge-text-muted)]">
                    {user.currentStreak >= 7
                        ? "Amazing! Keep the fire burning!"
                        : user.currentStreak >= 3
                            ? "Great progress! You're building momentum."
                            : "Complete a challenge today to start your streak!"}
                </span>
            </motion.div>
        </motion.div>
    );
}
