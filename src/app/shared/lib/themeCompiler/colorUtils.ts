/**
 * Color Utilities for Theme Compiler
 *
 * Provides color manipulation functions for generating theme variations,
 * accessibility adjustments, and colorblind-safe transformations.
 */

import type { ColorblindMode, ColorIntensity, ContrastLevel } from "./types";

// ============================================================================
// Color Name to Tailwind Class Mappings
// ============================================================================

/**
 * Named color to Tailwind color family mapping
 */
export const colorFamilies = {
  // Blues
  indigo: { light: "indigo", dark: "indigo" },
  blue: { light: "blue", dark: "blue" },
  sky: { light: "sky", dark: "sky" },
  cyan: { light: "cyan", dark: "cyan" },

  // Purples
  purple: { light: "purple", dark: "purple" },
  violet: { light: "violet", dark: "violet" },
  fuchsia: { light: "fuchsia", dark: "fuchsia" },

  // Pinks/Reds
  pink: { light: "pink", dark: "pink" },
  rose: { light: "rose", dark: "rose" },
  red: { light: "red", dark: "red" },

  // Oranges/Yellows
  orange: { light: "orange", dark: "orange" },
  amber: { light: "amber", dark: "amber" },
  yellow: { light: "yellow", dark: "yellow" },

  // Greens
  lime: { light: "lime", dark: "lime" },
  green: { light: "green", dark: "green" },
  emerald: { light: "emerald", dark: "emerald" },
  teal: { light: "teal", dark: "teal" },

  // Neutrals
  slate: { light: "slate", dark: "slate" },
  gray: { light: "gray", dark: "gray" },
  zinc: { light: "zinc", dark: "zinc" },
  neutral: { light: "neutral", dark: "neutral" },
  stone: { light: "stone", dark: "stone" },
} as const;

export type ColorFamily = keyof typeof colorFamilies;

// ============================================================================
// Intensity Scales
// ============================================================================

/**
 * Tailwind color shade mappings based on intensity
 */
export const intensityScales: Record<ColorIntensity, {
  light: { bg: number; text: number; accent: number; border: number };
  dark: { bg: number; text: number; accent: number; border: number };
}> = {
  subtle: {
    light: { bg: 50, text: 600, accent: 400, border: 200 },
    dark: { bg: 900, text: 300, accent: 400, border: 700 },
  },
  normal: {
    light: { bg: 100, text: 700, accent: 500, border: 200 },
    dark: { bg: 800, text: 200, accent: 400, border: 600 },
  },
  vivid: {
    light: { bg: 100, text: 800, accent: 600, border: 300 },
    dark: { bg: 700, text: 100, accent: 300, border: 500 },
  },
  intense: {
    light: { bg: 200, text: 900, accent: 700, border: 400 },
    dark: { bg: 600, text: 50, accent: 200, border: 400 },
  },
};

// ============================================================================
// Contrast Adjustments
// ============================================================================

/**
 * Contrast level adjustments for text/background combinations
 */
export const contrastAdjustments: Record<ContrastLevel, {
  textShadeBoost: number;
  borderOpacityBoost: number;
  shadowIntensity: string;
}> = {
  normal: {
    textShadeBoost: 0,
    borderOpacityBoost: 0,
    shadowIntensity: "shadow-lg",
  },
  high: {
    textShadeBoost: 100,
    borderOpacityBoost: 20,
    shadowIntensity: "shadow-xl",
  },
  maximum: {
    textShadeBoost: 200,
    borderOpacityBoost: 40,
    shadowIntensity: "shadow-2xl",
  },
};

// ============================================================================
// Colorblind-Safe Color Transformations
// ============================================================================

/**
 * Colorblind-safe color replacements
 * Maps problematic colors to safe alternatives
 */
export const colorblindSafeColors: Record<ColorblindMode, Record<string, string>> = {
  none: {},
  protanopia: {
    // Red-green (red weak) - replace reds with oranges/blues
    red: "amber",
    rose: "orange",
    pink: "violet",
    green: "cyan",
    emerald: "teal",
    lime: "sky",
  },
  deuteranopia: {
    // Red-green (green weak) - similar to protanopia
    red: "amber",
    rose: "orange",
    pink: "fuchsia",
    green: "blue",
    emerald: "cyan",
    lime: "sky",
  },
  tritanopia: {
    // Blue-yellow - replace blues/yellows with reds/cyans
    blue: "rose",
    indigo: "pink",
    violet: "fuchsia",
    yellow: "orange",
    amber: "red",
    lime: "emerald",
  },
  achromatopsia: {
    // Complete color blindness - use grayscale-friendly palette
    // All colors map to slate with intensity variations
    red: "slate",
    rose: "slate",
    pink: "slate",
    orange: "slate",
    amber: "slate",
    yellow: "slate",
    lime: "slate",
    green: "slate",
    emerald: "slate",
    teal: "slate",
    cyan: "slate",
    sky: "slate",
    blue: "slate",
    indigo: "slate",
    violet: "slate",
    purple: "slate",
    fuchsia: "slate",
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the Tailwind color class for a color family and shade
 */
export function getColorClass(
  prefix: "bg" | "text" | "border" | "from" | "via" | "to",
  color: string,
  shade: number,
  opacity?: number
): string {
  const opacitySuffix = opacity !== undefined ? `/${opacity}` : "";
  return `${prefix}-${color}-${shade}${opacitySuffix}`;
}

/**
 * Apply colorblind-safe transformation to a color
 */
export function applyColorblindTransform(
  color: string,
  mode: ColorblindMode
): string {
  if (mode === "none") return color;
  const mapping = colorblindSafeColors[mode];
  return mapping[color] ?? color;
}

/**
 * Get shade value adjusted for intensity and contrast
 */
export function getAdjustedShade(
  baseShade: number,
  contrastBoost: number,
  isText: boolean,
  isDark: boolean
): number {
  let adjusted = baseShade;

  if (isText) {
    // For text, increase shade for better contrast
    adjusted = isDark
      ? Math.max(50, baseShade - contrastBoost)
      : Math.min(900, baseShade + contrastBoost);
  }

  // Clamp to valid Tailwind shades
  const validShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  return validShades.reduce((prev, curr) =>
    Math.abs(curr - adjusted) < Math.abs(prev - adjusted) ? curr : prev
  );
}

/**
 * Generate gradient classes for a color scheme
 */
export function generateGradientClasses(
  primary: string,
  secondary: string,
  isDark: boolean
): {
  primaryBlob: string;
  secondaryBlob: string;
} {
  const intensity = isDark ? "900/30" : "200/30";
  return {
    primaryBlob: `bg-gradient-to-br from-${primary}-${intensity} via-purple-${intensity} to-blue-${intensity}`,
    secondaryBlob: `bg-gradient-to-tl from-cyan-${intensity} via-pink-${intensity} to-${secondary}-${intensity}`,
  };
}

/**
 * High contrast color scheme generator
 */
export function getHighContrastColors(isDark: boolean): {
  background: string;
  text: string;
  border: string;
} {
  return isDark
    ? {
        background: "bg-black",
        text: "text-white",
        border: "border-white",
      }
    : {
        background: "bg-white",
        text: "text-black",
        border: "border-black",
      };
}

/**
 * Sepia tone color adjustments
 */
export function getSepiaAdjustedColor(color: string): string {
  // Map cool colors to warm alternatives for sepia theme
  const sepiaMap: Record<string, string> = {
    blue: "amber",
    indigo: "orange",
    violet: "rose",
    cyan: "yellow",
    sky: "amber",
    slate: "stone",
    gray: "stone",
    zinc: "stone",
  };
  return sepiaMap[color] ?? color;
}
