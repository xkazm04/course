/**
 * Theme Compiler Types
 *
 * The ExtendedThemeScheme is not just a theme object - it's a compilation target.
 * Each ThemeIntent compiles to a complete UI specification (ExtendedThemeScheme).
 * This module defines the semantic UI intent types that serve as compiler input.
 */

// ============================================================================
// Semantic Color Intent
// ============================================================================

/**
 * Semantic color palette - the input vocabulary for theme compilation.
 * These are intent-based colors, not specific hex values.
 */
export interface SemanticColorPalette {
  /** Primary brand color (e.g., "indigo", "blue", "emerald") */
  primary: string;
  /** Secondary/accent color */
  secondary: string;
  /** Tertiary color for additional accents */
  tertiary?: string;
  /** Success state color */
  success?: string;
  /** Warning state color */
  warning?: string;
  /** Error state color */
  error?: string;
}

/**
 * Color intensity levels for fine-grained control
 */
export type ColorIntensity = "subtle" | "normal" | "vivid" | "intense";

/**
 * Contrast level specification
 */
export type ContrastLevel = "normal" | "high" | "maximum";

// ============================================================================
// Accessibility Intent
// ============================================================================

/**
 * Colorblind mode options for accessibility
 */
export type ColorblindMode =
  | "none"
  | "protanopia"      // Red-green (red weak)
  | "deuteranopia"    // Red-green (green weak)
  | "tritanopia"      // Blue-yellow
  | "achromatopsia";  // Complete color blindness

/**
 * Accessibility configuration for theme compilation
 */
export interface AccessibilityIntent {
  /** High contrast mode for visibility */
  highContrast?: boolean;
  /** Colorblind-safe color transformations */
  colorblindMode?: ColorblindMode;
  /** Reduce transparency for better readability */
  reduceTransparency?: boolean;
  /** Larger touch targets */
  largeTouchTargets?: boolean;
}

// ============================================================================
// Visual Style Intent
// ============================================================================

/**
 * Surface treatment style
 */
export type SurfaceStyle =
  | "flat"           // No depth, minimal shadows
  | "elevated"       // Cards with shadows
  | "glassmorphism"  // Blurred, translucent surfaces
  | "neumorphism"    // Soft shadows, embossed look
  | "brutalist";     // High contrast, stark edges

/**
 * Border radius style
 */
export type BorderRadiusStyle =
  | "sharp"          // 0 radius
  | "subtle"         // 4-8px radius
  | "rounded"        // 12-16px radius
  | "pill";          // Maximum radius

/**
 * Animation intensity
 */
export type AnimationIntensity =
  | "none"           // No animations
  | "subtle"         // Minimal, quick transitions
  | "normal"         // Standard animations
  | "expressive";    // Rich, playful animations

// ============================================================================
// Theme Intent - The Compiler Input
// ============================================================================

/**
 * ThemeIntent is the semantic input to the theme compiler.
 * It expresses UI intent without specifying exact CSS classes.
 * The compiler translates this intent into a complete ExtendedThemeScheme.
 */
export interface ThemeIntent {
  /** Base appearance: light or dark */
  appearance: "light" | "dark";

  /** Primary color palette */
  colors: SemanticColorPalette;

  /** Color intensity level */
  intensity?: ColorIntensity;

  /** Contrast level */
  contrast?: ContrastLevel;

  /** Accessibility options */
  accessibility?: AccessibilityIntent;

  /** Surface treatment style */
  surface?: SurfaceStyle;

  /** Border radius style */
  borderRadius?: BorderRadiusStyle;

  /** Animation intensity */
  animation?: AnimationIntensity;

  /** Optional name for the compiled theme */
  name?: string;
}

// ============================================================================
// Preset Identifiers
// ============================================================================

/**
 * Built-in theme presets that can be used directly
 */
export type ThemePreset =
  | "light"
  | "dark"
  | "highContrast"
  | "highContrastDark"
  | "sepia"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "midnight"
  | "forest"
  | "ocean"
  | "sunset";

// ============================================================================
// Brand Customization
// ============================================================================

/**
 * Brand-specific customization options
 */
export interface BrandCustomization {
  /** Primary brand color (hex or named color) */
  primaryColor: string;
  /** Secondary brand color */
  secondaryColor?: string;
  /** Accent color for highlights */
  accentColor?: string;
  /** Font family override */
  fontFamily?: string;
  /** Logo-compatible background requirement */
  logoBackgroundMode?: "light" | "dark" | "transparent";
}

/**
 * User preference overrides
 */
export interface UserThemePreferences {
  /** Preferred base theme */
  baseTheme?: "light" | "dark" | "system";
  /** Color intensity preference */
  intensity?: ColorIntensity;
  /** Contrast preference */
  contrast?: ContrastLevel;
  /** Accessibility needs */
  accessibility?: AccessibilityIntent;
}
