"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group, Color } from "three";
import { PODIUM_CONFIGS, PodiumConfig } from "../../lib/arenaTypes";

interface PodiumProps {
    config: PodiumConfig;
    showGlow?: boolean;
}

// Individual podium component
const Podium: React.FC<PodiumProps> = ({ config, showGlow = true }) => {
    const meshRef = useRef<Mesh>(null);
    const glowRef = useRef<Mesh>(null);

    useFrame((state) => {
        if (glowRef.current && showGlow) {
            const intensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            (glowRef.current.material as any).opacity = intensity;
        }
    });

    const podiumColor = useMemo(() => new Color(config.color), [config.color]);
    const glowColor = useMemo(() => new Color(config.glowColor), [config.glowColor]);

    return (
        <group position={[config.position.x, config.position.y, config.position.z]}>
            {/* Main podium cylinder */}
            <mesh ref={meshRef} castShadow receiveShadow>
                <cylinderGeometry args={[1.5, 2, config.height, 8]} />
                <meshStandardMaterial
                    color={podiumColor}
                    metalness={0.8}
                    roughness={0.2}
                    emissive={podiumColor}
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Top platform */}
            <mesh position={[0, config.height / 2 + 0.1, 0]} castShadow>
                <cylinderGeometry args={[1.8, 1.8, 0.2, 8]} />
                <meshStandardMaterial
                    color="#1C1C1F"
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Rank number on podium */}
            <mesh position={[0, 0, 2.1]} rotation={[0, 0, 0]}>
                <planeGeometry args={[1.5, 1.5]} />
                <meshBasicMaterial
                    color={podiumColor}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Glow ring at base */}
            {showGlow && (
                <mesh ref={glowRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[2, 3, 32]} />
                    <meshBasicMaterial
                        color={glowColor}
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}

            {/* Decorative pillars */}
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
                <mesh
                    key={i}
                    position={[
                        Math.cos(angle) * 2.5,
                        config.height / 4,
                        Math.sin(angle) * 2.5 + config.position.z,
                    ]}
                    castShadow
                >
                    <cylinderGeometry args={[0.1, 0.1, config.height / 2, 6]} />
                    <meshStandardMaterial
                        color={podiumColor}
                        metalness={0.9}
                        roughness={0.1}
                        emissive={podiumColor}
                        emissiveIntensity={0.1}
                    />
                </mesh>
            ))}
        </group>
    );
};

// All three podiums together
export const Podiums: React.FC = () => {
    return (
        <group data-testid="arena-podiums">
            {PODIUM_CONFIGS.map((config) => (
                <Podium key={config.rank} config={config} />
            ))}
        </group>
    );
};

export default Podiums;
