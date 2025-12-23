/**
 * Variant Pattern as State Machine
 *
 * This module provides a polymorphic component pattern where variants
 * are treated as different "modes" or "states" of the same UI concept.
 * Instead of 20 isolated variant files (5 features x 4 variants), we
 * express them as polymorphic components with mode parameters.
 *
 * Benefits:
 * - Single component with multiple expressions
 * - Adding new variants is trivial (add a mode)
 * - Shared state and logic across modes
 * - Type-safe mode transitions
 */

import { ComponentType } from "react";

// ============================================================================
// Core Types
// ============================================================================

/**
 * Represents a rendering mode for a polymorphic variant component.
 * Each mode transforms the component's rendering strategy while
 * maintaining the same underlying data and interactions.
 */
export interface VariantMode<TMode extends string = string> {
  id: TMode;
  name: string;
  description?: string;
}

/**
 * Configuration for a polymorphic variant component.
 * Defines all available modes and their metadata.
 */
export interface VariantConfig<TMode extends string> {
  /** Unique identifier for this variant component */
  id: string;
  /** Display name */
  name: string;
  /** Available rendering modes */
  modes: VariantMode<TMode>[];
  /** Default mode when none specified */
  defaultMode: TMode;
}

/**
 * Props for a polymorphic variant component.
 * The mode prop controls which rendering strategy is used.
 */
export interface PolymorphicVariantProps<TMode extends string, TData = unknown> {
  /** Current rendering mode */
  mode: TMode;
  /** Data to display (same across all modes) */
  data?: TData;
  /** Callback when mode changes (for internal transitions) */
  onModeChange?: (newMode: TMode) => void;
  /** Optional className for styling overrides */
  className?: string;
}

/**
 * A mode renderer is a component that knows how to render
 * the variant in a specific mode.
 */
export type ModeRenderer<TMode extends string, TData = unknown, TProps extends object = object> =
  ComponentType<PolymorphicVariantProps<TMode, TData> & TProps>;

/**
 * Map of modes to their renderer components.
 */
export type ModeRendererMap<TMode extends string, TData = unknown, TProps extends object = object> =
  Record<TMode, ModeRenderer<TMode, TData, TProps>>;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a variant configuration with type-safe modes.
 */
export function createVariantConfig<TMode extends string>(
  config: VariantConfig<TMode>
): VariantConfig<TMode> {
  return config;
}

/**
 * Creates a type-safe mode definition.
 */
export function createMode<TMode extends string>(
  id: TMode,
  name: string,
  description?: string
): VariantMode<TMode> {
  return { id, name, description };
}

// ============================================================================
// Mode Resolution Utilities
// ============================================================================

/**
 * Resolves the current mode, falling back to default if invalid.
 */
export function resolveMode<TMode extends string>(
  config: VariantConfig<TMode>,
  requestedMode?: TMode
): TMode {
  if (!requestedMode) return config.defaultMode;
  const isValid = config.modes.some(m => m.id === requestedMode);
  return isValid ? requestedMode : config.defaultMode;
}

/**
 * Gets mode metadata by ID.
 */
export function getModeById<TMode extends string>(
  config: VariantConfig<TMode>,
  modeId: TMode
): VariantMode<TMode> | undefined {
  return config.modes.find(m => m.id === modeId);
}

/**
 * Gets the next mode in sequence (useful for cycling through modes).
 */
export function getNextMode<TMode extends string>(
  config: VariantConfig<TMode>,
  currentMode: TMode
): TMode {
  const currentIndex = config.modes.findIndex(m => m.id === currentMode);
  const nextIndex = (currentIndex + 1) % config.modes.length;
  return config.modes[nextIndex].id;
}

/**
 * Gets the previous mode in sequence.
 */
export function getPreviousMode<TMode extends string>(
  config: VariantConfig<TMode>,
  currentMode: TMode
): TMode {
  const currentIndex = config.modes.findIndex(m => m.id === currentMode);
  const prevIndex = (currentIndex - 1 + config.modes.length) % config.modes.length;
  return config.modes[prevIndex].id;
}

// ============================================================================
// Theme/Style Types for Mode Variations
// ============================================================================

/**
 * Color scheme for theme-based mode variations (like light/dark).
 */
export interface ThemeColorScheme {
  /** Background colors */
  background: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
  };
  /** Border colors */
  border: {
    primary: string;
    secondary: string;
  };
  /** Component-specific colors */
  components: {
    card: string;
    cardHover: string;
    button: string;
    buttonHover: string;
    input: string;
    inputFocus: string;
  };
}

/**
 * Extended theme scheme for comprehensive UI styling.
 * This eliminates isDark ternaries by pre-defining all className combinations.
 */
export interface ExtendedThemeScheme extends ThemeColorScheme {
  /** Page-level styling */
  page: {
    container: string;
    selection: string;
  };
  /** Gradient colors for backgrounds */
  gradients: {
    primaryBlob: string;
    secondaryBlob: string;
    gridFloor: string;
    gridLines: string;
    backCard: string;
    middleCard: string;
    middleCardBorder: string;
  };
  /** Badge styling */
  badge: {
    container: string;
    text: string;
    icon: string;
  };
  /** Header/hero section styling */
  hero: {
    tagline: string;
    title: string;
    subtitle: string;
    emphasis: string;
  };
  /** Card styling */
  card: {
    shine: string;
    container: string;
    iconContainer: string;
    liveTag: string;
    title: string;
    subtitle: string;
    moduleDefault: string;
    moduleHovered: string;
    moduleIconDefault: string;
    moduleText: string;
    arrowDefault: string;
    arrowHovered: string;
    watermarkText: string;
  };
  /** Button styling */
  buttons: {
    primary: string;
    primaryHoverOverlay: string;
    primaryTextHover: string;
    secondary: string;
  };
  /** Footer styling */
  footer: {
    container: string;
  };
}

/**
 * Creates a theme color scheme for a mode.
 */
export function createThemeScheme(scheme: ThemeColorScheme): ThemeColorScheme {
  return scheme;
}

// ============================================================================
// Pre-defined Theme Schemes
// ============================================================================

export const lightThemeScheme: ThemeColorScheme = {
  background: {
    primary: "bg-[#F0F2F5]",
    secondary: "bg-white",
    accent: "bg-indigo-50",
  },
  text: {
    primary: "text-slate-900",
    secondary: "text-slate-700",
    muted: "text-slate-500",
    accent: "text-indigo-600",
  },
  border: {
    primary: "border-slate-200",
    secondary: "border-white/50",
  },
  components: {
    card: "bg-white/80 border-white/50",
    cardHover: "hover:bg-white",
    button: "bg-slate-900 text-white",
    buttonHover: "hover:bg-slate-800",
    input: "bg-white border-slate-200",
    inputFocus: "focus:border-indigo-500 focus:ring-indigo-100",
  },
};

export const darkThemeScheme: ThemeColorScheme = {
  background: {
    primary: "bg-slate-950",
    secondary: "bg-slate-900",
    accent: "bg-indigo-900/20",
  },
  text: {
    primary: "text-white",
    secondary: "text-slate-300",
    muted: "text-slate-500",
    accent: "text-indigo-400",
  },
  border: {
    primary: "border-slate-700",
    secondary: "border-slate-700/50",
  },
  components: {
    card: "bg-slate-900/80 border-slate-700/50",
    cardHover: "hover:bg-slate-800",
    button: "bg-white text-slate-900",
    buttonHover: "hover:bg-white/90",
    input: "bg-slate-800 border-slate-700",
    inputFocus: "focus:border-indigo-500 focus:ring-indigo-900",
  },
};

// ============================================================================
// Extended Theme Schemes for Landing Page
// ============================================================================

export const extendedLightTheme: ExtendedThemeScheme = {
  ...lightThemeScheme,
  page: {
    container: "bg-[#F0F2F5] selection:bg-indigo-100",
    selection: "selection:bg-indigo-100",
  },
  gradients: {
    primaryBlob: "bg-gradient-to-br from-indigo-200/30 via-purple-200/30 to-blue-200/30",
    secondaryBlob: "bg-gradient-to-tl from-cyan-200/30 via-pink-200/30 to-indigo-200/30",
    gridFloor: "bg-gradient-to-t from-slate-200/50 to-transparent",
    gridLines: "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
    backCard: "bg-gradient-to-br from-indigo-100 to-white",
    middleCard: "bg-gradient-to-br from-purple-100 to-white",
    middleCardBorder: "border-white/50",
  },
  badge: {
    container: "bg-white/80 border border-white/50",
    text: "text-slate-600",
    icon: "text-indigo-500",
  },
  hero: {
    tagline: "bg-slate-900/5 border border-slate-900/10 text-slate-800",
    title: "text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900",
    subtitle: "text-slate-700",
    emphasis: "text-indigo-700",
  },
  card: {
    shine: "bg-gradient-to-br from-indigo-500/20 to-purple-500/0",
    container: "bg-white/10 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
    iconContainer: "bg-slate-900",
    liveTag: "bg-green-100/50 text-green-700 border border-green-200",
    title: "text-slate-800",
    subtitle: "text-slate-500",
    moduleDefault: "bg-slate-50/50 border-slate-100 hover:bg-white",
    moduleHovered: "bg-indigo-50 border-indigo-200",
    moduleIconDefault: "bg-slate-200 text-slate-600",
    moduleText: "text-slate-700",
    arrowDefault: "text-slate-400",
    arrowHovered: "text-indigo-500 translate-x-1 -translate-y-1",
    watermarkText: "opacity-30 text-slate-900",
  },
  buttons: {
    primary: "bg-slate-900 text-white shadow-slate-900/20",
    primaryHoverOverlay: "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500",
    primaryTextHover: "",
    secondary: "bg-white/50 text-slate-800 border border-white/60 hover:bg-white",
  },
  footer: {
    container: "bg-white/30 text-slate-500",
  },
};

export const extendedDarkTheme: ExtendedThemeScheme = {
  ...darkThemeScheme,
  page: {
    container: "bg-slate-950 selection:bg-indigo-900",
    selection: "selection:bg-indigo-900",
  },
  gradients: {
    primaryBlob: "bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-blue-900/30",
    secondaryBlob: "bg-gradient-to-tl from-cyan-900/30 via-pink-900/30 to-indigo-900/30",
    gridFloor: "bg-gradient-to-t from-slate-900/50 to-transparent",
    gridLines: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backCard: "bg-gradient-to-br from-indigo-900/40 to-slate-900",
    middleCard: "bg-gradient-to-br from-purple-900/40 to-slate-900",
    middleCardBorder: "border-slate-700/50",
  },
  badge: {
    container: "bg-slate-800/80 border border-slate-700/50",
    text: "text-slate-300",
    icon: "text-indigo-400",
  },
  hero: {
    tagline: "bg-white/5 border border-white/10 text-slate-300",
    title: "text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-300 to-slate-500",
    subtitle: "text-slate-400",
    emphasis: "text-indigo-400",
  },
  card: {
    shine: "bg-gradient-to-br from-indigo-500/30 to-purple-500/10",
    container: "bg-slate-900/80 border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
    iconContainer: "bg-indigo-600",
    liveTag: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    title: "text-white",
    subtitle: "text-slate-400",
    moduleDefault: "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800",
    moduleHovered: "bg-indigo-500/20 border-indigo-500/50",
    moduleIconDefault: "bg-slate-700 text-slate-400",
    moduleText: "text-slate-200",
    arrowDefault: "text-slate-500",
    arrowHovered: "text-indigo-400 translate-x-1 -translate-y-1",
    watermarkText: "opacity-20 text-white",
  },
  buttons: {
    primary: "bg-white text-slate-900 shadow-white/10",
    primaryHoverOverlay: "bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400",
    primaryTextHover: "group-hover:text-white",
    secondary: "bg-slate-800/50 text-white border border-slate-700/60 hover:bg-slate-800",
  },
  footer: {
    container: "bg-slate-800/30 text-slate-500",
  },
};

/**
 * Gets the extended theme for a landing mode.
 */
export function getExtendedTheme(mode: "spatial" | "dark" | "light"): ExtendedThemeScheme {
  switch (mode) {
    case "dark":
      return extendedDarkTheme;
    case "spatial":
    case "light":
    default:
      return extendedLightTheme;
  }
}

// ============================================================================
// Layout Mode Types for UI Variations
// ============================================================================

/**
 * Layout strategy for component rendering.
 */
export type LayoutMode =
  | "split-view"      // Sidebar + main content
  | "map"             // Spatial/visual representation
  | "list"            // Linear list view
  | "form"            // Form-based input
  | "chat"            // Conversational interface
  | "wizard"          // Multi-step flow
  | "grid"            // Grid layout
  | "timeline"        // Timeline/roadmap view
  | "ide"             // IDE-style with panels
  | "cards";          // Card-based layout

/**
 * Interaction strategy for component behavior.
 */
export type InteractionMode =
  | "passive"         // Read-only/display
  | "interactive"     // Click/select interactions
  | "editable"        // Form/input interactions
  | "conversational"  // Chat/dialogue interactions
  | "immersive";      // 3D/spatial interactions

// ============================================================================
// Composite Mode Pattern
// ============================================================================

/**
 * A composite mode combines theme, layout, and interaction strategies.
 * This allows expressing complex variant combinations.
 */
export interface CompositeMode {
  theme: "light" | "dark" | "system";
  layout: LayoutMode;
  interaction: InteractionMode;
}

/**
 * Creates a composite mode configuration.
 */
export function createCompositeMode(
  theme: CompositeMode["theme"],
  layout: LayoutMode,
  interaction: InteractionMode
): CompositeMode {
  return { theme, layout, interaction };
}

// ============================================================================
// Theme Compiler Integration
// ============================================================================

/**
 * Re-export theme compiler functionality for convenient access.
 * The ThemeCompiler transforms semantic ThemeIntent into ExtendedThemeScheme.
 *
 * This recognizes that ExtendedThemeScheme is not just a theme object -
 * it's a compilation target. Each mode compiles to a complete UI specification.
 *
 * @example
 * ```ts
 * // Using presets
 * const theme = themeCompiler.compilePreset("midnight");
 *
 * // Using custom intent
 * const theme = themeCompiler.compile({
 *   appearance: "dark",
 *   colors: { primary: "emerald", secondary: "teal" },
 *   accessibility: { highContrast: true }
 * });
 * ```
 */
export {
  ThemeCompiler,
  themeCompiler,
  // Types
  type ThemeIntent,
  type ThemePreset,
  // Presets
  getPreset,
  listPresets,
  getPresetsByCategory,
  // Hooks
  useCompiledTheme,
  useThemePresets,
  useStaticTheme,
  useAccessibleTheme,
} from "./themeCompiler";
