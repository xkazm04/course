"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Atom, FileType, Palette, Layers, Server, Code2, Code, Database,
    GitBranch, Box, Smartphone, TestTube, Figma, Wrench, Cloud, Users,
    Flame
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Skill, SKILL_LEVEL_CONFIG } from "../lib/types";
import { ProgressRing } from "./ProgressRing";
import { SkillCrown } from "./SkillCrown";
import {
    GRADIENT_COLORS,
    getGlowColor,
    toExtendedColor,
} from "@/app/shared/lib/learningDomains";

interface SkillCardProps {
    skill: Skill;
    index?: number;
    onClick?: () => void;
    compact?: boolean;
    className?: string;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Atom, FileType, Palette, Layers, Server, Code2, Code, Database,
    GitBranch, Box, Smartphone, TestTube, Figma, Wrench, Cloud, Users,
};

export const SkillCard = ({
    skill,
    index = 0,
    onClick,
    compact = false,
    className,
}: SkillCardProps) => {
    const Icon = iconMap[skill.icon] || Code;
    const progress = (skill.currentXp / skill.maxXp) * 100;
    const levelConfig = SKILL_LEVEL_CONFIG[skill.level];
    const skillColor = toExtendedColor(skill.color);

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={className}
            >
                <button
                    onClick={onClick}
                    className="w-full"
                    data-testid={`skill-card-compact-${skill.id}`}
                >
                    <PrismaticCard
                        glowColor={getGlowColor(skillColor)}
                        className="cursor-pointer"
                    >
                        <div className="p-4 flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shrink-0",
                                GRADIENT_COLORS[skillColor]
                            )}>
                                <Icon size={ICON_SIZES.md} />
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {skill.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-xs font-semibold",
                                        levelConfig.color === "slate" && "text-slate-600 dark:text-slate-400",
                                        levelConfig.color === "indigo" && "text-indigo-600 dark:text-indigo-400",
                                        levelConfig.color === "purple" && "text-purple-600 dark:text-purple-400",
                                        levelConfig.color === "emerald" && "text-emerald-600 dark:text-emerald-400"
                                    )}>
                                        {levelConfig.label}
                                    </span>
                                    <SkillCrown crowns={skill.crowns} size="sm" />
                                </div>
                            </div>

                            <ProgressRing
                                progress={progress}
                                size="sm"
                                color={skill.color}
                                showPercentage={false}
                            >
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    {Math.round(progress)}%
                                </span>
                            </ProgressRing>
                        </div>
                    </PrismaticCard>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={className}
        >
            <button
                onClick={onClick}
                className="w-full text-left"
                data-testid={`skill-card-${skill.id}`}
            >
                <PrismaticCard
                    glowColor={getGlowColor(skillColor)}
                    className="h-full cursor-pointer"
                >
                    <div className="p-5 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white",
                                GRADIENT_COLORS[skillColor]
                            )}>
                                <Icon size={ICON_SIZES.lg} />
                            </div>
                            <SkillCrown crowns={skill.crowns} size="md" />
                        </div>

                        {/* Title & Level */}
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                            {skill.name}
                        </h3>
                        <span className={cn(
                            "inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-bold mb-3",
                            levelConfig.color === "slate" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                            levelConfig.color === "indigo" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
                            levelConfig.color === "purple" && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                            levelConfig.color === "emerald" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        )}>
                            {levelConfig.label}
                        </span>

                        {/* Description */}
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-grow">
                            {skill.description}
                        </p>

                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Progress</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {skill.currentXp} / {skill.maxXp} XP
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    className={cn(
                                        "h-full rounded-full bg-gradient-to-r",
                                        GRADIENT_COLORS[skillColor]
                                    )}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                                />
                            </div>
                        </div>

                        {/* Streak */}
                        {skill.streak > 0 && (
                            <div className="flex items-center gap-1.5 mt-3 text-xs text-orange-600 dark:text-orange-400">
                                <Flame size={ICON_SIZES.sm} className="fill-orange-500" />
                                <span className="font-bold">{skill.streak} day streak</span>
                            </div>
                        )}
                    </div>
                </PrismaticCard>
            </button>
        </motion.div>
    );
};
