"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Code2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ForgeProject } from "../../lib/types";
import { forgeEasing, staggerDelay } from "../../lib/animations";

interface ProjectGridModalProps {
    isOpen: boolean;
    projects: ForgeProject[];
    selectedId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}

const statusColors = {
    planning: "bg-[var(--forge-info)]/10 text-[var(--forge-info)] border-[var(--forge-info)]/20",
    active: "bg-[var(--forge-success)]/10 text-[var(--forge-success)] border-[var(--forge-success)]/20",
    mature: "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/20",
};

export function ProjectGridModal({
    isOpen,
    projects,
    selectedId,
    onSelect,
    onClose,
}: ProjectGridModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: forgeEasing }}
                        className="fixed inset-4 md:inset-8 lg:inset-16 z-50 bg-[var(--forge-bg-daylight)] rounded-2xl border border-[var(--forge-border-subtle)] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                            <div>
                                <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">
                                    Browse All Projects
                                </h2>
                                <p className="text-sm text-[var(--forge-text-muted)]">
                                    Select a project to view details
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {projects.map((project, index) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        isSelected={project.id === selectedId}
                                        index={index}
                                        onSelect={() => {
                                            onSelect(project.id);
                                            onClose();
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Project card for grid
function ProjectCard({
    project,
    isSelected,
    index,
    onSelect,
}: {
    project: ForgeProject;
    isSelected: boolean;
    index: number;
    onSelect: () => void;
}) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: staggerDelay(index, 0.05), ease: forgeEasing }}
            onClick={onSelect}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative p-4 rounded-xl text-left transition-all",
                "bg-[var(--forge-bg-elevated)]/50 border",
                isSelected
                    ? "border-[var(--ember)] shadow-lg shadow-[var(--ember)]/20"
                    : "border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/50 hover:shadow-md"
            )}
        >
            {/* Selected indicator */}
            {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--ember)] border-2 border-[var(--forge-bg-daylight)]" />
            )}

            {/* Preview area */}
            <div className="aspect-video rounded-lg bg-gradient-to-br from-[var(--ember)]/20 to-[var(--gold)]/20 mb-3 flex items-center justify-center">
                <Code2 size={24} className="text-[var(--ember)]/50" />
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
                    statusColors[project.status]
                )}>
                    {project.status === "mature" ? "Stable" : project.status}
                </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-[var(--forge-text-primary)] mb-1">
                {project.name}
            </h3>

            {/* Target product */}
            <p className="text-xs text-[var(--forge-text-muted)] mb-3">
                vs {project.targetProduct}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-[var(--forge-text-secondary)]">
                <span className="flex items-center gap-1">
                    <Target size={12} className="text-[var(--forge-success)]" />
                    {project.openChallenges} tasks
                </span>
                <span>{project.featureParityPercent}% complete</span>
            </div>
        </motion.button>
    );
}
