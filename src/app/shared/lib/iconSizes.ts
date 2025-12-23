/**
 * Consistent Icon Sizing System
 *
 * This module provides a standardized icon sizing scale for use across the application.
 * Using these constants ensures visual consistency and proper optical weight relative
 * to adjacent text and containers.
 *
 * Size Scale:
 * - xs (12px): Extra small - for ultra-compact UIs, tag removers, density indicators
 * - sm (14px): Small - inline text icons, breadcrumbs, secondary labels
 * - md (18px): Medium - buttons, form controls, primary actions
 * - lg (24px): Large - feature icons, section headers, emphasis elements
 * - xl (32px): Extra large - hero elements, achievements, main focal points
 *
 * Context Guidelines:
 * - Inline icons (next to text): sm (14px)
 * - Button icons: md (18px)
 * - Feature/card icons: lg (24px)
 * - Hero/celebration icons: xl (32px)
 * - Ultra-compact UIs: xs (12px)
 */

export const ICON_SIZES = {
  /** Extra small - ultra-compact UIs, tag removers (12px) */
  xs: 12,
  /** Small - inline text icons, breadcrumbs, secondary elements (14px) */
  sm: 14,
  /** Medium - buttons, form controls, primary actions (18px) */
  md: 18,
  /** Large - feature icons, section headers, emphasis elements (24px) */
  lg: 24,
  /** Extra large - hero elements, achievements, main focal points (32px) */
  xl: 32,
} as const;

export type IconSize = keyof typeof ICON_SIZES;
export type IconSizeValue = (typeof ICON_SIZES)[IconSize];

/**
 * Helper function to get icon size value
 * @param size - The size key (xs, sm, md, lg, xl)
 * @returns The pixel value for the icon size
 */
export function getIconSize(size: IconSize): IconSizeValue {
  return ICON_SIZES[size];
}

/**
 * Context-based icon size recommendations
 * Use these to determine the appropriate size for different UI contexts
 */
export const ICON_CONTEXT = {
  /** Icons displayed inline with text */
  inline: ICON_SIZES.sm,
  /** Icons in buttons and form controls */
  button: ICON_SIZES.md,
  /** Icons in feature cards and sections */
  feature: ICON_SIZES.lg,
  /** Icons in hero sections and celebrations */
  hero: ICON_SIZES.xl,
  /** Icons in compact/dense UIs */
  compact: ICON_SIZES.xs,
} as const;

export type IconContext = keyof typeof ICON_CONTEXT;

/**
 * Optical alignment adjustments for icons next to text
 *
 * Icons often appear slightly misaligned when placed next to text due to
 * differences in visual weight distribution. These adjustments compensate
 * for optical illusions to achieve pixel-perfect visual alignment.
 *
 * Usage with Tailwind:
 * - Use `items-center` on the flex container
 * - Apply `leading-none` to icon containers
 * - For icons in sized containers, ensure the container uses flex centering
 *
 * Usage with CSS utility:
 * - Apply `icon-text-align` class to the container (defined in globals.css)
 * - This automatically applies the optical adjustment transform
 */
export const ICON_ALIGNMENT = {
  /** Default alignment - uses flex items-center with optical adjustment */
  default: 'flex items-center',
  /** Alignment class for icon-text groups */
  iconText: 'icon-text-align',
  /** Alignment class for icon-text groups with tight spacing */
  iconTextTight: 'icon-text-align-tight',
  /** Alignment class for icon-text groups with wide spacing */
  iconTextWide: 'icon-text-align-wide',
  /** For icons in sized containers (like 48px icon boxes) */
  iconContainer: 'icon-container-align',
} as const;

export type IconAlignment = keyof typeof ICON_ALIGNMENT;
