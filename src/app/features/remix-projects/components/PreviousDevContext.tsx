"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ChevronDown, ChevronUp, AlertCircle, Clock, Zap } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { DeveloperPersona } from "../lib/types";

interface PreviousDevContextProps {
    developer: DeveloperPersona;
    projectHistory: string;
    variant?: "compact" | "full";
}

export const PreviousDevContext: React.FC<PreviousDevContextProps> = ({
    developer,
    projectHistory,
    variant = "compact",
}) => {
    const [isExpanded, setIsExpanded] = useState(variant === "full");

    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-gradient-to-br from-[var(--forge-bg-elevated)] to-[var(--forge-warning)]/5",
                elevation.elevated
            )}
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{developer.avatar}</div>
                    <div>
                        <h4 className="font-medium text-[var(--forge-text-primary)] flex items-center gap-2">
                            <User size={ICON_SIZES.sm} className="text-[var(--forge-warning)]" />
                            Previous Developer Context
                        </h4>
                        <p className="text-sm text-[var(--forge-text-muted)]">
                            {developer.name} - {developer.experience}
                        </p>
                    </div>
                </div>
                <div className="text-[var(--forge-text-muted)]">
                    {isExpanded ? (
                        <ChevronUp size={ICON_SIZES.md} />
                    ) : (
                        <ChevronDown size={ICON_SIZES.md} />
                    )}
                </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-4">
                            {/* Backstory */}
                            <div className="p-3 rounded-lg bg-[var(--forge-bg-anvil)]">
                                <p className="text-sm text-[var(--forge-text-secondary)] italic">
                                    "{developer.backstory}"
                                </p>
                            </div>

                            {/* Developer traits */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <TraitCard
                                    icon={Zap}
                                    title="Coding Style"
                                    content={developer.style}
                                    color="blue"
                                />
                                <TraitCard
                                    icon={Clock}
                                    title="Constraints"
                                    content={developer.timeConstraints}
                                    color="purple"
                                />
                            </div>

                            {/* Known weaknesses */}
                            <div>
                                <h5 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase mb-2 flex items-center gap-1">
                                    <AlertCircle size={ICON_SIZES.xs} className="text-[var(--forge-warning)]" />
                                    Known Weaknesses
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {developer.knownWeaknesses.map((weakness, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 rounded-lg text-xs bg-[var(--forge-warning)]/10 text-[var(--forge-warning)] border border-[var(--forge-warning)]/20"
                                        >
                                            {weakness}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Project history */}
                            {projectHistory && (
                                <div className="p-3 rounded-lg bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]">
                                    <h5 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase mb-1">
                                        Project History
                                    </h5>
                                    <p className="text-sm text-[var(--forge-text-secondary)]">
                                        {projectHistory}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Trait card component
interface TraitCardProps {
    icon: React.ElementType;
    title: string;
    content: string;
    color: "blue" | "purple" | "amber";
}

const TraitCard: React.FC<TraitCardProps> = ({ icon: Icon, title, content, color }) => {
    const colorClasses = {
        blue: "text-[var(--forge-info)] bg-[var(--forge-info)]/10",
        purple: "text-[var(--ember)] bg-[var(--ember)]/10",
        amber: "text-[var(--forge-warning)] bg-[var(--forge-warning)]/10",
    }[color];

    return (
        <div className="p-3 rounded-lg bg-[var(--forge-bg-anvil)]">
            <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1 rounded", colorClasses)}>
                    <Icon size={ICON_SIZES.sm} />
                </div>
                <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase">
                    {title}
                </span>
            </div>
            <p className="text-sm text-[var(--forge-text-secondary)]">{content}</p>
        </div>
    );
};

// Inline version for compact displays
interface InlineDevContextProps {
    developer: DeveloperPersona;
}

export const InlineDevContext: React.FC<InlineDevContextProps> = ({ developer }) => {
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--forge-warning)]/10 border border-[var(--forge-warning)]/20">
            <span className="text-xl">{developer.avatar}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--forge-warning)] font-medium">{developer.name}</p>
                <p className="text-xs text-[var(--forge-text-muted)] truncate italic">
                    "{developer.timeConstraints}"
                </p>
            </div>
        </div>
    );
};
