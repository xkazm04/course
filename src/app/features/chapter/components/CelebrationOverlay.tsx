/**
 * Celebration Overlay Component
 *
 * Shows celebration animations when learner achieves milestones
 * as triggered by the AI Learning Conductor.
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Star, Sparkles, Trophy, Zap, X } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface CelebrationOverlayProps {
    isVisible: boolean;
    message?: string | null;
    type?: "progress" | "streak" | "mastery" | "speed" | "completion";
    onDismiss?: () => void;
    autoDismissMs?: number;
    className?: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    emoji: string;
}

// ============================================================================
// Celebration Types Configuration
// ============================================================================

const CELEBRATION_CONFIGS = {
    progress: {
        icon: Star,
        color: "text-[var(--gold)]",
        bgColor: "from-[var(--gold)]/30 via-[var(--forge-warning)]/20 to-[var(--ember)]/30",
        borderColor: "border-[var(--gold)]/30",
        title: "Great Progress!",
        emojis: ["⭐", "✨", "🌟"],
    },
    streak: {
        icon: Zap,
        color: "text-[var(--ember)]",
        bgColor: "from-[var(--ember)]/30 via-[var(--forge-error)]/20 to-[var(--ember-glow)]/30",
        borderColor: "border-[var(--ember)]/30",
        title: "Streak Active!",
        emojis: ["🔥", "⚡", "💫"],
    },
    mastery: {
        icon: Trophy,
        color: "text-[var(--ember-glow)]",
        bgColor: "from-[var(--ember-glow)]/30 via-[var(--forge-info)]/20 to-[var(--forge-info)]/30",
        borderColor: "border-[var(--ember-glow)]/30",
        title: "Mastery Achieved!",
        emojis: ["🏆", "👑", "💎"],
    },
    speed: {
        icon: Sparkles,
        color: "text-[var(--forge-info)]",
        bgColor: "from-[var(--forge-info)]/30 via-[var(--forge-success)]/20 to-[var(--forge-success)]/30",
        borderColor: "border-[var(--forge-info)]/30",
        title: "Speed Bonus!",
        emojis: ["🚀", "💨", "⚡"],
    },
    completion: {
        icon: Award,
        color: "text-[var(--forge-success)]",
        bgColor: "from-[var(--forge-success)]/30 via-[var(--forge-success)]/20 to-[var(--forge-info)]/30",
        borderColor: "border-[var(--forge-success)]/30",
        title: "Section Complete!",
        emojis: ["🎉", "🎊", "✅"],
    },
};

// ============================================================================
// Particles Component
// ============================================================================

function CelebrationParticles({ emojis }: { emojis: string[] }) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F472B6"];
        const newParticles: Particle[] = [];

        for (let i = 0; i < 20; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                rotation: Math.random() * 360,
                scale: 0.5 + Math.random() * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
            });
        }

        setParticles(newParticles);
    }, [emojis]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    initial={{
                        opacity: 0,
                        x: "50%",
                        y: "50%",
                        scale: 0,
                        rotate: 0,
                    }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        x: `${particle.x}%`,
                        y: `${particle.y}%`,
                        scale: [0, particle.scale, particle.scale, 0],
                        rotate: particle.rotation,
                    }}
                    transition={{
                        duration: 2,
                        delay: Math.random() * 0.5,
                        ease: "easeOut",
                    }}
                    className="absolute text-2xl"
                    style={{ left: "50%", top: "50%" }}
                >
                    {particle.emoji}
                </motion.div>
            ))}
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function CelebrationOverlay({
    isVisible,
    message,
    type = "progress",
    onDismiss,
    autoDismissMs = 4000,
    className,
}: CelebrationOverlayProps) {
    const config = CELEBRATION_CONFIGS[type];
    const Icon = config.icon;

    // Auto-dismiss
    useEffect(() => {
        if (isVisible && autoDismissMs > 0) {
            const timer = setTimeout(() => {
                onDismiss?.();
            }, autoDismissMs);
            return () => clearTimeout(timer);
        }
    }, [isVisible, autoDismissMs, onDismiss]);

    const handleDismiss = useCallback(() => {
        onDismiss?.();
    }, [onDismiss]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                        "fixed inset-0 z-50 flex items-center justify-center p-4",
                        "bg-black/50 backdrop-blur-sm",
                        className
                    )}
                    onClick={handleDismiss}
                    data-testid="celebration-overlay"
                >
                    {/* Particles */}
                    <CelebrationParticles emojis={config.emojis} />

                    {/* Card */}
                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "relative w-full max-w-sm rounded-2xl overflow-hidden",
                            "bg-gradient-to-br",
                            config.bgColor,
                            "border",
                            config.borderColor,
                            "shadow-2xl"
                        )}
                        data-testid="celebration-card"
                    >
                        {/* Dismiss button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-[var(--forge-bg-anvil)]/50 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors z-10"
                            data-testid="celebration-dismiss-btn"
                        >
                            <X size={16} />
                        </button>

                        {/* Content */}
                        <div className="p-6 text-center">
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="inline-block mb-4"
                            >
                                <div
                                    className={cn(
                                        "p-4 rounded-2xl",
                                        "bg-gradient-to-br from-[var(--forge-bg-anvil)] to-[var(--forge-bg-void)]",
                                        "border border-[var(--forge-border-subtle)]"
                                    )}
                                >
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatType: "reverse",
                                        }}
                                    >
                                        <Icon size={48} className={config.color} />
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Title */}
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={cn("text-lg font-semibold mb-2", config.color)}
                            >
                                {config.title}
                            </motion.h3>

                            {/* Message */}
                            {message && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-sm text-[var(--forge-text-secondary)] leading-relaxed"
                                >
                                    {message}
                                </motion.p>
                            )}

                            {/* Continue button */}
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                onClick={handleDismiss}
                                className={cn(
                                    "mt-6 px-6 py-2.5 rounded-lg text-sm font-medium",
                                    "bg-gradient-to-r from-[var(--forge-bg-elevated)] to-[var(--forge-bg-anvil)]",
                                    "border border-[var(--forge-border-default)]",
                                    "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)]",
                                    "hover:from-[var(--forge-bg-anvil)] hover:to-[var(--forge-bg-elevated)]",
                                    "transition-all"
                                )}
                                data-testid="celebration-continue-btn"
                            >
                                Continue Learning
                            </motion.button>
                        </div>

                        {/* Progress indicator */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: autoDismissMs / 1000, ease: "linear" }}
                            className={cn(
                                "h-1 origin-left",
                                config.color.replace("text-", "bg-")
                            )}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CelebrationOverlay;
