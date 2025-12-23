"use client";

/**
 * Theme Compiler Hooks
 *
 * React hooks for consuming compiled themes in components.
 * Provides integration with the existing theme context and
 * enables dynamic theme compilation based on user preferences.
 */

import { useMemo, useCallback, useState } from "react";
import { ExtendedThemeScheme } from "../variantMachine";
import { ThemeCompiler, themeCompiler } from "./compiler";
import type {
  ThemeIntent,
  ThemePreset,
  UserThemePreferences,
  BrandCustomization,
} from "./types";
import { getPreset, themePresets, getPresetsByCategory } from "./presets";

// ============================================================================
// Main Hook: useCompiledTheme
// ============================================================================

interface UseCompiledThemeOptions {
  /** Base theme intent or preset to start with */
  base?: ThemeIntent | ThemePreset;
  /** User preferences to apply */
  preferences?: UserThemePreferences;
  /** Brand customization to apply */
  brand?: BrandCustomization;
  /** Custom compiler instance (defaults to singleton) */
  compiler?: ThemeCompiler;
}

interface UseCompiledThemeReturn {
  /** The compiled theme scheme */
  theme: ExtendedThemeScheme;
  /** The current intent that was compiled */
  intent: ThemeIntent;
  /** Compile a new theme from intent */
  compileTheme: (intent: ThemeIntent) => ExtendedThemeScheme;
  /** Switch to a preset */
  switchToPreset: (preset: ThemePreset) => void;
  /** Update user preferences */
  updatePreferences: (prefs: Partial<UserThemePreferences>) => void;
  /** Check if current theme is dark mode */
  isDark: boolean;
  /** List of available presets */
  availablePresets: ThemePreset[];
}

/**
 * Hook for consuming compiled themes in components
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, switchToPreset, isDark } = useCompiledTheme({
 *     base: "midnight"
 *   });
 *
 *   return (
 *     <div className={theme.page.container}>
 *       <button onClick={() => switchToPreset(isDark ? "light" : "dark")}>
 *         Toggle Theme
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCompiledTheme(
  options: UseCompiledThemeOptions = {}
): UseCompiledThemeReturn {
  const { compiler = themeCompiler, brand } = options;

  // Resolve initial intent
  const initialIntent = useMemo(() => {
    if (!options.base) return getPreset("light");
    if (typeof options.base === "string") return getPreset(options.base);
    return options.base;
  }, [options.base]);

  // State for current intent and preferences
  const [currentIntent, setCurrentIntent] = useState<ThemeIntent>(initialIntent);
  const [preferences, setPreferences] = useState<UserThemePreferences>(
    options.preferences ?? {}
  );

  // Compile the theme with all options applied
  const theme = useMemo(() => {
    let result: ExtendedThemeScheme;

    if (brand) {
      // Apply brand customization
      let intentWithPrefs = currentIntent;
      if (Object.keys(preferences).length > 0) {
        // Apply preferences first if present
        intentWithPrefs = {
          ...currentIntent,
          appearance: preferences.baseTheme === "dark" ? "dark" :
                      preferences.baseTheme === "light" ? "light" :
                      currentIntent.appearance,
          intensity: preferences.intensity ?? currentIntent.intensity,
          contrast: preferences.contrast ?? currentIntent.contrast,
          accessibility: {
            ...currentIntent.accessibility,
            ...preferences.accessibility,
          },
        };
      }
      result = compiler.compileWithBrand(intentWithPrefs, brand);
    } else if (Object.keys(preferences).length > 0) {
      result = compiler.compileWithPreferences(currentIntent, preferences);
    } else {
      result = compiler.compile(currentIntent);
    }

    return result;
  }, [currentIntent, preferences, brand, compiler]);

  // Compile a new theme from intent
  const compileTheme = useCallback(
    (intent: ThemeIntent): ExtendedThemeScheme => {
      setCurrentIntent(intent);
      return compiler.compile(intent);
    },
    [compiler]
  );

  // Switch to a preset
  const switchToPreset = useCallback((preset: ThemePreset) => {
    const presetIntent = getPreset(preset);
    setCurrentIntent(presetIntent);
  }, []);

  // Update user preferences
  const updatePreferences = useCallback((prefs: Partial<UserThemePreferences>) => {
    setPreferences((current) => ({ ...current, ...prefs }));
  }, []);

  return {
    theme,
    intent: currentIntent,
    compileTheme,
    switchToPreset,
    updatePreferences,
    isDark: currentIntent.appearance === "dark",
    availablePresets: Object.keys(themePresets) as ThemePreset[],
  };
}

// ============================================================================
// Preset Selection Hook
// ============================================================================

interface UseThemePresetsReturn {
  /** All available presets */
  presets: ThemePreset[];
  /** Presets organized by category */
  categories: ReturnType<typeof getPresetsByCategory>;
  /** Get the intent for a preset */
  getPresetIntent: (preset: ThemePreset) => ThemeIntent;
  /** Preview compile a preset */
  previewPreset: (preset: ThemePreset) => ExtendedThemeScheme;
}

/**
 * Hook for working with theme presets
 *
 * @example
 * ```tsx
 * function ThemeSelector() {
 *   const { categories, previewPreset } = useThemePresets();
 *
 *   return (
 *     <div>
 *       <h3>Accessibility Themes</h3>
 *       {categories.accessibility.map(preset => (
 *         <button key={preset} onClick={() => previewPreset(preset)}>
 *           {preset}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useThemePresets(): UseThemePresetsReturn {
  const presets = useMemo(() => Object.keys(themePresets) as ThemePreset[], []);
  const categories = useMemo(() => getPresetsByCategory(), []);

  const getPresetIntent = useCallback((preset: ThemePreset): ThemeIntent => {
    return getPreset(preset);
  }, []);

  const previewPreset = useCallback((preset: ThemePreset): ExtendedThemeScheme => {
    return themeCompiler.compilePreset(preset);
  }, []);

  return {
    presets,
    categories,
    getPresetIntent,
    previewPreset,
  };
}

// ============================================================================
// Static Compilation Hook (Memoized)
// ============================================================================

/**
 * Hook for statically compiled themes - useful when theme doesn't change
 *
 * @example
 * ```tsx
 * function StaticThemedComponent() {
 *   const theme = useStaticTheme("midnight");
 *   return <div className={theme.page.container}>...</div>;
 * }
 * ```
 */
export function useStaticTheme(preset: ThemePreset): ExtendedThemeScheme {
  return useMemo(() => themeCompiler.compilePreset(preset), [preset]);
}

/**
 * Hook for statically compiled theme from intent
 */
export function useStaticThemeFromIntent(intent: ThemeIntent): ExtendedThemeScheme {
  return useMemo(() => themeCompiler.compile(intent), [intent]);
}

// ============================================================================
// Accessibility-Focused Hook
// ============================================================================

interface UseAccessibleThemeOptions {
  /** Base appearance */
  appearance: "light" | "dark";
  /** Enable high contrast */
  highContrast?: boolean;
  /** Colorblind mode */
  colorblindMode?: "protanopia" | "deuteranopia" | "tritanopia";
  /** Reduce transparency */
  reduceTransparency?: boolean;
}

/**
 * Hook specifically for accessibility-focused theme compilation
 *
 * @example
 * ```tsx
 * function AccessibleComponent() {
 *   const theme = useAccessibleTheme({
 *     appearance: "light",
 *     highContrast: true,
 *     colorblindMode: "deuteranopia"
 *   });
 *
 *   return <div className={theme.page.container}>...</div>;
 * }
 * ```
 */
export function useAccessibleTheme(
  options: UseAccessibleThemeOptions
): ExtendedThemeScheme {
  return useMemo(() => {
    const intent: ThemeIntent = {
      appearance: options.appearance,
      colors: {
        primary: "indigo",
        secondary: "purple",
      },
      contrast: options.highContrast ? "maximum" : "high",
      accessibility: {
        highContrast: options.highContrast,
        colorblindMode: options.colorblindMode ?? "none",
        reduceTransparency: options.reduceTransparency,
      },
      surface: options.highContrast ? "flat" : "elevated",
      animation: "subtle",
    };

    return themeCompiler.compile(intent);
  }, [
    options.appearance,
    options.highContrast,
    options.colorblindMode,
    options.reduceTransparency,
  ]);
}
