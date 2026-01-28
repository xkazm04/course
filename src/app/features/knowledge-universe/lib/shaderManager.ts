/**
 * Shader Manager
 *
 * Manages GLSL shaders for the Knowledge Universe WebGL renderer.
 * Provides shader loading, compilation, caching, and hot-reloading.
 *
 * Features:
 * - Pre-compiled shader library for common effects
 * - Shader caching and reuse
 * - Uniform management
 * - Error handling with graceful fallbacks
 */

import * as THREE from "three";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Shader definition
 */
export interface ShaderDefinition {
    name: string;
    vertexShader: string;
    fragmentShader: string;
    uniforms: Record<string, THREE.IUniform>;
    blending?: THREE.Blending;
    transparent?: boolean;
    depthWrite?: boolean;
    side?: THREE.Side;
}

/**
 * Compiled shader
 */
export interface CompiledShader {
    material: THREE.ShaderMaterial;
    uniforms: Record<string, THREE.IUniform>;
    lastUpdate: number;
}

/**
 * Shader variant for different quality levels
 */
export type ShaderQuality = "high" | "medium" | "low";

// ============================================================================
// SHADER LIBRARY
// ============================================================================

/**
 * Built-in shader definitions
 */
export const SHADER_LIBRARY = {
    /**
     * Node shader - renders individual nodes with glow and pulse
     */
    node: {
        name: "node",
        vertexShader: `
            attribute vec3 instanceColor;
            attribute vec4 instanceData; // opacity, pulse, hover, selected

            varying vec3 vColor;
            varying vec4 vData;
            varying vec2 vUv;
            varying float vScreenRadius;

            uniform float uTime;
            uniform float uScale;

            void main() {
                vColor = instanceColor;
                vData = instanceData;
                vUv = uv;

                // Transform position
                vec4 worldPos = instanceMatrix * vec4(position, 1.0);
                vec4 mvPosition = modelViewMatrix * worldPos;

                // Calculate screen-space radius for LOD
                vScreenRadius = length((modelViewMatrix * instanceMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz) * uScale;

                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uBloomIntensity;

            varying vec3 vColor;
            varying vec4 vData; // opacity, pulse, hover, selected
            varying vec2 vUv;
            varying float vScreenRadius;

            void main() {
                float opacity = vData.x;
                float pulse = vData.y;
                float hover = vData.z;
                float selected = vData.w;

                // Calculate distance from center
                vec2 center = vec2(0.5, 0.5);
                float dist = length(vUv - center) * 2.0;

                // Discard pixels outside circle
                if (dist > 1.0) discard;

                // LOD: simplify rendering for small nodes
                bool simplifiedRender = vScreenRadius < 10.0;

                // Base color
                vec3 color = vColor;

                if (!simplifiedRender) {
                    // Inner shine gradient
                    float shine = 1.0 - smoothstep(0.0, 0.6, dist);
                    color = mix(color, vec3(1.0), shine * 0.35);

                    // Pulse effect
                    float pulseIntensity = 0.15 * sin(uTime * 0.003 + pulse * 6.28318);
                    color = mix(color, vec3(1.0), pulseIntensity * uBloomIntensity);

                    // Hover brightening
                    if (hover > 0.5) {
                        color = mix(color, vec3(1.0), 0.25);
                    }
                }

                // Edge softness (anti-aliasing)
                float edgeWidth = simplifiedRender ? 0.15 : 0.08;
                float alpha = opacity * (1.0 - smoothstep(1.0 - edgeWidth, 1.0, dist));

                // Selection ring
                if (selected > 0.5 && !simplifiedRender) {
                    float ringInner = 0.82;
                    float ringOuter = 0.95;
                    float ring = smoothstep(ringInner, ringInner + 0.02, dist) *
                                 (1.0 - smoothstep(ringOuter - 0.02, ringOuter, dist));
                    color = mix(color, vec3(1.0), ring * 0.8);
                    alpha = max(alpha, ring * opacity * 0.9);
                }

                gl_FragColor = vec4(color, alpha);
            }
        `,
        uniforms: {
            uTime: { value: 0 },
            uScale: { value: 1 },
            uBloomIntensity: { value: 0.8 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
    },

    /**
     * Glow shader - renders outer glow for nodes
     */
    glow: {
        name: "glow",
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
            uniform float uGlowIntensity;

            varying vec3 vColor;
            varying float vOpacity;
            varying vec2 vUv;

            void main() {
                vec2 center = vec2(0.5, 0.5);
                float dist = length(vUv - center) * 2.0;

                if (dist > 1.0) discard;

                // Soft exponential falloff
                float glow = exp(-dist * 2.0) * uGlowIntensity;

                // Slight pulse
                float pulse = 0.95 + 0.05 * sin(uTime * 0.002);

                float alpha = glow * vOpacity * pulse * 0.6;

                gl_FragColor = vec4(vColor, alpha);
            }
        `,
        uniforms: {
            uTime: { value: 0 },
            uGlowIntensity: { value: 1.0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    },

    /**
     * Cluster shader - renders nebula-like cluster visualization
     */
    cluster: {
        name: "cluster",
        vertexShader: `
            attribute vec3 instanceColor;
            attribute vec4 instanceData;

            varying vec3 vColor;
            varying float vOpacity;
            varying vec2 vUv;
            varying vec2 vWorldPos;

            void main() {
                vColor = instanceColor;
                vOpacity = instanceData.x;
                vUv = uv;

                vec4 worldPos = instanceMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xy;

                vec4 mvPosition = modelViewMatrix * worldPos;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;

            varying vec3 vColor;
            varying float vOpacity;
            varying vec2 vUv;
            varying vec2 vWorldPos;

            // Simplex noise for nebula effect
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                   -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
                vec2 x0 = v - i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                                        + i.x + vec3(0.0, i1.x, 1.0));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                        dot(x12.zw,x12.zw)), 0.0);
                m = m*m; m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 center = vec2(0.5, 0.5);
                float dist = length(vUv - center) * 2.0;

                if (dist > 1.0) discard;

                // Multi-octave noise for nebula
                float t = uTime * 0.0001;
                vec2 noiseCoord = vWorldPos * 0.01;
                float n1 = snoise(noiseCoord + vec2(t, 0.0)) * 0.5 + 0.5;
                float n2 = snoise(noiseCoord * 2.0 + vec2(0.0, t)) * 0.25 + 0.25;
                float n3 = snoise(noiseCoord * 4.0 - vec2(t * 0.5)) * 0.125 + 0.125;
                float noise = n1 + n2 + n3;

                // Multi-layer glow
                float glow1 = 1.0 - pow(dist, 1.0);
                float glow2 = 1.0 - pow(dist, 2.0);
                float glow3 = 1.0 - pow(dist, 0.6);

                float glow = glow1 * 0.4 + glow2 * 0.3 + glow3 * noise * 0.3;

                // Pulse
                float pulse = sin(uTime * 0.002) * 0.1 + 0.95;

                // Core brightness
                float core = smoothstep(0.5, 0.0, dist);

                vec3 color = vColor;
                color = mix(color, vec3(1.0), core * 0.35);

                // Particle sparkles
                float sparkle = step(0.97, snoise(vWorldPos * 0.1 + uTime * 0.001)) * core;
                color = mix(color, vec3(1.0), sparkle);

                float alpha = glow * vOpacity * pulse * 0.7;

                gl_FragColor = vec4(color, alpha);
            }
        `,
        uniforms: {
            uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    },

    /**
     * Connection shader - renders curved lines between nodes
     */
    connection: {
        name: "connection",
        vertexShader: `
            attribute vec3 color;
            attribute float alpha;

            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                vColor = color;
                vAlpha = alpha;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uScale;

            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                // Fade at low zoom
                float scaleFade = smoothstep(0.1, 0.3, uScale);
                float alpha = vAlpha * scaleFade * 0.4;

                gl_FragColor = vec4(vColor, alpha);
            }
        `,
        uniforms: {
            uTime: { value: 0 },
            uScale: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
    },

    /**
     * Particle shader - ambient background particles
     */
    particle: {
        name: "particle",
        vertexShader: `
            attribute float size;
            attribute float phase;
            attribute vec3 color;

            varying vec3 vColor;
            varying float vAlpha;

            uniform float uTime;
            uniform float uScale;
            uniform vec2 uCameraOffset;

            void main() {
                vColor = color;

                // Twinkle effect
                vAlpha = 0.25 + 0.15 * sin(uTime * 0.001 + phase);

                // Parallax movement
                vec3 pos = position;
                pos.xy -= uCameraOffset * 0.1;

                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * uScale * (200.0 / -mvPosition.z);
                gl_PointSize = clamp(gl_PointSize, 0.5, 10.0);

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

                float alpha = vAlpha * (1.0 - dist * dist);

                gl_FragColor = vec4(vColor, alpha);
            }
        `,
        uniforms: {
            uTime: { value: 0 },
            uScale: { value: 1 },
            uCameraOffset: { value: new THREE.Vector2(0, 0) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    },

    /**
     * Post-processing bloom shader
     */
    bloom: {
        name: "bloom",
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uBloomStrength;
            uniform float uBloomRadius;
            uniform vec2 uResolution;

            varying vec2 vUv;

            void main() {
                vec4 color = texture2D(tDiffuse, vUv);

                // 9-tap Gaussian blur
                vec2 texelSize = 1.0 / uResolution;
                vec4 blur = vec4(0.0);

                float weights[5];
                weights[0] = 0.227027;
                weights[1] = 0.1945946;
                weights[2] = 0.1216216;
                weights[3] = 0.054054;
                weights[4] = 0.016216;

                for (int i = -4; i <= 4; i++) {
                    for (int j = -4; j <= 4; j++) {
                        vec2 offset = vec2(float(i), float(j)) * texelSize * uBloomRadius;
                        float weight = weights[abs(i)] * weights[abs(j)];
                        blur += texture2D(tDiffuse, vUv + offset) * weight;
                    }
                }

                // Blend bloom with original
                gl_FragColor = color + blur * uBloomStrength;
            }
        `,
        uniforms: {
            tDiffuse: { value: null },
            uBloomStrength: { value: 0.5 },
            uBloomRadius: { value: 2.0 },
            uResolution: { value: new THREE.Vector2(1, 1) },
        },
        transparent: false,
        depthWrite: false,
    },
} as const;

// ============================================================================
// SHADER MANAGER CLASS
// ============================================================================

/**
 * ShaderManager - Manages shader compilation and caching
 */
export class ShaderManager {
    private compiledShaders: Map<string, CompiledShader> = new Map();
    private quality: ShaderQuality = "high";

    constructor(quality: ShaderQuality = "high") {
        this.quality = quality;
    }

    // ========================================================================
    // SHADER COMPILATION
    // ========================================================================

    /**
     * Get or compile a shader from the library
     */
    getShader(name: keyof typeof SHADER_LIBRARY): THREE.ShaderMaterial {
        // Check cache
        const cached = this.compiledShaders.get(name);
        if (cached) {
            return cached.material;
        }

        // Compile new shader
        const definition = SHADER_LIBRARY[name];
        const material = this.compileShader(definition);

        // Cache
        this.compiledShaders.set(name, {
            material,
            uniforms: material.uniforms,
            lastUpdate: Date.now(),
        });

        return material;
    }

    /**
     * Compile a shader definition
     */
    compileShader(definition: ShaderDefinition): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            vertexShader: this.processShader(definition.vertexShader),
            fragmentShader: this.processShader(definition.fragmentShader),
            uniforms: { ...definition.uniforms },
            transparent: definition.transparent ?? true,
            depthWrite: definition.depthWrite ?? false,
            blending: definition.blending ?? THREE.NormalBlending,
            side: definition.side ?? THREE.FrontSide,
        });
    }

    /**
     * Process shader source (add precision, quality adjustments)
     */
    private processShader(source: string): string {
        // Add precision declaration if not present
        if (!source.includes("precision")) {
            const precision = this.quality === "high" ? "highp" : "mediump";
            source = `precision ${precision} float;\n` + source;
        }

        return source;
    }

    // ========================================================================
    // UNIFORM MANAGEMENT
    // ========================================================================

    /**
     * Update a uniform value
     */
    updateUniform(shaderName: string, uniformName: string, value: any): void {
        const cached = this.compiledShaders.get(shaderName);
        if (cached && cached.uniforms[uniformName]) {
            cached.uniforms[uniformName].value = value;
        }
    }

    /**
     * Update time uniform across all shaders
     */
    updateTime(time: number): void {
        for (const [, cached] of this.compiledShaders) {
            if (cached.uniforms.uTime) {
                cached.uniforms.uTime.value = time;
            }
        }
    }

    /**
     * Update scale uniform across all shaders
     */
    updateScale(scale: number): void {
        for (const [, cached] of this.compiledShaders) {
            if (cached.uniforms.uScale) {
                cached.uniforms.uScale.value = scale;
            }
        }
    }

    // ========================================================================
    // QUALITY MANAGEMENT
    // ========================================================================

    /**
     * Set shader quality level
     */
    setQuality(quality: ShaderQuality): void {
        if (this.quality === quality) return;

        this.quality = quality;

        // Recompile all shaders at new quality
        const shaderNames = Array.from(this.compiledShaders.keys());
        this.compiledShaders.clear();

        for (const name of shaderNames) {
            this.getShader(name as keyof typeof SHADER_LIBRARY);
        }
    }

    /**
     * Get current quality level
     */
    getQuality(): ShaderQuality {
        return this.quality;
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Dispose all compiled shaders
     */
    dispose(): void {
        for (const [, cached] of this.compiledShaders) {
            cached.material.dispose();
        }
        this.compiledShaders.clear();
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new ShaderManager
 */
export function createShaderManager(quality?: ShaderQuality): ShaderManager {
    return new ShaderManager(quality);
}

/**
 * Get shader source from library
 */
export function getShaderSource(name: keyof typeof SHADER_LIBRARY): ShaderDefinition {
    return SHADER_LIBRARY[name];
}
