/**
 * Color Palette Generator
 *
 * Generates accessible color palettes for the Knowledge Map.
 * Supports colorblind-safe modes and custom theme generation.
 *
 * Features:
 * - Colorblind simulation (Deuteranopia, Protanopia, Tritanopia)
 * - WCAG-compliant palette generation
 * - Node status colors with proper contrast
 * - Connection/edge colors
 * - Preset theme palettes
 */

// ============================================================================
// TYPES
// ============================================================================

export type ColorblindMode =
    | "none"
    | "deuteranopia" // Red-green (most common, ~6% of males)
    | "protanopia"   // Red-blind (~1% of males)
    | "tritanopia";  // Blue-yellow (rare, ~0.01%)

export type NodeShape = "circle" | "hexagon" | "rounded-square";

export type ConnectionStyle = "straight" | "curved" | "animated";

export interface ColorPalette {
    // Background colors
    background: {
        primary: string;
        secondary: string;
        elevated: string;
        overlay: string;
    };
    // Text colors
    text: {
        primary: string;
        secondary: string;
        muted: string;
        inverse: string;
    };
    // Border colors
    border: {
        subtle: string;
        default: string;
        strong: string;
    };
    // Accent colors
    accent: {
        primary: string;
        primaryHover: string;
        secondary: string;
        tertiary: string;
    };
    // Node status colors
    status: {
        completed: string;
        completedBg: string;
        inProgress: string;
        inProgressBg: string;
        available: string;
        availableBg: string;
        locked: string;
        lockedBg: string;
    };
    // Domain colors (for knowledge areas)
    domains: {
        frontend: string;
        backend: string;
        fullstack: string;
        databases: string;
        mobile: string;
        games: string;
    };
    // Connection colors
    connections: {
        default: string;
        active: string;
        highlighted: string;
    };
    // Glow/shadow colors
    effects: {
        glow: string;
        shadow: string;
        ember: string;
    };
}

export interface ThemePreset {
    id: string;
    name: string;
    description: string;
    isDark: boolean;
    palette: ColorPalette;
    nodeShape: NodeShape;
    connectionStyle: ConnectionStyle;
}

// ============================================================================
// COLOR MANIPULATION UTILITIES
// ============================================================================

/**
 * Parse hex color to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return { r: 0, g: 0, b: 0 };
    }
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b]
        .map((x) => {
            const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        })
        .join("");
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}

/**
 * Adjust color lightness
 */
export function adjustLightness(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex);
    const hsl = rgbToHsl(r, g, b);
    hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Mix two colors together
 */
export function mixColors(color1: string, color2: string, weight: number = 0.5): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    return rgbToHex(
        Math.round(c1.r * weight + c2.r * (1 - weight)),
        Math.round(c1.g * weight + c2.g * (1 - weight)),
        Math.round(c1.b * weight + c2.b * (1 - weight))
    );
}

/**
 * Add alpha to a hex color
 */
export function withAlpha(hex: string, alpha: number): string {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// COLORBLIND SIMULATION
// ============================================================================

/**
 * Colorblind simulation matrices
 * Based on research by Brettel, Viénot, and Mollon (1997)
 */
const COLORBLIND_MATRICES: Record<ColorblindMode, number[][] | null> = {
    none: null,
    deuteranopia: [
        [0.625, 0.375, 0],
        [0.7, 0.3, 0],
        [0, 0.3, 0.7],
    ],
    protanopia: [
        [0.567, 0.433, 0],
        [0.558, 0.442, 0],
        [0, 0.242, 0.758],
    ],
    tritanopia: [
        [0.95, 0.05, 0],
        [0, 0.433, 0.567],
        [0, 0.475, 0.525],
    ],
};

/**
 * Simulate how a color appears to someone with colorblindness
 */
export function simulateColorblind(hex: string, mode: ColorblindMode): string {
    if (mode === "none") return hex;

    const matrix = COLORBLIND_MATRICES[mode];
    if (!matrix) return hex;

    const { r, g, b } = hexToRgb(hex);

    const newR = r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2];
    const newG = r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2];
    const newB = r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2];

    return rgbToHex(newR, newG, newB);
}

/**
 * Apply colorblind simulation to entire palette
 */
export function simulatePaletteColorblind(
    palette: ColorPalette,
    mode: ColorblindMode
): ColorPalette {
    if (mode === "none") return palette;

    const simulateObj = <T extends Record<string, string>>(obj: T): T => {
        const result = { ...obj } as T;
        for (const key in result) {
            if (typeof result[key] === "string" && result[key].startsWith("#")) {
                (result as Record<string, string>)[key] = simulateColorblind(result[key], mode);
            }
        }
        return result;
    };

    return {
        background: simulateObj(palette.background),
        text: simulateObj(palette.text),
        border: simulateObj(palette.border),
        accent: simulateObj(palette.accent),
        status: simulateObj(palette.status),
        domains: simulateObj(palette.domains),
        connections: simulateObj(palette.connections),
        effects: simulateObj(palette.effects),
    };
}

// ============================================================================
// COLORBLIND-SAFE PALETTES
// ============================================================================

/**
 * Colorblind-safe status colors
 * Uses shape + pattern + luminance rather than hue alone
 */
export const COLORBLIND_SAFE_STATUS = {
    // Blue (distinguishable across all types)
    completed: "#0077BB",
    completedBg: "#DBEAFE",
    // Orange (distinguishable, high luminance)
    inProgress: "#EE7733",
    inProgressBg: "#FFEDD5",
    // Gray (neutral, relies on luminance)
    available: "#6B7280",
    availableBg: "#F3F4F6",
    // Dark gray (low luminance)
    locked: "#9CA3AF",
    lockedBg: "#E5E7EB",
};

/**
 * Colorblind-safe domain colors
 * IBM Design colorblind-safe palette
 */
export const COLORBLIND_SAFE_DOMAINS = {
    frontend: "#648FFF", // Blue
    backend: "#785EF0",  // Purple
    fullstack: "#DC267F", // Magenta
    databases: "#FE6100", // Orange
    mobile: "#FFB000",   // Gold
    games: "#009E73",    // Teal
};

// ============================================================================
// PRESET THEMES
// ============================================================================

/**
 * Default dark theme palette (Forge theme)
 */
const FORGE_DARK_PALETTE: ColorPalette = {
    background: {
        primary: "#09090A",
        secondary: "#0D0D0E",
        elevated: "#1C1C1F",
        overlay: "rgba(0, 0, 0, 0.8)",
    },
    text: {
        primary: "#FAFAFA",
        secondary: "#A1A1AA",
        muted: "#71717A",
        inverse: "#09090A",
    },
    border: {
        subtle: "#252528",
        default: "#32323A",
        strong: "#52525B",
    },
    accent: {
        primary: "#F97316",
        primaryHover: "#EA580C",
        secondary: "#D97706",
        tertiary: "#C2410C",
    },
    status: {
        completed: "#4ADE80",
        completedBg: "#064E3B",
        inProgress: "#F97316",
        inProgressBg: "#7C2D12",
        available: "#71717A",
        availableBg: "#27272A",
        locked: "#52525B",
        lockedBg: "#18181B",
    },
    domains: {
        frontend: "#818CF8",
        backend: "#34D399",
        fullstack: "#C084FC",
        databases: "#22D3EE",
        mobile: "#F472B6",
        games: "#FB923C",
    },
    connections: {
        default: "rgba(113, 113, 122, 0.5)",
        active: "rgba(249, 115, 22, 0.7)",
        highlighted: "#F97316",
    },
    effects: {
        glow: "rgba(249, 115, 22, 0.3)",
        shadow: "rgba(0, 0, 0, 0.5)",
        ember: "#C2410C",
    },
};

/**
 * Default light theme palette
 */
const FORGE_LIGHT_PALETTE: ColorPalette = {
    background: {
        primary: "#FAFAF8",
        secondary: "#FFFFFF",
        elevated: "#FFFFFF",
        overlay: "rgba(255, 255, 255, 0.9)",
    },
    text: {
        primary: "#1A1816",
        secondary: "#5C564E",
        muted: "#8C857D",
        inverse: "#FAFAFA",
    },
    border: {
        subtle: "#E8E4E0",
        default: "#D4CFC9",
        strong: "#B8B3AD",
    },
    accent: {
        primary: "#C2410C",
        primaryHover: "#B45309",
        secondary: "#D97706",
        tertiary: "#EA580C",
    },
    status: {
        completed: "#0D7A4F",
        completedBg: "#D1FAE5",
        inProgress: "#C2410C",
        inProgressBg: "#FFEDD5",
        available: "#5C564E",
        availableBg: "#F7F5F3",
        locked: "#8C857D",
        lockedBg: "#E8E4E0",
    },
    domains: {
        frontend: "#6366F1",
        backend: "#10B981",
        fullstack: "#A855F7",
        databases: "#06B6D4",
        mobile: "#EC4899",
        games: "#F97316",
    },
    connections: {
        default: "rgba(140, 133, 125, 0.4)",
        active: "rgba(194, 65, 12, 0.6)",
        highlighted: "#C2410C",
    },
    effects: {
        glow: "rgba(194, 65, 12, 0.2)",
        shadow: "rgba(0, 0, 0, 0.1)",
        ember: "#EA580C",
    },
};

/**
 * Ocean theme - Cool blue tones
 */
const OCEAN_DARK_PALETTE: ColorPalette = {
    background: {
        primary: "#0A1628",
        secondary: "#0F1E32",
        elevated: "#162A45",
        overlay: "rgba(10, 22, 40, 0.9)",
    },
    text: {
        primary: "#E8F4FC",
        secondary: "#94C2E8",
        muted: "#5A8BB8",
        inverse: "#0A1628",
    },
    border: {
        subtle: "#1E3A5F",
        default: "#2D5080",
        strong: "#3D68A0",
    },
    accent: {
        primary: "#3B82F6",
        primaryHover: "#2563EB",
        secondary: "#06B6D4",
        tertiary: "#0EA5E9",
    },
    status: {
        completed: "#34D399",
        completedBg: "#064E3B",
        inProgress: "#3B82F6",
        inProgressBg: "#1E3A5F",
        available: "#5A8BB8",
        availableBg: "#162A45",
        locked: "#3D5A80",
        lockedBg: "#0F1E32",
    },
    domains: {
        frontend: "#60A5FA",
        backend: "#34D399",
        fullstack: "#A78BFA",
        databases: "#22D3EE",
        mobile: "#F472B6",
        games: "#FBBF24",
    },
    connections: {
        default: "rgba(90, 139, 184, 0.4)",
        active: "rgba(59, 130, 246, 0.7)",
        highlighted: "#3B82F6",
    },
    effects: {
        glow: "rgba(59, 130, 246, 0.3)",
        shadow: "rgba(0, 0, 0, 0.5)",
        ember: "#06B6D4",
    },
};

/**
 * Forest theme - Natural green tones
 */
const FOREST_DARK_PALETTE: ColorPalette = {
    background: {
        primary: "#0A1A14",
        secondary: "#0F261C",
        elevated: "#163326",
        overlay: "rgba(10, 26, 20, 0.9)",
    },
    text: {
        primary: "#E8F5EC",
        secondary: "#94D3A8",
        muted: "#5AAF78",
        inverse: "#0A1A14",
    },
    border: {
        subtle: "#1E4D35",
        default: "#2D6B4A",
        strong: "#3D8A60",
    },
    accent: {
        primary: "#10B981",
        primaryHover: "#059669",
        secondary: "#34D399",
        tertiary: "#6EE7B7",
    },
    status: {
        completed: "#34D399",
        completedBg: "#064E3B",
        inProgress: "#FBBF24",
        inProgressBg: "#78350F",
        available: "#5AAF78",
        availableBg: "#163326",
        locked: "#3D6B50",
        lockedBg: "#0F261C",
    },
    domains: {
        frontend: "#60A5FA",
        backend: "#34D399",
        fullstack: "#A78BFA",
        databases: "#22D3EE",
        mobile: "#F472B6",
        games: "#FB923C",
    },
    connections: {
        default: "rgba(90, 175, 120, 0.4)",
        active: "rgba(16, 185, 129, 0.7)",
        highlighted: "#10B981",
    },
    effects: {
        glow: "rgba(16, 185, 129, 0.3)",
        shadow: "rgba(0, 0, 0, 0.5)",
        ember: "#34D399",
    },
};

/**
 * Sunset theme - Warm orange/pink tones
 */
const SUNSET_DARK_PALETTE: ColorPalette = {
    background: {
        primary: "#1A0F14",
        secondary: "#261418",
        elevated: "#331A22",
        overlay: "rgba(26, 15, 20, 0.9)",
    },
    text: {
        primary: "#FCE8EC",
        secondary: "#E8A4B8",
        muted: "#B86A88",
        inverse: "#1A0F14",
    },
    border: {
        subtle: "#4D2535",
        default: "#6B3548",
        strong: "#8A455B",
    },
    accent: {
        primary: "#F472B6",
        primaryHover: "#EC4899",
        secondary: "#FB7185",
        tertiary: "#FDA4AF",
    },
    status: {
        completed: "#4ADE80",
        completedBg: "#064E3B",
        inProgress: "#F472B6",
        inProgressBg: "#4D2535",
        available: "#B86A88",
        availableBg: "#331A22",
        locked: "#6B4555",
        lockedBg: "#261418",
    },
    domains: {
        frontend: "#818CF8",
        backend: "#34D399",
        fullstack: "#C084FC",
        databases: "#22D3EE",
        mobile: "#F472B6",
        games: "#FB923C",
    },
    connections: {
        default: "rgba(184, 106, 136, 0.4)",
        active: "rgba(244, 114, 182, 0.7)",
        highlighted: "#F472B6",
    },
    effects: {
        glow: "rgba(244, 114, 182, 0.3)",
        shadow: "rgba(0, 0, 0, 0.5)",
        ember: "#FB7185",
    },
};

/**
 * Monochrome theme - Grayscale
 */
const MONOCHROME_DARK_PALETTE: ColorPalette = {
    background: {
        primary: "#0A0A0A",
        secondary: "#141414",
        elevated: "#1F1F1F",
        overlay: "rgba(10, 10, 10, 0.9)",
    },
    text: {
        primary: "#FAFAFA",
        secondary: "#A3A3A3",
        muted: "#737373",
        inverse: "#0A0A0A",
    },
    border: {
        subtle: "#262626",
        default: "#404040",
        strong: "#525252",
    },
    accent: {
        primary: "#FAFAFA",
        primaryHover: "#E5E5E5",
        secondary: "#A3A3A3",
        tertiary: "#737373",
    },
    status: {
        completed: "#FAFAFA",
        completedBg: "#262626",
        inProgress: "#A3A3A3",
        inProgressBg: "#1F1F1F",
        available: "#737373",
        availableBg: "#171717",
        locked: "#525252",
        lockedBg: "#0A0A0A",
    },
    domains: {
        frontend: "#E5E5E5",
        backend: "#D4D4D4",
        fullstack: "#C3C3C3",
        databases: "#A3A3A3",
        mobile: "#8A8A8A",
        games: "#737373",
    },
    connections: {
        default: "rgba(115, 115, 115, 0.4)",
        active: "rgba(250, 250, 250, 0.7)",
        highlighted: "#FAFAFA",
    },
    effects: {
        glow: "rgba(250, 250, 250, 0.2)",
        shadow: "rgba(0, 0, 0, 0.5)",
        ember: "#A3A3A3",
    },
};

// ============================================================================
// THEME PRESETS
// ============================================================================

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: "forge-dark",
        name: "Forge Dark",
        description: "Default dark theme with warm ember accents",
        isDark: true,
        palette: FORGE_DARK_PALETTE,
        nodeShape: "rounded-square",
        connectionStyle: "curved",
    },
    {
        id: "forge-light",
        name: "Forge Light",
        description: "Clean light theme for daytime use",
        isDark: false,
        palette: FORGE_LIGHT_PALETTE,
        nodeShape: "rounded-square",
        connectionStyle: "curved",
    },
    {
        id: "ocean",
        name: "Ocean",
        description: "Cool blue tones inspired by the deep sea",
        isDark: true,
        palette: OCEAN_DARK_PALETTE,
        nodeShape: "hexagon",
        connectionStyle: "curved",
    },
    {
        id: "forest",
        name: "Forest",
        description: "Natural green tones for a calm experience",
        isDark: true,
        palette: FOREST_DARK_PALETTE,
        nodeShape: "circle",
        connectionStyle: "curved",
    },
    {
        id: "sunset",
        name: "Sunset",
        description: "Warm pink and orange sunset colors",
        isDark: true,
        palette: SUNSET_DARK_PALETTE,
        nodeShape: "rounded-square",
        connectionStyle: "animated",
    },
    {
        id: "monochrome",
        name: "Monochrome",
        description: "Clean grayscale for minimal distraction",
        isDark: true,
        palette: MONOCHROME_DARK_PALETTE,
        nodeShape: "circle",
        connectionStyle: "straight",
    },
];

// ============================================================================
// PALETTE GENERATION
// ============================================================================

/**
 * Generate a custom palette from a primary accent color
 */
export function generatePaletteFromAccent(
    accentHex: string,
    isDark: boolean
): ColorPalette {
    const accent = hexToRgb(accentHex);
    const accentHsl = rgbToHsl(accent.r, accent.g, accent.b);

    // Generate lighter and darker variants
    const accentLight = adjustLightness(accentHex, 20);
    const accentDark = adjustLightness(accentHex, -20);
    const accentMuted = adjustLightness(accentHex, isDark ? -30 : 30);

    // Background colors based on theme
    const bgPrimary = isDark ? "#09090A" : "#FAFAF8";
    const bgSecondary = isDark ? "#0D0D0E" : "#FFFFFF";
    const bgElevated = isDark ? "#1C1C1F" : "#FFFFFF";

    // Generate complementary colors
    const complementHue = (accentHsl.h + 180) % 360;
    const complementRgb = hslToRgb(complementHue, accentHsl.s * 0.7, isDark ? 60 : 40);
    const complementHex = rgbToHex(complementRgb.r, complementRgb.g, complementRgb.b);

    return {
        background: {
            primary: bgPrimary,
            secondary: bgSecondary,
            elevated: bgElevated,
            overlay: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)",
        },
        text: {
            primary: isDark ? "#FAFAFA" : "#1A1816",
            secondary: isDark ? "#A1A1AA" : "#5C564E",
            muted: isDark ? "#71717A" : "#8C857D",
            inverse: isDark ? "#09090A" : "#FAFAFA",
        },
        border: {
            subtle: isDark ? "#252528" : "#E8E4E0",
            default: isDark ? "#32323A" : "#D4CFC9",
            strong: isDark ? "#52525B" : "#B8B3AD",
        },
        accent: {
            primary: accentHex,
            primaryHover: accentDark,
            secondary: accentLight,
            tertiary: complementHex,
        },
        status: {
            completed: isDark ? "#4ADE80" : "#0D7A4F",
            completedBg: isDark ? "#064E3B" : "#D1FAE5",
            inProgress: accentHex,
            inProgressBg: isDark ? accentMuted : adjustLightness(accentHex, 40),
            available: isDark ? "#71717A" : "#5C564E",
            availableBg: isDark ? "#27272A" : "#F7F5F3",
            locked: isDark ? "#52525B" : "#8C857D",
            lockedBg: isDark ? "#18181B" : "#E8E4E0",
        },
        domains: isDark ? FORGE_DARK_PALETTE.domains : FORGE_LIGHT_PALETTE.domains,
        connections: {
            default: isDark ? "rgba(113, 113, 122, 0.5)" : "rgba(140, 133, 125, 0.4)",
            active: withAlpha(accentHex, 0.7),
            highlighted: accentHex,
        },
        effects: {
            glow: withAlpha(accentHex, 0.3),
            shadow: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.1)",
            ember: accentLight,
        },
    };
}

/**
 * Get a colorblind-safe palette
 */
export function getColorblindSafePalette(
    basePalette: ColorPalette,
    mode: ColorblindMode
): ColorPalette {
    if (mode === "none") return basePalette;

    // Replace status and domain colors with colorblind-safe alternatives
    return {
        ...basePalette,
        status: {
            completed: COLORBLIND_SAFE_STATUS.completed,
            completedBg: basePalette.status.completedBg,
            inProgress: COLORBLIND_SAFE_STATUS.inProgress,
            inProgressBg: basePalette.status.inProgressBg,
            available: COLORBLIND_SAFE_STATUS.available,
            availableBg: basePalette.status.availableBg,
            locked: COLORBLIND_SAFE_STATUS.locked,
            lockedBg: basePalette.status.lockedBg,
        },
        domains: COLORBLIND_SAFE_DOMAINS,
    };
}

/**
 * Export palette as CSS custom properties
 */
export function paletteToCSS(palette: ColorPalette, prefix: string = "theme"): string {
    const lines: string[] = [];

    const addVar = (name: string, value: string) => {
        lines.push(`  --${prefix}-${name}: ${value};`);
    };

    // Background
    addVar("bg-primary", palette.background.primary);
    addVar("bg-secondary", palette.background.secondary);
    addVar("bg-elevated", palette.background.elevated);
    addVar("bg-overlay", palette.background.overlay);

    // Text
    addVar("text-primary", palette.text.primary);
    addVar("text-secondary", palette.text.secondary);
    addVar("text-muted", palette.text.muted);
    addVar("text-inverse", palette.text.inverse);

    // Border
    addVar("border-subtle", palette.border.subtle);
    addVar("border-default", palette.border.default);
    addVar("border-strong", palette.border.strong);

    // Accent
    addVar("accent-primary", palette.accent.primary);
    addVar("accent-primary-hover", palette.accent.primaryHover);
    addVar("accent-secondary", palette.accent.secondary);
    addVar("accent-tertiary", palette.accent.tertiary);

    // Status
    addVar("status-completed", palette.status.completed);
    addVar("status-completed-bg", palette.status.completedBg);
    addVar("status-in-progress", palette.status.inProgress);
    addVar("status-in-progress-bg", palette.status.inProgressBg);
    addVar("status-available", palette.status.available);
    addVar("status-available-bg", palette.status.availableBg);
    addVar("status-locked", palette.status.locked);
    addVar("status-locked-bg", palette.status.lockedBg);

    // Domains
    addVar("domain-frontend", palette.domains.frontend);
    addVar("domain-backend", palette.domains.backend);
    addVar("domain-fullstack", palette.domains.fullstack);
    addVar("domain-databases", palette.domains.databases);
    addVar("domain-mobile", palette.domains.mobile);
    addVar("domain-games", palette.domains.games);

    // Connections
    addVar("connection-default", palette.connections.default);
    addVar("connection-active", palette.connections.active);
    addVar("connection-highlighted", palette.connections.highlighted);

    // Effects
    addVar("effect-glow", palette.effects.glow);
    addVar("effect-shadow", palette.effects.shadow);
    addVar("effect-ember", palette.effects.ember);

    return lines.join("\n");
}

/**
 * Export theme as JSON for sharing
 */
export function exportThemeAsJSON(preset: ThemePreset): string {
    return JSON.stringify(preset, null, 2);
}

/**
 * Import theme from JSON
 */
export function importThemeFromJSON(json: string): ThemePreset | null {
    try {
        const parsed = JSON.parse(json);
        // Validate required fields
        if (
            !parsed.id ||
            !parsed.name ||
            !parsed.palette ||
            typeof parsed.isDark !== "boolean"
        ) {
            return null;
        }
        return parsed as ThemePreset;
    } catch {
        return null;
    }
}
