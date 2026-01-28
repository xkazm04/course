/**
 * Node Instance Batcher
 *
 * Manages efficient batching of nodes for WebGL instanced rendering.
 * Groups nodes by type and visual properties to minimize draw calls.
 *
 * Features:
 * - Automatic batching by node type
 * - LOD-based batch management
 * - Frustum culling per batch
 * - Dirty tracking for minimal updates
 * - Memory-efficient buffer management
 */

import * as THREE from "three";
import type { UniverseNode, ClusterNode, ZoomLevel } from "./types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Node batch for a specific node type
 */
export interface NodeBatch {
    type: string;
    nodes: UniverseNode[];
    instanceCount: number;
    dirty: boolean;
    visible: boolean;
    lodLevel: "high" | "medium" | "low";
}

/**
 * Instance data for a single node
 */
export interface InstanceData {
    matrix: THREE.Matrix4;
    color: THREE.Color;
    glowColor: THREE.Color;
    opacity: number;
    pulsePhase: number;
    isHovered: boolean;
    isSelected: boolean;
}

/**
 * Batcher configuration
 */
export interface NodeInstanceBatcherConfig {
    maxInstancesPerBatch: number;
    lodDistances: {
        high: number;
        medium: number;
        low: number;
    };
    enableFrustumCulling: boolean;
    batchByType: boolean;
}

/**
 * Batch update result
 */
export interface BatchUpdateResult {
    totalInstances: number;
    visibleInstances: number;
    batchCount: number;
    culledBatches: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_BATCHER_CONFIG: NodeInstanceBatcherConfig = {
    maxInstancesPerBatch: 5000,
    lodDistances: {
        high: 100,
        medium: 300,
        low: 800,
    },
    enableFrustumCulling: true,
    batchByType: true,
};

// ============================================================================
// NODE INSTANCE BATCHER
// ============================================================================

/**
 * NodeInstanceBatcher - Manages efficient batching for instanced rendering
 */
export class NodeInstanceBatcher {
    private config: NodeInstanceBatcherConfig;
    private batches: Map<string, NodeBatch> = new Map();
    private instanceDataPool: InstanceData[] = [];
    private poolIndex: number = 0;

    // Shared buffers for all batches
    private matrixBuffer: Float32Array;
    private colorBuffer: Float32Array;
    private dataBuffer: Float32Array;

    // Reusable objects to avoid allocations
    private tempMatrix: THREE.Matrix4 = new THREE.Matrix4();
    private tempColor: THREE.Color = new THREE.Color();
    private tempPosition: THREE.Vector3 = new THREE.Vector3();
    private frustum: THREE.Frustum = new THREE.Frustum();
    private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();

    constructor(config: Partial<NodeInstanceBatcherConfig> = {}) {
        this.config = { ...DEFAULT_BATCHER_CONFIG, ...config };

        // Allocate shared buffers
        const maxInstances = this.config.maxInstancesPerBatch * 10; // Support 10 batches
        this.matrixBuffer = new Float32Array(maxInstances * 16);
        this.colorBuffer = new Float32Array(maxInstances * 3);
        this.dataBuffer = new Float32Array(maxInstances * 4);

        // Pre-allocate instance data pool
        for (let i = 0; i < maxInstances; i++) {
            this.instanceDataPool.push({
                matrix: new THREE.Matrix4(),
                color: new THREE.Color(),
                glowColor: new THREE.Color(),
                opacity: 1,
                pulsePhase: 0,
                isHovered: false,
                isSelected: false,
            });
        }
    }

    // ========================================================================
    // BATCH MANAGEMENT
    // ========================================================================

    /**
     * Update batches from a list of nodes
     */
    updateFromNodes(
        nodes: UniverseNode[],
        hoveredId: string | null,
        selectedId: string | null,
        cameraPosition: THREE.Vector3,
        opacityOverrides?: Map<string, number>
    ): BatchUpdateResult {
        // Reset pool index
        this.poolIndex = 0;

        // Group nodes by type
        const nodesByType = this.groupByType(nodes);

        // Update or create batches
        let totalInstances = 0;
        let visibleInstances = 0;
        let culledBatches = 0;

        for (const [type, typeNodes] of nodesByType) {
            let batch = this.batches.get(type);

            if (!batch) {
                batch = this.createBatch(type);
                this.batches.set(type, batch);
            }

            // Determine LOD level based on camera distance
            batch.lodLevel = this.calculateLOD(typeNodes, cameraPosition);

            // Update batch nodes
            batch.nodes = typeNodes;
            batch.instanceCount = typeNodes.length;
            batch.dirty = true;

            // Calculate instance data
            for (let i = 0; i < typeNodes.length; i++) {
                const node = typeNodes[i];
                const instanceData = this.getInstanceData();

                this.calculateInstanceData(
                    node,
                    instanceData,
                    hoveredId,
                    selectedId,
                    cameraPosition,
                    batch.lodLevel,
                    opacityOverrides?.get(node.id)
                );

                totalInstances++;
                visibleInstances++;
            }
        }

        // Remove batches for node types no longer present
        for (const [type, batch] of this.batches) {
            if (!nodesByType.has(type)) {
                this.batches.delete(type);
            }
        }

        return {
            totalInstances,
            visibleInstances,
            batchCount: this.batches.size,
            culledBatches,
        };
    }

    /**
     * Group nodes by type
     */
    private groupByType(nodes: UniverseNode[]): Map<string, UniverseNode[]> {
        const groups = new Map<string, UniverseNode[]>();

        for (const node of nodes) {
            const type = this.config.batchByType ? node.type : "default";
            let group = groups.get(type);

            if (!group) {
                group = [];
                groups.set(type, group);
            }

            group.push(node);
        }

        return groups;
    }

    /**
     * Create a new batch
     */
    private createBatch(type: string): NodeBatch {
        return {
            type,
            nodes: [],
            instanceCount: 0,
            dirty: true,
            visible: true,
            lodLevel: "high",
        };
    }

    /**
     * Get instance data from pool
     */
    private getInstanceData(): InstanceData {
        if (this.poolIndex >= this.instanceDataPool.length) {
            // Grow pool if needed
            this.instanceDataPool.push({
                matrix: new THREE.Matrix4(),
                color: new THREE.Color(),
                glowColor: new THREE.Color(),
                opacity: 1,
                pulsePhase: 0,
                isHovered: false,
                isSelected: false,
            });
        }

        return this.instanceDataPool[this.poolIndex++];
    }

    // ========================================================================
    // INSTANCE DATA CALCULATION
    // ========================================================================

    /**
     * Calculate instance data for a node
     */
    private calculateInstanceData(
        node: UniverseNode,
        data: InstanceData,
        hoveredId: string | null,
        selectedId: string | null,
        cameraPosition: THREE.Vector3,
        lodLevel: "high" | "medium" | "low",
        opacityOverride?: number
    ): void {
        // Calculate LOD-adjusted radius
        let radius = node.radius;
        if (lodLevel === "medium") {
            radius *= 0.9;
        } else if (lodLevel === "low") {
            radius *= 0.75;
        }

        // Build transform matrix
        data.matrix.makeScale(radius, radius, 1);
        data.matrix.setPosition(node.x, node.y, 0);

        // Set colors
        data.color.set(node.color);
        data.glowColor.set(node.glowColor);

        // Set state
        data.opacity = opacityOverride ?? 1;
        data.pulsePhase = Math.random() * Math.PI * 2;
        data.isHovered = node.id === hoveredId;
        data.isSelected = node.id === selectedId;
    }

    /**
     * Calculate LOD level based on average distance to camera
     */
    private calculateLOD(
        nodes: UniverseNode[],
        cameraPosition: THREE.Vector3
    ): "high" | "medium" | "low" {
        if (nodes.length === 0) return "high";

        // Sample a few nodes to estimate distance
        const sampleSize = Math.min(10, nodes.length);
        const step = Math.floor(nodes.length / sampleSize);
        let totalDistance = 0;

        for (let i = 0; i < sampleSize; i++) {
            const node = nodes[i * step];
            this.tempPosition.set(node.x, node.y, 0);
            totalDistance += this.tempPosition.distanceTo(cameraPosition);
        }

        const avgDistance = totalDistance / sampleSize;
        const { lodDistances } = this.config;

        if (avgDistance < lodDistances.high) return "high";
        if (avgDistance < lodDistances.medium) return "medium";
        return "low";
    }

    // ========================================================================
    // FRUSTUM CULLING
    // ========================================================================

    /**
     * Update frustum from camera
     */
    updateFrustum(camera: THREE.Camera): void {
        this.projScreenMatrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }

    /**
     * Check if a node is visible in frustum
     */
    isNodeVisible(node: UniverseNode): boolean {
        if (!this.config.enableFrustumCulling) return true;

        this.tempPosition.set(node.x, node.y, 0);
        return this.frustum.containsPoint(this.tempPosition);
    }

    /**
     * Filter visible nodes from a batch
     */
    getVisibleNodes(batch: NodeBatch): UniverseNode[] {
        if (!this.config.enableFrustumCulling) {
            return batch.nodes;
        }

        return batch.nodes.filter(node => this.isNodeVisible(node));
    }

    // ========================================================================
    // BUFFER EXPORT
    // ========================================================================

    /**
     * Get batches for rendering
     */
    getBatches(): NodeBatch[] {
        return Array.from(this.batches.values());
    }

    /**
     * Get batch by type
     */
    getBatch(type: string): NodeBatch | undefined {
        return this.batches.get(type);
    }

    /**
     * Export instance matrices to buffer
     */
    exportMatrices(batch: NodeBatch): Float32Array {
        const count = batch.instanceCount;
        const buffer = new Float32Array(count * 16);

        for (let i = 0; i < count; i++) {
            const node = batch.nodes[i];
            this.tempMatrix.makeScale(node.radius, node.radius, 1);
            this.tempMatrix.setPosition(node.x, node.y, 0);
            this.tempMatrix.toArray(buffer, i * 16);
        }

        return buffer;
    }

    /**
     * Export instance colors to buffer
     */
    exportColors(batch: NodeBatch): Float32Array {
        const count = batch.instanceCount;
        const buffer = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const node = batch.nodes[i];
            this.tempColor.set(node.color);
            buffer[i * 3] = this.tempColor.r;
            buffer[i * 3 + 1] = this.tempColor.g;
            buffer[i * 3 + 2] = this.tempColor.b;
        }

        return buffer;
    }

    /**
     * Export instance data (opacity, pulse, hover, selected) to buffer
     */
    exportData(
        batch: NodeBatch,
        hoveredId: string | null,
        selectedId: string | null,
        opacityOverrides?: Map<string, number>
    ): Float32Array {
        const count = batch.instanceCount;
        const buffer = new Float32Array(count * 4);

        for (let i = 0; i < count; i++) {
            const node = batch.nodes[i];
            buffer[i * 4] = opacityOverrides?.get(node.id) ?? 1; // opacity
            buffer[i * 4 + 1] = (i / count) * Math.PI * 2; // pulse phase
            buffer[i * 4 + 2] = node.id === hoveredId ? 1 : 0; // hover
            buffer[i * 4 + 3] = node.id === selectedId ? 1 : 0; // selected
        }

        return buffer;
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /**
     * Get batcher statistics
     */
    getStats(): {
        batchCount: number;
        totalInstances: number;
        poolSize: number;
        poolUsed: number;
    } {
        let totalInstances = 0;
        for (const batch of this.batches.values()) {
            totalInstances += batch.instanceCount;
        }

        return {
            batchCount: this.batches.size,
            totalInstances,
            poolSize: this.instanceDataPool.length,
            poolUsed: this.poolIndex,
        };
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Clear all batches
     */
    clear(): void {
        this.batches.clear();
        this.poolIndex = 0;
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.clear();
        this.instanceDataPool = [];
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new NodeInstanceBatcher
 */
export function createNodeInstanceBatcher(
    config?: Partial<NodeInstanceBatcherConfig>
): NodeInstanceBatcher {
    return new NodeInstanceBatcher(config);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Estimate optimal batch size based on GPU capabilities
 */
export function estimateOptimalBatchSize(): number {
    if (typeof window === "undefined") return 5000;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    if (!gl) return 5000;

    // Check max vertex uniform vectors
    const maxUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);

    // Each instance needs ~4 uniforms for matrix, estimate conservatively
    return Math.min(10000, Math.floor(maxUniforms / 4));
}

/**
 * Calculate memory usage for a given node count
 */
export function estimateMemoryUsage(nodeCount: number): {
    matrices: number;
    colors: number;
    data: number;
    total: number;
} {
    const matrices = nodeCount * 16 * 4; // 16 floats per matrix, 4 bytes per float
    const colors = nodeCount * 3 * 4; // 3 floats per color
    const data = nodeCount * 4 * 4; // 4 floats per instance data

    return {
        matrices,
        colors,
        data,
        total: matrices + colors + data,
    };
}
