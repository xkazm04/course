"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    GitBranch,
    Clock,
    Zap,
    CheckCircle2,
    Code,
    Palette,
    Smartphone,
    Gauge,
    TestTube,
    Accessibility,
    AlertCircle,
    FileText,
    ChevronRight,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { HomeworkDefinition, HomeworkType, Difficulty } from "../lib/useChapterHomework";

// ============================================================================
// Types
// ============================================================================

interface HomeworkSelectionModalProps {
    isOpen: boolean;
    homeworks: HomeworkDefinition[];
    onSelect: (homework: HomeworkDefinition) => void;
    onStartAssignment: (homeworkDefinitionId: string) => Promise<{ success: boolean; error?: string }>;
    onClose: () => void;
}

// ============================================================================
// Configuration
// ============================================================================

const homeworkTypeIcons: Record<HomeworkType, React.ReactNode> = {
    implementation: <Code size={16} />,
    ui_design: <Palette size={16} />,
    responsive: <Smartphone size={16} />,
    performance: <Gauge size={16} />,
    testing: <TestTube size={16} />,
    accessibility: <Accessibility size={16} />,
    edge_cases: <AlertCircle size={16} />,
    documentation: <FileText size={16} />,
};

const homeworkTypeLabels: Record<HomeworkType, string> = {
    implementation: "Implementation",
    ui_design: "UI Design",
    responsive: "Responsive",
    performance: "Performance",
    testing: "Testing",
    accessibility: "Accessibility",
    edge_cases: "Edge Cases",
    documentation: "Documentation",
};

const difficultyConfig: Record<Difficulty, { color: string; bgColor: string; borderColor: string }> = {
    beginner: {
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
    },
    intermediate: {
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
    },
    advanced: {
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
    },
    expert: {
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
    },
};

// ============================================================================
// Component
// ============================================================================

export const HomeworkSelectionModal: React.FC<HomeworkSelectionModalProps> = ({
    isOpen,
    homeworks,
    onSelect,
    onStartAssignment,
    onClose,
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelect = useCallback((homework: HomeworkDefinition) => {
        setSelectedId(homework.homework_id);
        setError(null);
    }, []);

    const handleStart = useCallback(async () => {
        if (!selectedId) return;

        const selectedHomework = homeworks.find(h => h.homework_id === selectedId);
        if (!selectedHomework) return;

        setIsStarting(true);
        setError(null);

        try {
            const result = await onStartAssignment(selectedId);

            if (result.success) {
                onSelect(selectedHomework);
                onClose();
            } else {
                setError(result.error || "Failed to start assignment");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsStarting(false);
        }
    }, [selectedId, homeworks, onStartAssignment, onSelect, onClose]);

    // Group homeworks by type
    const groupedHomeworks = React.useMemo(() => {
        const groups: Record<string, HomeworkDefinition[]> = {};

        for (const hw of homeworks) {
            const type = hw.homework_type || "implementation";
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(hw);
        }

        return groups;
    }, [homeworks]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        data-testid="homework-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        data-testid="homework-selection-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-hidden"
                    >
                        <div className="bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-default)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-[var(--forge-border-subtle)] shrink-0">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--ember)]/10 text-[var(--ember)]">
                                            <GitBranch size={ICON_SIZES.lg} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-[var(--forge-text-primary)]">
                                                Choose Your Homework
                                            </h3>
                                            <p className="text-sm text-[var(--forge-text-muted)]">
                                                Select a project task to work on for this chapter
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        data-testid="homework-modal-close-btn"
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                                    >
                                        <X size={ICON_SIZES.md} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {Object.entries(groupedHomeworks).map(([type, hws]) => (
                                    <div key={type} className="space-y-3">
                                        {/* Type Header */}
                                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--forge-text-secondary)]">
                                            {homeworkTypeIcons[type as HomeworkType]}
                                            <span>{homeworkTypeLabels[type as HomeworkType] || type}</span>
                                            <span className="text-xs text-[var(--forge-text-muted)]">
                                                ({hws.length})
                                            </span>
                                        </div>

                                        {/* Homework Cards */}
                                        <div className="space-y-2">
                                            {hws.map((homework) => (
                                                <HomeworkCard
                                                    key={homework.homework_id}
                                                    homework={homework}
                                                    isSelected={selectedId === homework.homework_id}
                                                    onSelect={() => handleSelect(homework)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {homeworks.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-[var(--forge-text-muted)]">
                                            No homeworks available for this chapter.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-4 border-t border-[var(--forge-border-subtle)] shrink-0">
                                {error && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-[var(--forge-text-muted)]">
                                        {selectedId
                                            ? "Click 'Start Assignment' to begin working on this task"
                                            : "Select a homework task to continue"}
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleStart}
                                            disabled={!selectedId || isStarting}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                                selectedId && !isStarting
                                                    ? "bg-[var(--ember)] text-white hover:bg-[var(--ember-hover)]"
                                                    : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] cursor-not-allowed"
                                            )}
                                        >
                                            {isStarting ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Starting...
                                                </>
                                            ) : (
                                                <>
                                                    Start Assignment
                                                    <ChevronRight size={14} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ============================================================================
// Homework Card Component
// ============================================================================

interface HomeworkCardProps {
    homework: HomeworkDefinition;
    isSelected: boolean;
    onSelect: () => void;
}

const HomeworkCard: React.FC<HomeworkCardProps> = ({ homework, isSelected, onSelect }) => {
    const difficulty = (homework.difficulty || "intermediate") as Difficulty;
    const config = difficultyConfig[difficulty];

    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full p-4 rounded-xl border text-left transition-all",
                isSelected
                    ? "border-[var(--ember)] bg-[var(--ember)]/5 ring-1 ring-[var(--ember)]"
                    : "border-[var(--forge-border-subtle)] bg-[var(--forge-bg-card)] hover:border-[var(--forge-border-default)] hover:bg-[var(--forge-bg-elevated)]"
            )}
            data-testid={`homework-card-${homework.homework_id}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Title and difficulty */}
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-[var(--forge-text-primary)] truncate">
                            {homework.homework_name}
                        </h4>
                        <span
                            className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
                                config.color,
                                config.bgColor,
                                config.borderColor
                            )}
                        >
                            {difficulty}
                        </span>
                    </div>

                    {/* Description */}
                    {homework.description && (
                        <p className="text-sm text-[var(--forge-text-secondary)] line-clamp-2 mb-2">
                            {homework.description}
                        </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-[var(--forge-text-muted)]">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            ~{homework.estimated_hours}h
                        </span>
                        <span className="flex items-center gap-1">
                            <Zap size={12} className="text-[var(--gold)]" />
                            {homework.xp_reward} XP
                        </span>
                        {homework.project_name && (
                            <span className="flex items-center gap-1">
                                <GitBranch size={12} />
                                {homework.project_owner}/{homework.project_name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Selection indicator */}
                <div
                    className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1",
                        isSelected
                            ? "border-[var(--ember)] bg-[var(--ember)]"
                            : "border-[var(--forge-border-default)]"
                    )}
                >
                    {isSelected && <CheckCircle2 size={12} className="text-white" />}
                </div>
            </div>

            {/* Already assigned badge */}
            {homework.user_assignment_status && (
                <div className="mt-3 pt-3 border-t border-[var(--forge-border-subtle)]">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                            homework.user_assignment_status === "completed"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-blue-500/10 text-blue-500"
                        )}
                    >
                        {homework.user_assignment_status === "completed" ? (
                            <>
                                <CheckCircle2 size={12} />
                                Completed
                            </>
                        ) : (
                            <>
                                <Clock size={12} />
                                {homework.user_assignment_status.replace("_", " ")}
                            </>
                        )}
                    </span>
                </div>
            )}

            {/* Repo link preview */}
            {homework.source_repo_url && isSelected && (
                <div className="mt-3 pt-3 border-t border-[var(--forge-border-subtle)]">
                    <a
                        href={homework.source_repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-[var(--ember)] hover:underline"
                    >
                        View repository
                        <ExternalLink size={10} />
                    </a>
                </div>
            )}
        </button>
    );
};

export default HomeworkSelectionModal;
