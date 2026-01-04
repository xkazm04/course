"use client";

import { motion } from "framer-motion";
import { Hammer, Star, TrendingUp } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface Skill {
    id: string;
    name: string;
    category: string;
    proficiency: string;
    xpEarned: number;
}

interface SkillsOverviewProps {
    skills: Skill[];
}

const PROFICIENCY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    novice: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-400/30" },
    beginner: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
    intermediate: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    advanced: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    expert: { bg: "bg-[var(--gold)]/10", text: "text-[var(--gold)]", border: "border-[var(--gold)]/30" },
};

function SkillBar({ skill, index }: { skill: Skill; index: number }) {
    const colors = PROFICIENCY_COLORS[skill.proficiency] || PROFICIENCY_COLORS.novice;
    const proficiencyPercent = {
        novice: 20,
        beginner: 40,
        intermediate: 60,
        advanced: 80,
        expert: 100,
    }[skill.proficiency] || 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={cn(
                "p-3 rounded-xl border transition-all",
                colors.border,
                colors.bg
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--forge-text-primary)]">
                        {skill.name}
                    </span>
                    <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
                        colors.bg,
                        colors.text
                    )}>
                        {skill.proficiency}
                    </span>
                </div>
                <span className="text-xs text-[var(--forge-text-muted)]">
                    {skill.xpEarned.toLocaleString()} XP
                </span>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--forge-bg-bench)]">
                    <motion.div
                        className={cn("h-full rounded-full", colors.text.replace("text-", "bg-"))}
                        initial={{ width: 0 }}
                        animate={{ width: `${proficiencyPercent}%` }}
                        transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    />
                </div>
                <span className="text-xs text-[var(--forge-text-muted)] w-8 text-right">
                    {proficiencyPercent}%
                </span>
            </div>

            <p className="text-[10px] text-[var(--forge-text-muted)] mt-1">
                {skill.category}
            </p>
        </motion.div>
    );
}

export function SkillsOverview({ skills }: SkillsOverviewProps) {
    if (skills.length === 0) {
        return null;
    }

    // Sort by XP earned
    const sortedSkills = [...skills].sort((a, b) => b.xpEarned - a.xpEarned);
    const topSkills = sortedSkills.slice(0, 5);

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden"
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[var(--forge-success)]/10">
                            <Hammer className="w-5 h-5 text-[var(--forge-success)]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--forge-text-primary)]">
                                Top Skills
                            </h3>
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                Your strongest areas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{skills.length} skills tracked</span>
                    </div>
                </div>

                {/* Skills List */}
                <div className="space-y-3">
                    {topSkills.map((skill, index) => (
                        <SkillBar key={skill.id} skill={skill} index={index} />
                    ))}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-[var(--forge-border-subtle)]">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--forge-text-muted)]">Total Skill XP</span>
                        <span className="font-semibold text-[var(--forge-text-primary)] flex items-center gap-1">
                            <Star className="w-4 h-4 text-[var(--gold)]" />
                            {skills.reduce((sum, s) => sum + s.xpEarned, 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
