/**
 * Accessibility Checker
 *
 * Validates color contrast ratios according to WCAG 2.1 guidelines.
 * Ensures map themes meet accessibility standards.
 *
 * WCAG Contrast Requirements:
 * - AA Normal Text (14pt+): 4.5:1
 * - AA Large Text (18pt+ or 14pt bold): 3:1
 * - AA UI Components: 3:1
 * - AAA Normal Text: 7:1
 * - AAA Large Text: 4.5:1
 */

import { hexToRgb, type ColorPalette } from "./colorPaletteGenerator";

// ============================================================================
// TYPES
// ============================================================================

export type WCAGLevel = "A" | "AA" | "AAA";
export type TextSize = "normal" | "large";

export interface ContrastResult {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
    passesAALarge: boolean;
    passesAAALarge: boolean;
    passesUIComponent: boolean;
}

export interface ColorPair {
    foreground: string;
    background: string;
    name: string;
    context: "text" | "ui" | "decorative";
    size?: TextSize;
}

export interface AccessibilityReport {
    isValid: boolean;
    level: WCAGLevel;
    totalPairs: number;
    passingPairs: number;
    failingPairs: ColorPair[];
    warnings: ColorPair[];
    suggestions: string[];
}

// ============================================================================
// CONTRAST CALCULATION
// ============================================================================

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export function getRelativeLuminance(hex: string): number {
    const { r, g, b } = hexToRgb(hex);

    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear = rsRGB <= 0.03928
        ? rsRGB / 12.92
        : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928
        ? gsRGB / 12.92
        : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928
        ? bsRGB / 12.92
        : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a ratio like 4.5 (representing 4.5:1)
 */
export function getContrastRatio(color1: string, color2: string): number {
    const l1 = getRelativeLuminance(color1);
    const l2 = getRelativeLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check contrast against WCAG requirements
 */
export function checkContrast(
    foreground: string,
    background: string
): ContrastResult {
    const ratio = getContrastRatio(foreground, background);

    return {
        ratio: Math.round(ratio * 100) / 100,
        passesAA: ratio >= 4.5,
        passesAAA: ratio >= 7,
        passesAALarge: ratio >= 3,
        passesAAALarge: ratio >= 4.5,
        passesUIComponent: ratio >= 3,
    };
}

/**
 * Suggest a color adjustment to meet contrast requirements
 */
export function suggestContrastFix(
    foreground: string,
    background: string,
    targetRatio: number = 4.5
): string {
    const currentRatio = getContrastRatio(foreground, background);

    if (currentRatio >= targetRatio) {
        return foreground; // Already meets requirement
    }

    const fgLuminance = getRelativeLuminance(foreground);
    const bgLuminance = getRelativeLuminance(background);

    // Determine if we should lighten or darken
    const shouldLighten = bgLuminance < 0.5;

    // Binary search for the right luminance
    let low = shouldLighten ? fgLuminance : 0;
    let high = shouldLighten ? 1 : fgLuminance;
    let bestColor = foreground;

    for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        const testColor = luminanceToColor(mid, foreground);
        const testRatio = getContrastRatio(testColor, background);

        if (testRatio >= targetRatio) {
            bestColor = testColor;
            if (shouldLighten) {
                high = mid;
            } else {
                low = mid;
            }
        } else {
            if (shouldLighten) {
                low = mid;
            } else {
                high = mid;
            }
        }
    }

    return bestColor;
}

/**
 * Convert a target luminance back to a hex color
 * Maintains the original hue and saturation
 */
function luminanceToColor(targetLuminance: number, originalColor: string): string {
    const { r, g, b } = hexToRgb(originalColor);

    // Calculate the current luminance factors
    const currentLuminance = getRelativeLuminance(originalColor);
    if (currentLuminance === 0) {
        // Handle pure black - return a gray
        const gray = Math.round(Math.pow(targetLuminance * 12.92, 1 / 2.4) * 255);
        return rgbToHex(gray, gray, gray);
    }

    // Scale RGB proportionally
    const scale = targetLuminance / currentLuminance;
    const newR = Math.min(255, Math.max(0, Math.round(r * scale)));
    const newG = Math.min(255, Math.max(0, Math.round(g * scale)));
    const newB = Math.min(255, Math.max(0, Math.round(b * scale)));

    return rgbToHex(newR, newG, newB);
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b]
        .map((x) => {
            const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        })
        .join("");
}

// ============================================================================
// PALETTE VALIDATION
// ============================================================================

/**
 * Define all color pairs that need to be checked in a palette
 */
export function getPaletteColorPairs(palette: ColorPalette): ColorPair[] {
    const pairs: ColorPair[] = [];

    // Text on backgrounds
    pairs.push({
        foreground: palette.text.primary,
        background: palette.background.primary,
        name: "Primary text on primary background",
        context: "text",
        size: "normal",
    });

    pairs.push({
        foreground: palette.text.primary,
        background: palette.background.elevated,
        name: "Primary text on elevated background",
        context: "text",
        size: "normal",
    });

    pairs.push({
        foreground: palette.text.secondary,
        background: palette.background.primary,
        name: "Secondary text on primary background",
        context: "text",
        size: "normal",
    });

    pairs.push({
        foreground: palette.text.muted,
        background: palette.background.primary,
        name: "Muted text on primary background",
        context: "text",
        size: "large", // Muted text usually used larger
    });

    // Accent on backgrounds
    pairs.push({
        foreground: palette.accent.primary,
        background: palette.background.primary,
        name: "Primary accent on primary background",
        context: "ui",
    });

    pairs.push({
        foreground: palette.text.inverse,
        background: palette.accent.primary,
        name: "Inverse text on accent background",
        context: "text",
        size: "normal",
    });

    // Status colors on their backgrounds
    pairs.push({
        foreground: palette.status.completed,
        background: palette.status.completedBg,
        name: "Completed status text on completed background",
        context: "ui",
    });

    pairs.push({
        foreground: palette.status.inProgress,
        background: palette.status.inProgressBg,
        name: "In-progress status text on in-progress background",
        context: "ui",
    });

    pairs.push({
        foreground: palette.status.available,
        background: palette.status.availableBg,
        name: "Available status text on available background",
        context: "ui",
    });

    // Borders on backgrounds
    pairs.push({
        foreground: palette.border.default,
        background: palette.background.primary,
        name: "Default border on primary background",
        context: "ui",
    });

    // Domain colors on primary background
    Object.entries(palette.domains).forEach(([domain, color]) => {
        pairs.push({
            foreground: color,
            background: palette.background.primary,
            name: `${domain} domain color on primary background`,
            context: "ui",
        });
    });

    return pairs;
}

/**
 * Validate a full color palette against WCAG requirements
 */
export function validatePalette(
    palette: ColorPalette,
    level: WCAGLevel = "AA"
): AccessibilityReport {
    const pairs = getPaletteColorPairs(palette);
    const failingPairs: ColorPair[] = [];
    const warnings: ColorPair[] = [];
    const suggestions: string[] = [];

    pairs.forEach((pair) => {
        // Skip pairs with rgba/transparent backgrounds
        if (pair.background.includes("rgba") || pair.background === "transparent") {
            return;
        }

        const result = checkContrast(pair.foreground, pair.background);

        // Determine minimum required ratio
        let requiredRatio: number;
        if (pair.context === "decorative") {
            return; // Decorative elements don't need contrast
        } else if (pair.context === "ui") {
            requiredRatio = 3;
        } else if (pair.size === "large") {
            requiredRatio = level === "AAA" ? 4.5 : 3;
        } else {
            requiredRatio = level === "AAA" ? 7 : 4.5;
        }

        if (result.ratio < requiredRatio) {
            failingPairs.push(pair);

            // Generate suggestion
            const fixedColor = suggestContrastFix(
                pair.foreground,
                pair.background,
                requiredRatio
            );
            suggestions.push(
                `${pair.name}: Change ${pair.foreground} to ${fixedColor} (current ratio: ${result.ratio}:1, required: ${requiredRatio}:1)`
            );
        } else if (result.ratio < requiredRatio * 1.2) {
            // Warn if close to failing
            warnings.push(pair);
        }
    });

    return {
        isValid: failingPairs.length === 0,
        level,
        totalPairs: pairs.length,
        passingPairs: pairs.length - failingPairs.length,
        failingPairs,
        warnings,
        suggestions,
    };
}

/**
 * Quick check if two colors have sufficient contrast
 */
export function hasEnoughContrast(
    foreground: string,
    background: string,
    minRatio: number = 4.5
): boolean {
    const ratio = getContrastRatio(foreground, background);
    return ratio >= minRatio;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a readable text color (black or white) for a background
 */
export function getReadableTextColor(background: string): string {
    const luminance = getRelativeLuminance(background);
    return luminance > 0.179 ? "#000000" : "#FFFFFF";
}

/**
 * Check if a color is considered "dark"
 */
export function isColorDark(hex: string): boolean {
    const luminance = getRelativeLuminance(hex);
    return luminance < 0.179;
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
    return `${ratio.toFixed(2)}:1`;
}

/**
 * Get WCAG level badge based on contrast
 */
export function getContrastBadge(ratio: number): { level: string; color: string } {
    if (ratio >= 7) {
        return { level: "AAA", color: "#10B981" };
    } else if (ratio >= 4.5) {
        return { level: "AA", color: "#3B82F6" };
    } else if (ratio >= 3) {
        return { level: "AA Large", color: "#F59E0B" };
    } else {
        return { level: "Fail", color: "#EF4444" };
    }
}

/**
 * Generate a contrast report as a string
 */
export function generateContrastReport(report: AccessibilityReport): string {
    const lines: string[] = [
        `WCAG ${report.level} Accessibility Report`,
        `${"=".repeat(40)}`,
        ``,
        `Status: ${report.isValid ? "✓ PASS" : "✗ FAIL"}`,
        `Passing: ${report.passingPairs}/${report.totalPairs} color pairs`,
        ``,
    ];

    if (report.failingPairs.length > 0) {
        lines.push(`Failing Pairs (${report.failingPairs.length}):`);
        report.failingPairs.forEach((pair) => {
            const ratio = getContrastRatio(pair.foreground, pair.background);
            lines.push(`  • ${pair.name}: ${formatContrastRatio(ratio)}`);
        });
        lines.push(``);
    }

    if (report.warnings.length > 0) {
        lines.push(`Warnings (${report.warnings.length}):`);
        report.warnings.forEach((pair) => {
            const ratio = getContrastRatio(pair.foreground, pair.background);
            lines.push(`  ⚠ ${pair.name}: ${formatContrastRatio(ratio)} (borderline)`);
        });
        lines.push(``);
    }

    if (report.suggestions.length > 0) {
        lines.push(`Suggestions:`);
        report.suggestions.forEach((suggestion) => {
            lines.push(`  → ${suggestion}`);
        });
    }

    return lines.join("\n");
}
