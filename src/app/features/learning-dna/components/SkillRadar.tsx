"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Radar, Brain, Star } from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { DerivedSkillProficiency } from "../lib/types";

interface SkillRadarProps {
    skills: DerivedSkillProficiency[];
    maxSkills?: number;
    className?: string;
}

const PROFICIENCY_COLORS: Record<DerivedSkillProficiency["proficiency"], string> = {
    beginner: "var(--color-orange)",
    intermediate: "var(--color-amber)",
    advanced: "var(--color-cyan)",
    expert: "var(--color-emerald)",
};

const PROFICIENCY_LABELS: Record<DerivedSkillProficiency["proficiency"], string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
};

/**
 * Skill Radar - Displays derived skills with confidence scores
 */
export function SkillRadar({ skills, maxSkills = 8, className }: SkillRadarProps) {
    const displaySkills = useMemo(() => {
        return skills.slice(0, maxSkills);
    }, [skills, maxSkills]);

    const avgConfidence = useMemo(() => {
        if (displaySkills.length === 0) return 0;
        return Math.round(
            displaySkills.reduce((acc, s) => acc + s.confidence, 0) / displaySkills.length
        );
    }, [displaySkills]);

    if (displaySkills.length === 0) {
        return (
            <PrismaticCard glowColor="cyan" className={className}>
                <div className="p-6 text-center" data-testid="skill-radar-empty">
                    <Brain
                        size={ICON_SIZES.xl}
                        className="mx-auto mb-4 text-[var(--text-muted)]"
                    />
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                        No Skills Detected
                    </h3>
                    <p className="text-sm text-[var(--text-muted-high)]">
                        Connect platforms to discover your verified skills
                    </p>
                </div>
            </PrismaticCard>
        );
    }

    return (
        <PrismaticCard glowColor="cyan" className={className}>
            <div className="p-6" data-testid="skill-radar-card">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, var(--color-cyan), var(--color-indigo))`,
                            }}
                        >
                            <Radar size={ICON_SIZES.md} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--text-primary)]">
                                Verified Skills
                            </h3>
                            <p className="text-xs text-[var(--text-muted-high)]">
                                {avgConfidence}% avg confidence
                            </p>
                        </div>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-muted-high)]">
                        {skills.length} skills
                    </span>
                </div>

                {/* Skills List */}
                <div className="space-y-3">
                    {displaySkills.map((skill, i) => (
                        <motion.div
                            key={skill.skillId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group"
                            data-testid={`skill-item-${skill.skillId}`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Skill Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-[var(--text-primary)] truncate">
                                            {skill.skillName}
                                        </span>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: `color-mix(in srgb, ${PROFICIENCY_COLORS[skill.proficiency]} 20%, transparent)`,
                                                color: PROFICIENCY_COLORS[skill.proficiency],
                                            }}
                                        >
                                            {PROFICIENCY_LABELS[skill.proficiency]}
                                        </span>
                                    </div>

                                    {/* Sources */}
                                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                        {skill.sources.slice(0, 3).map((source, j) => (
                                            <span
                                                key={j}
                                                className="px-1.5 py-0.5 rounded bg-[var(--surface-inset)]"
                                            >
                                                {source.platform}
                                            </span>
                                        ))}
                                        {skill.sources.length > 3 && (
                                            <span className="text-[var(--text-muted)]">
                                                +{skill.sources.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Confidence Score */}
                                <div className="w-20 text-right">
                                    <div className="flex items-center justify-end gap-1 mb-1">
                                        <Star
                                            size={ICON_SIZES.xs}
                                            style={{ color: PROFICIENCY_COLORS[skill.proficiency] }}
                                        />
                                        <span
                                            className="font-bold text-sm"
                                            style={{ color: PROFICIENCY_COLORS[skill.proficiency] }}
                                        >
                                            {skill.confidence}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Confidence Bar */}
                            <div className="mt-2 h-1 bg-[var(--surface-inset)] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        backgroundColor: PROFICIENCY_COLORS[skill.proficiency],
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.confidence}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Show More */}
                {skills.length > maxSkills && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                        <button
                            className="w-full text-center text-sm text-[var(--color-cyan)] hover:underline"
                            data-testid="skill-radar-show-more-btn"
                        >
                            View all {skills.length} skills
                        </button>
                    </div>
                )}

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex flex-wrap gap-3 justify-center">
                        {(Object.keys(PROFICIENCY_LABELS) as DerivedSkillProficiency["proficiency"][]).map(
                            (level) => (
                                <div key={level} className="flex items-center gap-1.5">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: PROFICIENCY_COLORS[level] }}
                                    />
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {PROFICIENCY_LABELS[level]}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </PrismaticCard>
    );
}
