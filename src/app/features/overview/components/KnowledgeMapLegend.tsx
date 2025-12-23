/**
 * Knowledge Map Legend
 *
 * Legend component showing status, connection, and progression indicators.
 */

"use client";

import React from "react";

export const KnowledgeMapLegend: React.FC = () => {
    return (
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
            {/* Status Section */}
            <span className="font-medium text-slate-600 dark:text-slate-400">Status:</span>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">Locked</span>
            </div>

            {/* Connections Section */}
            <span className="ml-4 font-medium text-slate-600 dark:text-slate-400">Connections:</span>
            <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-indigo-500" />
                <span className="text-slate-600 dark:text-slate-400">Required</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-green-500" />
                <span className="text-slate-600 dark:text-slate-400">Recommended</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span
                    className="w-4 h-0.5 bg-slate-400 opacity-50"
                    style={{ backgroundImage: "repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px)" }}
                />
                <span className="text-slate-600 dark:text-slate-400">Optional</span>
            </div>

            {/* Progression Section */}
            <span className="ml-4 font-medium text-slate-600 dark:text-slate-400">Progression:</span>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">Foundation</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">Core</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">Intermediate</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">Advanced</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-rose-500 rounded-full" />
                <span className="text-slate-600 dark:text-slate-400">Expert</span>
            </div>
        </div>
    );
};
