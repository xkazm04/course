"use client";

/**
 * Theme Customizer Component
 *
 * Advanced theme editor for creating custom map themes.
 * Allows fine-grained control over all color variables.
 */

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Palette,
    Download,
    Upload,
    Copy,
    Check,
    AlertCircle,
    Sparkles,
    Eye,
    Save,
    X,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useMapTheme } from "../lib/mapThemeProvider";
import {
    type ColorPalette,
    type ThemePreset,
    generatePaletteFromAccent,
    hexToRgb,
    rgbToHsl,
} from "../lib/colorPaletteGenerator";
import {
    checkContrast,
    formatContrastRatio,
    getContrastBadge,
    validatePalette,
} from "../lib/accessibilityChecker";

// ============================================================================
// TYPES
// ============================================================================

interface ThemeCustomizerProps {
    /** Called when customizer is closed */
    onClose?: () => void;
    /** Initial theme to edit (defaults to current) */
    initialTheme?: ThemePreset;
}

interface ColorInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    description?: string;
    contrastWith?: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Color input with preview and contrast info
 */
function ColorInput({
    label,
    value,
    onChange,
    description,
    contrastWith,
}: ColorInputProps) {
    const [isEditing, setIsEditing] = useState(false);

    const contrast = contrastWith ? checkContrast(value, contrastWith) : null;
    const badge = contrast ? getContrastBadge(contrast.ratio) : null;

    return (
        <div className="flex items-center gap-3 py-2">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--forge-text-primary)]">
                        {label}
                    </span>
                    {badge && (
                        <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                                backgroundColor: badge.color + "20",
                                color: badge.color,
                            }}
                        >
                            {badge.level}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-[var(--forge-text-muted)] truncate">
                        {description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Color preview */}
                <div
                    className="w-8 h-8 rounded-lg border border-[var(--forge-border-subtle)] cursor-pointer relative overflow-hidden"
                    style={{ backgroundColor: value }}
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {contrastWith && (
                        <div
                            className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                            style={{ color: value }}
                        >
                            Aa
                        </div>
                    )}
                </div>

                {/* Hex input */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono rounded border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)]"
                />

                {/* Native color picker */}
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                    style={{ padding: 0 }}
                />
            </div>
        </div>
    );
}

/**
 * Color section header
 */
function ColorSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border-b border-[var(--forge-border-subtle)] last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 text-left"
            >
                <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                    {title}
                </span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-[var(--forge-text-muted)]"
                >
                    ▼
                </motion.span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 space-y-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Theme preview card
 */
function ThemePreview({
    palette,
    isDark,
}: {
    palette: ColorPalette;
    isDark: boolean;
}) {
    return (
        <div
            className="p-4 rounded-xl border border-[var(--forge-border-subtle)]"
            style={{ backgroundColor: palette.background.primary }}
        >
            <p
                className="text-sm font-medium mb-3"
                style={{ color: palette.text.primary }}
            >
                Preview
            </p>

            {/* Mini map preview */}
            <div
                className="relative w-full h-32 rounded-lg overflow-hidden"
                style={{ backgroundColor: palette.background.secondary }}
            >
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full">
                    <line
                        x1="40"
                        y1="40"
                        x2="100"
                        y2="80"
                        stroke={palette.connections.default}
                        strokeWidth="2"
                    />
                    <line
                        x1="100"
                        y1="80"
                        x2="160"
                        y2="50"
                        stroke={palette.connections.active}
                        strokeWidth="2"
                    />
                </svg>

                {/* Nodes */}
                <div
                    className="absolute w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                        left: 28,
                        top: 28,
                        backgroundColor: palette.status.completedBg,
                        border: `2px solid ${palette.status.completed}`,
                    }}
                >
                    <Check
                        className="w-5 h-5"
                        style={{ color: palette.status.completed }}
                    />
                </div>

                <div
                    className="absolute w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                        left: 88,
                        top: 68,
                        backgroundColor: palette.status.inProgressBg,
                        border: `2px solid ${palette.status.inProgress}`,
                    }}
                >
                    <Sparkles
                        className="w-5 h-5"
                        style={{ color: palette.status.inProgress }}
                    />
                </div>

                <div
                    className="absolute w-12 h-12 rounded-xl flex items-center justify-center opacity-60"
                    style={{
                        left: 148,
                        top: 38,
                        backgroundColor: palette.status.lockedBg,
                        border: `2px solid ${palette.status.locked}`,
                    }}
                >
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: palette.status.locked }}
                    />
                </div>
            </div>

            {/* Domain colors */}
            <div className="flex gap-1 mt-3">
                {Object.entries(palette.domains).map(([domain, color]) => (
                    <div
                        key={domain}
                        className="flex-1 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                        title={domain}
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ThemeCustomizer({ onClose, initialTheme }: ThemeCustomizerProps) {
    const {
        currentPreset,
        setCustomTheme,
        exportTheme,
        importTheme,
    } = useMapTheme();

    // Working copy of the theme being edited
    const [editingTheme, setEditingTheme] = useState<ThemePreset>(
        initialTheme || {
            ...currentPreset,
            id: "custom",
            name: "Custom Theme",
        }
    );

    const [copied, setCopied] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    // Update a palette color
    const updateColor = useCallback(
        (section: keyof ColorPalette, key: string, value: string) => {
            // Validate hex color
            if (!/^#[0-9A-Fa-f]{6}$/.test(value)) return;

            setEditingTheme((prev) => ({
                ...prev,
                palette: {
                    ...prev.palette,
                    [section]: {
                        ...(prev.palette[section] as Record<string, string>),
                        [key]: value,
                    },
                },
            }));
        },
        []
    );

    // Generate palette from accent color
    const generateFromAccent = useCallback((accentHex: string) => {
        const newPalette = generatePaletteFromAccent(accentHex, editingTheme.isDark);
        setEditingTheme((prev) => ({
            ...prev,
            palette: newPalette,
        }));
    }, [editingTheme.isDark]);

    // Toggle dark mode
    const toggleDarkMode = useCallback(() => {
        const newIsDark = !editingTheme.isDark;
        // Regenerate palette for new mode
        const newPalette = generatePaletteFromAccent(
            editingTheme.palette.accent.primary,
            newIsDark
        );
        setEditingTheme((prev) => ({
            ...prev,
            isDark: newIsDark,
            palette: newPalette,
        }));
    }, [editingTheme.isDark, editingTheme.palette.accent.primary]);

    // Save theme
    const handleSave = useCallback(() => {
        setCustomTheme(editingTheme);
        onClose?.();
    }, [editingTheme, setCustomTheme, onClose]);

    // Copy theme JSON
    const handleCopy = useCallback(async () => {
        const json = JSON.stringify(editingTheme, null, 2);
        await navigator.clipboard.writeText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [editingTheme]);

    // Import theme
    const handleImport = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const imported = JSON.parse(text) as ThemePreset;

                // Validate structure
                if (!imported.palette || !imported.name) {
                    throw new Error("Invalid theme file");
                }

                setEditingTheme({
                    ...imported,
                    id: "custom",
                });
                setImportError(null);
            } catch (err) {
                setImportError("Failed to import theme. Please check the file format.");
            }
        };
        input.click();
    }, []);

    // Export theme
    const handleExport = useCallback(() => {
        const json = JSON.stringify(editingTheme, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${editingTheme.name.toLowerCase().replace(/\s+/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [editingTheme]);

    // Validate current palette
    const validation = validatePalette(editingTheme.palette, "AA");

    const { palette } = editingTheme;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl max-h-[90vh] bg-[var(--forge-bg-elevated)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--forge-border-subtle)]">
                    <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-[var(--ember)]" />
                        <div>
                            <input
                                type="text"
                                value={editingTheme.name}
                                onChange={(e) =>
                                    setEditingTheme((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                className="text-lg font-semibold bg-transparent border-none outline-none text-[var(--forge-text-primary)]"
                            />
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                Custom Theme Editor
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                editingTheme.isDark
                                    ? "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)]"
                                    : "bg-white text-gray-900 border border-gray-200"
                            )}
                        >
                            {editingTheme.isDark ? "Dark" : "Light"}
                        </button>

                        {/* Validation badge */}
                        <div
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                                validation.isValid
                                    ? "bg-[var(--forge-success)]/20 text-[var(--forge-success)]"
                                    : "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]"
                            )}
                        >
                            {validation.isValid ? (
                                <Check className="w-3 h-3" />
                            ) : (
                                <AlertCircle className="w-3 h-3" />
                            )}
                            WCAG {validation.level}
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Color editor */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Quick generate */}
                        <div className="p-4 rounded-xl bg-[var(--forge-bg-anvil)] space-y-3">
                            <p className="text-sm font-medium text-[var(--forge-text-primary)]">
                                Quick Generate
                            </p>
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                Pick an accent color to generate a full palette
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={palette.accent.primary}
                                    onChange={(e) => generateFromAccent(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={palette.accent.primary}
                                    onChange={(e) => generateFromAccent(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm font-mono rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)]"
                                    placeholder="#F97316"
                                />
                                <button
                                    onClick={() => generateFromAccent(palette.accent.primary)}
                                    className="px-4 py-2 rounded-lg bg-[var(--ember)] text-white text-sm font-medium hover:bg-[var(--ember-glow)] transition-colors"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Color sections */}
                        <ColorSection title="Backgrounds">
                            <ColorInput
                                label="Primary"
                                value={palette.background.primary}
                                onChange={(v) => updateColor("background", "primary", v)}
                                description="Main canvas background"
                            />
                            <ColorInput
                                label="Secondary"
                                value={palette.background.secondary}
                                onChange={(v) => updateColor("background", "secondary", v)}
                                description="Cards and containers"
                            />
                            <ColorInput
                                label="Elevated"
                                value={palette.background.elevated}
                                onChange={(v) => updateColor("background", "elevated", v)}
                                description="Floating elements"
                            />
                        </ColorSection>

                        <ColorSection title="Text">
                            <ColorInput
                                label="Primary"
                                value={palette.text.primary}
                                onChange={(v) => updateColor("text", "primary", v)}
                                description="Main text color"
                                contrastWith={palette.background.primary}
                            />
                            <ColorInput
                                label="Secondary"
                                value={palette.text.secondary}
                                onChange={(v) => updateColor("text", "secondary", v)}
                                description="Supporting text"
                                contrastWith={palette.background.primary}
                            />
                            <ColorInput
                                label="Muted"
                                value={palette.text.muted}
                                onChange={(v) => updateColor("text", "muted", v)}
                                description="Subtle text"
                                contrastWith={palette.background.primary}
                            />
                        </ColorSection>

                        <ColorSection title="Accent">
                            <ColorInput
                                label="Primary"
                                value={palette.accent.primary}
                                onChange={(v) => updateColor("accent", "primary", v)}
                                description="Main accent color"
                                contrastWith={palette.background.primary}
                            />
                            <ColorInput
                                label="Hover"
                                value={palette.accent.primaryHover}
                                onChange={(v) => updateColor("accent", "primaryHover", v)}
                                description="Hover state"
                            />
                            <ColorInput
                                label="Secondary"
                                value={palette.accent.secondary}
                                onChange={(v) => updateColor("accent", "secondary", v)}
                                description="Secondary accent"
                            />
                        </ColorSection>

                        <ColorSection title="Node Status">
                            <ColorInput
                                label="Completed"
                                value={palette.status.completed}
                                onChange={(v) => updateColor("status", "completed", v)}
                                contrastWith={palette.status.completedBg}
                            />
                            <ColorInput
                                label="Completed Bg"
                                value={palette.status.completedBg}
                                onChange={(v) => updateColor("status", "completedBg", v)}
                            />
                            <ColorInput
                                label="In Progress"
                                value={palette.status.inProgress}
                                onChange={(v) => updateColor("status", "inProgress", v)}
                                contrastWith={palette.status.inProgressBg}
                            />
                            <ColorInput
                                label="In Progress Bg"
                                value={palette.status.inProgressBg}
                                onChange={(v) => updateColor("status", "inProgressBg", v)}
                            />
                            <ColorInput
                                label="Available"
                                value={palette.status.available}
                                onChange={(v) => updateColor("status", "available", v)}
                                contrastWith={palette.status.availableBg}
                            />
                            <ColorInput
                                label="Available Bg"
                                value={palette.status.availableBg}
                                onChange={(v) => updateColor("status", "availableBg", v)}
                            />
                            <ColorInput
                                label="Locked"
                                value={palette.status.locked}
                                onChange={(v) => updateColor("status", "locked", v)}
                                contrastWith={palette.status.lockedBg}
                            />
                            <ColorInput
                                label="Locked Bg"
                                value={palette.status.lockedBg}
                                onChange={(v) => updateColor("status", "lockedBg", v)}
                            />
                        </ColorSection>

                        <ColorSection title="Domains">
                            <ColorInput
                                label="Frontend"
                                value={palette.domains.frontend}
                                onChange={(v) => updateColor("domains", "frontend", v)}
                            />
                            <ColorInput
                                label="Backend"
                                value={palette.domains.backend}
                                onChange={(v) => updateColor("domains", "backend", v)}
                            />
                            <ColorInput
                                label="Fullstack"
                                value={palette.domains.fullstack}
                                onChange={(v) => updateColor("domains", "fullstack", v)}
                            />
                            <ColorInput
                                label="Databases"
                                value={palette.domains.databases}
                                onChange={(v) => updateColor("domains", "databases", v)}
                            />
                            <ColorInput
                                label="Mobile"
                                value={palette.domains.mobile}
                                onChange={(v) => updateColor("domains", "mobile", v)}
                            />
                            <ColorInput
                                label="Games"
                                value={palette.domains.games}
                                onChange={(v) => updateColor("domains", "games", v)}
                            />
                        </ColorSection>
                    </div>

                    {/* Preview sidebar */}
                    <div className="w-80 border-l border-[var(--forge-border-subtle)] p-6 space-y-4 bg-[var(--forge-bg-anvil)]">
                        <ThemePreview palette={palette} isDark={editingTheme.isDark} />

                        {/* Import error */}
                        {importError && (
                            <div className="p-3 rounded-lg bg-[var(--forge-error)]/10 border border-[var(--forge-error)]/30">
                                <p className="text-xs text-[var(--forge-error)]">{importError}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={handleSave}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember-glow)] transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Save Theme
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-[var(--forge-success)]" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    {copied ? "Copied!" : "Copy"}
                                </button>

                                <button
                                    onClick={handleImport}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
                                >
                                    <Upload className="w-4 h-4" />
                                    Import
                                </button>

                                <button
                                    onClick={handleExport}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Validation warnings */}
                        {!validation.isValid && validation.failingPairs.length > 0 && (
                            <div className="p-3 rounded-lg bg-[var(--forge-warning)]/10 border border-[var(--forge-warning)]/30 space-y-2">
                                <p className="text-xs font-medium text-[var(--forge-warning)]">
                                    Contrast Issues ({validation.failingPairs.length})
                                </p>
                                <ul className="text-xs text-[var(--forge-text-muted)] space-y-1">
                                    {validation.failingPairs.slice(0, 3).map((pair, i) => (
                                        <li key={i} className="truncate">
                                            • {pair.name}
                                        </li>
                                    ))}
                                    {validation.failingPairs.length > 3 && (
                                        <li>
                                            +{validation.failingPairs.length - 3} more
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default ThemeCustomizer;
