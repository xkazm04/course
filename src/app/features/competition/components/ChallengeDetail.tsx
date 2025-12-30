"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    CheckCircle,
    Circle,
    Star,
    AlertTriangle,
    Code,
    FileText,
    Users,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Challenge } from "../lib/types";
import { DIFFICULTY_CONFIG } from "../lib/tierSystem";
import { CountdownTimer, TimeProgress } from "./CountdownTimer";
import { TierBadge } from "./TierBadge";

interface ChallengeDetailProps {
    challenge: Challenge;
    hasJoined?: boolean;
    onBack?: () => void;
    onJoin?: () => void;
    onStartSubmission?: () => void;
}

export const ChallengeDetail: React.FC<ChallengeDetailProps> = ({
    challenge,
    hasJoined = false,
    onBack,
    onJoin,
    onStartSubmission,
}) => {
    const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
    const isActive = challenge.status === "active";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-start gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] transition-colors"
                    >
                        <ArrowLeft size={ICON_SIZES.lg} />
                    </button>
                )}
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                            className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                difficultyConfig.bgColor,
                                difficultyConfig.color
                            )}
                        >
                            {difficultyConfig.label}
                        </span>
                        {challenge.skillTierRestriction && (
                            <TierBadge tier={challenge.skillTierRestriction} size="sm" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                        {challenge.title}
                    </h1>
                    <p className="text-[var(--forge-text-muted)] mt-2">{challenge.description}</p>
                </div>
            </div>

            {/* Time and participants */}
            <div
                className={cn(
                    "rounded-xl border border-[var(--forge-border-default)]",
                    "bg-[var(--forge-bg-elevated)] p-4",
                    elevation.elevated
                )}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <span className="text-xs text-[var(--forge-text-muted)]">Time Remaining</span>
                            <CountdownTimer endDate={challenge.endDate} variant="default" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                            <div>
                                <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                                    {challenge.participantCount}
                                </span>
                                <span className="text-xs text-[var(--forge-text-muted)] block">
                                    participants
                                </span>
                            </div>
                        </div>
                    </div>
                    {isActive && (
                        hasJoined ? (
                            <button
                                onClick={onStartSubmission}
                                className="px-6 py-2 rounded-lg bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember-intense)] transition-colors shadow-ember-sm"
                            >
                                Start Coding
                            </button>
                        ) : (
                            <button
                                onClick={onJoin}
                                className="px-6 py-2 rounded-lg bg-[var(--forge-success)] text-white font-medium hover:bg-[var(--forge-success)]/80 transition-colors"
                            >
                                Join Challenge
                            </button>
                        )
                    )}
                </div>
                <div className="mt-4">
                    <TimeProgress startDate={challenge.startDate} endDate={challenge.endDate} />
                </div>
            </div>

            {/* Specification */}
            <div
                className={cn(
                    "rounded-xl border border-[var(--forge-border-default)]",
                    "bg-[var(--forge-bg-elevated)] p-6",
                    elevation.elevated
                )}
            >
                <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
                    <FileText size={ICON_SIZES.md} />
                    Challenge Specification
                </h2>
                <p className="text-[var(--forge-text-secondary)] mb-4">
                    {challenge.specification.overview}
                </p>

                <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-2">
                    Technical Requirements
                </h3>
                <ul className="space-y-2 mb-4">
                    {challenge.specification.technicalRequirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                            <CheckCircle size={ICON_SIZES.sm} className="text-[var(--forge-success)] mt-0.5 flex-shrink-0" />
                            {req}
                        </li>
                    ))}
                </ul>

                {challenge.specification.constraints.length > 0 && (
                    <>
                        <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-2">
                            Constraints
                        </h3>
                        <ul className="space-y-2">
                            {challenge.specification.constraints.map((constraint, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                                    <AlertTriangle size={ICON_SIZES.sm} className="text-[var(--forge-warning)] mt-0.5 flex-shrink-0" />
                                    {constraint}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            {/* Required features and bonus */}
            <div className="grid md:grid-cols-2 gap-6">
                <RequiredFeaturesList features={challenge.requiredFeatures} />
                <BonusObjectivesList objectives={challenge.bonusObjectives} />
            </div>

            {/* Evaluation criteria */}
            <EvaluationCriteriaList criteria={challenge.evaluationCriteria} />
        </motion.div>
    );
};

// Required features list
interface RequiredFeaturesListProps {
    features: Challenge["requiredFeatures"];
}

const RequiredFeaturesList: React.FC<RequiredFeaturesListProps> = ({ features }) => (
    <div
        className={cn(
            "rounded-xl border border-[var(--forge-border-default)]",
            "bg-[var(--forge-bg-elevated)] p-6",
            elevation.elevated
        )}
    >
        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
            <CheckCircle size={ICON_SIZES.md} className="text-[var(--forge-success)]" />
            Required Features
        </h2>
        <ul className="space-y-3">
            {features.map((feature) => (
                <li key={feature.id} className="flex items-start gap-3">
                    <Circle size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)] mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-[var(--forge-text-primary)]">
                            {feature.name}
                            <span className="ml-2 text-xs text-[var(--forge-text-muted)]">
                                ({feature.weight}%)
                            </span>
                        </p>
                        <p className="text-xs text-[var(--forge-text-muted)]">{feature.description}</p>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

// Bonus objectives list
interface BonusObjectivesListProps {
    objectives: Challenge["bonusObjectives"];
}

const BonusObjectivesList: React.FC<BonusObjectivesListProps> = ({ objectives }) => (
    <div
        className={cn(
            "rounded-xl border border-[var(--forge-border-default)]",
            "bg-[var(--forge-bg-elevated)] p-6",
            elevation.elevated
        )}
    >
        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
            <Star size={ICON_SIZES.md} className="text-[var(--forge-warning)]" />
            Bonus Objectives
        </h2>
        <ul className="space-y-3">
            {objectives.map((objective) => (
                <li key={objective.id} className="flex items-start gap-3">
                    <Star size={ICON_SIZES.sm} className="text-[var(--forge-warning)] mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--forge-text-primary)]">
                            {objective.name}
                        </p>
                        <p className="text-xs text-[var(--forge-text-muted)]">{objective.description}</p>
                    </div>
                    <span className="text-sm font-medium text-[var(--forge-warning)]">+{objective.points}pts</span>
                </li>
            ))}
        </ul>
    </div>
);

// Evaluation criteria list
interface EvaluationCriteriaListProps {
    criteria: Challenge["evaluationCriteria"];
}

const EvaluationCriteriaList: React.FC<EvaluationCriteriaListProps> = ({ criteria }) => (
    <div
        className={cn(
            "rounded-xl border border-[var(--forge-border-default)]",
            "bg-[var(--forge-bg-elevated)] p-6",
            elevation.elevated
        )}
    >
        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
            <Code size={ICON_SIZES.md} className="text-[var(--ember)]" />
            Evaluation Criteria
        </h2>
        <div className="space-y-4">
            {criteria.map((criterion) => (
                <div key={criterion.id} className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--forge-text-primary)]">
                            {criterion.name}
                        </p>
                        <p className="text-xs text-[var(--forge-text-muted)]">{criterion.description}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                            {criterion.weight}%
                        </span>
                        <span
                            className={cn(
                                "block text-xs px-2 py-0.5 rounded",
                                criterion.type === "automated" && "bg-[var(--forge-info)]/20 text-[var(--forge-info)]",
                                criterion.type === "peer_review" && "bg-[var(--ember)]/10 text-[var(--ember)]",
                                criterion.type === "code_quality" && "bg-[var(--forge-success)]/20 text-[var(--forge-success)]"
                            )}
                        >
                            {criterion.type.replace("_", " ")}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
