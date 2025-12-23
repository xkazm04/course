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
                "bg-indigo-50 dark:bg-indigo-950/40",
                "border border-indigo-200 dark:border-indigo-800"
            )}
            data-testid="focus-mode-banner"
        >
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <Focus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        Focus Mode Active
                    </p>
                    <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
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
                    "bg-indigo-100 dark:bg-indigo-900/50",
                    "text-indigo-700 dark:text-indigo-300",
                    "hover:bg-indigo-200 dark:hover:bg-indigo-800/50",
                    "transition-colors"
                )}
                data-testid="exit-focus-mode-btn"
            >
                Exit Focus Mode
            </button>
        </motion.div>
    );
};
