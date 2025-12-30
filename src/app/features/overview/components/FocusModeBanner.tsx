/**
 * Focus Mode Banner
 *
 * Banner component displayed when focus mode is active.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Focus } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface FocusModeBannerProps {
    selectedNodeTitle: string | null;
    focusedNodeCount: number;
    onExit: () => void;
}

export const FocusModeBanner: React.FC<FocusModeBannerProps> = ({
    selectedNodeTitle,
    focusedNodeCount,
    onExit,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl",
                "bg-[var(--ember)]/10",
                "border border-[var(--ember)]/30"
            )}
            data-testid="focus-mode-banner"
        >
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[var(--ember)]/20 rounded-lg">
                    <Focus className="w-4 h-4 text-[var(--ember)]" />
                </div>
                <div>
                    <p className="text-sm font-medium text-[var(--ember)]">
                        Focus Mode Active
                    </p>
                    <p className="text-xs text-[var(--ember)]/70">
                        {selectedNodeTitle
                            ? `Showing path for "${selectedNodeTitle}" - ${focusedNodeCount} connected nodes`
                            : "Select a node to focus on its learning path"}
                    </p>
                </div>
            </div>
            <button
                onClick={onExit}
                className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg",
                    "bg-[var(--ember)]/20",
                    "text-[var(--ember)]",
                    "hover:bg-[var(--ember)]/30",
                    "transition-colors"
                )}
                data-testid="exit-focus-mode-btn"
            >
                Exit Focus Mode
            </button>
        </motion.div>
    );
};
