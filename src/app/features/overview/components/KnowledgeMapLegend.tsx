/**
 * Knowledge Map Legend
 *
 * Legend component showing status, connection, and progression indicators.
 */

"use client";

import React from "react";

export const KnowledgeMapLegend: React.FC = () => {
    return (
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-[var(--forge-bg-elevated)] rounded-xl text-xs">
            {/* Status Section */}
            <span className="font-medium text-[var(--forge-text-secondary)]">Status:</span>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[var(--forge-success)] rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[var(--ember)] rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[var(--forge-text-muted)] rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[var(--forge-text-muted)] opacity-50 rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">Locked</span>
            </div>

            {/* Connections Section */}
            <span className="ml-4 font-medium text-[var(--forge-text-secondary)]">Connections:</span>
            <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[var(--ember)]" />
                <span className="text-[var(--forge-text-secondary)]">Required</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[var(--forge-success)]" />
                <span className="text-[var(--forge-text-secondary)]">Recommended</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span
                    className="w-4 h-0.5 bg-[var(--forge-text-muted)] opacity-50"
                    style={{ backgroundImage: "repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px)" }}
                />
                <span className="text-[var(--forge-text-secondary)]">Optional</span>
            </div>

            {/* Progression Section */}
            <span className="ml-4 font-medium text-[var(--forge-text-secondary)]">Progression:</span>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-[var(--forge-success)] rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">Foundation</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-[var(--forge-accent)] rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">Core</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-[var(--ember)] rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">Intermediate</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-[var(--forge-accent)] rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">Advanced</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-[var(--forge-error)] rounded-full" />
                <span className="text-[var(--forge-text-secondary)]">Expert</span>
            </div>
        </div>
    );
};
