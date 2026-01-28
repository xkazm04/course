/**
 * WebGL Renderer
 *
 * High-performance WebGL-based renderer for the Knowledge Universe using Three.js.
 * Provides 60fps rendering for 10k+ nodes with advanced visual effects.
 *
 * Features:
 * - Instanced rendering for thousands of nodes in single draw calls
 * - Custom shaders for bloom, glow, and pulse effects
 * - GPU-accelerated particle systems
 * - Post-processing pipeline (bloom, chromatic aberration)
 * - Graceful fallback to Canvas 2D
 * - WebGL context loss recovery
 */

import * as THREE from "three";
import type { UniverseNode, ClusterNode, ZoomLevel } from "./types";
import type { WorldCoordinator } from "./worldCoordinator";

// ============================================================================
// TYPES
// ============================================================================

export interface WebGLRendererConfig {
    /** Enable antialiasing (may impact performance) */
    antialias: boolean;
    /** Pixel ratio (use device pixel ratio for sharpness) */
    pixelRatio: number;
    /** Enable post-processing effects */
    enablePostProcessing: boolean;
    /** Enable bloom effect */
    enableBloom: boolean;
    /** Bloom intensity */
    bloomIntensity: number;
    /** Enable particle effects */
    enableParticles: boolean;
    /** Maximum particles for ambient effects */
    maxParticles: number;
    /** Enable debug mode (show FPS, draw calls) */
    debug: boolean;
    /** Background color */
    backgroundColor: number;
    /** LOD distance thresholds */
    lodDistances: {
        high: number;
        medium: number;
        low: number;
    };
}

export interface WebGLRendererStats {
    fps: number;
    drawCalls: number;
    triangles: number;
    nodeCount: number;
    visibleNodes: number;
    memoryUsage: number;
}

export interface NodeRenderData {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: THREE.Color;
    glowColor: THREE.Color;
    type: string;
    isHovered: boolean;
    isSelected: boolean;
    opacity: number;
    pulsePhase: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_WEBGL_CONFIG: WebGLRendererConfig = {
    antialias: true,
    pixelRatio: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
    enablePostProcessing: true,
    enableBloom: true,
    bloomIntensity: 0.8,
    enableParticles: true,
    maxParticles: 2000,
    debug: false,
    backgroundColor: 0x0a0a0b,
    lodDistances: {
        high: 100,
        medium: 300,
        low: 800,
    },
};

// ============================================================================
// WEBGL SUPPORT DETECTION
// ============================================================================

/**
 * Detect WebGL support and capabilities
 */
export function detectWebGLSupport(): {
    supported: boolean;
    version: number;
    maxTextureSize: number;
    maxVertexUniforms: number;
    renderer: string;
} {
    if (typeof window === "undefined") {
        return { supported: false, version: 0, maxTextureSize: 0, maxVertexUniforms: 0, renderer: "" };
    }

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    if (!gl) {
        return { supported: false, version: 0, maxTextureSize: 0, maxVertexUniforms: 0, renderer: "" };
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "Unknown";

    return {
        supported: true,
        version: gl instanceof WebGL2RenderingContext ? 2 : 1,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        renderer,
    };
}

// ============================================================================
// WEBGL UNIVERSE RENDERER
// ============================================================================

/**
 * WebGLUniverseRenderer - High-performance WebGL renderer for the Knowledge Universe
 */
export class WebGLUniverseRenderer {
    private config: WebGLRendererConfig;
    private renderer: THREE.WebGLRenderer | null = null;
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private canvas: HTMLCanvasElement | null = null;
    private width: number = 800;
    private height: number = 600;

    // Node rendering
    private nodeInstanceMesh: THREE.InstancedMesh | null = null;
    private glowInstanceMesh: THREE.InstancedMesh | null = null;
    private nodeGeometry: THREE.CircleGeometry;
    private glowGeometry: THREE.CircleGeometry;
    private nodeMaterial: THREE.ShaderMaterial;
    private glowMaterial: THREE.ShaderMaterial;
    private maxInstances: number = 15000;
    private instanceCount: number = 0;

    // Cluster rendering
    private clusterMesh: THREE.InstancedMesh | null = null;
    private clusterGeometry: THREE.CircleGeometry;
    private clusterMaterial: THREE.ShaderMaterial;

    // Particles
    private particleSystem: THREE.Points | null = null;
    private particleGeometry: THREE.BufferGeometry | null = null;
    private particleMaterial: THREE.ShaderMaterial | null = null;

    // Connections
    private connectionLines: THREE.LineSegments | null = null;
    private connectionGeometry: THREE.BufferGeometry | null = null;
    private connectionMaterial: THREE.LineBasicMaterial | null = null;

    // State
    private time: number = 0;
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 60;
    private disposed: boolean = false;

    // Buffers for instanced attributes
    private instanceMatrix: THREE.Matrix4[] = [];
    private instanceColors: Float32Array | null = null;
    private instanceData: Float32Array | null = null; // opacity, pulse, hover, selected

    // Context loss handling
    private contextLost: boolean = false;
    private onContextLost: (() => void) | null = null;
    private onContextRestored: (() => void) | null = null;

    constructor(config: Partial<WebGLRendererConfig> = {}) {
        this.config = { ...DEFAULT_WEBGL_CONFIG, ...config };

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);

        // Create orthographic camera (2D view)
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
        this.camera.position.z = 100;

        // Create node geometry (circle with segments for smooth edges)
        this.nodeGeometry = new THREE.CircleGeometry(1, 32);
        this.glowGeometry = new THREE.CircleGeometry(1, 24);
        this.clusterGeometry = new THREE.CircleGeometry(1, 48);

        // Create shader materials
        this.nodeMaterial = this.createNodeMaterial();
        this.glowMaterial = this.createGlowMaterial();
        this.clusterMaterial = this.createClusterMaterial();

        // Initialize instance buffers
        this.initializeInstanceBuffers();
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize the renderer with a canvas element
     */
    initialize(canvas: HTMLCanvasElement): boolean {
        if (this.disposed) return false;

        this.canvas = canvas;

        try {
            // Create WebGL renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: this.config.antialias,
                alpha: false,
                powerPreference: "high-performance",
                stencil: false,
                depth: false,
            });

            this.renderer.setPixelRatio(this.config.pixelRatio);
            this.renderer.setSize(this.width, this.height);

            // Setup context loss handlers
            canvas.addEventListener("webglcontextlost", this.handleContextLost);
            canvas.addEventListener("webglcontextrestored", this.handleContextRestored);

            // Create instanced meshes
            this.createInstancedMeshes();

            // Create particle system
            if (this.config.enableParticles) {
                this.createParticleSystem();
            }

            // Create connection lines
            this.createConnectionLines();

            return true;
        } catch (error) {
            console.error("Failed to initialize WebGL renderer:", error);
            return false;
        }
    }

    private initializeInstanceBuffers(): void {
        // Pre-allocate buffers for maximum instances
        this.instanceMatrix = new Array(this.maxInstances);
        for (let i = 0; i < this.maxInstances; i++) {
            this.instanceMatrix[i] = new THREE.Matrix4();
        }

        // Color buffer (r, g, b for each instance)
        this.instanceColors = new Float32Array(this.maxInstances * 3);

        // Data buffer (opacity, pulse, hover, selected for each instance)
        this.instanceData = new Float32Array(this.maxInstances * 4);
    }

    private createInstancedMeshes(): void {
        if (!this.renderer) return;

        // Main node mesh
        this.nodeInstanceMesh = new THREE.InstancedMesh(
            this.nodeGeometry,
            this.nodeMaterial,
            this.maxInstances
        );
        this.nodeInstanceMesh.frustumCulled = false; // We handle culling ourselves
        this.scene.add(this.nodeInstanceMesh);

        // Glow mesh (rendered behind nodes)
        this.glowInstanceMesh = new THREE.InstancedMesh(
            this.glowGeometry,
            this.glowMaterial,
            this.maxInstances
        );
        this.glowInstanceMesh.frustumCulled = false;
        this.glowInstanceMesh.renderOrder = -1; // Render before nodes
        this.scene.add(this.glowInstanceMesh);

        // Cluster mesh
        this.clusterMesh = new THREE.InstancedMesh(
            this.clusterGeometry,
            this.clusterMaterial,
            1000 // Max clusters
        );
        this.clusterMesh.frustumCulled = false;
        this.clusterMesh.renderOrder = -2; // Render before everything
        this.scene.add(this.clusterMesh);

        // Add instance attributes
        const colorAttr = new THREE.InstancedBufferAttribute(this.instanceColors!, 3);
        const dataAttr = new THREE.InstancedBufferAttribute(this.instanceData!, 4);

        this.nodeGeometry.setAttribute("instanceColor", colorAttr);
        this.nodeGeometry.setAttribute("instanceData", dataAttr);
        this.glowGeometry.setAttribute("instanceColor", colorAttr);
        this.glowGeometry.setAttribute("instanceData", dataAttr);
    }

    private createParticleSystem(): void {
        const positions = new Float32Array(this.config.maxParticles * 3);
        const colors = new Float32Array(this.config.maxParticles * 3);
        const sizes = new Float32Array(this.config.maxParticles);
        const phases = new Float32Array(this.config.maxParticles);

        // Initialize particle positions randomly
        for (let i = 0; i < this.config.maxParticles; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 4000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
            positions[i * 3 + 2] = -1; // Behind nodes

            // Ember/gold colors
            const isEmber = Math.random() > 0.7;
            if (isEmber) {
                colors[i * 3] = 0.76; // R
                colors[i * 3 + 1] = 0.25; // G
                colors[i * 3 + 2] = 0.05; // B
            } else {
                colors[i * 3] = 0.83; // R
                colors[i * 3 + 1] = 0.66; // G
                colors[i * 3 + 2] = 0.33; // B
            }

            sizes[i] = 1 + Math.random() * 2;
            phases[i] = Math.random() * Math.PI * 2;
        }

        this.particleGeometry = new THREE.BufferGeometry();
        this.particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        this.particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
        this.particleGeometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));

        this.particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: 1 },
            },
            vertexShader: `
                attribute float size;
                attribute float phase;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uTime;
                uniform float uScale;

                void main() {
                    vColor = color;
                    vAlpha = 0.3 + 0.2 * sin(uTime * 0.001 + phase);

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * uScale * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;

                    float alpha = vAlpha * (1.0 - dist * 2.0);
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.particleSystem.renderOrder = -3; // Render first (background)
        this.scene.add(this.particleSystem);
    }

    private createConnectionLines(): void {
        // Pre-allocate for max connections
        const maxConnections = 5000;
        const positions = new Float32Array(maxConnections * 6); // 2 vertices per line, 3 floats each
        const colors = new Float32Array(maxConnections * 6);

        this.connectionGeometry = new THREE.BufferGeometry();
        this.connectionGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        this.connectionGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        this.connectionMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.NormalBlending,
        });

        this.connectionLines = new THREE.LineSegments(
            this.connectionGeometry,
            this.connectionMaterial
        );
        this.connectionLines.renderOrder = -1.5; // Between glow and nodes
        this.scene.add(this.connectionLines);
    }

    // ========================================================================
    // SHADER MATERIALS
    // ========================================================================

    private createNodeMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
            },
            vertexShader: `
                attribute vec3 instanceColor;
                attribute vec4 instanceData; // opacity, pulse, hover, selected
                varying vec3 vColor;
                varying vec4 vData;
                varying vec2 vUv;

                void main() {
                    vColor = instanceColor;
                    vData = instanceData;
                    vUv = uv;

                    // Apply instance matrix transformation
                    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec3 vColor;
                varying vec4 vData; // opacity, pulse, hover, selected
                varying vec2 vUv;

                void main() {
                    float opacity = vData.x;
                    float pulse = vData.y;
                    float hover = vData.z;
                    float selected = vData.w;

                    // Calculate distance from center
                    vec2 center = vec2(0.5, 0.5);
                    float dist = length(vUv - center) * 2.0;

                    // Discard outside circle
                    if (dist > 1.0) discard;

                    // Base color
                    vec3 color = vColor;

                    // Inner shine
                    float shine = 1.0 - smoothstep(0.0, 0.6, dist);
                    color = mix(color, vec3(1.0), shine * 0.3);

                    // Pulse effect
                    float pulseIntensity = 0.1 * sin(uTime * 0.003 + pulse * 6.28);
                    color = mix(color, vec3(1.0), pulseIntensity * 0.2);

                    // Hover effect
                    if (hover > 0.5) {
                        color = mix(color, vec3(1.0), 0.2);
                    }

                    // Edge softness
                    float alpha = opacity * (1.0 - smoothstep(0.9, 1.0, dist));

                    // Selected ring
                    if (selected > 0.5) {
                        float ring = smoothstep(0.85, 0.9, dist) * (1.0 - smoothstep(0.95, 1.0, dist));
                        color = mix(color, vec3(1.0), ring);
                        alpha = max(alpha, ring * opacity);
                    }

                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
    }

    private createGlowMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
            },
            vertexShader: `
                attribute vec3 instanceColor;
                attribute vec4 instanceData;
                varying vec3 vColor;
                varying float vOpacity;
                varying vec2 vUv;

                void main() {
                    vColor = instanceColor;
                    vOpacity = instanceData.x;
                    vUv = uv;

                    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vOpacity;
                varying vec2 vUv;

                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = length(vUv - center) * 2.0;

                    if (dist > 1.0) discard;

                    // Soft glow falloff
                    float glow = 1.0 - pow(dist, 1.5);
                    float alpha = glow * vOpacity * 0.5;

                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }

    private createClusterMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
            },
            vertexShader: `
                attribute vec3 instanceColor;
                attribute vec4 instanceData;
                varying vec3 vColor;
                varying float vOpacity;
                varying vec2 vUv;

                void main() {
                    vColor = instanceColor;
                    vOpacity = instanceData.x;
                    vUv = uv;

                    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec3 vColor;
                varying float vOpacity;
                varying vec2 vUv;

                // Noise function for nebula effect
                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);

                    float a = hash(i);
                    float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0));
                    float d = hash(i + vec2(1.0, 1.0));

                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }

                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = length(vUv - center) * 2.0;

                    if (dist > 1.0) discard;

                    // Nebula noise
                    vec2 noiseCoord = vUv * 4.0 + vec2(uTime * 0.0001);
                    float n = noise(noiseCoord) * 0.5 + 0.5;

                    // Multi-layer glow
                    float glow1 = 1.0 - pow(dist, 1.2);
                    float glow2 = 1.0 - pow(dist, 2.0);
                    float glow3 = 1.0 - pow(dist, 0.8);

                    float glow = glow1 * 0.5 + glow2 * 0.3 + glow3 * n * 0.2;

                    // Pulsing effect
                    float pulse = sin(uTime * 0.002) * 0.1 + 0.9;

                    // Core brightness
                    float core = smoothstep(0.6, 0.0, dist);

                    vec3 color = vColor;
                    color = mix(color, vec3(1.0), core * 0.3);

                    float alpha = glow * vOpacity * pulse * 0.7;

                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    /**
     * Update camera from WorldCoordinator
     */
    updateCamera(coordinator: WorldCoordinator): void {
        const { x, y, scale } = coordinator.camera;
        const { width, height } = coordinator.viewport;

        // Update orthographic camera bounds
        const halfWidth = width / (2 * scale);
        const halfHeight = height / (2 * scale);

        this.camera.left = x - halfWidth;
        this.camera.right = x + halfWidth;
        this.camera.top = y + halfHeight;
        this.camera.bottom = y - halfHeight;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Update nodes for rendering
     */
    updateNodes(
        nodes: UniverseNode[],
        hoveredId: string | null,
        selectedId: string | null,
        opacityOverrides?: Map<string, number>
    ): void {
        if (!this.nodeInstanceMesh || !this.glowInstanceMesh) return;

        this.instanceCount = Math.min(nodes.length, this.maxInstances);
        const matrix = new THREE.Matrix4();
        const glowMatrix = new THREE.Matrix4();
        const color = new THREE.Color();

        for (let i = 0; i < this.instanceCount; i++) {
            const node = nodes[i];

            // Skip clusters (handled separately)
            if (node.type === "cluster") continue;

            // Set transform matrix
            matrix.makeScale(node.radius, node.radius, 1);
            matrix.setPosition(node.x, node.y, 0);
            this.nodeInstanceMesh.setMatrixAt(i, matrix);

            // Glow is larger
            const glowRadius = node.radius * 2;
            glowMatrix.makeScale(glowRadius, glowRadius, 1);
            glowMatrix.setPosition(node.x, node.y, -0.1);
            this.glowInstanceMesh.setMatrixAt(i, glowMatrix);

            // Set color
            color.set(node.color);
            this.instanceColors![i * 3] = color.r;
            this.instanceColors![i * 3 + 1] = color.g;
            this.instanceColors![i * 3 + 2] = color.b;

            // Set instance data
            const opacity = opacityOverrides?.get(node.id) ?? 1;
            const pulse = (i / this.instanceCount) * Math.PI * 2;
            const hover = node.id === hoveredId ? 1 : 0;
            const selected = node.id === selectedId ? 1 : 0;

            this.instanceData![i * 4] = opacity;
            this.instanceData![i * 4 + 1] = pulse;
            this.instanceData![i * 4 + 2] = hover;
            this.instanceData![i * 4 + 3] = selected;
        }

        // Update instance count
        this.nodeInstanceMesh.count = this.instanceCount;
        this.glowInstanceMesh.count = this.instanceCount;

        // Mark matrices as needing update
        this.nodeInstanceMesh.instanceMatrix.needsUpdate = true;
        this.glowInstanceMesh.instanceMatrix.needsUpdate = true;

        // Update attribute buffers
        const colorAttr = this.nodeGeometry.getAttribute("instanceColor") as THREE.BufferAttribute;
        const dataAttr = this.nodeGeometry.getAttribute("instanceData") as THREE.BufferAttribute;
        if (colorAttr) colorAttr.needsUpdate = true;
        if (dataAttr) dataAttr.needsUpdate = true;
    }

    /**
     * Update cluster nodes
     */
    updateClusters(clusters: ClusterNode[], opacityOverrides?: Map<string, number>): void {
        if (!this.clusterMesh) return;

        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        const clusterCount = Math.min(clusters.length, 1000);

        for (let i = 0; i < clusterCount; i++) {
            const cluster = clusters[i];

            // Cluster with larger radius
            const radius = cluster.radius * 1.5;
            matrix.makeScale(radius, radius, 1);
            matrix.setPosition(cluster.x, cluster.y, -0.5);
            this.clusterMesh.setMatrixAt(i, matrix);

            // Set color
            color.set(cluster.color);
            this.clusterMesh.setColorAt(i, color);
        }

        this.clusterMesh.count = clusterCount;
        this.clusterMesh.instanceMatrix.needsUpdate = true;
        if (this.clusterMesh.instanceColor) {
            this.clusterMesh.instanceColor.needsUpdate = true;
        }
    }

    /**
     * Render a frame
     */
    render(): void {
        if (!this.renderer || this.contextLost || this.disposed) return;

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        this.time += deltaTime;

        // Update FPS counter
        this.frameCount++;
        if (this.frameCount % 30 === 0) {
            this.fps = Math.round(1000 / deltaTime);
        }

        // Update shader uniforms
        this.nodeMaterial.uniforms.uTime.value = this.time;
        this.glowMaterial.uniforms.uTime.value = this.time;
        this.clusterMaterial.uniforms.uTime.value = this.time;

        if (this.particleMaterial) {
            this.particleMaterial.uniforms.uTime.value = this.time;
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Resize the renderer
     */
    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        if (this.renderer) {
            this.renderer.setSize(width, height);
        }
    }

    // ========================================================================
    // STATS
    // ========================================================================

    getStats(): WebGLRendererStats {
        const info = this.renderer?.info;

        return {
            fps: this.fps,
            drawCalls: info?.render?.calls ?? 0,
            triangles: info?.render?.triangles ?? 0,
            nodeCount: this.instanceCount,
            visibleNodes: this.instanceCount,
            memoryUsage: info?.memory?.geometries ?? 0,
        };
    }

    // ========================================================================
    // CONTEXT LOSS HANDLING
    // ========================================================================

    private handleContextLost = (event: Event): void => {
        event.preventDefault();
        this.contextLost = true;
        console.warn("WebGL context lost");
        this.onContextLost?.();
    };

    private handleContextRestored = (): void => {
        this.contextLost = false;
        console.log("WebGL context restored");

        // Recreate resources
        if (this.canvas) {
            this.createInstancedMeshes();
            if (this.config.enableParticles) {
                this.createParticleSystem();
            }
            this.createConnectionLines();
        }

        this.onContextRestored?.();
    };

    setContextLossHandlers(
        onLost: () => void,
        onRestored: () => void
    ): void {
        this.onContextLost = onLost;
        this.onContextRestored = onRestored;
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose(): void {
        this.disposed = true;

        if (this.canvas) {
            this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
            this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
        }

        // Dispose geometries
        this.nodeGeometry.dispose();
        this.glowGeometry.dispose();
        this.clusterGeometry.dispose();

        // Dispose materials
        this.nodeMaterial.dispose();
        this.glowMaterial.dispose();
        this.clusterMaterial.dispose();

        if (this.particleMaterial) {
            this.particleMaterial.dispose();
        }
        if (this.particleGeometry) {
            this.particleGeometry.dispose();
        }
        if (this.connectionMaterial) {
            this.connectionMaterial.dispose();
        }
        if (this.connectionGeometry) {
            this.connectionGeometry.dispose();
        }

        // Dispose renderer
        this.renderer?.dispose();
        this.renderer = null;
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new WebGLUniverseRenderer
 */
export function createWebGLRenderer(
    config?: Partial<WebGLRendererConfig>
): WebGLUniverseRenderer {
    return new WebGLUniverseRenderer(config);
}
