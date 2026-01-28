"use client";

/**
 * Theme Selector Component
 *
 * UI for selecting map themes and visual preferences.
 * Includes preset themes, colorblind modes, and quick settings.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Palette,
    Sun,
    Moon,
    Eye,
    EyeOff,
    Circle,
    Hexagon,
    Square,
    Minus,
    Waves,
    Sparkles,
    Check,
    ChevronDown,
    Settings2,
    Type,
    Accessibility,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useMapTheme, type FontSize } from "../lib/mapThemeProvider";
import type { ColorblindMode, NodeShape, ConnectionStyle } from "../lib/colorPaletteGenerator";
import { formatContrastRatio, getContrastBadge } from "../lib/accessibilityChecker";

// ============================================================================
// TYPES
// ============================================================================

interface ThemeSelectorProps {
    /** Compact mode shows only essential options */
    compact?: boolean;
    /** Show accessibility settings */
    showAccessibility?: boolean;
    /** Called when settings panel is toggled */
    onSettingsToggle?: (open: boolean) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORBLIND_OPTIONS: { value: ColorblindMode; label: string; description: string }[] = [
    { value: "none", label: "None", description: "Standard colors" },
    { value: "deuteranopia", label: "Deuteranopia", description: "Red-green (most common)" },
    { value: "protanopia", label: "Protanopia", description: "Red-blind" },
    { value: "tritanopia", label: "Tritanopia", description: "Blue-yellow" },
];

const NODE_SHAPE_OPTIONS: { value: NodeShape; label: string; icon: React.ReactNode }[] = [
    { value: "circle", label: "Circle", icon: <Circle className="w-4 h-4" /> },
    { value: "hexagon", label: "Hexagon", icon: <Hexagon className="w-4 h-4" /> },
    { value: "rounded-square", label: "Rounded", icon: <Square className="w-4 h-4" /> },
];

const CONNECTION_STYLE_OPTIONS: { value: ConnectionStyle; label: string; icon: React.ReactNode }[] = [
    { value: "straight", label: "Straight", icon: <Minus className="w-4 h-4" /> },
    { value: "curved", label: "Curved", icon: <Waves className="w-4 h-4" /> },
    { value: "animated", label: "Animated", icon: <Sparkles className="w-4 h-4" /> },
];

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
    { value: "small", label: "S" },
    { value: "medium", label: "M" },
    { value: "large", label: "L" },
    { value: "xl", label: "XL" },
];

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Theme preset card
 */
function ThemePresetCard({
    preset,
    isSelected,
    onClick,
}: {
    preset: { id: string; name: string; description: string; isDark: boolean; palette: { background: { primary: string }; accent: { primary: string }; status: { completed: string; inProgress: string } } };
    isSelected: boolean;
    onClick: () => void;
}) {
    const { palette } = preset;

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative w-full p-3 rounded-xl border-2 transition-all text-left",
                "hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2",
                isSelected
                    ? "border-[var(--ember)] ring-2 ring-[var(--ember)]/30"
                    : "border-[var(--forge-border-subtle)] hover:border-[var(--forge-border-default)]"
            )}
            style={{
                backgroundColor: palette.background.primary,
            }}
        >
            {/* Color swatches */}
            <div className="flex gap-1.5 mb-2">
                <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: palette.accent.primary }}
                />
                <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: palette.status.completed }}
                />
                <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: palette.status.inProgress }}
                />
            </div>

            {/* Label */}
            <div className="flex items-center justify-between">
                <div>
                    <p
                        className="text-sm font-medium"
                        style={{ color: preset.isDark ? "#FAFAFA" : "#1A1816" }}
                    >
                        {preset.name}
                    </p>
                    <p
                        className="text-xs opacity-60"
                        style={{ color: preset.isDark ? "#A1A1AA" : "#5C564E" }}
                    >
                        {preset.isDark ? "Dark" : "Light"}
                    </p>
                </div>
                {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[var(--ember)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                )}
            </div>
        </button>
    );
}

/**
 * Option button group
 */
function OptionGroup<T extends string>({
    options,
    value,
    onChange,
    label,
}: {
    options: { value: T; label: string; icon?: React.ReactNode }[];
    value: T;
    onChange: (value: T) => void;
    label: string;
}) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--forge-text-secondary)]">
                {label}
            </label>
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--forge-bg-anvil)]">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            value === option.value
                                ? "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] shadow-sm"
                                : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        )}
                    >
                        {option.icon}
                        <span>{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * Slider control
 */
function SliderControl({
    value,
    onChange,
    min,
    max,
    label,
    formatValue,
}: {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    label: string;
    formatValue?: (value: number) => string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-xs font-medium text-[var(--forge-text-secondary)]">
                    {label}
                </label>
                <span className="text-xs text-[var(--forge-text-muted)]">
                    {formatValue ? formatValue(value) : value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[var(--forge-bg-anvil)]"
                style={{
                    background: `linear-gradient(to right, var(--ember) ${((value - min) / (max - min)) * 100}%, var(--forge-bg-anvil) ${((value - min) / (max - min)) * 100}%)`,
                }}
            />
        </div>
    );
}

/**
 * Toggle switch
 */
function Toggle({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className="flex items-center justify-between w-full py-2 group"
        >
            <div className="text-left">
                <p className="text-sm text-[var(--forge-text-primary)]">{label}</p>
                {description && (
                    <p className="text-xs text-[var(--forge-text-muted)]">{description}</p>
                )}
            </div>
            <div
                className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    checked ? "bg-[var(--ember)]" : "bg-[var(--forge-bg-anvil)]"
                )}
            >
                <div
                    className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                        checked ? "translate-x-5" : "translate-x-1"
                    )}
                />
            </div>
        </button>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ThemeSelector({
    compact = false,
    showAccessibility = true,
    onSettingsToggle,
}: ThemeSelectorProps) {
    const {
        preferences,
        presets,
        currentPreset,
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
        resetToDefaults,
    } = useMapTheme();

    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<"themes" | "appearance" | "accessibility">("themes");

    const toggleExpanded = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        onSettingsToggle?.(newState);
    };

    // Compact view - just shows current theme and toggle
    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={toggleExpanded}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                        "border border-[var(--forge-border-subtle)]",
                        "hover:border-[var(--forge-border-default)]",
                        "bg-[var(--forge-bg-elevated)]"
                    )}
                >
                    <Palette className="w-4 h-4 text-[var(--ember)]" />
                    <span className="text-sm text-[var(--forge-text-primary)]">
                        {currentPreset.name}
                    </span>
                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-[var(--forge-text-muted)] transition-transform",
                            isExpanded && "rotate-180"
                        )}
                    />
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full right-0 mt-2 w-80 p-4 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] shadow-xl z-50"
                        >
                            <ThemeSelectorContent
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                showAccessibility={showAccessibility}
                                preferences={preferences}
                                presets={presets}
                                currentPreset={currentPreset}
                                accessibilityReport={accessibilityReport}
                                setPreset={setPreset}
                                setColorblindMode={setColorblindMode}
                                setNodeShape={setNodeShape}
                                setConnectionStyle={setConnectionStyle}
                                setFontSize={setFontSize}
                                setReducedMotion={setReducedMotion}
                                setShowConnectionLabels={setShowConnectionLabels}
                                setNodeBorderRadius={setNodeBorderRadius}
                                setConnectionWidth={setConnectionWidth}
                                resetToDefaults={resetToDefaults}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Full view
    return (
        <div className="p-4 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
            <ThemeSelectorContent
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                showAccessibility={showAccessibility}
                preferences={preferences}
                presets={presets}
                currentPreset={currentPreset}
                accessibilityReport={accessibilityReport}
                setPreset={setPreset}
                setColorblindMode={setColorblindMode}
                setNodeShape={setNodeShape}
                setConnectionStyle={setConnectionStyle}
                setFontSize={setFontSize}
                setReducedMotion={setReducedMotion}
                setShowConnectionLabels={setShowConnectionLabels}
                setNodeBorderRadius={setNodeBorderRadius}
                setConnectionWidth={setConnectionWidth}
                resetToDefaults={resetToDefaults}
            />
        </div>
    );
}

/**
 * Internal content component
 */
function ThemeSelectorContent({
    activeTab,
    setActiveTab,
    showAccessibility,
    preferences,
    presets,
    currentPreset,
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
    resetToDefaults,
}: {
    activeTab: "themes" | "appearance" | "accessibility";
    setActiveTab: (tab: "themes" | "appearance" | "accessibility") => void;
    showAccessibility: boolean;
    preferences: ReturnType<typeof useMapTheme>["preferences"];
    presets: ReturnType<typeof useMapTheme>["presets"];
    currentPreset: ReturnType<typeof useMapTheme>["currentPreset"];
    accessibilityReport: ReturnType<typeof useMapTheme>["accessibilityReport"];
    setPreset: ReturnType<typeof useMapTheme>["setPreset"];
    setColorblindMode: ReturnType<typeof useMapTheme>["setColorblindMode"];
    setNodeShape: ReturnType<typeof useMapTheme>["setNodeShape"];
    setConnectionStyle: ReturnType<typeof useMapTheme>["setConnectionStyle"];
    setFontSize: ReturnType<typeof useMapTheme>["setFontSize"];
    setReducedMotion: ReturnType<typeof useMapTheme>["setReducedMotion"];
    setShowConnectionLabels: ReturnType<typeof useMapTheme>["setShowConnectionLabels"];
    setNodeBorderRadius: ReturnType<typeof useMapTheme>["setNodeBorderRadius"];
    setConnectionWidth: ReturnType<typeof useMapTheme>["setConnectionWidth"];
    resetToDefaults: ReturnType<typeof useMapTheme>["resetToDefaults"];
}) {
    return (
        <div className="space-y-4">
            {/* Tab navigation */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--forge-bg-anvil)]">
                <button
                    onClick={() => setActiveTab("themes")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        activeTab === "themes"
                            ? "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] shadow-sm"
                            : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                    )}
                >
                    <Palette className="w-3.5 h-3.5" />
                    Themes
                </button>
                <button
                    onClick={() => setActiveTab("appearance")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        activeTab === "appearance"
                            ? "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] shadow-sm"
                            : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                    )}
                >
                    <Settings2 className="w-3.5 h-3.5" />
                    Style
                </button>
                {showAccessibility && (
                    <button
                        onClick={() => setActiveTab("accessibility")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            activeTab === "accessibility"
                                ? "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] shadow-sm"
                                : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        )}
                    >
                        <Accessibility className="w-3.5 h-3.5" />
                        Access
                    </button>
                )}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                {activeTab === "themes" && (
                    <motion.div
                        key="themes"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map((preset) => (
                                <ThemePresetCard
                                    key={preset.id}
                                    preset={preset}
                                    isSelected={currentPreset.id === preset.id}
                                    onClick={() => setPreset(preset.id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === "appearance" && (
                    <motion.div
                        key="appearance"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                    >
                        <OptionGroup
                            label="Node Shape"
                            options={NODE_SHAPE_OPTIONS}
                            value={preferences.nodeShape}
                            onChange={setNodeShape}
                        />

                        <OptionGroup
                            label="Connection Style"
                            options={CONNECTION_STYLE_OPTIONS}
                            value={preferences.connectionStyle}
                            onChange={setConnectionStyle}
                        />

                        <OptionGroup
                            label="Label Size"
                            options={FONT_SIZE_OPTIONS}
                            value={preferences.fontSize}
                            onChange={setFontSize}
                        />

                        <SliderControl
                            label="Border Radius"
                            value={preferences.nodeBorderRadius}
                            onChange={setNodeBorderRadius}
                            min={0}
                            max={16}
                            formatValue={(v) => `${v}px`}
                        />

                        <SliderControl
                            label="Connection Width"
                            value={preferences.connectionWidth}
                            onChange={setConnectionWidth}
                            min={1}
                            max={4}
                            formatValue={(v) => `${v}px`}
                        />

                        <Toggle
                            label="Show Connection Labels"
                            checked={preferences.showConnectionLabels}
                            onChange={setShowConnectionLabels}
                        />
                    </motion.div>
                )}

                {activeTab === "accessibility" && showAccessibility && (
                    <motion.div
                        key="accessibility"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                    >
                        {/* Colorblind mode */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--forge-text-secondary)]">
                                Colorblind Assistance
                            </label>
                            <div className="space-y-1">
                                {COLORBLIND_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setColorblindMode(option.value)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all",
                                            preferences.colorblindMode === option.value
                                                ? "bg-[var(--ember)]/10 border border-[var(--ember)]/30"
                                                : "bg-[var(--forge-bg-anvil)] border border-transparent hover:bg-[var(--forge-bg-elevated)]"
                                        )}
                                    >
                                        <div className="text-left">
                                            <p className="text-sm text-[var(--forge-text-primary)]">
                                                {option.label}
                                            </p>
                                            <p className="text-xs text-[var(--forge-text-muted)]">
                                                {option.description}
                                            </p>
                                        </div>
                                        {preferences.colorblindMode === option.value && (
                                            <Check className="w-4 h-4 text-[var(--ember)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Toggle
                            label="Reduced Motion"
                            description="Disable animations for accessibility"
                            checked={preferences.reducedMotion}
                            onChange={setReducedMotion}
                        />

                        {/* Accessibility report */}
                        {accessibilityReport && (
                            <div className="p-3 rounded-lg bg-[var(--forge-bg-anvil)] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-[var(--forge-text-secondary)]">
                                        Contrast Check
                                    </span>
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded text-xs font-medium",
                                            accessibilityReport.isValid
                                                ? "bg-[var(--forge-success)]/20 text-[var(--forge-success)]"
                                                : "bg-[var(--forge-error)]/20 text-[var(--forge-error)]"
                                        )}
                                    >
                                        {accessibilityReport.isValid ? "WCAG AA Pass" : "Needs Review"}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--forge-text-muted)]">
                                    {accessibilityReport.passingPairs}/{accessibilityReport.totalPairs} color pairs meet contrast requirements
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reset button */}
            <button
                onClick={resetToDefaults}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] transition-all"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Defaults
            </button>
        </div>
    );
}

export default ThemeSelector;
