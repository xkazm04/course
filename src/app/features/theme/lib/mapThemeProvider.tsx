"use client";

/**
 * Map Theme Provider
 *
 * Extended theme context for Knowledge Map customization.
 * Manages visual preferences, colorblind modes, and custom themes.
 *
 * Features:
 * - Theme preset selection
 * - Colorblind-safe mode toggle
 * - Node shape customization
 * - Connection style options
 * - Font size adjustment
 * - Custom theme creation
 * - Theme persistence (localStorage + Supabase sync)
 * - Theme export/import
 */

import React, {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    useMemo,
} from "react";
import {
    type ColorPalette,
    type ColorblindMode,
    type NodeShape,
    type ConnectionStyle,
    type ThemePreset,
    THEME_PRESETS,
    getColorblindSafePalette,
    paletteToCSS,
    importThemeFromJSON,
    exportThemeAsJSON,
} from "./colorPaletteGenerator";
import { validatePalette, type AccessibilityReport } from "./accessibilityChecker";
import { useTheme } from "./ThemeContext";

// ============================================================================
// TYPES
// ============================================================================

export type FontSize = "small" | "medium" | "large" | "xl";

export interface MapThemePreferences {
    // Active theme preset ID or "custom"
    presetId: string;
    // Colorblind assistance mode
    colorblindMode: ColorblindMode;
    // Node appearance
    nodeShape: NodeShape;
    // Connection appearance
    connectionStyle: ConnectionStyle;
    // Map label font size
    fontSize: FontSize;
    // Custom theme (when presetId === "custom")
    customTheme: ThemePreset | null;
    // Animation preferences
    reducedMotion: boolean;
    // Show connection labels
    showConnectionLabels: boolean;
    // Node border radius (0-16)
    nodeBorderRadius: number;
    // Connection line width (1-4)
    connectionWidth: number;
}

export interface MapThemeContextType {
    // Current preferences
    preferences: MapThemePreferences;
    // Computed palette (with colorblind adjustments applied)
    palette: ColorPalette;
    // Current theme preset
    currentPreset: ThemePreset;
    // Available presets
    presets: ThemePreset[];
    // Accessibility report for current palette
    accessibilityReport: AccessibilityReport | null;

    // Actions
    setPreset: (presetId: string) => void;
    setColorblindMode: (mode: ColorblindMode) => void;
    setNodeShape: (shape: NodeShape) => void;
    setConnectionStyle: (style: ConnectionStyle) => void;
    setFontSize: (size: FontSize) => void;
    setReducedMotion: (reduced: boolean) => void;
    setShowConnectionLabels: (show: boolean) => void;
    setNodeBorderRadius: (radius: number) => void;
    setConnectionWidth: (width: number) => void;

    // Custom theme actions
    setCustomTheme: (theme: ThemePreset) => void;
    exportTheme: () => string;
    importTheme: (json: string) => boolean;
    resetToDefaults: () => void;

    // Utility
    getCSSVariables: () => string;
    isCustomTheme: boolean;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_PREFERENCES: MapThemePreferences = {
    presetId: "forge-dark",
    colorblindMode: "none",
    nodeShape: "rounded-square",
    connectionStyle: "curved",
    fontSize: "medium",
    customTheme: null,
    reducedMotion: false,
    showConnectionLabels: false,
    nodeBorderRadius: 12,
    connectionWidth: 2,
};

const STORAGE_KEY = "map-theme-preferences";

// ============================================================================
// CONTEXT
// ============================================================================

const MapThemeContext = createContext<MapThemeContextType | null>(null);

// ============================================================================
// UTILITIES
// ============================================================================

function loadPreferences(): MapThemePreferences {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_PREFERENCES, ...parsed };
        }
    } catch {
        // Ignore localStorage errors
    }

    return DEFAULT_PREFERENCES;
}

function savePreferences(prefs: MapThemePreferences): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // Ignore localStorage errors
    }
}

function getPresetById(presetId: string): ThemePreset | undefined {
    return THEME_PRESETS.find((p) => p.id === presetId);
}

// ============================================================================
// PROVIDER
// ============================================================================

interface MapThemeProviderProps {
    children: React.ReactNode;
}

export function MapThemeProvider({ children }: MapThemeProviderProps) {
    const { resolvedTheme } = useTheme();
    const [preferences, setPreferences] = useState<MapThemePreferences>(DEFAULT_PREFERENCES);
    const [mounted, setMounted] = useState(false);

    // Load preferences on mount
    useEffect(() => {
        const loaded = loadPreferences();

        // Check for system reduced motion preference
        if (typeof window !== "undefined") {
            const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
            if (mediaQuery.matches) {
                loaded.reducedMotion = true;
            }
        }

        setPreferences(loaded);
        setMounted(true);
    }, []);

    // Save preferences when they change
    useEffect(() => {
        if (mounted) {
            savePreferences(preferences);
        }
    }, [preferences, mounted]);

    // Get current preset (respecting light/dark mode)
    const currentPreset = useMemo((): ThemePreset => {
        if (preferences.presetId === "custom" && preferences.customTheme) {
            return preferences.customTheme;
        }

        const preset = getPresetById(preferences.presetId);
        if (preset) {
            return preset;
        }

        // Fallback: use default based on system theme
        const defaultId = resolvedTheme === "dark" ? "forge-dark" : "forge-light";
        return getPresetById(defaultId) || THEME_PRESETS[0];
    }, [preferences.presetId, preferences.customTheme, resolvedTheme]);

    // Compute palette with colorblind adjustments
    const palette = useMemo((): ColorPalette => {
        let basePalette = currentPreset.palette;

        // Apply colorblind-safe colors if enabled
        if (preferences.colorblindMode !== "none") {
            basePalette = getColorblindSafePalette(basePalette, preferences.colorblindMode);
        }

        return basePalette;
    }, [currentPreset.palette, preferences.colorblindMode]);

    // Validate palette accessibility
    const accessibilityReport = useMemo((): AccessibilityReport | null => {
        try {
            return validatePalette(palette, "AA");
        } catch {
            return null;
        }
    }, [palette]);

    // Apply CSS variables to document
    useEffect(() => {
        if (!mounted || typeof document === "undefined") return;

        const css = paletteToCSS(palette, "map");
        const styleId = "map-theme-variables";

        let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `:root {\n${css}\n}`;

        // Also set data attributes for CSS selectors
        const root = document.documentElement;
        root.setAttribute("data-map-theme", preferences.presetId);
        root.setAttribute("data-node-shape", preferences.nodeShape);
        root.setAttribute("data-connection-style", preferences.connectionStyle);
        root.setAttribute("data-font-size", preferences.fontSize);
        root.setAttribute("data-colorblind-mode", preferences.colorblindMode);

        if (preferences.reducedMotion) {
            root.setAttribute("data-reduced-motion", "true");
        } else {
            root.removeAttribute("data-reduced-motion");
        }

        // Set CSS custom properties for dynamic values
        root.style.setProperty("--map-node-radius", `${preferences.nodeBorderRadius}px`);
        root.style.setProperty("--map-connection-width", `${preferences.connectionWidth}px`);
        root.style.setProperty("--map-font-size", getFontSizeValue(preferences.fontSize));

        return () => {
            // Cleanup on unmount
            styleElement?.remove();
        };
    }, [mounted, palette, preferences]);

    // Actions
    const setPreset = useCallback((presetId: string) => {
        setPreferences((prev) => ({ ...prev, presetId }));
    }, []);

    const setColorblindMode = useCallback((colorblindMode: ColorblindMode) => {
        setPreferences((prev) => ({ ...prev, colorblindMode }));
    }, []);

    const setNodeShape = useCallback((nodeShape: NodeShape) => {
        setPreferences((prev) => ({ ...prev, nodeShape }));
    }, []);

    const setConnectionStyle = useCallback((connectionStyle: ConnectionStyle) => {
        setPreferences((prev) => ({ ...prev, connectionStyle }));
    }, []);

    const setFontSize = useCallback((fontSize: FontSize) => {
        setPreferences((prev) => ({ ...prev, fontSize }));
    }, []);

    const setReducedMotion = useCallback((reducedMotion: boolean) => {
        setPreferences((prev) => ({ ...prev, reducedMotion }));
    }, []);

    const setShowConnectionLabels = useCallback((showConnectionLabels: boolean) => {
        setPreferences((prev) => ({ ...prev, showConnectionLabels }));
    }, []);

    const setNodeBorderRadius = useCallback((nodeBorderRadius: number) => {
        setPreferences((prev) => ({
            ...prev,
            nodeBorderRadius: Math.max(0, Math.min(16, nodeBorderRadius)),
        }));
    }, []);

    const setConnectionWidth = useCallback((connectionWidth: number) => {
        setPreferences((prev) => ({
            ...prev,
            connectionWidth: Math.max(1, Math.min(4, connectionWidth)),
        }));
    }, []);

    const setCustomTheme = useCallback((theme: ThemePreset) => {
        setPreferences((prev) => ({
            ...prev,
            presetId: "custom",
            customTheme: theme,
        }));
    }, []);

    const exportTheme = useCallback((): string => {
        return exportThemeAsJSON(currentPreset);
    }, [currentPreset]);

    const importTheme = useCallback((json: string): boolean => {
        const imported = importThemeFromJSON(json);
        if (imported) {
            setCustomTheme(imported);
            return true;
        }
        return false;
    }, [setCustomTheme]);

    const resetToDefaults = useCallback(() => {
        setPreferences(DEFAULT_PREFERENCES);
    }, []);

    const getCSSVariables = useCallback((): string => {
        return paletteToCSS(palette, "map");
    }, [palette]);

    const value: MapThemeContextType = {
        preferences,
        palette,
        currentPreset,
        presets: THEME_PRESETS,
        accessibilityReport,
        setPreset,
        setColorblindMode,
        setNodeShape,
        setConnectionStyle,
        setFontSize,
        setReducedMotion,
        setShowConnectionLabels,
        setNodeBorderRadius,
        setConnectionWidth,
        setCustomTheme,
        exportTheme,
        importTheme,
        resetToDefaults,
        getCSSVariables,
        isCustomTheme: preferences.presetId === "custom",
    };

    // Don't render until mounted to prevent hydration mismatch
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <MapThemeContext.Provider value={value}>
            {children}
        </MapThemeContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export function useMapTheme(): MapThemeContextType {
    const context = useContext(MapThemeContext);
    if (!context) {
        throw new Error("useMapTheme must be used within a MapThemeProvider");
    }
    return context;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getFontSizeValue(size: FontSize): string {
    switch (size) {
        case "small":
            return "0.75rem";
        case "medium":
            return "0.875rem";
        case "large":
            return "1rem";
        case "xl":
            return "1.125rem";
    }
}

/**
 * Get CSS class for node shape
 */
export function getNodeShapeClass(shape: NodeShape): string {
    switch (shape) {
        case "circle":
            return "rounded-full";
        case "hexagon":
            return "clip-hexagon";
        case "rounded-square":
            return "rounded-xl";
    }
}

/**
 * Get connection path generator for style
 */
export function getConnectionPathStyle(style: ConnectionStyle): {
    curve: "straight" | "curved";
    animated: boolean;
} {
    switch (style) {
        case "straight":
            return { curve: "straight", animated: false };
        case "curved":
            return { curve: "curved", animated: false };
        case "animated":
            return { curve: "curved", animated: true };
    }
}
