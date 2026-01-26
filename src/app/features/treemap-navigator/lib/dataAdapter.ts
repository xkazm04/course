/**
 * Data Adapter for Treemap Navigator
 *
 * Fetches nodes from /api/map-nodes and transforms them to TreemapNode format.
 * Bridges the existing API with the navigation store.
 */

import type { TreemapNode, ApiNode } from "./types";

/**
 * Get color for a node based on its type and depth.
 * Uses dark gaming aesthetic with glowing accents.
 */
function getNodeColor(nodeType: string, depth: number): string {
  const colors: Record<string, string[]> = {
    domain: ["#1e3a5f", "#2a4a7a", "#3a5a9a"],
    topic: ["#2d4a3e", "#3d5a4e", "#4d6a5e"],
    skill: ["#4a3052", "#5a4062", "#6a5072"],
    course: ["#5a3d2b", "#6a4d3b", "#7a5d4b"],
    lesson: ["#3d4a5a", "#4d5a6a", "#5d6a7a"],
  };

  const colorSet = colors[nodeType] || colors.lesson;
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
