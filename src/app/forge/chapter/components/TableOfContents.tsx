"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    List, X, CheckCircle, Circle, PlayCircle,
    ChevronUp, ChevronDown, RefreshCw, Loader2,
    Wifi, WifiOff, Map
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ChapterSection } from "@/app/features/chapter/lib/chapterData";

// ============================================================================
// Types
// ============================================================================

interface TableOfContentsProps {
    sections: ChapterSection[];
    activeSection: number;
    expandedSection: number | null;
    onNavigate: (sectionId: number) => void;
    onActiveSectionChange?: (sectionId: number) => void;
    className?: string;
    // Learning Path props
    courseName?: string;
    chapterTitle?: string;
    chapterId?: string;
    isRegenerating?: boolean;
    onRegenerate?: () => void;
    isRealtimeConnected?: boolean;
    regenerateProgress?: { percent: number; message: string } | null;
}

// ============================================================================
// Scroll Spy Hook
// ============================================================================

function useScrollSpy(
    sections: ChapterSection[],
    onActiveSectionChange?: (sectionId: number) => void
) {
    const [visibleSection, setVisibleSection] = useState<number | null>(null);

    useEffect(() => {
        if (sections.length === 0) return;

        const observers: IntersectionObserver[] = [];
        const sectionVisibility: Record<number, boolean> = {};

        sections.forEach((section) => {
            const element = document.getElementById(`section-${section.id}`);
            if (!element) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        sectionVisibility[section.id] = entry.isIntersecting;

                        // Find first visible section
                        for (const s of sections) {
                            if (sectionVisibility[s.id]) {
                                if (visibleSection !== s.id) {
                                    setVisibleSection(s.id);
                                    onActiveSectionChange?.(s.id);
                                }
                                break;
                            }
                        }
                    });
                },
                {
                    rootMargin: "-100px 0px -60% 0px",
                    threshold: 0,
                }
            );

            observer.observe(element);
            observers.push(observer);
        });

        return () => {
            observers.forEach((obs) => obs.disconnect());
        };
    }, [sections, onActiveSectionChange, visibleSection]);

    return visibleSection;
}

// ============================================================================
// TOC Item Component
// ============================================================================

interface TOCItemProps {
    section: ChapterSection;
    isActive: boolean;
    isExpanded: boolean;
    isScrollActive: boolean;
    onClick: () => void;
}

function TOCItem({ section, isActive, isExpanded, isScrollActive, onClick }: TOCItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all",
                "hover:bg-[var(--forge-bg-elevated)]",
                (isActive || isScrollActive) && "bg-[var(--ember)]/10 text-[var(--ember)]",
                isExpanded && !isActive && !isScrollActive && "bg-[var(--forge-bg-elevated)]/50",
                !isActive && !isExpanded && !isScrollActive && "text-[var(--forge-text-muted)]"
            )}
        >
            {/* Status Icon */}
            <span className="flex-shrink-0">
                {section.completed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (isActive || isScrollActive) ? (
                    <PlayCircle className="w-4 h-4 text-[var(--ember)]" />
                ) : (
                    <Circle className="w-4 h-4" />
                )}
            </span>

            {/* Title */}
            <span className={cn(
                "flex-1 truncate",
                section.completed && "line-through opacity-60"
            )}>
                {section.title}
            </span>

            {/* Duration */}
            <span className="text-xs text-[var(--forge-text-muted)] flex-shrink-0">
                {section.duration}
            </span>
        </button>
    );
}

// ============================================================================
// Floating TOC Button (Mobile)
// ============================================================================

interface FloatingTOCButtonProps {
    onClick: () => void;
    progress: number;
}

function FloatingTOCButton({ onClick, progress }: FloatingTOCButtonProps) {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--ember)] text-white shadow-lg shadow-[var(--ember)]/30 flex items-center justify-center lg:hidden"
        >
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                />
                <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - progress / 100)}
                    className="transition-all duration-300"
                />
            </svg>
            <List className="w-5 h-5 relative z-10" />
        </motion.button>
    );
}

// ============================================================================
// Mobile TOC Sheet
// ============================================================================

interface MobileTOCSheetProps {
    isOpen: boolean;
    onClose: () => void;
    sections: ChapterSection[];
    activeSection: number;
    expandedSection: number | null;
    scrollActiveSection: number | null;
    onNavigate: (sectionId: number) => void;
    progress: number;
    // Learning Path
    courseName?: string;
    chapterTitle?: string;
    isRegenerating?: boolean;
    onRegenerate?: () => void;
    isRealtimeConnected?: boolean;
}

function MobileTOCSheet({
    isOpen,
    onClose,
    sections,
    activeSection,
    expandedSection,
    scrollActiveSection,
    onNavigate,
    progress,
    courseName,
    chapterTitle,
    isRegenerating,
    onRegenerate,
    isRealtimeConnected,
}: MobileTOCSheetProps) {
    const handleNavigate = (sectionId: number) => {
        onNavigate(sectionId);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--forge-bg-daylight)] rounded-t-2xl max-h-[80vh] overflow-hidden lg:hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                            <div>
                                <h3 className="font-semibold text-[var(--forge-text-primary)]">
                                    Contents
                                </h3>
                                <p className="text-sm text-[var(--forge-text-muted)]">
                                    {Math.round(progress)}% complete
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 bg-[var(--forge-bg-elevated)]">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--ember)] to-emerald-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Sections */}
                        <div className="p-4 overflow-y-auto max-h-[50vh]">
                            <div className="space-y-1">
                                {sections.map((section) => (
                                    <TOCItem
                                        key={section.id}
                                        section={section}
                                        isActive={activeSection === section.id}
                                        isExpanded={expandedSection === section.id}
                                        isScrollActive={scrollActiveSection === section.id}
                                        onClick={() => handleNavigate(section.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Learning Path Section */}
                        {onRegenerate && (
                            <div className="p-4 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30">
                                <button
                                    onClick={onRegenerate}
                                    disabled={isRegenerating}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--forge-bg-bench)] hover:bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-lg text-sm text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-colors disabled:opacity-50"
                                >
                                    {isRegenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Regenerate Content
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// Desktop TOC Sidebar (Unified with Learning Path)
// ============================================================================

interface DesktopTOCSidebarProps {
    sections: ChapterSection[];
    activeSection: number;
    expandedSection: number | null;
    scrollActiveSection: number | null;
    onNavigate: (sectionId: number) => void;
    progress: number;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    // Learning Path props
    courseName?: string;
    chapterTitle?: string;
    isRegenerating?: boolean;
    onRegenerate?: () => void;
    isRealtimeConnected?: boolean;
    regenerateProgress?: { percent: number; message: string } | null;
}

function DesktopTOCSidebar({
    sections,
    activeSection,
    expandedSection,
    scrollActiveSection,
    onNavigate,
    progress,
    isMinimized,
    onToggleMinimize,
    courseName,
    chapterTitle,
    isRegenerating,
    onRegenerate,
    isRealtimeConnected,
    regenerateProgress,
}: DesktopTOCSidebarProps) {
    const activeRef = useRef<HTMLDivElement>(null);

    // Scroll active item into view
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [scrollActiveSection]);

    if (isMinimized) {
        return (
            <motion.div
                initial={{ width: 48 }}
                animate={{ width: 48 }}
                className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 z-40"
            >
                <button
                    onClick={onToggleMinimize}
                    className="w-12 h-12 rounded-xl bg-[var(--forge-bg-daylight)] border border-[var(--forge-border-subtle)] shadow-lg flex items-center justify-center hover:bg-[var(--forge-bg-elevated)] transition-colors"
                >
                    <List className="w-5 h-5 text-[var(--forge-text-muted)]" />
                </button>
                {/* Mini progress indicator */}
                <div className="mt-2 w-12 h-1 rounded-full bg-[var(--forge-bg-elevated)] overflow-hidden">
                    <div
                        className="h-full bg-[var(--ember)] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="hidden lg:block fixed left-4 top-28 w-72 z-40 max-h-[calc(100vh-8rem)]"
        >
            <div className="bg-[var(--forge-bg-daylight)] border border-[var(--forge-border-subtle)] rounded-xl shadow-lg overflow-hidden flex flex-col max-h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-[var(--forge-border-subtle)] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <List className="w-4 h-4 text-[var(--forge-text-muted)]" />
                        <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                            Contents
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--forge-text-muted)]">
                            {Math.round(progress)}%
                        </span>
                        <button
                            onClick={onToggleMinimize}
                            className="p-1 rounded hover:bg-[var(--forge-bg-elevated)] transition-colors"
                            title="Minimize"
                        >
                            <ChevronUp className="w-4 h-4 text-[var(--forge-text-muted)]" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-[var(--forge-bg-elevated)] flex-shrink-0">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[var(--ember)] to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Learning Path Context */}
                {courseName && (
                    <div className="px-3 py-2 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30 flex-shrink-0">
                        <div className="flex items-center gap-2 text-[var(--forge-text-muted)]">
                            <Map className="w-3 h-3" />
                            <span className="text-xs font-medium uppercase tracking-wider">Path</span>
                        </div>
                        <p className="text-xs text-[var(--forge-text-secondary)] mt-1 truncate" title={courseName}>
                            {courseName}
                        </p>
                    </div>
                )}

                {/* Sections - Scrollable */}
                <div className="p-2 overflow-y-auto flex-1 min-h-0">
                    <div className="space-y-0.5">
                        {sections.map((section) => {
                            const isScrollActive = scrollActiveSection === section.id;
                            const isActive = activeSection === section.id;
                            return (
                                <div
                                    key={section.id}
                                    ref={isScrollActive ? activeRef : undefined}
                                >
                                    <TOCItem
                                        section={section}
                                        isActive={isActive}
                                        isExpanded={expandedSection === section.id}
                                        isScrollActive={isScrollActive}
                                        onClick={() => onNavigate(section.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Regenerate Section */}
                {onRegenerate && (
                    <div className="p-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30 flex-shrink-0 space-y-2">
                        {/* Connection Status */}
                        <div className="flex items-center justify-center gap-2 text-xs text-[var(--forge-text-muted)]">
                            {isRealtimeConnected ? (
                                <>
                                    <Wifi className="w-3 h-3 text-green-500" />
                                    <span>Live updates</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-3 h-3 text-yellow-500" />
                                    <span>Connecting...</span>
                                </>
                            )}
                        </div>

                        <button
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[var(--forge-bg-bench)] hover:bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-lg text-xs text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-colors disabled:opacity-50"
                        >
                            {isRegenerating ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    {regenerateProgress?.message || "Regenerating..."}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-3 h-3" />
                                    Regenerate
                                </>
                            )}
                        </button>

                        {/* Progress Bar */}
                        {isRegenerating && regenerateProgress && (
                            <div className="h-1 bg-[var(--forge-bg-bench)] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-[var(--ember)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${regenerateProgress.percent}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Keyboard hint */}
                <div className="p-2 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30 flex-shrink-0">
                    <p className="text-[10px] text-[var(--forge-text-muted)] text-center">
                        <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]">J</kbd>
                        <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] ml-1">K</kbd>
                        {" "}navigate •{" "}
                        <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]">?</kbd>
                        {" "}shortcuts
                    </p>
                </div>
            </div>
        </motion.aside>
    );
}

// ============================================================================
// Main TableOfContents Component
// ============================================================================

export function TableOfContents({
    sections,
    activeSection,
    expandedSection,
    onNavigate,
    onActiveSectionChange,
    className,
    courseName,
    chapterTitle,
    chapterId,
    isRegenerating,
    onRegenerate,
    isRealtimeConnected,
    regenerateProgress,
}: TableOfContentsProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Scroll spy to track visible section
    const scrollActiveSection = useScrollSpy(sections, onActiveSectionChange);

    const completedCount = sections.filter(s => s.completed).length;
    const progress = sections.length > 0 ? (completedCount / sections.length) * 100 : 0;

    return (
        <>
            {/* Desktop Sidebar */}
            <DesktopTOCSidebar
                sections={sections}
                activeSection={activeSection}
                expandedSection={expandedSection}
                scrollActiveSection={scrollActiveSection}
                onNavigate={onNavigate}
                progress={progress}
                isMinimized={isMinimized}
                onToggleMinimize={() => setIsMinimized(!isMinimized)}
                courseName={courseName}
                chapterTitle={chapterTitle}
                isRegenerating={isRegenerating}
                onRegenerate={onRegenerate}
                isRealtimeConnected={isRealtimeConnected}
                regenerateProgress={regenerateProgress}
            />

            {/* Mobile FAB */}
            <AnimatePresence>
                {!isMobileOpen && (
                    <FloatingTOCButton
                        onClick={() => setIsMobileOpen(true)}
                        progress={progress}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sheet */}
            <MobileTOCSheet
                isOpen={isMobileOpen}
                onClose={() => setIsMobileOpen(false)}
                sections={sections}
                activeSection={activeSection}
                expandedSection={expandedSection}
                scrollActiveSection={scrollActiveSection}
                onNavigate={onNavigate}
                progress={progress}
                courseName={courseName}
                chapterTitle={chapterTitle}
                isRegenerating={isRegenerating}
                onRegenerate={onRegenerate}
                isRealtimeConnected={isRealtimeConnected}
            />
        </>
    );
}

export default TableOfContents;
