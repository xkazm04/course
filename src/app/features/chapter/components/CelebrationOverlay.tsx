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
        color: "text-yellow-400",
        bgColor: "from-yellow-900/30 via-amber-900/20 to-orange-900/30",
        borderColor: "border-yellow-600/30",
        title: "Great Progress!",
        emojis: ["⭐", "✨", "🌟"],
    },
    streak: {
        icon: Zap,
        color: "text-orange-400",
        bgColor: "from-orange-900/30 via-red-900/20 to-pink-900/30",
        borderColor: "border-orange-600/30",
        title: "Streak Active!",
        emojis: ["🔥", "⚡", "💫"],
    },
    mastery: {
        icon: Trophy,
        color: "text-purple-400",
        bgColor: "from-purple-900/30 via-indigo-900/20 to-blue-900/30",
        borderColor: "border-purple-600/30",
        title: "Mastery Achieved!",
        emojis: ["🏆", "👑", "💎"],
    },
    speed: {
        icon: Sparkles,
        color: "text-cyan-400",
        bgColor: "from-cyan-900/30 via-teal-900/20 to-emerald-900/30",
        borderColor: "border-cyan-600/30",
        title: "Speed Bonus!",
        emojis: ["🚀", "💨", "⚡"],
    },
    completion: {
        icon: Award,
        color: "text-green-400",
        bgColor: "from-green-900/30 via-emerald-900/20 to-teal-900/30",
        borderColor: "border-green-600/30",
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
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors z-10"
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
                                        "bg-gradient-to-br from-slate-800 to-slate-900",
                                        "border border-slate-700/50"
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
                                className={cn("text-2xl font-bold mb-2", config.color)}
                            >
                                {config.title}
                            </motion.h3>

                            {/* Message */}
                            {message && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-slate-300 leading-relaxed"
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
                                    "mt-6 px-6 py-2.5 rounded-lg font-medium",
                                    "bg-gradient-to-r from-slate-700 to-slate-800",
                                    "border border-slate-600/50",
                                    "text-slate-200 hover:text-white",
                                    "hover:from-slate-600 hover:to-slate-700",
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
                                config.color.replace("text-", "bg-").replace("400", "600")
                            )}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CelebrationOverlay;
