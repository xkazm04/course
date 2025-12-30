"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Building2,
    MapPin,
    Brain,
    MessageSquare,
    Clock,
    DollarSign,
    ChevronDown,
    ChevronUp,
    Briefcase,
    Zap,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ClientPersona, ARCHETYPE_CONFIG } from "../lib/types";

interface ClientProfileProps {
    persona: ClientPersona;
    compact?: boolean;
    showDetails?: boolean;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({
    persona,
    compact = false,
    showDetails = true,
}) => {
    const [isExpanded, setIsExpanded] = useState(!compact);
    const archetypeConfig = ARCHETYPE_CONFIG[persona.archetype];

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <div className="text-3xl">{persona.avatar}</div>
                <div>
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">{persona.name}</h3>
                    <p className="text-xs text-[var(--forge-text-muted)]">
                        {persona.role} at {persona.industry.name}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            layout
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] overflow-hidden",
                elevation.elevated
            )}
        >
            {/* Header */}
            <div className="p-4">
                <div className="flex items-start gap-4">
                    <div className="text-5xl">{persona.avatar}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg text-[var(--forge-text-primary)]">
                                {persona.name}
                            </h3>
                            <ArchetypeBadge archetype={persona.archetype} />
                        </div>
                        <p className="text-sm text-[var(--forge-text-secondary)]">
                            {persona.role}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--forge-text-muted)]">
                            <span className="flex items-center gap-1">
                                <Building2 size={ICON_SIZES.xs} />
                                {persona.industry.name}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin size={ICON_SIZES.xs} />
                                {persona.location}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <QuickStat
                        icon={<Brain size={ICON_SIZES.sm} />}
                        label="Tech Level"
                        value={`${persona.technicalLiteracy}/5`}
                        color="ember"
                    />
                    <QuickStat
                        icon={<Clock size={ICON_SIZES.sm} />}
                        label="Patience"
                        value={persona.patience}
                        color={persona.patience === "low" ? "error" : persona.patience === "high" ? "success" : "warning"}
                    />
                    <QuickStat
                        icon={<DollarSign size={ICON_SIZES.sm} />}
                        label="Budget"
                        value={persona.budgetSensitivity}
                        color={persona.budgetSensitivity === "strict" ? "error" : persona.budgetSensitivity === "flexible" ? "success" : "warning"}
                    />
                </div>
            </div>

            {/* Expandable details */}
            {showDetails && (
                <>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full px-4 py-2 flex items-center justify-between text-sm text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)] transition-colors border-t border-[var(--forge-border-subtle)]"
                    >
                        <span>View full profile</span>
                        {isExpanded ? (
                            <ChevronUp size={ICON_SIZES.sm} />
                        ) : (
                            <ChevronDown size={ICON_SIZES.sm} />
                        )}
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-[var(--forge-border-subtle)] overflow-hidden"
                            >
                                <ClientProfileDetails persona={persona} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
};

// Archetype badge
interface ArchetypeBadgeProps {
    archetype: ClientPersona["archetype"];
}

const ArchetypeBadge: React.FC<ArchetypeBadgeProps> = ({ archetype }) => {
    const config = ARCHETYPE_CONFIG[archetype];

    const colorClasses: Record<string, string> = {
        amber: "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
        red: "bg-[var(--forge-error)]/20 text-[var(--forge-error)]",
        blue: "bg-[var(--forge-info)]/20 text-[var(--forge-info)]",
        emerald: "bg-[var(--forge-success)]/20 text-[var(--forge-success)]",
        purple: "bg-[var(--ember)]/20 text-[var(--ember)]",
        cyan: "bg-[var(--forge-info)]/20 text-[var(--forge-info)]",
        orange: "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
        pink: "bg-[var(--ember)]/20 text-[var(--ember)]",
    };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            colorClasses[config.color]
        )}>
            {config.label}
        </span>
    );
};

// Quick stat item
interface QuickStatProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}

const QuickStat: React.FC<QuickStatProps> = ({ icon, label, value, color }) => {
    const colorClasses: Record<string, string> = {
        ember: "bg-[var(--ember)]/10 text-[var(--ember)]",
        error: "bg-[var(--forge-error)]/10 text-[var(--forge-error)]",
        warning: "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]",
        success: "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
    };

    return (
        <div className={cn(
            "p-2 rounded-lg text-center",
            colorClasses[color] || colorClasses.ember
        )}>
            <div className="flex justify-center mb-1">{icon}</div>
            <div className="text-xs font-medium capitalize">{value}</div>
            <div className="text-xs opacity-70">{label}</div>
        </div>
    );
};

// Detailed profile information
interface ClientProfileDetailsProps {
    persona: ClientPersona;
}

const ClientProfileDetails: React.FC<ClientProfileDetailsProps> = ({ persona }) => {
    return (
        <div className="p-4 space-y-4">
            {/* Business context */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase mb-2 flex items-center gap-1">
                    <Briefcase size={ICON_SIZES.xs} />
                    Business Context
                </h4>
                <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed">
                    {persona.businessContext}
                </p>
            </section>

            {/* Pain points */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase mb-2 flex items-center gap-1">
                    <Zap size={ICON_SIZES.xs} />
                    Pain Points
                </h4>
                <ul className="space-y-1">
                    {persona.painPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                            <span className="text-[var(--forge-error)] mt-0.5">•</span>
                            {point}
                        </li>
                    ))}
                </ul>
            </section>

            {/* Previous experience */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase mb-2">
                    Previous Tech Experience
                </h4>
                <p className="text-sm text-[var(--forge-text-muted)] italic">
                    "{persona.previousExperience}"
                </p>
            </section>

            {/* Communication style */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase mb-2 flex items-center gap-1">
                    <MessageSquare size={ICON_SIZES.xs} />
                    Communication Style
                </h4>
                <div className="flex flex-wrap gap-2">
                    <StyleTag label="Formality" value={persona.messageStyle.formalityLevel} />
                    <StyleTag label="Length" value={persona.messageStyle.typicalLength} />
                    <StyleTag label="Emojis" value={persona.messageStyle.emojiUsage} />
                    <StyleTag label="Decisions" value={persona.decisionMaking} />
                </div>
            </section>

            {/* Personality traits */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase mb-2">
                    Personality Traits
                </h4>
                <div className="flex flex-wrap gap-1">
                    {ARCHETYPE_CONFIG[persona.archetype].traits.map(trait => (
                        <span
                            key={trait}
                            className="px-2 py-0.5 rounded text-xs bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]"
                        >
                            {trait}
                        </span>
                    ))}
                </div>
            </section>
        </div>
    );
};

// Style tag for communication section
interface StyleTagProps {
    label: string;
    value: string;
}

const StyleTag: React.FC<StyleTagProps> = ({ label, value }) => {
    return (
        <div className="px-2 py-1 rounded-lg bg-[var(--forge-bg-elevated)]">
            <span className="text-xs text-[var(--forge-text-muted)]">{label}: </span>
            <span className="text-xs font-medium text-[var(--forge-text-secondary)] capitalize">{value}</span>
        </div>
    );
};
