# OpenForge Design System

> **Version:** 1.0  
> **Stack:** Next.js + TypeScript + Tailwind CSS 4  
> **Last Updated:** December 2024

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Patterns](#component-patterns)
6. [Motion & Animation](#motion--animation)
7. [Iconography](#iconography)
8. [Tailwind Configuration](#tailwind-configuration)

---

## Design Philosophy

### Core Concept: "The Learning Forge"

OpenForge transforms raw curiosity into refined knowledge. Our visual language embodies this transformation—where cold, unformed ideas enter the forge and emerge as glowing, structured learning paths.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Transformative** | UI elements should convey progress and evolution. Static feels dead; subtle motion brings life. |
| **Warm Intelligence** | AI should feel approachable, not cold. Warm ember tones humanize the technology. |
| **Structured Freedom** | Clean geometric foundations with organic, flowing accents. Order meets creativity. |
| **Progressive Disclosure** | Complexity reveals itself as users advance. The forge opens gradually. |
| **Dark-First, Light-Ready** | Primary experience is dark mode (the forge); light mode is the "daylight workshop." |

### Visual Metaphors

- **Sparks & Embers** → New ideas, notifications, progress indicators
- **Molten Flow** → Learning paths, data streams, transitions
- **Anvil & Structure** → Core UI containers, cards, foundations
- **Rising Particles** → Achievements, completions, upward growth
- **Neural Pathways** → Connections between topics, skill trees

---

## Color System

### Brand Colors

```
Primary Palette — "The Forge Core"
├── Ember Orange    → The heart of transformation
├── Molten Gold     → Achievement and mastery
├── Forge Charcoal  → Foundation and structure
└── Spark White     → Highlights and clarity
```

### Dark Mode Palette (Primary)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--bg-void` | `#0A0A0B` | 10, 10, 11 | Deepest background |
| `--bg-forge` | `#121214` | 18, 18, 20 | Primary background |
| `--bg-anvil` | `#1A1A1F` | 26, 26, 31 | Cards, containers |
| `--bg-elevated` | `#242429` | 36, 36, 41 | Hover states, modals |
| `--border-subtle` | `#2A2A32` | 42, 42, 50 | Subtle borders |
| `--border-default` | `#3A3A45` | 58, 58, 69 | Default borders |
| `--text-muted` | `#6B6B7A` | 107, 107, 122 | Secondary text |
| `--text-secondary` | `#9A9AAD` | 154, 154, 173 | Supporting text |
| `--text-primary` | `#EAEAF0` | 234, 234, 240 | Primary text |
| `--text-bright` | `#FFFFFF` | 255, 255, 255 | Emphasized text |

### Accent Colors — "The Ember Spectrum"

| Token | Hex | Usage |
|-------|-----|-------|
| `--ember-dim` | `#B34700` | Pressed states |
| `--ember` | `#E85A00` | Primary actions |
| `--ember-bright` | `#FF6B1A` | Hover states |
| `--ember-glow` | `#FF8A4D` | Focus rings, glows |
| `--molten` | `#FFB366` | Highlights |
| `--gold` | `#FFCC80` | Achievements, special |
| `--spark` | `#FFE5C2` | Subtle warm accents |

### Semantic Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--success` | `#34D399` | `#059669` | Completed, correct |
| `--warning` | `#FBBF24` | `#D97706` | Caution, pending |
| `--error` | `#F87171` | `#DC2626` | Errors, destructive |
| `--info` | `#60A5FA` | `#2563EB` | Informational |

### Light Mode Palette (Secondary)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-daylight` | `#FAFAF9` | Primary background |
| `--bg-workshop` | `#FFFFFF` | Cards, containers |
| `--bg-bench` | `#F5F5F4` | Subtle sections |
| `--bg-elevated` | `#FFFFFF` | Modals (with shadow) |
| `--border-subtle` | `#E7E5E4` | Subtle borders |
| `--border-default` | `#D6D3D1` | Default borders |
| `--text-muted` | `#A8A29E` | Tertiary text |
| `--text-secondary` | `#78716C` | Supporting text |
| `--text-primary` | `#1C1917` | Primary text |
| `--ember-light` | `#C2410C` | Primary actions (adjusted) |

### Gradient Definitions

```css
/* Core forge glow gradient */
--gradient-forge: linear-gradient(135deg, #E85A00 0%, #FFB366 50%, #FFCC80 100%);

/* Background ambient glow */
--gradient-ambient: radial-gradient(ellipse at 50% 0%, rgba(232, 90, 0, 0.15) 0%, transparent 60%);

/* Card hover ember effect */
--gradient-ember-hover: linear-gradient(180deg, rgba(255, 107, 26, 0.08) 0%, transparent 40%);

/* Achievement/gold shimmer */
--gradient-gold: linear-gradient(135deg, #FFB366 0%, #FFCC80 50%, #FFE5C2 100%);

/* Neural path line gradient */
--gradient-path: linear-gradient(90deg, #E85A00 0%, #60A5FA 100%);
```

---

## Typography

### Font Stack

```css
/* Primary — Clean, modern, highly legible */
--font-sans: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Mono — For code, data, technical content */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;

/* Display — Optional for marketing headlines */
--font-display: 'Cal Sans', 'Inter', sans-serif;
```

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px | 16px | 400 | Captions, labels |
| `text-sm` | 14px | 20px | 400 | Secondary text, UI elements |
| `text-base` | 16px | 24px | 400 | Body text |
| `text-lg` | 18px | 28px | 400 | Large body, intro text |
| `text-xl` | 20px | 28px | 500 | Card titles |
| `text-2xl` | 24px | 32px | 600 | Section headings |
| `text-3xl` | 30px | 36px | 600 | Page titles |
| `text-4xl` | 36px | 40px | 700 | Hero headings |
| `text-5xl` | 48px | 48px | 700 | Display headlines |

### Font Weight Usage

| Weight | Token | Usage |
|--------|-------|-------|
| 400 | `font-normal` | Body text, descriptions |
| 500 | `font-medium` | UI labels, buttons, emphasized body |
| 600 | `font-semibold` | Headings, card titles |
| 700 | `font-bold` | Hero text, strong emphasis |

### Typography Patterns

```tsx
// Heading hierarchy example
<h1 className="text-4xl font-bold text-text-primary">Dashboard</h1>
<h2 className="text-2xl font-semibold text-text-primary">Your Learning Paths</h2>
<h3 className="text-xl font-medium text-text-primary">Current Progress</h3>
<p className="text-base text-text-secondary">Supporting description text</p>
<span className="text-sm text-text-muted">Last updated 2 hours ago</span>
```

---

## Spacing & Layout

### Spacing Scale

Based on 4px grid system:

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | Reset |
| `space-1` | 4px | Tight inline spacing |
| `space-2` | 8px | Icon gaps, dense lists |
| `space-3` | 12px | Compact padding |
| `space-4` | 16px | Default padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Component gaps |
| `space-10` | 40px | Large sections |
| `space-12` | 48px | Page sections |
| `space-16` | 64px | Major sections |
| `space-20` | 80px | Hero spacing |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Chips, tags, inline elements |
| `rounded` | 6px | Buttons, inputs |
| `rounded-md` | 8px | Cards, small containers |
| `rounded-lg` | 12px | Modals, large cards |
| `rounded-xl` | 16px | Hero sections, feature cards |
| `rounded-2xl` | 24px | Special promotional cards |
| `rounded-full` | 9999px | Avatars, circular buttons |

### Container Widths

```css
--container-sm: 640px;   /* Narrow content, forms */
--container-md: 768px;   /* Default content width */
--container-lg: 1024px;  /* Wide content */
--container-xl: 1280px;  /* Full dashboard width */
--container-2xl: 1536px; /* Maximum width */
```

### Layout Grid

```tsx
// Standard 12-column grid
<div className="grid grid-cols-12 gap-6">
  <aside className="col-span-3">Sidebar</aside>
  <main className="col-span-9">Content</main>
</div>
```

---

## Component Patterns

### 1. Forge Card — Primary Content Container

The signature card component with subtle ember glow on interaction.

```tsx
// ForgeCard.tsx
interface ForgeCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'ember';
  className?: string;
}

export function ForgeCard({ children, variant = 'default', className }: ForgeCardProps) {
  const variants = {
    default: 'bg-bg-anvil border-border-subtle',
    elevated: 'bg-bg-elevated border-border-default shadow-lg',
    ember: 'bg-bg-anvil border-ember/20 shadow-ember-glow',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-5 transition-all duration-300',
        'hover:border-ember/30 hover:shadow-ember-sm',
        'group relative overflow-hidden',
        variants[variant],
        className
      )}
    >
      {/* Ember glow effect on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      {children}
    </div>
  );
}
```

**Tailwind shadow extensions:**
```css
shadow-ember-sm: 0 2px 8px -2px rgba(232, 90, 0, 0.15)
shadow-ember: 0 4px 16px -4px rgba(232, 90, 0, 0.2)
shadow-ember-glow: 0 0 32px -8px rgba(232, 90, 0, 0.3)
```

---

### 2. Spark Button — Primary Action Button

Buttons with ember particle effect on interaction.

```tsx
// SparkButton.tsx
interface SparkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function SparkButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  ...props 
}: SparkButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-forge disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-ember text-white hover:bg-ember-bright active:bg-ember-dim shadow-ember-sm hover:shadow-ember',
    secondary: 'bg-bg-elevated text-text-primary border border-border-default hover:border-ember/50 hover:text-ember',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
      {/* Optional: Spark particle canvas overlay */}
    </button>
  );
}
```

---

### 3. Learning Path Progress — Molten Flow Indicator

A unique progress bar that feels like molten metal flowing through a channel.

```tsx
// MoltenProgress.tsx
interface MoltenProgressProps {
  value: number; // 0-100
  showSparks?: boolean;
}

export function MoltenProgress({ value, showSparks = true }: MoltenProgressProps) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
      {/* Track glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-ember/10 to-transparent" />
      
      {/* Molten fill */}
      <div
        className="h-full rounded-full bg-gradient-to-r from-ember via-ember-bright to-molten transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      >
        {/* Animated glow pulse */}
        <div className="absolute inset-0 animate-pulse-slow bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Leading spark */}
      {showSparks && value > 0 && value < 100 && (
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_8px_2px_rgba(255,179,102,0.6)]"
          style={{ left: `calc(${value}% - 6px)` }}
        />
      )}
    </div>
  );
}
```

---

### 4. Neural Path Connector — Skill Tree Lines

SVG-based connectors for showing learning path relationships.

```tsx
// PathConnector.tsx
interface PathConnectorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active?: boolean;
  completed?: boolean;
}

export function PathConnector({ from, to, active, completed }: PathConnectorProps) {
  const midX = (from.x + to.x) / 2;
  const path = `M ${from.x} ${from.y} Q ${midX} ${from.y}, ${midX} ${(from.y + to.y) / 2} T ${to.x} ${to.y}`;

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible">
      <defs>
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={completed ? '#34D399' : '#E85A00'} />
          <stop offset="100%" stopColor={completed ? '#34D399' : '#60A5FA'} />
        </linearGradient>
        {active && (
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <path
        d={path}
        stroke="url(#pathGradient)"
        strokeWidth={active ? 3 : 2}
        fill="none"
        strokeLinecap="round"
        filter={active ? 'url(#glow)' : undefined}
        className={cn(
          'transition-all duration-300',
          !completed && !active && 'opacity-30'
        )}
      />
      {/* Animated particle along path when active */}
      {active && (
        <circle r="4" fill="#FFB366">
          <animateMotion dur="2s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </svg>
  );
}
```

---

### 5. Ember Input — Text Input with Forge Styling

```tsx
// EmberInput.tsx
interface EmberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function EmberInput({ label, error, className, ...props }: EmberInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-text-secondary">{label}</label>
      )}
      <div className="relative">
        <input
          className={cn(
            'w-full h-10 px-3 rounded-md bg-bg-elevated border border-border-subtle',
            'text-text-primary placeholder:text-text-muted',
            'transition-all duration-200',
            'focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember/30',
            'hover:border-border-default',
            error && 'border-error focus:border-error focus:ring-error/30',
            className
          )}
          {...props}
        />
        {/* Bottom ember line on focus */}
        <div className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-ember to-transparent transition-all duration-300 peer-focus:w-full" />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
```

---

### 6. Achievement Badge — Gold Shimmer Effect

```tsx
// AchievementBadge.tsx
interface AchievementBadgeProps {
  title: string;
  icon: React.ReactNode;
  unlocked?: boolean;
}

export function AchievementBadge({ title, icon, unlocked }: AchievementBadgeProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300',
        unlocked
          ? 'bg-gradient-to-b from-gold/10 to-transparent'
          : 'bg-bg-anvil opacity-50 grayscale'
      )}
    >
      {/* Shimmer effect for unlocked */}
      {unlocked && (
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>
      )}
      
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full',
          unlocked
            ? 'bg-gradient-to-br from-molten to-gold text-bg-forge shadow-[0_0_20px_rgba(255,179,102,0.4)]'
            : 'bg-bg-elevated text-text-muted'
        )}
      >
        {icon}
      </div>
      <span className={cn('text-sm font-medium', unlocked ? 'text-gold' : 'text-text-muted')}>
        {title}
      </span>
    </div>
  );
}
```

---

### 7. Floating Action Spark — AI Assistant Trigger

```tsx
// FloatingSparkButton.tsx
export function FloatingSparkButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-ember to-ember-bright shadow-ember-glow transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(232,90,0,0.5)] active:scale-95"
    >
      {/* Pulsing ring */}
      <span className="absolute inset-0 animate-ping rounded-full bg-ember opacity-20" />
      
      {/* Inner glow */}
      <span className="absolute inset-1 rounded-full bg-gradient-to-br from-ember-bright to-ember opacity-50" />
      
      {/* Icon */}
      <SparklesIcon className="relative h-6 w-6 text-white" />
      
      {/* Rising particles effect on hover */}
      <div className="absolute -inset-4 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Add canvas-based or CSS particle animation */}
      </div>
    </button>
  );
}
```

---

## Motion & Animation

### Animation Principles

1. **Embers Rise** — Upward motion represents progress and achievement
2. **Heat Waves** — Subtle oscillation for active/processing states
3. **Forge Pulse** — Rhythmic glow for attention-seeking elements
4. **Molten Flow** — Smooth, liquid transitions for path progress
5. **Spark Flash** — Quick, bright flashes for micro-interactions

### Tailwind Animation Extensions

```css
/* Add to tailwind.config.ts */
animation: {
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'shimmer': 'shimmer 2s infinite',
  'float': 'float 3s ease-in-out infinite',
  'ember-rise': 'ember-rise 2s ease-out infinite',
  'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
}

keyframes: {
  shimmer: {
    '100%': { transform: 'translateX(200%)' },
  },
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  'ember-rise': {
    '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
    '100%': { transform: 'translateY(-20px) scale(0)', opacity: '0' },
  },
  'glow-pulse': {
    '0%, 100%': { boxShadow: '0 0 20px rgba(232, 90, 0, 0.3)' },
    '50%': { boxShadow: '0 0 40px rgba(232, 90, 0, 0.6)' },
  },
}
```

### Transition Durations

| Duration | Usage |
|----------|-------|
| `duration-150` | Micro-interactions, hovers |
| `duration-200` | Button states, toggles |
| `duration-300` | Card hovers, focus states |
| `duration-500` | Progress bars, reveals |
| `duration-700` | Page transitions, modals |
| `duration-1000` | Hero animations, onboarding |

### Easing Functions

```css
--ease-forge: cubic-bezier(0.4, 0, 0.2, 1);      /* Default, smooth */
--ease-ember-out: cubic-bezier(0.16, 1, 0.3, 1); /* Quick start, gentle end */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful bounce */
```

---

## Iconography

### Icon Style Guidelines

- **Style:** Outlined, 1.5px stroke weight
- **Size:** 24px default, with 16px and 20px variants
- **Corners:** Slightly rounded (2px radius on corners)
- **Recommended Library:** Lucide React (consistent with Tailwind ecosystem)

### Custom Icon Recommendations

Consider creating custom icons for:
- Forge/Anvil — Platform logo element
- Learning Path — Branching upward path
- Spark/Ember — Progress indicator
- AI Generate — Sparkles with circuit pattern
- Skill Node — Hexagon with inner glow

### Icon Color Usage

| Context | Color Token |
|---------|-------------|
| Default UI | `text-text-muted` |
| Interactive (hover) | `text-text-primary` |
| Active/Selected | `text-ember` |
| Success | `text-success` |
| Disabled | `text-text-muted` with 50% opacity |

---

## Tailwind Configuration

### Full Configuration File

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          void: '#0A0A0B',
          forge: '#121214',
          anvil: '#1A1A1F',
          elevated: '#242429',
          // Light mode
          daylight: '#FAFAF9',
          workshop: '#FFFFFF',
          bench: '#F5F5F4',
        },
        // Border colors
        border: {
          subtle: '#2A2A32',
          DEFAULT: '#3A3A45',
          // Light mode
          'subtle-light': '#E7E5E4',
          'default-light': '#D6D3D1',
        },
        // Text colors
        text: {
          muted: '#6B6B7A',
          secondary: '#9A9AAD',
          primary: '#EAEAF0',
          bright: '#FFFFFF',
          // Light mode
          'muted-light': '#A8A29E',
          'secondary-light': '#78716C',
          'primary-light': '#1C1917',
        },
        // Brand colors
        ember: {
          dim: '#B34700',
          DEFAULT: '#E85A00',
          bright: '#FF6B1A',
          glow: '#FF8A4D',
        },
        molten: '#FFB366',
        gold: '#FFCC80',
        spark: '#FFE5C2',
        // Semantic
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#60A5FA',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'monospace'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'ember-sm': '0 2px 8px -2px rgba(232, 90, 0, 0.15)',
        ember: '0 4px 16px -4px rgba(232, 90, 0, 0.2)',
        'ember-glow': '0 0 32px -8px rgba(232, 90, 0, 0.3)',
        'ember-intense': '0 0 48px -8px rgba(232, 90, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-forge': 'linear-gradient(135deg, #E85A00 0%, #FFB366 50%, #FFCC80 100%)',
        'gradient-ambient': 'radial-gradient(ellipse at 50% 0%, rgba(232, 90, 0, 0.15) 0%, transparent 60%)',
        'gradient-gold': 'linear-gradient(135deg, #FFB366 0%, #FFCC80 50%, #FFE5C2 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s infinite',
        float: 'float 3s ease-in-out infinite',
        'ember-rise': 'ember-rise 2s ease-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(200%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'ember-rise': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-20px) scale(0)', opacity: '0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232, 90, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(232, 90, 0, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## CSS Variables Setup

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode variables */
    --background: 250 250 249;
    --foreground: 28 25 23;
    /* ... other light mode vars */
  }

  .dark {
    /* Dark mode variables */
    --background: 18 18 20;
    --foreground: 234 234 240;
    /* ... other dark mode vars */
  }
}

/* Custom utilities */
@layer utilities {
  .text-gradient-forge {
    @apply bg-gradient-forge bg-clip-text text-transparent;
  }
  
  .glow-ember {
    filter: drop-shadow(0 0 8px rgba(232, 90, 0, 0.4));
  }
}
```

---

## Quick Reference

### Component Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| ForgeCard | 🟢 | Primary container |
| SparkButton | 🟢 | All variants |
| EmberInput | 🟢 | With validation |
| MoltenProgress | 🟢 | Animated |
| PathConnector | 🟢 | SVG-based |
| AchievementBadge | 🟢 | With shimmer |
| FloatingSparkButton | 🟢 | AI trigger |
| NavBar | 🟡 | To design |
| Sidebar | 🟡 | To design |
| Modal | 🟡 | To design |
| Toast | 🟡 | To design |
| Dropdown | 🟡 | To design |

---

*OpenForge Design System — Forging Knowledge, One Path at a Time*