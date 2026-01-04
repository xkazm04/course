"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ============================================================================
// Types
// ============================================================================

export type FontSize = "small" | "medium" | "large" | "xl";
export type ReadingMode = "default" | "focus" | "night";

interface ReadingPreferences {
    fontSize: FontSize;
    readingMode: ReadingMode;
    setFontSize: (size: FontSize) => void;
    setReadingMode: (mode: ReadingMode) => void;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
    toggleReadingMode: () => void;
}

const FONT_SIZE_ORDER: FontSize[] = ["small", "medium", "large", "xl"];

const STORAGE_KEY = "forge-reading-preferences";

// ============================================================================
// Context
// ============================================================================

const ReadingPreferencesContext = createContext<ReadingPreferences | null>(null);

export function useReadingPreferences() {
    const context = useContext(ReadingPreferencesContext);
    if (!context) {
        throw new Error("useReadingPreferences must be used within ReadingPreferencesProvider");
    }
    return context;
}

// ============================================================================
// Provider
// ============================================================================

interface ReadingPreferencesProviderProps {
    children: React.ReactNode;
}

export function ReadingPreferencesProvider({ children }: ReadingPreferencesProviderProps) {
    const [fontSize, setFontSizeState] = useState<FontSize>("medium");
    const [readingMode, setReadingModeState] = useState<ReadingMode>("default");
    const [isHydrated, setIsHydrated] = useState(false);

    // Load preferences from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.fontSize && FONT_SIZE_ORDER.includes(parsed.fontSize)) {
                    setFontSizeState(parsed.fontSize);
                }
                if (parsed.readingMode && ["default", "focus", "night"].includes(parsed.readingMode)) {
                    setReadingModeState(parsed.readingMode);
                }
            }
        } catch (e) {
            console.error("Failed to load reading preferences:", e);
        }
        setIsHydrated(true);
    }, []);

    // Persist preferences to localStorage
    useEffect(() => {
        if (!isHydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize, readingMode }));
        } catch (e) {
            console.error("Failed to save reading preferences:", e);
        }
    }, [fontSize, readingMode, isHydrated]);

    const setFontSize = useCallback((size: FontSize) => {
        setFontSizeState(size);
    }, []);

    const setReadingMode = useCallback((mode: ReadingMode) => {
        setReadingModeState(mode);
    }, []);

    const increaseFontSize = useCallback(() => {
        setFontSizeState((current) => {
            const idx = FONT_SIZE_ORDER.indexOf(current);
            return idx < FONT_SIZE_ORDER.length - 1 ? FONT_SIZE_ORDER[idx + 1] : current;
        });
    }, []);

    const decreaseFontSize = useCallback(() => {
        setFontSizeState((current) => {
            const idx = FONT_SIZE_ORDER.indexOf(current);
            return idx > 0 ? FONT_SIZE_ORDER[idx - 1] : current;
        });
    }, []);

    const toggleReadingMode = useCallback(() => {
        setReadingModeState((current) => {
            if (current === "default") return "focus";
            if (current === "focus") return "night";
            return "default";
        });
    }, []);

    return (
        <ReadingPreferencesContext.Provider
            value={{
                fontSize,
                readingMode,
                setFontSize,
                setReadingMode,
                increaseFontSize,
                decreaseFontSize,
                toggleReadingMode,
            }}
        >
            {children}
        </ReadingPreferencesContext.Provider>
    );
}

// ============================================================================
// CSS Classes for Font Sizes
// ============================================================================

export const fontSizeClasses: Record<FontSize, string> = {
    small: "text-sm leading-relaxed",
    medium: "text-base leading-relaxed",
    large: "text-lg leading-loose",
    xl: "text-xl leading-loose",
};

export const fontSizeLabels: Record<FontSize, string> = {
    small: "S",
    medium: "M",
    large: "L",
    xl: "XL",
};

// ============================================================================
// CSS Classes for Reading Modes
// ============================================================================

export const readingModeClasses: Record<ReadingMode, string> = {
    default: "",
    focus: "reading-mode-focus",
    night: "reading-mode-night",
};

export const readingModeLabels: Record<ReadingMode, { label: string; description: string }> = {
    default: { label: "Default", description: "Standard reading experience" },
    focus: { label: "Focus", description: "Reduced distractions, dimmed UI" },
    night: { label: "Night", description: "Warm tones, reduced blue light" },
};
