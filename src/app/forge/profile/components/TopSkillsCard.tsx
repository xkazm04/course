"use client";

import { motion } from "framer-motion";
import { Crown, TrendingUp } from "lucide-react";
import { getTopSkills } from "./mockData";
import type { Skill } from "./types";

function SkillCrowns({ count, max = 5 }: { count: number; max?: number }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: max }, (_, i) => (
                <Crown
                    key={i}
                    size={10}
                    className={i < count
                        ? "fill-[var(--gold)] text-[var(--gold)]"
                        : "fill-[var(--forge-border-subtle)] text-[var(--forge-text-muted)]"
                    }
                />
            ))}
        </div>
    );
}

function ProgressRing({ progress, size = 36 }: { progress: number; size?: number }) {
    const radius = (size - 6) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={3}
                    className="stroke-[var(--forge-border-subtle)]"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={3}
                    strokeLinecap="round"
                    stroke="url(#ring-gradient)"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
                <defs>
                    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--ember)" />
                        <stop offset="100%" stopColor="var(--gold)" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

function SkillItem({ skill, rank, delay }: { skill: Skill; rank: number; delay: number }) {
    const progress = (skill.currentXp / skill.maxXp) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--forge-bg-elevated)] hover:bg-[var(--forge-bg-bench)] transition-colors"
        >
            {/* Rank badge */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--ember)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {rank}
            </div>

            {/* Skill info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--forge-text-primary)] truncate">
                        {skill.name}
                    </span>
                    <SkillCrowns count={skill.crowns} />
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">
                    {skill.currentXp.toLocaleString()} XP
                </div>
            </div>

            {/* Progress ring */}
            <ProgressRing progress={progress} />
        </motion.div>
    );
}

export function TopSkillsCard() {
    const topSkills = getTopSkills(5);

    return (
        <section className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--forge-text-primary)] flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--forge-success)]" />
                    Top Skills
                </h2>
                <span className="text-xs text-[var(--forge-text-muted)]">By XP</span>
            </div>

            <div className="space-y-2">
                {topSkills.map((skill, index) => (
                    <SkillItem
                        key={skill.id}
                        skill={skill}
                        rank={index + 1}
                        delay={0.1 + index * 0.08}
                    />
                ))}
            </div>
        </section>
    );
}
