"use client";

/**
 * SkillOverlapViz Component
 *
 * Visualizes skill overlap between selected learning paths.
 * Shows unique skills per path and shared skills in a Venn-diagram style layout.
 */

import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Target } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { ExtendedPathComparisonData, CombinedPathAnalysis } from "../lib/types";
import {
    toDomainColor,
    BG_COLORS,
} from "@/app/shared/lib/learningDomains";

interface SkillOverlapVizProps {
    /** Extended comparison data with skill analysis */
    comparisonData: ExtendedPathComparisonData[];
    /** Combined path analysis */
    combinedAnalysis: CombinedPathAnalysis;
}

const SkillBadge: React.FC<{
    skill: string;
    variant: "unique" | "shared";
    pathColor?: string;
    animationDelay?: number;
}> = ({ skill, variant, pathColor, animationDelay = 0 }) => (
    <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: animationDelay, duration: 0.2 }}
        className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
            variant === "shared"
                ? "bg-[var(--ember)]/10 text-[var(--ember)] border border-[var(--ember)]/20"
                : pathColor
                  ? `${BG_COLORS[pathColor as keyof typeof BG_COLORS] || "bg-[var(--forge-text-muted)]"} text-white`
                  : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)]"
        )}
    >
        {variant === "shared" && <Sparkles size={ICON_SIZES.xs} />}
        {skill}
    </motion.span>
);

export const SkillOverlapViz: React.FC<SkillOverlapVizProps> = ({
    comparisonData,
    combinedAnalysis,
}) => {
    const { overlappingSkills, totalUniqueSkills } = combinedAnalysis;

    return (
        <div
            className="space-y-6 p-4 bg-[var(--forge-bg-anvil)] rounded-xl"
            data-testid="skill-overlap-viz"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target size={ICON_SIZES.md} className="text-[var(--ember)]" />
                    <h3 className="text-lg font-bold text-[var(--forge-text-primary)]">
                        Skill Overlap Analysis
                    </h3>
                </div>
                <div className="text-sm text-[var(--forge-text-muted)]">
                    {totalUniqueSkills.length} total unique skills
                </div>
            </div>

            {/* Shared Skills Section */}
            {overlappingSkills.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                        <span className="text-sm font-semibold text-[var(--forge-text-secondary)]">
                            Shared Skills ({overlappingSkills.length})
                        </span>
                        <span className="text-xs text-[var(--forge-text-muted)]">
                            - Skills that transfer between paths
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2" data-testid="shared-skills-list">
                        {overlappingSkills.map((skill, i) => (
                            <SkillBadge
                                key={skill}
                                skill={skill}
                                variant="shared"
                                animationDelay={i * 0.05}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Per-Path Unique Skills */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)` }}>
                {comparisonData.map((data, pathIndex) => {
                    const pathColor = toDomainColor(data.path.color);
                    return (
                        <div
                            key={data.path.id}
                            className="space-y-2"
                            data-testid={`path-skills-${data.path.id}`}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "w-3 h-3 rounded-full",
                                        BG_COLORS[pathColor]
                                    )}
                                />
                                <span className="text-sm font-semibold text-[var(--forge-text-primary)]">
                                    {data.path.name.split(' ')[0]}
                                </span>
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    ({data.skillAnalysis.uniqueSkills.length} unique)
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {data.skillAnalysis.uniqueSkills.map((skill, i) => (
                                    <SkillBadge
                                        key={skill}
                                        skill={skill}
                                        variant="unique"
                                        pathColor={pathColor}
                                        animationDelay={pathIndex * 0.1 + i * 0.03}
                                    />
                                ))}
                                {data.skillAnalysis.uniqueSkills.length === 0 && (
                                    <span className="text-xs text-[var(--forge-text-muted)] italic">
                                        All skills shared with other paths
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-3 border-t border-[var(--forge-border-default)] text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[var(--ember)]/10 border border-[var(--ember)]/20 rounded text-[var(--ember)]">
                        Shared
                    </span>
                    <span className="text-[var(--forge-text-muted)]">= Transferable between paths</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-gradient-forge text-white rounded">
                        Unique
                    </span>
                    <span className="text-[var(--forge-text-muted)]">= Path-specific skill</span>
                </div>
            </div>
        </div>
    );
};

export default SkillOverlapViz;
