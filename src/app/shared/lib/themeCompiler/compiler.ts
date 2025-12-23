/**
 * Theme Compiler
 *
 * The ThemeCompiler transforms semantic ThemeIntent into concrete ExtendedThemeScheme.
 * This is the core of the "UI-as-compilation" architecture - themes are not
 * hand-crafted JSON but are programmatically generated from minimal semantic input.
 *
 * Usage:
 * ```ts
 * const compiler = new ThemeCompiler();
 * const theme = compiler.compile({ appearance: "dark", colors: { primary: "indigo", secondary: "purple" } });
 * // or use a preset
 * const theme = compiler.compilePreset("midnight");
 * ```
 */

import { ExtendedThemeScheme, ThemeColorScheme } from "../variantMachine";
import type {
  ThemeIntent,
  ThemePreset,
  BrandCustomization,
  UserThemePreferences,
  ColorIntensity,
  ContrastLevel,
  SurfaceStyle,
} from "./types";
import {
  intensityScales,
  contrastAdjustments,
  applyColorblindTransform,
  getAdjustedShade,
  getHighContrastColors,
  getSepiaAdjustedColor,
  type ColorFamily,
  colorFamilies,
} from "./colorUtils";
import { getPreset, themePresets } from "./presets";

// ============================================================================
// Theme Compiler Class
// ============================================================================

export class ThemeCompiler {
  /**
   * Compile a ThemeIntent into a complete ExtendedThemeScheme
   */
  compile(intent: ThemeIntent): ExtendedThemeScheme {
    const isDark = intent.appearance === "dark";
    const intensity = intent.intensity ?? "normal";
    const contrast = intent.contrast ?? "normal";
    const surface = intent.surface ?? "glassmorphism";

    // Apply colorblind transformation if specified
    const primaryColor = intent.accessibility?.colorblindMode
      ? applyColorblindTransform(intent.colors.primary, intent.accessibility.colorblindMode)
      : intent.colors.primary;

    const secondaryColor = intent.accessibility?.colorblindMode
      ? applyColorblindTransform(intent.colors.secondary, intent.accessibility.colorblindMode)
      : intent.colors.secondary;

    // Handle high contrast mode specially
    if (intent.accessibility?.highContrast) {
      return this.compileHighContrast(intent);
    }

    // Get shade scales based on intensity
    const scales = intensityScales[intensity];
    const shadeSet = isDark ? scales.dark : scales.light;

    // Get contrast adjustments
    const contrastAdj = contrastAdjustments[contrast];

    // Build the base color scheme
    const baseScheme = this.buildBaseColorScheme(
      primaryColor,
      isDark,
      shadeSet,
      contrastAdj.textShadeBoost,
      surface,
      intent.accessibility?.reduceTransparency
    );

    // Build the extended scheme
    return this.buildExtendedScheme(
      baseScheme,
      primaryColor,
      secondaryColor,
      isDark,
      shadeSet,
      surface,
      intent.accessibility?.reduceTransparency
    );
  }

  /**
   * Compile from a preset name
   */
  compilePreset(preset: ThemePreset): ExtendedThemeScheme {
    const intent = getPreset(preset);
    return this.compile(intent);
  }

  /**
   * Compile with brand customization layered on top of a base intent
   */
  compileWithBrand(
    baseIntent: ThemeIntent,
    brand: BrandCustomization
  ): ExtendedThemeScheme {
    // Merge brand colors into the intent
    const mergedIntent: ThemeIntent = {
      ...baseIntent,
      colors: {
        ...baseIntent.colors,
        primary: this.resolveColorName(brand.primaryColor),
        secondary: brand.secondaryColor
          ? this.resolveColorName(brand.secondaryColor)
          : baseIntent.colors.secondary,
        tertiary: brand.accentColor
          ? this.resolveColorName(brand.accentColor)
          : baseIntent.colors.tertiary,
      },
    };

    return this.compile(mergedIntent);
  }

  /**
   * Compile with user preferences applied
   */
  compileWithPreferences(
    baseIntent: ThemeIntent,
    prefs: UserThemePreferences
  ): ExtendedThemeScheme {
    const mergedIntent: ThemeIntent = {
      ...baseIntent,
      appearance: prefs.baseTheme === "dark" ? "dark" : prefs.baseTheme === "light" ? "light" : baseIntent.appearance,
      intensity: prefs.intensity ?? baseIntent.intensity,
      contrast: prefs.contrast ?? baseIntent.contrast,
      accessibility: {
        ...baseIntent.accessibility,
        ...prefs.accessibility,
      },
    };

    return this.compile(mergedIntent);
  }

  /**
   * Get all available presets
   */
  getAvailablePresets(): ThemePreset[] {
    return Object.keys(themePresets) as ThemePreset[];
  }

  // ============================================================================
  // Private Compilation Methods
  // ============================================================================

  private buildBaseColorScheme(
    primary: string,
    isDark: boolean,
    shades: { bg: number; text: number; accent: number; border: number },
    textBoost: number,
    surface: SurfaceStyle,
    reduceTransparency?: boolean
  ): ThemeColorScheme {
    const opacity = reduceTransparency ? "" : "/80";
    const hoverOpacity = reduceTransparency ? "" : "/90";

    if (isDark) {
      return {
        background: {
          primary: "bg-slate-950",
          secondary: "bg-slate-900",
          accent: `bg-${primary}-900/20`,
        },
        text: {
          primary: "text-white",
          secondary: "text-slate-300",
          muted: "text-slate-500",
          accent: `text-${primary}-400`,
        },
        border: {
          primary: "border-slate-700",
          secondary: "border-slate-700/50",
        },
        components: {
          card: `bg-slate-900${opacity} border-slate-700/50`,
          cardHover: "hover:bg-slate-800",
          button: "bg-white text-slate-900",
          buttonHover: `hover:bg-white${hoverOpacity}`,
          input: "bg-slate-800 border-slate-700",
          inputFocus: `focus:border-${primary}-500 focus:ring-${primary}-900`,
        },
      };
    }

    return {
      background: {
        primary: "bg-[#F0F2F5]",
        secondary: "bg-white",
        accent: `bg-${primary}-50`,
      },
      text: {
        primary: "text-slate-900",
        secondary: "text-slate-700",
        muted: "text-slate-500",
        accent: `text-${primary}-600`,
      },
      border: {
        primary: "border-slate-200",
        secondary: "border-white/50",
      },
      components: {
        card: `bg-white${opacity} border-white/50`,
        cardHover: "hover:bg-white",
        button: "bg-slate-900 text-white",
        buttonHover: "hover:bg-slate-800",
        input: "bg-white border-slate-200",
        inputFocus: `focus:border-${primary}-500 focus:ring-${primary}-100`,
      },
    };
  }

  private buildExtendedScheme(
    base: ThemeColorScheme,
    primary: string,
    secondary: string,
    isDark: boolean,
    shades: { bg: number; text: number; accent: number; border: number },
    surface: SurfaceStyle,
    reduceTransparency?: boolean
  ): ExtendedThemeScheme {
    const opacity30 = reduceTransparency ? "/50" : "/30";
    const opacity50 = reduceTransparency ? "/70" : "/50";

    if (isDark) {
      return {
        ...base,
        page: {
          container: `bg-slate-950 selection:bg-${primary}-900`,
          selection: `selection:bg-${primary}-900`,
        },
        gradients: {
          primaryBlob: `bg-gradient-to-br from-${primary}-900${opacity30} via-purple-900${opacity30} to-blue-900${opacity30}`,
          secondaryBlob: `bg-gradient-to-tl from-cyan-900${opacity30} via-pink-900${opacity30} to-${secondary}-900${opacity30}`,
          gridFloor: `bg-gradient-to-t from-slate-900${opacity50} to-transparent`,
          gridLines: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backCard: `bg-gradient-to-br from-${primary}-900/40 to-slate-900`,
          middleCard: `bg-gradient-to-br from-${secondary}-900/40 to-slate-900`,
          middleCardBorder: "border-slate-700/50",
        },
        badge: {
          container: "bg-slate-800/80 border border-slate-700/50",
          text: "text-slate-300",
          icon: `text-${primary}-400`,
        },
        hero: {
          tagline: "bg-white/5 border border-white/10 text-slate-300",
          title: "text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-300 to-slate-500",
          subtitle: "text-slate-400",
          emphasis: `text-${primary}-400`,
        },
        card: {
          shine: `bg-gradient-to-br from-${primary}-500/30 to-${secondary}-500/10`,
          container: "bg-slate-900/80 border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
          iconContainer: `bg-${primary}-600`,
          liveTag: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
          title: "text-white",
          subtitle: "text-slate-400",
          moduleDefault: "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800",
          moduleHovered: `bg-${primary}-500/20 border-${primary}-500/50`,
          moduleIconDefault: "bg-slate-700 text-slate-400",
          moduleText: "text-slate-200",
          arrowDefault: "text-slate-500",
          arrowHovered: `text-${primary}-400 translate-x-1 -translate-y-1`,
          watermarkText: "opacity-20 text-white",
        },
        buttons: {
          primary: "bg-white text-slate-900 shadow-white/10",
          primaryHoverOverlay: `bg-gradient-to-r from-${primary}-400 via-${secondary}-400 to-cyan-400`,
          primaryTextHover: "group-hover:text-white",
          secondary: "bg-slate-800/50 text-white border border-slate-700/60 hover:bg-slate-800",
        },
        footer: {
          container: "bg-slate-800/30 text-slate-500",
        },
      };
    }

    // Light theme
    return {
      ...base,
      page: {
        container: `bg-[#F0F2F5] selection:bg-${primary}-100`,
        selection: `selection:bg-${primary}-100`,
      },
      gradients: {
        primaryBlob: `bg-gradient-to-br from-${primary}-200${opacity30} via-purple-200${opacity30} to-blue-200${opacity30}`,
        secondaryBlob: `bg-gradient-to-tl from-cyan-200${opacity30} via-pink-200${opacity30} to-${secondary}-200${opacity30}`,
        gridFloor: `bg-gradient-to-t from-slate-200${opacity50} to-transparent`,
        gridLines: "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
        backCard: `bg-gradient-to-br from-${primary}-100 to-white`,
        middleCard: `bg-gradient-to-br from-${secondary}-100 to-white`,
        middleCardBorder: "border-white/50",
      },
      badge: {
        container: "bg-white/80 border border-white/50",
        text: "text-slate-600",
        icon: `text-${primary}-500`,
      },
      hero: {
        tagline: "bg-slate-900/5 border border-slate-900/10 text-slate-800",
        title: "text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900",
        subtitle: "text-slate-700",
        emphasis: `text-${primary}-700`,
      },
      card: {
        shine: `bg-gradient-to-br from-${primary}-500/20 to-${secondary}-500/0`,
        container: "bg-white/10 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
        iconContainer: "bg-slate-900",
        liveTag: "bg-green-100/50 text-green-700 border border-green-200",
        title: "text-slate-800",
        subtitle: "text-slate-500",
        moduleDefault: "bg-slate-50/50 border-slate-100 hover:bg-white",
        moduleHovered: `bg-${primary}-50 border-${primary}-200`,
        moduleIconDefault: "bg-slate-200 text-slate-600",
        moduleText: "text-slate-700",
        arrowDefault: "text-slate-400",
        arrowHovered: `text-${primary}-500 translate-x-1 -translate-y-1`,
        watermarkText: "opacity-30 text-slate-900",
      },
      buttons: {
        primary: "bg-slate-900 text-white shadow-slate-900/20",
        primaryHoverOverlay: `bg-gradient-to-r from-${primary}-500 via-${secondary}-500 to-cyan-500`,
        primaryTextHover: "",
        secondary: "bg-white/50 text-slate-800 border border-white/60 hover:bg-white",
      },
      footer: {
        container: "bg-white/30 text-slate-500",
      },
    };
  }

  private compileHighContrast(intent: ThemeIntent): ExtendedThemeScheme {
    const isDark = intent.appearance === "dark";
    const hc = getHighContrastColors(isDark);

    // High contrast uses minimal styling for maximum clarity
    const base: ThemeColorScheme = {
      background: {
        primary: hc.background,
        secondary: hc.background,
        accent: hc.background,
      },
      text: {
        primary: hc.text,
        secondary: hc.text,
        muted: hc.text,
        accent: hc.text,
      },
      border: {
        primary: hc.border,
        secondary: hc.border,
      },
      components: {
        card: `${hc.background} ${hc.border} border-2`,
        cardHover: isDark ? "hover:bg-slate-900" : "hover:bg-slate-100",
        button: isDark ? "bg-white text-black" : "bg-black text-white",
        buttonHover: isDark ? "hover:bg-slate-200" : "hover:bg-slate-800",
        input: `${hc.background} ${hc.border} border-2`,
        inputFocus: isDark ? "focus:ring-white" : "focus:ring-black",
      },
    };

    return {
      ...base,
      page: {
        container: `${hc.background}`,
        selection: isDark ? "selection:bg-white selection:text-black" : "selection:bg-black selection:text-white",
      },
      gradients: {
        primaryBlob: "bg-transparent",
        secondaryBlob: "bg-transparent",
        gridFloor: "bg-transparent",
        gridLines: isDark
          ? "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)"
          : "linear-gradient(to right, rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.2) 1px, transparent 1px)",
        backCard: hc.background,
        middleCard: hc.background,
        middleCardBorder: `${hc.border} border-2`,
      },
      badge: {
        container: `${hc.background} ${hc.border} border-2`,
        text: hc.text,
        icon: hc.text,
      },
      hero: {
        tagline: `${hc.background} ${hc.border} border-2 ${hc.text}`,
        title: hc.text,
        subtitle: hc.text,
        emphasis: isDark ? "text-yellow-300 underline" : "text-blue-800 underline",
      },
      card: {
        shine: "bg-transparent",
        container: `${hc.background} ${hc.border} border-2 shadow-none`,
        iconContainer: isDark ? "bg-white text-black" : "bg-black text-white",
        liveTag: isDark ? "bg-green-900 text-green-100 border-2 border-green-100" : "bg-green-100 text-green-900 border-2 border-green-900",
        title: hc.text,
        subtitle: hc.text,
        moduleDefault: `${hc.background} ${hc.border} border`,
        moduleHovered: isDark ? "bg-slate-800 border-white border-2" : "bg-slate-200 border-black border-2",
        moduleIconDefault: isDark ? "bg-white text-black" : "bg-black text-white",
        moduleText: hc.text,
        arrowDefault: hc.text,
        arrowHovered: `${hc.text} translate-x-1 -translate-y-1`,
        watermarkText: `opacity-50 ${hc.text}`,
      },
      buttons: {
        primary: isDark ? "bg-white text-black border-2 border-white" : "bg-black text-white border-2 border-black",
        primaryHoverOverlay: "bg-transparent",
        primaryTextHover: "",
        secondary: `${hc.background} ${hc.text} ${hc.border} border-2`,
      },
      footer: {
        container: `${hc.background} ${hc.text} ${hc.border} border-t-2`,
      },
    };
  }

  private resolveColorName(color: string): string {
    // If it's already a known color family, return as-is
    if (color in colorFamilies) {
      return color;
    }

    // Handle hex colors by finding closest Tailwind match
    if (color.startsWith("#")) {
      // For simplicity, default to indigo for hex colors
      // A more sophisticated implementation would analyze the hex and find closest match
      return "indigo";
    }

    // Default fallback
    return "indigo";
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default compiler instance for convenience
 */
export const themeCompiler = new ThemeCompiler();
