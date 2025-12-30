"use client";

import { motion } from "framer-motion";
import { Mouse, Hand, ZoomIn, ArrowLeft } from "lucide-react";
import { STATUS_STYLES } from "../lib/types";

export function Legend() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="fixed top-20 right-4 z-30"
        >
            <div className="bg-[var(--forge-bg-elevated)]/95 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] shadow-lg p-3 text-xs">
                <div className="text-[var(--forge-text-secondary)] font-medium mb-2 uppercase tracking-wide">Legend</div>

                {/* Status colors */}
                <div className="space-y-1.5 mb-3 pb-3 border-b border-[var(--forge-border-subtle)]">
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: STATUS_STYLES.completed.fill }}
                        />
                        <span className="text-[var(--forge-text-secondary)]">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: STATUS_STYLES.in_progress.fill }}
                        />
                        <span className="text-[var(--forge-text-secondary)]">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: STATUS_STYLES.available.fill }}
                        />
                        <span className="text-[var(--forge-text-secondary)]">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: STATUS_STYLES.locked.fill }}
                        />
                        <span className="text-[var(--forge-text-secondary)]">Locked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full bg-[var(--forge-text-secondary)]"
                        />
                        <span className="text-[var(--forge-text-secondary)]">Group</span>
                    </div>
                </div>

                {/* Mouse actions */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[var(--forge-text-muted)]">
                        <Mouse size={12} />
                        <span>Click: Drill down</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--forge-text-muted)]">
                        <ArrowLeft size={12} />
                        <span>Right click / Esc: Back</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--forge-text-muted)]">
                        <Hand size={12} />
                        <span>Drag: Pan canvas</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--forge-text-muted)]">
                        <ZoomIn size={12} />
                        <span>Scroll / +−: Zoom</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
