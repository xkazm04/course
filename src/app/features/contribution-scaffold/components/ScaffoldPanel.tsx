"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Code2,
    Terminal,
    Lightbulb,
    ChevronDown,
    ChevronRight,
    FolderTree,
    FileCode,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ScaffoldData } from "../lib/types";
import { CodebaseOrientation } from "./CodebaseOrientation";
import { ConceptPrimer } from "./ConceptPrimer";
import { SetupGuide } from "./SetupGuide";
import { HintSystem } from "./HintSystem";
import { RelevantDocs } from "./RelevantDocs";

interface ScaffoldPanelProps {
    scaffold: ScaffoldData;
    onUnlockHint?: (hintId: string) => void;
}

type TabId = "orientation" | "concepts" | "setup" | "hints" | "docs";

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    badge?: number;
}

export const ScaffoldPanel: React.FC<ScaffoldPanelProps> = ({
    scaffold,
    onUnlockHint,
}) => {
    const [activeTab, setActiveTab] = useState<TabId>("orientation");

    const unlockedHints = scaffold.hints.filter(h => h.unlocked).length;
    const totalHints = scaffold.hints.length;

    const tabs: Tab[] = [
        { id: "orientation", label: "Codebase", icon: <FolderTree size={ICON_SIZES.sm} /> },
        { id: "concepts", label: "Concepts", icon: <BookOpen size={ICON_SIZES.sm} /> },
        { id: "setup", label: "Setup", icon: <Terminal size={ICON_SIZES.sm} /> },
        { id: "hints", label: "Hints", icon: <Lightbulb size={ICON_SIZES.sm} />, badge: unlockedHints },
        { id: "docs", label: "Docs", icon: <ExternalLink size={ICON_SIZES.sm} />, badge: scaffold.relevantDocs.length },
    ];

    return (
        <div className={cn(
            "rounded-xl border border-[var(--border-default)]",
            "bg-[var(--surface-elevated)] overflow-hidden",
            elevation.elevated
        )}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                        <Code2 size={ICON_SIZES.lg} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                            Contribution Scaffold
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            Everything you need to get started
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                            "border-b-2 -mb-[2px]",
                            activeTab === tab.id
                                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-xs",
                                activeTab === tab.id
                                    ? "bg-[var(--accent-primary)]/20"
                                    : "bg-[var(--surface-overlay)]"
                            )}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "orientation" && (
                            <CodebaseOrientation orientation={scaffold.codebaseOrientation} />
                        )}
                        {activeTab === "concepts" && (
                            <ConceptPrimer primer={scaffold.conceptPrimer} />
                        )}
                        {activeTab === "setup" && (
                            <SetupGuide guide={scaffold.setupGuide} />
                        )}
                        {activeTab === "hints" && (
                            <HintSystem
                                hints={scaffold.hints}
                                onUnlock={onUnlockHint}
                            />
                        )}
                        {activeTab === "docs" && (
                            <RelevantDocs docs={scaffold.relevantDocs} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
