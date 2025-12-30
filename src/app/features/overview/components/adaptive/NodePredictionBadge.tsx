"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { CompletionPrediction } from "@/app/features/adaptive-learning/lib/types";

export interface NodePredictionBadgeProps {
    nodeId: string;
    getPrediction: (nodeId: string) => CompletionPrediction | null;
}

/**
 * Badge showing AI prediction for the selected node.
 * Displays success probability, estimated time, and potential challenges.
 */
export const NodePredictionBadge: React.FC<NodePredictionBadgeProps> = ({ nodeId, getPrediction }) => {
    const prediction = getPrediction(nodeId);
    if (!prediction) return null;

    const probability = prediction.probability;
    const color = probability >= 0.7 ? "emerald" : probability >= 0.4 ? "amber" : "red";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 z-10"
            data-testid="node-prediction-badge"
        >
            <div className={cn(
                "px-4 py-3 rounded-xl bg-[var(--forge-bg-elevated)] backdrop-blur-sm",
                "border border-[var(--forge-border-subtle)] shadow-lg"
            )}>
                <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-5 h-5 text-[var(--ember)]" />
                    <span className="font-medium text-[var(--forge-text-primary)]">AI Prediction</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className={cn(
                            "text-2xl font-bold",
                            color === "emerald" ? "text-[var(--forge-success)]" :
                                color === "amber" ? "text-[var(--forge-warning)]" :
                                    "text-[var(--forge-error)]"
                        )}>
                            {Math.round(probability * 100)}%
                        </div>
                        <div className="text-xs text-[var(--forge-text-secondary)]">Success Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[var(--forge-text-primary)]">
                            {prediction.estimatedHours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-[var(--forge-text-secondary)]">Est. Time</div>
                    </div>
                </div>
                {prediction.potentialChallenges.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[var(--forge-border-subtle)]">
                        <p className="text-xs text-[var(--forge-warning)]">
                            {prediction.potentialChallenges[0]}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
