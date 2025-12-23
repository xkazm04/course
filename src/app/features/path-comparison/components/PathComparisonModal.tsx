"use client";

/**
 * PathComparisonModal Component
 *
 * A dedicated modal for side-by-side comparison of 2-3 learning paths.
 * Displays comparison cards horizontally with visual diff indicators.
 * Includes skill overlap visualization and combined path analysis.
 */

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitCompare, ArrowRight, Sparkles, LayoutGrid, Layers, Target } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { PathComparisonData, ExtendedPathComparisonData, CombinedPathAnalysis } from "../lib/types";
import { PathComparisonCard } from "./PathComparisonCard";
import { SkillOverlapViz } from "./SkillOverlapViz";
import { CombinedPathPanel } from "./CombinedPathPanel";
import {
    generateExtendedComparisonData,
    analyzeCombinedPaths,
} from "../lib/comparisonUtils";
import type { LearningPath } from "@/app/shared/lib/types";
import { learningPaths } from "@/app/shared/lib/mockData";

interface PathComparisonModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Handler to close the modal */
    onClose: () => void;
    /** Comparison data for selected paths */
    comparisonData: PathComparisonData[];
    /** Handler to remove a path from comparison */
    onRemovePath: (pathId: string) => void;
    /** Handler when user chooses to start a path */
    onStartPath?: (pathId: string) => void;
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
};

type ComparisonView = "cards" | "skills" | "combined";

const VIEW_TABS: { id: ComparisonView; label: string; icon: React.ReactNode }[] = [
    { id: "cards", label: "Side by Side", icon: <LayoutGrid size={ICON_SIZES.sm} /> },
    { id: "skills", label: "Skills", icon: <Target size={ICON_SIZES.sm} /> },
    { id: "combined", label: "Combined", icon: <Layers size={ICON_SIZES.sm} /> },
];

export const PathComparisonModal: React.FC<PathComparisonModalProps> = ({
    isOpen,
    onClose,
    comparisonData,
    onRemovePath,
    onStartPath,
}) => {
    const [activeView, setActiveView] = useState<ComparisonView>("cards");

    // Get selected paths from comparison data
    const selectedPaths = useMemo(
        () => comparisonData.map(d => d.path),
        [comparisonData]
    );

    // Generate extended comparison data with skill analysis
    const extendedData = useMemo(
        () => generateExtendedComparisonData(selectedPaths, learningPaths),
        [selectedPaths]
    );

    // Generate combined path analysis
    const combinedAnalysis = useMemo(
        () => analyzeCombinedPaths(selectedPaths, learningPaths),
        [selectedPaths]
    );

    // Determine the top pick (highest overall score)
    const topPickId = useMemo(() => {
        if (comparisonData.length === 0) return null;
        const sorted = [...comparisonData].sort((a, b) => b.overallScore - a.overallScore);
        return sorted[0].path.id;
    }, [comparisonData]);

    // Handle escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (comparisonData.length < 2) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        data-testid="comparison-modal-backdrop"
                    />

                    {/* Modal */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div
                            className="w-full max-w-7xl max-h-[calc(100vh-2rem)] bg-[var(--surface-base)] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                            data-testid="comparison-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="comparison-modal-title"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-gradient-to-r from-[var(--surface-elevated)] to-[var(--surface-base)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10">
                                        <GitCompare
                                            size={ICON_SIZES.md}
                                            className="text-[var(--accent-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <h2
                                            id="comparison-modal-title"
                                            className="text-xl font-bold text-[var(--text-primary)]"
                                        >
                                            Path Comparison
                                        </h2>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            Compare {comparisonData.length} learning paths side-by-side
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    data-testid="close-comparison-modal-btn"
                                    aria-label="Close comparison modal"
                                >
                                    <X size={ICON_SIZES.md} />
                                </button>
                            </div>

                            {/* View Tabs */}
                            <div className="flex items-center gap-2 px-6 pt-4" data-testid="comparison-view-tabs">
                                {VIEW_TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveView(tab.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                            activeView === tab.id
                                                ? "bg-[var(--accent-primary)] text-white shadow-md"
                                                : "bg-[var(--surface-inset)] text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]"
                                        )}
                                        data-testid={`view-tab-${tab.id}`}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Recommendation Banner */}
                            {topPickId && activeView === "cards" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mx-6 mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl"
                                    data-testid="recommendation-banner"
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={ICON_SIZES.md} className="text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text-primary)]">
                                                Based on your comparison,{" "}
                                                <span className="text-green-500 font-bold">
                                                    {comparisonData.find(d => d.path.id === topPickId)?.path.name}
                                                </span>{" "}
                                                looks like the best match for you!
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                Highest overall score considering time, skills, career, and community.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Content Area */}
                            <div className="p-6 overflow-y-auto max-h-[calc(100vh-20rem)]">
                                <AnimatePresence mode="wait">
                                    {/* Side by Side Cards View */}
                                    {activeView === "cards" && (
                                        <motion.div
                                            key="cards"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="overflow-x-auto"
                                        >
                                            <div
                                                className={cn(
                                                    "grid gap-6 min-w-max",
                                                    comparisonData.length === 2
                                                        ? "grid-cols-2 max-w-4xl mx-auto"
                                                        : "grid-cols-3"
                                                )}
                                                data-testid="comparison-cards-grid"
                                            >
                                                {comparisonData.map((data, index) => (
                                                    <PathComparisonCard
                                                        key={data.path.id}
                                                        data={data}
                                                        isTopPick={data.path.id === topPickId}
                                                        onRemove={() => onRemovePath(data.path.id)}
                                                        animationDelay={index * 0.1}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Skills Overlap View */}
                                    {activeView === "skills" && (
                                        <motion.div
                                            key="skills"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            <SkillOverlapViz
                                                comparisonData={extendedData}
                                                combinedAnalysis={combinedAnalysis}
                                            />
                                        </motion.div>
                                    )}

                                    {/* Combined Path Analysis View */}
                                    {activeView === "combined" && (
                                        <motion.div
                                            key="combined"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            <CombinedPathPanel
                                                analysis={combinedAnalysis}
                                                selectedPaths={selectedPaths}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-default)] bg-[var(--surface-elevated)]">
                                <p className="text-sm text-[var(--text-muted)]">
                                    Green indicators show advantages, amber shows areas for consideration.
                                </p>

                                {topPickId && onStartPath && (
                                    <motion.button
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        onClick={() => onStartPath(topPickId)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-green-500/20"
                                        data-testid="start-recommended-path-btn"
                                    >
                                        <span>
                                            Start{" "}
                                            {comparisonData.find(d => d.path.id === topPickId)?.path.name}
                                        </span>
                                        <ArrowRight size={ICON_SIZES.sm} />
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PathComparisonModal;
