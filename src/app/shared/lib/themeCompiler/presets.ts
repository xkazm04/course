/**
 * Theme Presets
 *
 * Pre-configured ThemeIntent objects for common use cases.
 * These serve as starting points for theme compilation and demonstrate
 * the expressive power of the ThemeIntent system.
 */

import type { ThemeIntent, ThemePreset } from "./types";

// ============================================================================
// Base Presets
// ============================================================================

export const lightPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "indigo",
    secondary: "purple",
    tertiary: "cyan",
    success: "emerald",
    warning: "amber",
    error: "red",
  },
  intensity: "normal",
  contrast: "normal",
  surface: "glassmorphism",
  borderRadius: "rounded",
  animation: "normal",
  name: "Light",
};

export const darkPreset: ThemeIntent = {
  appearance: "dark",
  colors: {
    primary: "indigo",
    secondary: "purple",
    tertiary: "cyan",
    success: "emerald",
    warning: "amber",
    error: "red",
  },
  intensity: "normal",
  contrast: "normal",
  surface: "glassmorphism",
  borderRadius: "rounded",
  animation: "normal",
  name: "Dark",
};

// ============================================================================
// Accessibility Presets
// ============================================================================

export const highContrastPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "black" as string, // Will be handled specially
    secondary: "slate",
    success: "green",
    warning: "orange",
    error: "red",
  },
  intensity: "intense",
  contrast: "maximum",
  accessibility: {
    highContrast: true,
    reduceTransparency: true,
  },
  surface: "flat",
  borderRadius: "subtle",
  animation: "subtle",
  name: "High Contrast",
};

export const highContrastDarkPreset: ThemeIntent = {
  appearance: "dark",
  colors: {
    primary: "white" as string,
    secondary: "slate",
    success: "green",
    warning: "orange",
    error: "red",
  },
  intensity: "intense",
  contrast: "maximum",
  accessibility: {
    highContrast: true,
    reduceTransparency: true,
  },
  surface: "flat",
  borderRadius: "subtle",
  animation: "subtle",
  name: "High Contrast Dark",
};

// ============================================================================
// Colorblind-Safe Presets
// ============================================================================

export const protanopiaPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "blue",
    secondary: "orange",
    tertiary: "cyan",
    success: "cyan",
    warning: "amber",
    error: "orange",
  },
  intensity: "normal",
  contrast: "high",
  accessibility: {
    colorblindMode: "protanopia",
  },
  surface: "elevated",
  borderRadius: "rounded",
  animation: "normal",
  name: "Protanopia Safe",
};

export const deuteranopiaPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "blue",
    secondary: "orange",
    tertiary: "cyan",
    success: "blue",
    warning: "amber",
    error: "orange",
  },
  intensity: "normal",
  contrast: "high",
  accessibility: {
    colorblindMode: "deuteranopia",
  },
  surface: "elevated",
  borderRadius: "rounded",
  animation: "normal",
  name: "Deuteranopia Safe",
};

export const tritanopiaPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "rose",
    secondary: "teal",
    tertiary: "pink",
    success: "emerald",
    warning: "red",
    error: "rose",
  },
  intensity: "normal",
  contrast: "high",
  accessibility: {
    colorblindMode: "tritanopia",
  },
  surface: "elevated",
  borderRadius: "rounded",
  animation: "normal",
  name: "Tritanopia Safe",
};

// ============================================================================
// Aesthetic Presets
// ============================================================================

export const sepiaPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "amber",
    secondary: "orange",
    tertiary: "yellow",
    success: "green",
    warning: "orange",
    error: "red",
  },
  intensity: "subtle",
  contrast: "normal",
  surface: "elevated",
  borderRadius: "subtle",
  animation: "subtle",
  name: "Sepia",
};

export const midnightPreset: ThemeIntent = {
  appearance: "dark",
  colors: {
    primary: "violet",
    secondary: "indigo",
    tertiary: "purple",
    success: "emerald",
    warning: "amber",
    error: "rose",
  },
  intensity: "vivid",
  contrast: "normal",
  surface: "glassmorphism",
  borderRadius: "rounded",
  animation: "expressive",
  name: "Midnight",
};

export const forestPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "emerald",
    secondary: "teal",
    tertiary: "green",
    success: "green",
    warning: "amber",
    error: "red",
  },
  intensity: "normal",
  contrast: "normal",
  surface: "elevated",
  borderRadius: "rounded",
  animation: "normal",
  name: "Forest",
};

export const oceanPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "cyan",
    secondary: "blue",
    tertiary: "sky",
    success: "emerald",
    warning: "amber",
    error: "red",
  },
  intensity: "normal",
  contrast: "normal",
  surface: "glassmorphism",
  borderRadius: "rounded",
  animation: "normal",
  name: "Ocean",
};

export const sunsetPreset: ThemeIntent = {
  appearance: "light",
  colors: {
    primary: "orange",
    secondary: "rose",
    tertiary: "amber",
    success: "emerald",
    warning: "yellow",
    error: "red",
  },
  intensity: "vivid",
  contrast: "normal",
  surface: "elevated",
  borderRadius: "rounded",
  animation: "expressive",
  name: "Sunset",
};

// ============================================================================
// Preset Registry
// ============================================================================

export const themePresets: Record<ThemePreset, ThemeIntent> = {
  light: lightPreset,
  dark: darkPreset,
  highContrast: highContrastPreset,
  highContrastDark: highContrastDarkPreset,
  sepia: sepiaPreset,
  protanopia: protanopiaPreset,
  deuteranopia: deuteranopiaPreset,
  tritanopia: tritanopiaPreset,
  midnight: midnightPreset,
  forest: forestPreset,
  ocean: oceanPreset,
  sunset: sunsetPreset,
};

/**
 * Get a theme intent by preset name
 */
export function getPreset(preset: ThemePreset): ThemeIntent {
  return themePresets[preset];
}

/**
 * List all available presets
 */
export function listPresets(): ThemePreset[] {
  return Object.keys(themePresets) as ThemePreset[];
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(): {
  base: ThemePreset[];
  accessibility: ThemePreset[];
  aesthetic: ThemePreset[];
} {
  return {
    base: ["light", "dark"],
    accessibility: ["highContrast", "highContrastDark", "protanopia", "deuteranopia", "tritanopia"],
    aesthetic: ["sepia", "midnight", "forest", "ocean", "sunset"],
  };
}
