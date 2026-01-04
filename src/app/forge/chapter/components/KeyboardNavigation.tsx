"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface KeyboardNavigationProps {
    sections: Array<{ id: number }>;
    activeSection: number;
    expandedSection: number | null;
    onNavigateNext: () => void;
    onNavigatePrev: () => void;
    onExpandSection: (id: number | null) => void;
    onMarkComplete: () => void;
    onIncreaseFontSize?: () => void;
    onDecreaseFontSize?: () => void;
    onToggleReadingMode?: () => void;
    enabled?: boolean;
}

interface Shortcut {
    key: string;
    label: string;
    description: string;
    category: "navigation" | "actions" | "reading";
}

const SHORTCUTS: Shortcut[] = [
    { key: "j", label: "J", description: "Next section", category: "navigation" },
    { key: "k", label: "K", description: "Previous section", category: "navigation" },
    { key: " ", label: "Space", description: "Expand/collapse section", category: "navigation" },
    { key: "Enter", label: "Enter", description: "Mark section complete", category: "actions" },
    { key: "Escape", label: "Esc", description: "Collapse section", category: "navigation" },
    { key: "+", label: "+", description: "Increase font size", category: "reading" },
    { key: "-", label: "-", description: "Decrease font size", category: "reading" },
    { key: "r", label: "R", description: "Toggle reading mode", category: "reading" },
    { key: "?", label: "?", description: "Show shortcuts", category: "actions" },
];

// ============================================================================
// Keyboard Shortcuts Modal
// ============================================================================

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const navigationShortcuts = SHORTCUTS.filter(s => s.category === "navigation");
    const actionShortcuts = SHORTCUTS.filter(s => s.category === "actions");
    const readingShortcuts = SHORTCUTS.filter(s => s.category === "reading");

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
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
                    >
                        <div className="bg-[var(--forge-bg-daylight)] rounded-2xl border border-[var(--forge-border-subtle)] shadow-2xl overflow-hidden mx-4">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--ember)]/10 flex items-center justify-center">
                                        <Keyboard className="w-5 h-5 text-[var(--ember)]" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-[var(--forge-text-primary)]">
                                            Keyboard Shortcuts
                                        </h2>
                                        <p className="text-sm text-[var(--forge-text-muted)]">
                                            Navigate faster with your keyboard
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                                {/* Navigation */}
                                <div>
                                    <h3 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-3">
                                        Navigation
                                    </h3>
                                    <div className="space-y-2">
                                        {navigationShortcuts.map((shortcut) => (
                                            <ShortcutRow key={shortcut.key} shortcut={shortcut} />
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div>
                                    <h3 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-3">
                                        Actions
                                    </h3>
                                    <div className="space-y-2">
                                        {actionShortcuts.map((shortcut) => (
                                            <ShortcutRow key={shortcut.key} shortcut={shortcut} />
                                        ))}
                                    </div>
                                </div>

                                {/* Reading */}
                                <div>
                                    <h3 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-3">
                                        Reading
                                    </h3>
                                    <div className="space-y-2">
                                        {readingShortcuts.map((shortcut) => (
                                            <ShortcutRow key={shortcut.key} shortcut={shortcut} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30">
                                <p className="text-xs text-[var(--forge-text-muted)] text-center">
                                    Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] font-mono">Esc</kbd> to close
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-[var(--forge-text-secondary)]">
                {shortcut.description}
            </span>
            <kbd className="px-2 py-1 rounded-lg bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] text-xs font-mono border border-[var(--forge-border-subtle)]">
                {shortcut.label}
            </kbd>
        </div>
    );
}

// ============================================================================
// Toast Notification
// ============================================================================

interface KeyboardToastProps {
    message: string;
    isVisible: boolean;
}

function KeyboardToast({ message, isVisible }: KeyboardToastProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[var(--forge-bg-void)] text-white text-sm shadow-lg"
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// Main Hook
// ============================================================================

export function useKeyboardNavigation({
    sections,
    activeSection,
    expandedSection,
    onNavigateNext,
    onNavigatePrev,
    onExpandSection,
    onMarkComplete,
    onIncreaseFontSize,
    onDecreaseFontSize,
    onToggleReadingMode,
    enabled = true,
}: KeyboardNavigationProps) {
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = useCallback((message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 1500);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case "j":
                    e.preventDefault();
                    onNavigateNext();
                    showToast("Next section");
                    break;

                case "k":
                    e.preventDefault();
                    onNavigatePrev();
                    showToast("Previous section");
                    break;

                case " ": // Space
                    e.preventDefault();
                    if (expandedSection === activeSection) {
                        onExpandSection(null);
                        showToast("Section collapsed");
                    } else {
                        onExpandSection(activeSection);
                        showToast("Section expanded");
                    }
                    break;

                case "enter":
                    e.preventDefault();
                    onMarkComplete();
                    showToast("Section marked complete");
                    break;

                case "escape":
                    if (showShortcuts) {
                        setShowShortcuts(false);
                    } else if (expandedSection !== null) {
                        onExpandSection(null);
                        showToast("Section collapsed");
                    }
                    break;

                case "+":
                case "=":
                    e.preventDefault();
                    onIncreaseFontSize?.();
                    showToast("Font size increased");
                    break;

                case "-":
                    e.preventDefault();
                    onDecreaseFontSize?.();
                    showToast("Font size decreased");
                    break;

                case "r":
                    if (!e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        onToggleReadingMode?.();
                        showToast("Reading mode changed");
                    }
                    break;

                case "?":
                    e.preventDefault();
                    setShowShortcuts(true);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        enabled,
        activeSection,
        expandedSection,
        showShortcuts,
        onNavigateNext,
        onNavigatePrev,
        onExpandSection,
        onMarkComplete,
        onIncreaseFontSize,
        onDecreaseFontSize,
        onToggleReadingMode,
        showToast,
    ]);

    return {
        showShortcuts,
        setShowShortcuts,
        toast,
        ShortcutsModal: () => (
            <ShortcutsModal
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
            />
        ),
        Toast: () => <KeyboardToast message={toast || ""} isVisible={!!toast} />,
    };
}

export default useKeyboardNavigation;
