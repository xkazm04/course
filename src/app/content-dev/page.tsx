"use client";

/**
 * Content Development Page
 *
 * A dedicated page for developing and testing content views:
 * - Chapter content (ElegantVariant)
 * - Homework system (HomeworkWorkspace)
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap } from "lucide-react";
import { ElegantVariant } from "@/app/features/chapter";
import { ThemeToggle } from "@/app/features/theme";
import { ForgeBackground } from "@/app/forge/components";
import {
    HomeworkWorkspace,
    MOCK_HOMEWORK_DEFINITIONS,
    MOCK_HOMEWORK_SESSION,
} from "@/app/features/homework-v2";

type ContentTab = "chapter" | "homework";

const TAB_CONFIG: Array<{ id: ContentTab; label: string; icon: React.ReactNode }> = [
    { id: "chapter", label: "Chapter", icon: <BookOpen className="w-4 h-4" /> },
    { id: "homework", label: "Homework", icon: <GraduationCap className="w-4 h-4" /> },
];

export default function ContentDevPage() {
    const [activeTab, setActiveTab] = useState<ContentTab>("homework");

    // Use the first mock homework definition
    const homework = MOCK_HOMEWORK_DEFINITIONS[0];

    return (
        <div className="min-h-screen relative">
            {/* Forge Background */}
            <ForgeBackground showNoise />

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center">
                                <span className="text-white font-bold text-sm">CD</span>
                            </div>
                            <span className="text-sm font-semibold text-[var(--forge-text-primary)]">
                                Content Dev
                            </span>
                        </div>

                        {/* Tab switcher */}
                        <div className="flex items-center gap-1 p-1 bg-[var(--forge-bg-bench)]/50 rounded-lg border border-[var(--forge-border-subtle)]">
                            {TAB_CONFIG.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? "text-[var(--forge-text-primary)]"
                                            : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="active-content-tab"
                                            className="absolute inset-0 bg-[var(--forge-bg-elevated)] rounded-md shadow-sm"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        {tab.icon}
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Theme toggle */}
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Content area */}
            <main className="relative z-10">
                {activeTab === "chapter" && <ElegantVariant />}

                {activeTab === "homework" && (
                    <div className="h-[calc(100vh-3.5rem)]">
                        <HomeworkWorkspace
                            homework={homework}
                            session={MOCK_HOMEWORK_SESSION}
                            className="h-full"
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
