"use client";

import { ChevronRight } from "lucide-react";
import type { LearningPath } from "./pathData";

interface PathSelectorProps {
    paths: LearningPath[];
    activePath: LearningPath;
    onSelectPath: (path: LearningPath) => void;
}

export function PathSelector({ paths, activePath, onSelectPath }: PathSelectorProps) {
    return (
        <div className="lg:w-64 flex-shrink-0 space-y-4">
            {/* Path List */}
            <div className="bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] p-2">
                <div className="text-xs uppercase tracking-wider text-[var(--forge-text-muted)] px-3 py-2">
                    Select Path
                </div>
                {paths.map((path) => {
                    const Icon = path.icon;
                    const isActive = activePath.id === path.id;
                    return (
                        <button
                            key={path.id}
                            onClick={() => onSelectPath(path)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors border ${
                                isActive
                                    ? "bg-[var(--forge-bg-bench)] border-[var(--ember)]/30"
                                    : "border-transparent hover:bg-[var(--forge-bg-bench)]/50"
                            }`}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `color-mix(in srgb, ${path.color} 20%, transparent)` }}
                            >
                                <Icon size={16} style={{ color: path.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-[var(--forge-text-secondary)]"}`}>
                                    {path.name}
                                </div>
                                <div className="text-xs text-[var(--forge-text-muted)]">
                                    {path.nodes.length} modules
                                </div>
                            </div>
                            {isActive && <ChevronRight size={16} className="text-[var(--ember)]" />}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="bg-[var(--forge-bg-elevated)]/40 rounded-xl border border-[var(--forge-border-subtle)] p-4">
                <div className="text-xs uppercase tracking-wider text-[var(--forge-text-muted)] mb-3">
                    Legend
                </div>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activePath.color }} />
                        <span className="text-[var(--forge-text-secondary)]">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 bg-[#1a1a1a]" style={{ borderColor: activePath.color }} />
                        <span className="text-[var(--forge-text-secondary)]">Curated Content</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-dashed bg-[#1a1a1a]" style={{ borderColor: activePath.color }} />
                        <span className="text-[var(--forge-text-secondary)]">AI Generated ✨</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
