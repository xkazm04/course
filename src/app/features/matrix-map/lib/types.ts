/**
 * Matrix Map Types
 *
 * Extended types for the three matrix map visualizations.
 * Reuses core types from knowledge-map for compatibility.
 */

import type { MapNode, MapNodeBase, ViewportState, NavigationState, KnowledgeMapData } from "@/app/features/knowledge-map/lib/types";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// Re-export knowledge-map types for convenience
export type { MapNode, MapNodeBase, ViewportState, NavigationState, KnowledgeMapData };

// ============================================================================
// VARIANT TYPES
// ============================================================================

export type MatrixVariant = "nested" | "hex" | "metro";

// ============================================================================
// NESTED BOXES (TREEMAP) TYPES
// ============================================================================

export interface NestedBoxBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface NestedLayoutNode extends MapNodeBase {
    bounds: NestedBoxBounds;
    depth: number;
    isContainer: boolean;
}

// ============================================================================
// HEX GRID TYPES
// ============================================================================

export interface HexCoord {
    q: number; // Column (axial coordinate)
    r: number; // Row (axial coordinate)
}

export interface Point {
    x: number;
    y: number;
}

export interface HexLayoutNode extends MapNodeBase {
    hex: HexCoord;
    pixel: Point;
    size: number;
    groupId: string;
}

// ============================================================================
// METRO MAP TYPES
// ============================================================================

export interface MetroLine {
    id: string;
    domainId: LearningDomainId;
    color: string;
    stations: string[]; // Node IDs in order
    path: Point[];      // SVG path points
}

export interface MetroLayoutNode extends MapNodeBase {
    position: Point;
    lineId: string;
    isInterchange: boolean;
    stationIndex: number;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface MatrixMapContainerProps {
    variant: MatrixVariant;
    height?: string;
    initialDomainId?: LearningDomainId;
    onNodeSelect?: (node: MapNode | null) => void;
}

export interface MatrixCanvasProps {
    nodes: MapNode[];
    viewport: ViewportState;
    selectedNodeId: string | null;
    onNodeSelect: (nodeId: string) => void;
    onNodeDrillDown: (nodeId: string) => void;
    onBackgroundClick: () => void;
    containerWidth: number;
    containerHeight: number;
}
