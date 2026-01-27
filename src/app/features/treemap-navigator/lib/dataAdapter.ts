/**
 * Data Adapter for Treemap Navigator
 *
 * Fetches nodes from /api/map-nodes and transforms them to TreemapNode format.
 * Bridges the existing API with the navigation store.
 */

import type { TreemapNode, ApiNode } from "./types";

/**
 * Ember spectrum color palette for territory backgrounds.
 * Based on CSS variables from globals.css dark mode.
 * Darker colors for higher-level (domain) nodes,
 * brighter ember for deeper (lesson) nodes.
 */
const EMBER_PALETTE: Record<string, string[]> = {
  // Domain: deepest ember (near black with orange tint)
  domain: ["#451A03", "#4D1F06", "#5C2408"],
  // Topic: dark ember
  topic: ["#5C2408", "#6A2A0A", "#7C2D12"],
  // Skill: mid ember
  skill: ["#7C2D12", "#8A320F", "#9A3412"],
  // Course: bright ember
  course: ["#9A3412", "#A83E0E", "#B45309"],
  // Lesson: brightest (spark/molten range)
  lesson: ["#B45309", "#C2410C", "#EA580C"],
};

/**
 * Get color for a node based on its type and depth.
 * Uses warm ember aesthetic matching the Forge UI.
 */
function getNodeColor(nodeType: string, depth: number): string {
  const colorSet = EMBER_PALETTE[nodeType] || EMBER_PALETTE.lesson;
  const colorIndex = Math.min(depth, colorSet.length - 1);
  return colorSet[colorIndex];
}

/**
 * Transform API response node to TreemapNode format.
 * Initializes layout fields to 0 (computed later by layoutEngine).
 */
function transformNode(apiNode: ApiNode): TreemapNode {
  // Map API nodeType to our nodeType
  const nodeTypeMap: Record<string, TreemapNode["nodeType"]> = {
    domain: "domain",
    topic: "topic",
    skill: "skill",
    course: "course",
    lesson: "lesson",
  };

  return {
    id: apiNode.id,
    label: apiNode.name,
    parentId: apiNode.parentId,
    childCount: apiNode.totalChildren || 0,
    totalLessons: apiNode.totalChildren || 1, // Use totalChildren as weight fallback
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color: apiNode.color || getNodeColor(apiNode.nodeType, apiNode.depth),
    nodeType: nodeTypeMap[apiNode.nodeType] || "lesson",
    depth: apiNode.depth,
  };
}

/**
 * Response shape from /api/map-nodes GET endpoint
 */
interface FetchNodesResponse {
  nodes: Record<string, ApiNode>;
  rootNodeIds: string[];
  total: number;
  hasMore: boolean;
}

/**
 * Fetch root-level nodes (depth 0, no parent).
 */
export async function fetchRootNodes(): Promise<TreemapNode[]> {
  try {
    // Fetch nodes with no parent (root level) - depth 0
    const response = await fetch("/api/map-nodes?max_depth=0&limit=100");

    if (!response.ok) {
      throw new Error(`Failed to fetch root nodes: ${response.statusText}`);
    }

    const data: FetchNodesResponse = await response.json();

    // Transform root nodes using rootNodeIds to maintain order
    const rootNodes: TreemapNode[] = data.rootNodeIds
      .map((id) => data.nodes[id])
      .filter(Boolean)
      .map(transformNode);

    return rootNodes;
  } catch (error) {
    console.error("fetchRootNodes error:", error);
    throw error;
  }
}

/**
 * Fetch children of a specific parent node.
 */
export async function fetchChildren(parentId: string): Promise<TreemapNode[]> {
  try {
    const response = await fetch(
      `/api/map-nodes?parent_id=${encodeURIComponent(parentId)}&limit=100`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch children: ${response.statusText}`);
    }

    const data: FetchNodesResponse = await response.json();

    // Get all nodes that have this parent
    const children: TreemapNode[] = Object.values(data.nodes)
      .filter(
        (node): node is ApiNode => node !== null && node.parentId === parentId
      )
      .map(transformNode);

    return children;
  } catch (error) {
    console.error("fetchChildren error:", error);
    throw error;
  }
}
