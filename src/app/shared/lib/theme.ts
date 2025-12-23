/**
 * Theme token system for the course platform
 * Provides CSS variable accessors and utility classes for consistent theming
 */

// CSS variable accessors for use in inline styles
export const themeTokens = {
    surfaces: {
        base: 'var(--surface-base)',
        elevated: 'var(--surface-elevated)',
        overlay: 'var(--surface-overlay)',
        card: 'var(--surface-card)',
        inset: 'var(--surface-inset)',
    },
    text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        inverse: 'var(--text-inverse)',
    },
    borders: {
        subtle: 'var(--border-subtle)',
        default: 'var(--border-default)',
        strong: 'var(--border-strong)',
    },
    accents: {
        primary: 'var(--accent-primary)',
        primaryHover: 'var(--accent-primary-hover)',
        secondary: 'var(--accent-secondary)',
        tertiary: 'var(--accent-tertiary)',
    },
    colors: {
        indigo: 'var(--color-indigo)',
        purple: 'var(--color-purple)',
        emerald: 'var(--color-emerald)',
        cyan: 'var(--color-cyan)',
        orange: 'var(--color-orange)',
        pink: 'var(--color-pink)',
        blue: 'var(--color-blue)',
        amber: 'var(--color-amber)',
        red: 'var(--color-red)',
    },
    shadows: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
    },
    status: {
        success: {
            bg: 'var(--status-success-bg)',
            text: 'var(--status-success-text)',
            border: 'var(--status-success-border)',
        },
        warning: {
            bg: 'var(--status-warning-bg)',
            text: 'var(--status-warning-text)',
            border: 'var(--status-warning-border)',
        },
        error: {
            bg: 'var(--status-error-bg)',
            text: 'var(--status-error-text)',
            border: 'var(--status-error-border)',
        },
    },
    glass: {
        blur: 'var(--glass-blur)',
        bg: 'var(--glass-bg)',
        border: 'var(--glass-border)',
    },
    grid: {
        color: 'var(--grid-color)',
        size: 'var(--grid-size)',
    },
    gradients: {
        heroFrom: 'var(--gradient-hero-from)',
        heroVia: 'var(--gradient-hero-via)',
        heroTo: 'var(--gradient-hero-to)',
        accent: 'var(--gradient-accent)',
        mesh1: 'var(--gradient-mesh-1)',
        mesh2: 'var(--gradient-mesh-2)',
    },
    buttons: {
        primary: {
            bg: 'var(--btn-primary-bg)',
            text: 'var(--btn-primary-text)',
        },
        secondary: {
            bg: 'var(--btn-secondary-bg)',
            text: 'var(--btn-secondary-text)',
            border: 'var(--btn-secondary-border)',
        },
    },
    interactive: {
        hoverOverlay: 'var(--hover-overlay)',
        activeOverlay: 'var(--active-overlay)',
        focusRing: 'var(--focus-ring)',
    },
} as const;

// Tailwind class compositions for common patterns
export const themeClasses = {
    // Surface classes
    surfaceBase: 'bg-[var(--surface-base)]',
    surfaceElevated: 'bg-[var(--surface-elevated)]',
    surfaceOverlay: 'bg-[var(--surface-overlay)]',
    surfaceCard: 'bg-[var(--surface-card)]',

    // Text classes
    textPrimary: 'text-[var(--text-primary)]',
    textSecondary: 'text-[var(--text-secondary)]',
    textMuted: 'text-[var(--text-muted)]',
    textInverse: 'text-[var(--text-inverse)]',

    // Border classes
    borderSubtle: 'border-[var(--border-subtle)]',
    borderDefault: 'border-[var(--border-default)]',
    borderStrong: 'border-[var(--border-strong)]',

    // Accent text classes
    accentPrimary: 'text-[var(--accent-primary)]',
    accentSecondary: 'text-[var(--accent-secondary)]',
    accentTertiary: 'text-[var(--accent-tertiary)]',

    // Glass card pattern
    glassCard: 'bg-[var(--glass-bg)] backdrop-blur-[10px] border border-[var(--glass-border)]',

    // Elevated card pattern
    elevatedCard: 'bg-[var(--surface-elevated)] backdrop-blur-md border border-[var(--border-default)]',

    // Shadow classes
    shadowSm: 'shadow-[var(--shadow-sm)]',
    shadowMd: 'shadow-[var(--shadow-md)]',
    shadowLg: 'shadow-[var(--shadow-lg)]',

    // Status badges
    statusSuccess: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)]',
    statusWarning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]',
    statusError: 'bg-[var(--status-error-bg)] text-[var(--status-error-text)] border-[var(--status-error-border)]',

    // Button patterns
    btnPrimary: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]',
    btnSecondary: 'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border border-[var(--btn-secondary-border)]',

    // Interactive states
    hoverOverlay: 'hover:bg-[var(--hover-overlay)]',
    focusRing: 'focus:ring-2 focus:ring-[var(--focus-ring)]',
} as const;

// Typography presets based on the reference design
export const typography = {
    // Hero text: 7xl-8xl font-black tracking-tighter
    hero: 'text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]',
    heroItalic: 'text-6xl lg:text-7xl font-light italic',

    // Display text: 4xl-5xl font-bold
    display: 'text-4xl lg:text-5xl font-bold tracking-tight',

    // Heading levels
    h1: 'text-3xl lg:text-4xl font-bold',
    h2: 'text-2xl lg:text-3xl font-bold',
    h3: 'text-xl lg:text-2xl font-semibold',
    h4: 'text-lg font-semibold',

    // Body text
    bodyLg: 'text-xl font-medium leading-relaxed',
    body: 'text-base leading-relaxed',
    bodySm: 'text-sm leading-relaxed',

    // UI text
    label: 'text-sm font-medium',
    caption: 'text-xs',
    badge: 'text-[10px] uppercase font-bold tracking-widest',
} as const;

// Color mappings for domain-specific use (course domains)
export type DomainColor = 'indigo' | 'purple' | 'emerald' | 'cyan' | 'orange' | 'pink' | 'blue' | 'amber' | 'red';

export const domainColorClasses: Record<DomainColor, {
    bg: string;
    bgLight: string;
    text: string;
    border: string;
    gradient: string;
}> = {
    indigo: {
        bg: 'bg-indigo-500',
        bgLight: 'bg-indigo-50 dark:bg-indigo-900/30',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-500 dark:border-indigo-400',
        gradient: 'from-indigo-500 to-indigo-600',
    },
    purple: {
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-50 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500 dark:border-purple-400',
        gradient: 'from-purple-500 to-purple-600',
    },
    emerald: {
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500 dark:border-emerald-400',
        gradient: 'from-emerald-500 to-emerald-600',
    },
    cyan: {
        bg: 'bg-cyan-500',
        bgLight: 'bg-cyan-50 dark:bg-cyan-900/30',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-500 dark:border-cyan-400',
        gradient: 'from-cyan-500 to-cyan-600',
    },
    orange: {
        bg: 'bg-orange-500',
        bgLight: 'bg-orange-50 dark:bg-orange-900/30',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500 dark:border-orange-400',
        gradient: 'from-orange-500 to-orange-600',
    },
    pink: {
        bg: 'bg-pink-500',
        bgLight: 'bg-pink-50 dark:bg-pink-900/30',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-500 dark:border-pink-400',
        gradient: 'from-pink-500 to-pink-600',
    },
    blue: {
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500 dark:border-blue-400',
        gradient: 'from-blue-500 to-blue-600',
    },
    amber: {
        bg: 'bg-amber-500',
        bgLight: 'bg-amber-50 dark:bg-amber-900/30',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500 dark:border-amber-400',
        gradient: 'from-amber-500 to-amber-600',
    },
    red: {
        bg: 'bg-red-500',
        bgLight: 'bg-red-50 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500 dark:border-red-400',
        gradient: 'from-red-500 to-red-600',
    },
};

// Helper to get inline style object with CSS variables
export function getThemeStyle(tokens: Record<string, string>): React.CSSProperties {
    return tokens as React.CSSProperties;
}

// Grid pattern inline styles
export const gridPatternStyle: React.CSSProperties = {
    backgroundSize: 'var(--grid-size) var(--grid-size)',
    backgroundImage: `
        linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
        linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
    `,
};
