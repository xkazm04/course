/**
 * Particle Engine
 *
 * GPU-accelerated particle system for ambient visual effects in the Knowledge Universe.
 * Creates immersive cosmic atmosphere with floating embers, sparkles, and dust.
 *
 * Features:
 * - GPU-based particle simulation
 * - Multiple particle types (embers, sparkles, dust)
 * - Parallax movement for depth
 * - Automatic respawning
 * - Memory-efficient buffer management
 */

import * as THREE from "three";
import type { WorldCoordinator } from "./worldCoordinator";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Particle type
 */
export type ParticleType = "ember" | "sparkle" | "dust";

/**
 * Particle configuration
 */
export interface ParticleConfig {
    type: ParticleType;
    count: number;
    sizeRange: { min: number; max: number };
    speedRange: { min: number; max: number };
    color: THREE.Color;
    colorVariance: number;
    alphaRange: { min: number; max: number };
    twinkleSpeed: number;
    parallaxFactor: number;
    lifespan: number; // In seconds, 0 = infinite
    spawnRadius: number;
}

/**
 * Particle data for a single particle
 */
export interface ParticleData {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    size: number;
    alpha: number;
    phase: number;
    life: number;
    maxLife: number;
}

/**
 * Particle system statistics
 */
export interface ParticleStats {
    totalParticles: number;
    activeParticles: number;
    respawnedThisFrame: number;
    memoryUsage: number;
}

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

export const PARTICLE_PRESETS: Record<ParticleType, ParticleConfig> = {
    ember: {
        type: "ember",
        count: 500,
        sizeRange: { min: 1.5, max: 3 },
        speedRange: { min: 0.5, max: 2 },
        color: new THREE.Color(0xc2410c), // Ember orange
        colorVariance: 0.1,
        alphaRange: { min: 0.2, max: 0.5 },
        twinkleSpeed: 0.002,
        parallaxFactor: 0.15,
        lifespan: 0, // Infinite
        spawnRadius: 2500,
    },
    sparkle: {
        type: "sparkle",
        count: 300,
        sizeRange: { min: 0.5, max: 1.5 },
        speedRange: { min: 0.2, max: 1 },
        color: new THREE.Color(0xd4a853), // Gold
        colorVariance: 0.15,
        alphaRange: { min: 0.3, max: 0.8 },
        twinkleSpeed: 0.005,
        parallaxFactor: 0.08,
        lifespan: 0,
        spawnRadius: 2000,
    },
    dust: {
        type: "dust",
        count: 200,
        sizeRange: { min: 0.3, max: 0.8 },
        speedRange: { min: 0.1, max: 0.5 },
        color: new THREE.Color(0x888888), // Gray
        colorVariance: 0.2,
        alphaRange: { min: 0.1, max: 0.3 },
        twinkleSpeed: 0.001,
        parallaxFactor: 0.05,
        lifespan: 0,
        spawnRadius: 3000,
    },
};

// ============================================================================
// PARTICLE ENGINE CLASS
// ============================================================================

/**
 * ParticleEngine - GPU-accelerated particle system
 */
export class ParticleEngine {
    private systems: Map<ParticleType, ParticleSystem> = new Map();
    private cameraPosition: THREE.Vector2 = new THREE.Vector2(0, 0);
    private time: number = 0;
    private disposed: boolean = false;

    constructor() {}

    // ========================================================================
    // SYSTEM MANAGEMENT
    // ========================================================================

    /**
     * Add a particle system
     */
    addSystem(config: ParticleConfig): ParticleSystem {
        const system = new ParticleSystem(config);
        this.systems.set(config.type, system);
        return system;
    }

    /**
     * Add preset particle system
     */
    addPreset(type: ParticleType): ParticleSystem {
        return this.addSystem(PARTICLE_PRESETS[type]);
    }

    /**
     * Get a particle system
     */
    getSystem(type: ParticleType): ParticleSystem | undefined {
        return this.systems.get(type);
    }

    /**
     * Remove a particle system
     */
    removeSystem(type: ParticleType): void {
        const system = this.systems.get(type);
        if (system) {
            system.dispose();
            this.systems.delete(type);
        }
    }

    /**
     * Initialize default systems
     */
    initializeDefaults(): void {
        this.addPreset("ember");
        this.addPreset("sparkle");
        this.addPreset("dust");
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    /**
     * Update all particle systems
     */
    update(deltaTime: number, coordinator: WorldCoordinator): void {
        if (this.disposed) return;

        this.time += deltaTime;

        // Update camera position for parallax
        this.cameraPosition.set(coordinator.camera.x, coordinator.camera.y);

        for (const [, system] of this.systems) {
            system.update(deltaTime, this.time, this.cameraPosition);
        }
    }

    /**
     * Update shader uniforms
     */
    updateUniforms(): void {
        for (const [, system] of this.systems) {
            system.updateUniforms(this.time, this.cameraPosition);
        }
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    /**
     * Get all particle meshes for adding to scene
     */
    getMeshes(): THREE.Points[] {
        const meshes: THREE.Points[] = [];
        for (const [, system] of this.systems) {
            if (system.mesh) {
                meshes.push(system.mesh);
            }
        }
        return meshes;
    }

    /**
     * Add all systems to a scene
     */
    addToScene(scene: THREE.Scene): void {
        for (const mesh of this.getMeshes()) {
            scene.add(mesh);
        }
    }

    /**
     * Remove all systems from a scene
     */
    removeFromScene(scene: THREE.Scene): void {
        for (const mesh of this.getMeshes()) {
            scene.remove(mesh);
        }
    }

    // ========================================================================
    // STATS
    // ========================================================================

    /**
     * Get combined statistics
     */
    getStats(): ParticleStats {
        let totalParticles = 0;
        let activeParticles = 0;
        let respawnedThisFrame = 0;
        let memoryUsage = 0;

        for (const [, system] of this.systems) {
            const stats = system.getStats();
            totalParticles += stats.totalParticles;
            activeParticles += stats.activeParticles;
            respawnedThisFrame += stats.respawnedThisFrame;
            memoryUsage += stats.memoryUsage;
        }

        return {
            totalParticles,
            activeParticles,
            respawnedThisFrame,
            memoryUsage,
        };
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Dispose all systems
     */
    dispose(): void {
        this.disposed = true;
        for (const [, system] of this.systems) {
            system.dispose();
        }
        this.systems.clear();
    }
}

// ============================================================================
// PARTICLE SYSTEM CLASS
// ============================================================================

/**
 * ParticleSystem - Individual particle system
 */
class ParticleSystem {
    private config: ParticleConfig;
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;
    public mesh: THREE.Points;

    // Buffers
    private positions: Float32Array;
    private velocities: Float32Array;
    private colors: Float32Array;
    private sizes: Float32Array;
    private phases: Float32Array;
    private lives: Float32Array;

    // Stats
    private respawnedThisFrame: number = 0;

    constructor(config: ParticleConfig) {
        this.config = config;

        // Allocate buffers
        this.positions = new Float32Array(config.count * 3);
        this.velocities = new Float32Array(config.count * 3);
        this.colors = new Float32Array(config.count * 3);
        this.sizes = new Float32Array(config.count);
        this.phases = new Float32Array(config.count);
        this.lives = new Float32Array(config.count);

        // Initialize particles
        this.initializeParticles();

        // Create geometry
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute("size", new THREE.BufferAttribute(this.sizes, 1));
        this.geometry.setAttribute("phase", new THREE.BufferAttribute(this.phases, 1));

        // Create material
        this.material = this.createMaterial();

        // Create mesh
        this.mesh = new THREE.Points(this.geometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = -10; // Render behind everything
    }

    private initializeParticles(): void {
        const { count, spawnRadius, sizeRange, color, colorVariance } = this.config;

        for (let i = 0; i < count; i++) {
            // Random position within spawn radius
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * spawnRadius;
            this.positions[i * 3] = Math.cos(angle) * radius;
            this.positions[i * 3 + 1] = Math.sin(angle) * radius;
            this.positions[i * 3 + 2] = -10 - Math.random() * 50; // Behind nodes

            // Random velocity (slow drift)
            const speed = this.config.speedRange.min +
                Math.random() * (this.config.speedRange.max - this.config.speedRange.min);
            const velAngle = Math.random() * Math.PI * 2;
            this.velocities[i * 3] = Math.cos(velAngle) * speed;
            this.velocities[i * 3 + 1] = Math.sin(velAngle) * speed;
            this.velocities[i * 3 + 2] = 0;

            // Random color variation
            const variance = (Math.random() - 0.5) * colorVariance;
            this.colors[i * 3] = Math.max(0, Math.min(1, color.r + variance));
            this.colors[i * 3 + 1] = Math.max(0, Math.min(1, color.g + variance));
            this.colors[i * 3 + 2] = Math.max(0, Math.min(1, color.b + variance));

            // Random size
            this.sizes[i] = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);

            // Random phase for twinkle
            this.phases[i] = Math.random() * Math.PI * 2;

            // Infinite life for ambient particles
            this.lives[i] = this.config.lifespan > 0 ? this.config.lifespan : -1;
        }
    }

    private createMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uCameraOffset: { value: new THREE.Vector2(0, 0) },
                uParallaxFactor: { value: this.config.parallaxFactor },
                uTwinkleSpeed: { value: this.config.twinkleSpeed },
                uAlphaMin: { value: this.config.alphaRange.min },
                uAlphaMax: { value: this.config.alphaRange.max },
            },
            vertexShader: `
                attribute float size;
                attribute float phase;
                attribute vec3 color;

                uniform float uTime;
                uniform vec2 uCameraOffset;
                uniform float uParallaxFactor;
                uniform float uTwinkleSpeed;
                uniform float uAlphaMin;
                uniform float uAlphaMax;

                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    vColor = color;

                    // Twinkle effect
                    float twinkle = sin(uTime * uTwinkleSpeed + phase);
                    vAlpha = mix(uAlphaMin, uAlphaMax, twinkle * 0.5 + 0.5);

                    // Parallax offset
                    vec3 pos = position;
                    pos.xy -= uCameraOffset * uParallaxFactor;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_PointSize = clamp(gl_PointSize, 0.5, 12.0);

                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    // Circular falloff
                    float dist = length(gl_PointCoord - vec2(0.5)) * 2.0;
                    if (dist > 1.0) discard;

                    // Soft edge
                    float alpha = vAlpha * (1.0 - dist * dist);

                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }

    /**
     * Update particles
     */
    update(deltaTime: number, time: number, cameraPosition: THREE.Vector2): void {
        this.respawnedThisFrame = 0;
        const { count, spawnRadius, lifespan } = this.config;

        // Update positions based on velocity
        for (let i = 0; i < count; i++) {
            this.positions[i * 3] += this.velocities[i * 3] * deltaTime * 0.01;
            this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * deltaTime * 0.01;

            // Wrap particles that go too far from camera
            const dx = this.positions[i * 3] - cameraPosition.x;
            const dy = this.positions[i * 3 + 1] - cameraPosition.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > spawnRadius * 1.5) {
                // Respawn on opposite side
                const angle = Math.atan2(dy, dx) + Math.PI + (Math.random() - 0.5) * 0.5;
                const newRadius = spawnRadius * (0.8 + Math.random() * 0.4);
                this.positions[i * 3] = cameraPosition.x + Math.cos(angle) * newRadius;
                this.positions[i * 3 + 1] = cameraPosition.y + Math.sin(angle) * newRadius;
                this.respawnedThisFrame++;
            }

            // Update life if finite
            if (lifespan > 0) {
                this.lives[i] -= deltaTime * 0.001;
                if (this.lives[i] <= 0) {
                    this.respawnParticle(i, cameraPosition);
                }
            }
        }

        // Mark position buffer as needing update
        const posAttr = this.geometry.getAttribute("position") as THREE.BufferAttribute;
        posAttr.needsUpdate = true;
    }

    /**
     * Respawn a single particle
     */
    private respawnParticle(index: number, cameraPosition: THREE.Vector2): void {
        const { spawnRadius, sizeRange, speedRange } = this.config;

        // Random position around camera
        const angle = Math.random() * Math.PI * 2;
        const radius = spawnRadius * (0.5 + Math.random() * 0.5);
        this.positions[index * 3] = cameraPosition.x + Math.cos(angle) * radius;
        this.positions[index * 3 + 1] = cameraPosition.y + Math.sin(angle) * radius;

        // New velocity
        const speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
        const velAngle = Math.random() * Math.PI * 2;
        this.velocities[index * 3] = Math.cos(velAngle) * speed;
        this.velocities[index * 3 + 1] = Math.sin(velAngle) * speed;

        // Reset life
        this.lives[index] = this.config.lifespan;

        // New size
        this.sizes[index] = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
        const sizeAttr = this.geometry.getAttribute("size") as THREE.BufferAttribute;
        sizeAttr.needsUpdate = true;

        this.respawnedThisFrame++;
    }

    /**
     * Update shader uniforms
     */
    updateUniforms(time: number, cameraPosition: THREE.Vector2): void {
        this.material.uniforms.uTime.value = time;
        this.material.uniforms.uCameraOffset.value.set(cameraPosition.x, cameraPosition.y);
    }

    /**
     * Get statistics
     */
    getStats(): ParticleStats {
        return {
            totalParticles: this.config.count,
            activeParticles: this.config.count,
            respawnedThisFrame: this.respawnedThisFrame,
            memoryUsage:
                this.positions.byteLength +
                this.velocities.byteLength +
                this.colors.byteLength +
                this.sizes.byteLength +
                this.phases.byteLength +
                this.lives.byteLength,
        };
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new ParticleEngine
 */
export function createParticleEngine(): ParticleEngine {
    return new ParticleEngine();
}

/**
 * Create a particle engine with default systems
 */
export function createDefaultParticleEngine(): ParticleEngine {
    const engine = new ParticleEngine();
    engine.initializeDefaults();
    return engine;
}
