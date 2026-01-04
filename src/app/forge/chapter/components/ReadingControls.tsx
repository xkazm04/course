"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings, Type, Moon, Sun, Eye, Minus, Plus,
    ChevronDown, Check
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import {
    useReadingPreferences,
    FontSize,
    ReadingMode,
    fontSizeLabels,
    readingModeLabels,
} from "./ReadingPreferences";

// ============================================================================
// Font Size Selector
// ============================================================================

interface FontSizeSelectorProps {
    fontSize: FontSize;
    onIncrease: () => void;
    onDecrease: () => void;
    onSet: (size: FontSize) => void;
}

function FontSizeSelector({ fontSize, onIncrease, onDecrease, onSet }: FontSizeSelectorProps) {
    const sizes: FontSize[] = ["small", "medium", "large", "xl"];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--forge-text-secondary)] flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Font Size
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onDecrease}
                        disabled={fontSize === "small"}
                        className="p-1.5 rounded-lg hover:bg-[var(--forge-bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onIncrease}
                        disabled={fontSize === "xl"}
                        className="p-1.5 rounded-lg hover:bg-[var(--forge-bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Size Pills */}
            <div className="flex gap-1">
                {sizes.map((size) => (
                    <button
                        key={size}
                        onClick={() => onSet(size)}
                        className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                            fontSize === size
                                ? "bg-[var(--ember)] text-white"
                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        )}
                    >
                        {fontSizeLabels[size]}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Reading Mode Selector
// ============================================================================

interface ReadingModeSelectorProps {
    mode: ReadingMode;
    onSet: (mode: ReadingMode) => void;
}

function ReadingModeSelector({ mode, onSet }: ReadingModeSelectorProps) {
    const modes: ReadingMode[] = ["default", "focus", "night"];

    const modeIcons: Record<ReadingMode, React.ReactNode> = {
        default: <Sun className="w-4 h-4" />,
        focus: <Eye className="w-4 h-4" />,
        night: <Moon className="w-4 h-4" />,
    };

    return (
        <div className="space-y-3">
            <span className="text-sm text-[var(--forge-text-secondary)] flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Reading Mode
            </span>

            <div className="space-y-2">
                {modes.map((m) => (
                    <button
                        key={m}
                        onClick={() => onSet(m)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                            mode === m
                                ? "bg-[var(--ember)]/10 border border-[var(--ember)]/30"
                                : "bg-[var(--forge-bg-elevated)] border border-transparent hover:border-[var(--forge-border-subtle)]"
                        )}
                    >
                        <span className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            mode === m ? "bg-[var(--ember)] text-white" : "bg-[var(--forge-bg-bench)] text-[var(--forge-text-muted)]"
                        )}>
                            {modeIcons[m]}
                        </span>
                        <div className="flex-1">
                            <p className={cn(
                                "text-sm font-medium",
                                mode === m ? "text-[var(--ember)]" : "text-[var(--forge-text-primary)]"
                            )}>
                                {readingModeLabels[m].label}
                            </p>
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                {readingModeLabels[m].description}
                            </p>
                        </div>
                        {mode === m && (
                            <Check className="w-4 h-4 text-[var(--ember)]" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Reading Controls Panel
// ============================================================================

interface ReadingControlsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReadingControlsPanel({ isOpen, onClose }: ReadingControlsPanelProps) {
    const {
        fontSize,
        readingMode,
        setFontSize,
        setReadingMode,
        increaseFontSize,
        decreaseFontSize,
    } = useReadingPreferences();

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
                        className="fixed inset-0 z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-[var(--forge-bg-daylight)] border border-[var(--forge-border-subtle)] rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-4 space-y-6">
                            <FontSizeSelector
                                fontSize={fontSize}
                                onIncrease={increaseFontSize}
                                onDecrease={decreaseFontSize}
                                onSet={setFontSize}
                            />

                            <div className="h-px bg-[var(--forge-border-subtle)]" />

                            <ReadingModeSelector
                                mode={readingMode}
                                onSet={setReadingMode}
                            />
                        </div>

                        {/* Keyboard Hint */}
                        <div className="p-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30">
                            <p className="text-[10px] text-[var(--forge-text-muted)] text-center">
                                <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)]">+</kbd>
                                <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)] ml-1">-</kbd>
                                {" "}font size •{" "}
                                <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)]">R</kbd>
                                {" "}reading mode
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// Reading Controls Button
// ============================================================================

export function ReadingControlsButton() {
    const [isOpen, setIsOpen] = useState(false);
    const { fontSize, readingMode } = useReadingPreferences();

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]",
                    "hover:bg-[var(--forge-bg-bench)]",
                    isOpen && "ring-2 ring-[var(--ember)]/30"
                )}
            >
                <Settings className="w-4 h-4 text-[var(--forge-text-muted)]" />
                <span className="text-sm text-[var(--forge-text-secondary)]">
                    {fontSizeLabels[fontSize]}
                </span>
                {readingMode !== "default" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--ember)]/10 text-[var(--ember)]">
                        {readingModeLabels[readingMode].label}
                    </span>
                )}
                <ChevronDown className={cn(
                    "w-3 h-3 text-[var(--forge-text-muted)] transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            <ReadingControlsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
}

export default ReadingControlsButton;
