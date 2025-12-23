/**
 * Theme Compiler Module
 *
 * The ExtendedThemeScheme is not just a theme object - it's a compilation target.
 * Each mode compiles to a complete UI specification. This module provides the
 * ThemeCompiler that takes semantic UI intent and generates ExtendedThemeScheme,
 * enabling programmatic theme generation and user-customizable themes.
 *
 * Architecture: UI-as-compilation
 * - ThemeIntent: Semantic input describing desired UI characteristics
 * - ThemeCompiler: Transforms intent into concrete ExtendedThemeScheme
 * - Presets: Pre-defined intents for common use cases
 * - Hooks: React integration for dynamic theme consumption
 *
 * @example
 * ```tsx
 * // Using presets
 * const theme = themeCompiler.compilePreset("midnight");
 *
 * // Using custom intent
 * const theme = themeCompiler.compile({
 *   appearance: "dark",
 *   colors: { primary: "emerald", secondary: "teal" },
 *   accessibility: { highContrast: true }
 * });
 *
 * // In components with hooks
 * const { theme, switchToPreset } = useCompiledTheme({ base: "ocean" });
 * ```
 */

// Core compiler
export { ThemeCompiler, themeCompiler } from "./compiler";

// Types
export type {
  ThemeIntent,
  ThemePreset,
  SemanticColorPalette,
  ColorIntensity,
  ContrastLevel,
  ColorblindMode,
  AccessibilityIntent,
  SurfaceStyle,
  BorderRadiusStyle,
  AnimationIntensity,
  BrandCustomization,
  UserThemePreferences,
} from "./types";

// Presets
export {
  lightPreset,
  darkPreset,
  highContrastPreset,
  highContrastDarkPreset,
  sepiaPreset,
  protanopiaPreset,
  deuteranopiaPreset,
  tritanopiaPreset,
  midnightPreset,
  forestPreset,
  oceanPreset,
  sunsetPreset,
  themePresets,
  getPreset,
  listPresets,
  getPresetsByCategory,
} from "./presets";

// Color utilities
export {
  colorFamilies,
  intensityScales,
  contrastAdjustments,
  colorblindSafeColors,
  getColorClass,
  applyColorblindTransform,
  getAdjustedShade,
  generateGradientClasses,
  getHighContrastColors,
  getSepiaAdjustedColor,
  type ColorFamily,
} from "./colorUtils";

// React hooks
export {
  useCompiledTheme,
  useThemePresets,
  useStaticTheme,
  useStaticThemeFromIntent,
  useAccessibleTheme,
} from "./hooks";
