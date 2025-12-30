import type { MapNode } from "@/app/features/knowledge-map/lib/types";
import type { HexCoord, Point, HexLayoutNode } from "./types";

export const BASE_HEX_SIZE = 70;
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 2.5;

// Fixed spacing for layout (does NOT change with zoom)
const LAYOUT_SPACING = 160;

// ============================================================================
// HEX COORDINATE MATH (Flat-top hexagons for proper side-fitting)
// ============================================================================

/**
 * Convert axial hex coordinates to pixel position
 * Uses flat-top hexagon orientation for proper puzzle fitting
 */
export function hexToPixel(hex: HexCoord, spacing: number, cx: number, cy: number): Point {
    // Flat-top hexagon positioning
    const x = spacing * (3 / 2 * hex.q) + cx;
    const y = spacing * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r) + cy;
    return { x, y };
}

/**
 * Get SVG polygon points for a flat-top hexagon
 */
export function getHexPoints(cx: number, cy: number, size: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        // Flat-top: start at 0 degrees (right side)
        const angle = (Math.PI / 180) * (60 * i);
        points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
    }
    return points.join(" ");
}

// ============================================================================
// HEXAGONAL PUZZLE LAYOUT - Fixed positions, zoom handled by SVG transform
// ============================================================================

const RING_DIRECTIONS: HexCoord[] = [
    { q: 1, r: 0 },   // East
    { q: 0, r: 1 },   // Southeast
    { q: -1, r: 1 },  // Southwest
    { q: -1, r: 0 },  // West
    { q: 0, r: -1 },  // Northwest
    { q: 1, r: -1 },  // Northeast
];

/**
 * Layout nodes in hexagonal puzzle pattern
 * IMPORTANT: Positions are FIXED - zoom is handled by SVG transform only
 */
export function layoutHexPuzzle(
    nodes: MapNode[],
    width: number,
    height: number,
    _scale: number // Not used for positioning - zoom via SVG transform
): HexLayoutNode[] {
    if (!nodes.length || !width || !height) return [];

    const cx = width / 2;
    const cy = height / 2;

    const result: HexLayoutNode[] = [];
    const hexCoords = generateSpiralHexCoords(nodes.length);

    for (let i = 0; i < nodes.length; i++) {
        const hex = hexCoords[i];
        const pixel = hexToPixel(hex, LAYOUT_SPACING, cx, cy);

        result.push({
            ...nodes[i],
            hex: { ...hex },
            pixel,
        });
    }

    return result;
}

/**
 * Generate hex coordinates in a spiral pattern
 * Creates perfect honeycomb: 1 center, then rings of 6, 12, 18...
 */
function generateSpiralHexCoords(count: number): HexCoord[] {
    const coords: HexCoord[] = [];

    if (count === 0) return coords;

    // Center node
    coords.push({ q: 0, r: 0 });
    if (count === 1) return coords;

    let ring = 1;

    while (coords.length < count) {
        let hex: HexCoord = { q: ring, r: 0 };

        for (let side = 0; side < 6 && coords.length < count; side++) {
            for (let step = 0; step < ring && coords.length < count; step++) {
                coords.push({ ...hex });
                const dir = RING_DIRECTIONS[(side + 2) % 6];
                hex = { q: hex.q + dir.q, r: hex.r + dir.r };
            }
        }

        ring++;
    }

    return coords;
}

// ============================================================================
// ZOOM COMPENSATION - For visual elements only, not positioning
// ============================================================================

/**
 * Calculate compensation factor for visual elements at different zoom levels
 * Makes text/icons larger when zoomed out for readability
 */
export function getZoomCompensation(scale: number): number {
    // When zoomed out (scale < 1), increase visual element size
    // When zoomed in (scale > 1), keep normal or slightly smaller
    return Math.max(0.8, 1.5 / Math.max(scale, 0.3));
}

/**
 * Get compensated size for visual elements
 */
export function getCompensatedSize(baseSize: number, scale: number): number {
    return baseSize * getZoomCompensation(scale);
}
