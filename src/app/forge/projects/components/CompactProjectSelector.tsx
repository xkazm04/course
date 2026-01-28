"use client";

import { motion } from "framer-motion";
import { Grid3X3 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ForgeProject } from "../../lib/types";
import { forgeEasing } from "../../lib/animations";

interface CompactProjectSelectorProps {
    projects: ForgeProject[];
    selectedId: string;
    onSelect: (id: string) => void;
    onOpenGrid: () => void;
}

export function CompactProjectSelector({
    projects,
    selectedId,
    onSelect,
    onOpenGrid,
}: CompactProjectSelectorProps) {
    return (
        <div className="flex items-center gap-2 p-2 bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)]">
            {/* Project name buttons */}
            <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
                {projects.map((project) => (
                    <motion.button
                        key={project.id}
                        onClick={() => onSelect(project.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                            selectedId === project.id
                                ? "text-white"
                                : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)]"
                        )}
                    >
                        {/* Active indicator background */}
                        {selectedId === project.id && (
                            <motion.div
                                layoutId="project-selector-bg"
                                className="absolute inset-0 bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] rounded-lg"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{project.name}</span>
                    </motion.button>
                ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--forge-border-subtle)]" />

            {/* Browse All button */}
            <motion.button
                onClick={onOpenGrid}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--forge-text-secondary)] hover:text-[var(--ember)] hover:bg-[var(--ember)]/10 transition-colors"
            >
                <Grid3X3 size={16} />
                <span className="hidden sm:inline">Browse All</span>
            </motion.button>
        </div>
    );
}
