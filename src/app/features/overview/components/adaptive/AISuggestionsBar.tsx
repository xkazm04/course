"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

export interface AISuggestion {
    title: string;
    message: string;
    severity: "recommendation" | "urgent" | "info" | "suggestion";
    action: {
        targetNodeId?: string;
    };
}

export interface AISuggestionsBarProps {
    suggestions: AISuggestion[];
    maxVisible?: number;
    onNavigate: (nodeId: string) => void;
    onDismiss: (title: string) => void;
}

/**
 * Bar showing AI-generated suggestions and recommendations.
 */
export const AISuggestionsBar: React.FC<AISuggestionsBarProps> = ({
    suggestions,
    maxVisible = 2,
    onNavigate,
    onDismiss,
}) => {
    return (
        <AnimatePresence mode="popLayout">
            {suggestions.slice(0, maxVisible).map((suggestion, index) => (
                <motion.div
                    key={suggestion.title}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={cn(
                        "flex items-center justify-between p-4 rounded-xl border",
                        suggestion.severity === "recommendation"
                            ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                            : suggestion.severity === "urgent"
                                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                                : "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
                    )}
                    data-testid={`ai-suggestion-${index}`}
                >
                    <div className="flex items-center gap-3">
                        <Zap className={cn(
                            "w-5 h-5",
                            suggestion.severity === "recommendation" ? "text-purple-500" :
                                suggestion.severity === "urgent" ? "text-amber-500" : "text-indigo-500"
                        )} />
                        <div>
                            <p className="font-medium text-[var(--text-primary)]">{suggestion.title}</p>
                            <p className="text-sm text-[var(--text-secondary)]">{suggestion.message}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {suggestion.action.targetNodeId && (
                            <button
                                onClick={() => onNavigate(suggestion.action.targetNodeId!)}
                                className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                data-testid="go-to-suggestion-btn"
                            >
                                Go
                            </button>
                        )}
                        <button
                            onClick={() => onDismiss(suggestion.title)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            data-testid="dismiss-suggestion-btn"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    );
};
