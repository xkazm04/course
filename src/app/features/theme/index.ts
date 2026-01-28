// Base theme context (light/dark mode)
export { ThemeProvider, useTheme } from "./lib/ThemeContext";
export type { Theme, ResolvedTheme } from "./lib/ThemeContext";
export { ThemeToggle } from "./components/ThemeToggle";
export { ThemeProviderWrapper } from "./components/ThemeProviderWrapper";

// Color system exports
export {
    DOMAIN_COLORS,
    STATUS_STYLES,
    getDomainColors,
    getStatusColors,
    getDomainBg,
    getStatusBg,
} from "./lib/colors";
export type {
    DomainColorConfig,
    StatusStyleConfig,
    DomainColorKey,
    ThemeMode,
} from "./lib/colors";

// ============================================================================
// MAP THEME SYSTEM - Customizable themes for Knowledge Map
// ============================================================================

// Map Theme Provider - Global context for map visual preferences
export {
    MapThemeProvider,
    useMapTheme,
    getNodeShapeClass,
    getConnectionPathStyle,
} from "./lib/mapThemeProvider";
export type { FontSize, MapThemePreferences, MapThemeContextType } from "./lib/mapThemeProvider";

// Color Palette Generator - Create accessible color palettes
export {
    // Color manipulation utilities
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    adjustLightness,
    mixColors,
    withAlpha,
    // Colorblind simulation
    simulateColorblind,
    simulatePaletteColorblind,
    // Colorblind-safe palettes
    COLORBLIND_SAFE_STATUS,
    COLORBLIND_SAFE_DOMAINS,
    // Theme presets
    THEME_PRESETS,
    // Palette generation
    generatePaletteFromAccent,
    getColorblindSafePalette,
    paletteToCSS,
    exportThemeAsJSON,
    importThemeFromJSON,
} from "./lib/colorPaletteGenerator";
export type {
    ColorblindMode,
    NodeShape,
    ConnectionStyle,
    ColorPalette,
    ThemePreset,
} from "./lib/colorPaletteGenerator";

// Accessibility Checker - WCAG contrast validation
export {
    getRelativeLuminance,
    getContrastRatio,
    checkContrast,
    suggestContrastFix,
    getPaletteColorPairs,
    validatePalette,
    hasEnoughContrast,
    getReadableTextColor,
    isColorDark,
    formatContrastRatio,
    getContrastBadge,
    generateContrastReport,
} from "./lib/accessibilityChecker";
export type {
    WCAGLevel,
    TextSize,
    ContrastResult,
    ColorPair,
    AccessibilityReport,
} from "./lib/accessibilityChecker";

// ============================================================================
// COMPONENTS
// ============================================================================

// Theme Selector - UI for selecting themes and visual preferences
export { ThemeSelector } from "./components/ThemeSelector";

// Theme Customizer - Advanced theme editor
export { ThemeCustomizer } from "./components/ThemeCustomizer";
