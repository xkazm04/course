"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Clock, Users, TrendingUp } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { Challenge } from "../../lib/types";
import { difficultyColors, typeEmojis } from "./constants";
import { forgeEasing, staggerDelay } from "../../lib/animations";

interface ChallengeRowProps {
    challenge: Challenge;
    index: number;
}

// Difficulty icons
const difficultyIcons: Record<string, string> = {
    beginner: "🌱",
    intermediate: "🔥",
    advanced: "💎",
};

export function ChallengeRow({ challenge, index }: ChallengeRowProps) {
    const successRate = Math.round((challenge.successRate || 0) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
                delay: staggerDelay(index, 0.03),
                duration: 0.3,
                ease: forgeEasing,
            }}
        >
            <Link
                href={`/forge/challenges/${challenge.id}`}
                className={cn(
                    "group flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                    "hover:bg-gradient-to-r hover:from-[var(--ember)]/5 hover:to-transparent",
                    "border-l-2 border-l-transparent",
                    challenge.difficulty === "beginner" && "hover:border-l-[var(--forge-success)]",
                    challenge.difficulty === "intermediate" && "hover:border-l-[var(--gold)]",
                    challenge.difficulty === "advanced" && "hover:border-l-[var(--forge-error)]",
                    index % 2 === 0 ? "bg-[var(--forge-bg-daylight)]/30" : "bg-transparent"
                )}
                data-testid={`challenge-row-${challenge.id}`}
            >
                {/* Type Icon */}
                <motion.div
                    className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                        "bg-[var(--forge-bg-elevated)] group-hover:scale-110 transition-transform"
                    )}
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                >
                    {typeEmojis[challenge.type]}
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[var(--forge-text-primary)] group-hover:text-[var(--ember)] transition-colors truncate">
                            {challenge.title}
                        </h3>
                        <span className={cn(
                            "flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                            difficultyColors[challenge.difficulty]
                        )}>
                            <span>{difficultyIcons[challenge.difficulty]}</span>
                            <span className="capitalize">{challenge.difficulty}</span>
                        </span>
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center gap-4 text-sm text-[var(--forge-text-muted)]">
                        <span className="truncate">{challenge.projectName}</span>
                        <span className="flex-shrink-0 capitalize text-[var(--forge-text-secondary)]">
                            {challenge.type}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    {/* XP */}
                    <div className="flex items-center gap-1.5" title="XP Reward">
                        <Zap size={14} className="text-[var(--gold)]" />
                        <span className="text-sm font-semibold text-[var(--ember)]">
                            +{challenge.xpReward}
                        </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-[var(--forge-text-muted)]" title="Estimated Time">
                        <Clock size={14} />
                        <span className="text-sm">{challenge.estimatedMinutes}m</span>
                    </div>

                    {/* Success Rate */}
                    <div
                        className={cn(
                            "flex items-center gap-1.5",
                            successRate >= 70 ? "text-[var(--forge-success)]" :
                            successRate >= 40 ? "text-[var(--gold)]" : "text-[var(--forge-text-muted)]"
                        )}
                        title="Success Rate"
                    >
                        <TrendingUp size={14} />
                        <span className="text-sm font-medium">{successRate}%</span>
                    </div>
                </div>

                {/* Arrow */}
                <motion.div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-transparent group-hover:bg-[var(--ember)]/10 transition-colors"
                    whileHover={{ x: 4 }}
                >
                    <ArrowRight
                        size={18}
                        className="text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] transition-colors"
                    />
                </motion.div>
            </Link>
        </motion.div>
    );
}
