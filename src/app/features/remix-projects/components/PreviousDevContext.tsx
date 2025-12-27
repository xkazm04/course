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
                "rounded-xl border border-[var(--border-default)]",
                "bg-gradient-to-br from-[var(--surface-elevated)] to-amber-500/5",
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
                        <h4 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                            <User size={ICON_SIZES.sm} className="text-amber-400" />
                            Previous Developer Context
                        </h4>
                        <p className="text-sm text-[var(--text-muted)]">
                            {developer.name} - {developer.experience}
                        </p>
                    </div>
                </div>
                <div className="text-[var(--text-muted)]">
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
                            <div className="p-3 rounded-lg bg-[var(--surface-overlay)]">
                                <p className="text-sm text-[var(--text-secondary)] italic">
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
                                <h5 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2 flex items-center gap-1">
                                    <AlertCircle size={ICON_SIZES.xs} className="text-amber-400" />
                                    Known Weaknesses
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {developer.knownWeaknesses.map((weakness, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        >
                                            {weakness}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Project history */}
                            {projectHistory && (
                                <div className="p-3 rounded-lg bg-[var(--surface-base)] border border-[var(--border-subtle)]">
                                    <h5 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                                        Project History
                                    </h5>
                                    <p className="text-sm text-[var(--text-secondary)]">
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
        blue: "text-blue-400 bg-blue-500/10",
        purple: "text-purple-400 bg-purple-500/10",
        amber: "text-amber-400 bg-amber-500/10",
    }[color];

    return (
        <div className="p-3 rounded-lg bg-[var(--surface-overlay)]">
            <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1 rounded", colorClasses)}>
                    <Icon size={ICON_SIZES.sm} />
                </div>
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase">
                    {title}
                </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{content}</p>
        </div>
    );
};

// Inline version for compact displays
interface InlineDevContextProps {
    developer: DeveloperPersona;
}

export const InlineDevContext: React.FC<InlineDevContextProps> = ({ developer }) => {
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-xl">{developer.avatar}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-400 font-medium">{developer.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate italic">
                    "{developer.timeConstraints}"
                </p>
            </div>
        </div>
    );
};
