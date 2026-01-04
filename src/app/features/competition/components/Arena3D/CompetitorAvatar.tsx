"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group, Color, MeshStandardMaterial } from "three";
import { Float, Billboard, Text } from "@react-three/drei";
import {
    ArenaCompetitor,
    TierArmor,
    TIER_ARMOR_CONFIGS,
    ArenaPosition,
} from "../../lib/arenaTypes";
import { getTierConfig } from "../../lib/tierSystem";

interface CompetitorAvatarProps {
    competitor: ArenaCompetitor;
    isSelected?: boolean;
    onClick?: () => void;
}

// Particle system for aura effects
const AuraParticles: React.FC<{ color: string; type: TierArmor["particleEffect"] }> = ({
    color,
    type,
}) => {
    const particlesRef = useRef<Group>(null);

    const particles = useMemo(() => {
        const count = type === "cosmic" ? 30 : type === "lightning" ? 20 : 15;
        return Array.from({ length: count }, (_, i) => ({
            angle: (i / count) * Math.PI * 2,
            radius: 0.8 + Math.random() * 0.4,
            speed: 0.5 + Math.random() * 0.5,
            yOffset: Math.random() * 2,
        }));
    }, [type]);

    useFrame((state) => {
        if (!particlesRef.current) return;

        particlesRef.current.children.forEach((child, i) => {
            const particle = particles[i];
            const mesh = child as Mesh;
            const time = state.clock.elapsedTime;

            if (type === "sparks") {
                mesh.position.y = particle.yOffset + Math.sin(time * particle.speed + particle.angle) * 0.5;
                mesh.position.x = Math.cos(time * 0.5 + particle.angle) * particle.radius;
                mesh.position.z = Math.sin(time * 0.5 + particle.angle) * particle.radius;
            } else if (type === "flames") {
                mesh.position.y = particle.yOffset + (time * particle.speed) % 3;
                mesh.position.x = Math.cos(particle.angle) * particle.radius + Math.sin(time * 2) * 0.1;
                mesh.position.z = Math.sin(particle.angle) * particle.radius;
                mesh.scale.setScalar(1 - (mesh.position.y / 3) * 0.5);
            } else if (type === "lightning") {
                mesh.position.y = particle.yOffset + Math.sin(time * 10 + particle.angle) * 0.3;
                mesh.position.x = Math.cos(particle.angle) * particle.radius;
                mesh.position.z = Math.sin(particle.angle) * particle.radius;
                (mesh.material as MeshStandardMaterial).opacity = Math.random() > 0.5 ? 0.8 : 0.3;
            } else if (type === "cosmic") {
                const orbitTime = time * particle.speed;
                mesh.position.y = particle.yOffset + Math.sin(orbitTime * 2) * 1;
                mesh.position.x = Math.cos(orbitTime + particle.angle) * (particle.radius + 0.5);
                mesh.position.z = Math.sin(orbitTime + particle.angle) * (particle.radius + 0.5);
            }
        });
    });

    if (type === "none") return null;

    return (
        <group ref={particlesRef}>
            {particles.map((_, i) => (
                <mesh key={i}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    );
};

// Helmet component based on tier
const Helmet: React.FC<{ type: string | null; color: string }> = ({ type, color }) => {
    if (!type) return null;

    const helmetColor = useMemo(() => new Color(color), [color]);

    switch (type) {
        case "basic":
            return (
                <mesh position={[0, 1.1, 0]}>
                    <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={helmetColor} metalness={0.7} roughness={0.3} />
                </mesh>
            );
        case "crowned":
            return (
                <group position={[0, 1.1, 0]}>
                    <mesh>
                        <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color={helmetColor} metalness={0.8} roughness={0.2} />
                    </mesh>
                    {/* Crown spikes */}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.25, 0.3, Math.sin((i / 5) * Math.PI * 2) * 0.25]}>
                            <coneGeometry args={[0.08, 0.2, 4]} />
                            <meshStandardMaterial color={helmetColor} metalness={0.9} roughness={0.1} emissive={helmetColor} emissiveIntensity={0.3} />
                        </mesh>
                    ))}
                </group>
            );
        case "visored":
            return (
                <group position={[0, 1.1, 0]}>
                    <mesh>
                        <sphereGeometry args={[0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                        <meshStandardMaterial color={helmetColor} metalness={0.85} roughness={0.15} />
                    </mesh>
                    {/* Visor */}
                    <mesh position={[0, -0.05, 0.25]}>
                        <boxGeometry args={[0.5, 0.15, 0.1]} />
                        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
                    </mesh>
                </group>
            );
        case "crystalline":
            return (
                <group position={[0, 1.1, 0]}>
                    <mesh>
                        <icosahedronGeometry args={[0.35, 0]} />
                        <meshStandardMaterial color={helmetColor} metalness={0.1} roughness={0.1} transparent opacity={0.8} />
                    </mesh>
                </group>
            );
        case "legendary":
            return (
                <group position={[0, 1.1, 0]}>
                    <mesh>
                        <sphereGeometry args={[0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                        <meshStandardMaterial color={helmetColor} metalness={0.9} roughness={0.1} emissive={helmetColor} emissiveIntensity={0.5} />
                    </mesh>
                    {/* Wing-like decorations */}
                    {[-1, 1].map((side) => (
                        <mesh key={side} position={[side * 0.45, 0.1, 0]} rotation={[0, 0, side * 0.5]}>
                            <coneGeometry args={[0.15, 0.4, 4]} />
                            <meshStandardMaterial color={helmetColor} metalness={0.9} roughness={0.1} emissive={helmetColor} emissiveIntensity={0.4} />
                        </mesh>
                    ))}
                </group>
            );
        default:
            return null;
    }
};

// Shoulder pads
const ShoulderPads: React.FC<{ color: string; material: TierArmor["materialType"] }> = ({
    color,
    material,
}) => {
    const padColor = useMemo(() => new Color(color), [color]);
    const isGlowing = material === "glowing" || material === "ethereal";

    return (
        <group>
            {[-1, 1].map((side) => (
                <mesh key={side} position={[side * 0.6, 0.6, 0]}>
                    <sphereGeometry args={[0.25, 16, 16, 0, Math.PI, 0, Math.PI]} />
                    <meshStandardMaterial
                        color={padColor}
                        metalness={material === "crystalline" ? 0.1 : 0.8}
                        roughness={material === "crystalline" ? 0.1 : 0.2}
                        transparent={material === "crystalline"}
                        opacity={material === "crystalline" ? 0.8 : 1}
                        emissive={isGlowing ? padColor : undefined}
                        emissiveIntensity={isGlowing ? 0.3 : 0}
                    />
                </mesh>
            ))}
        </group>
    );
};

// Cape component
const Cape: React.FC<{ color: string }> = ({ color }) => {
    const capeRef = useRef<Mesh>(null);
    const capeColor = useMemo(() => new Color(color), [color]);

    useFrame((state) => {
        if (capeRef.current) {
            capeRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.05 - 0.2;
        }
    });

    return (
        <mesh ref={capeRef} position={[0, 0.2, -0.4]} rotation={[-0.2, 0, 0]}>
            <planeGeometry args={[0.8, 1.2]} />
            <meshStandardMaterial
                color={capeColor}
                side={2}
                metalness={0.3}
                roughness={0.7}
            />
        </mesh>
    );
};

// Main avatar body
const AvatarBody: React.FC<{ tier: string; color: string; material: TierArmor["materialType"] }> = ({
    tier,
    color,
    material,
}) => {
    const bodyColor = useMemo(() => new Color(color), [color]);
    const isGlowing = material === "glowing" || material === "ethereal";

    return (
        <group>
            {/* Body */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <capsuleGeometry args={[0.35, 0.6, 8, 16]} />
                <meshStandardMaterial
                    color={material === "basic" ? "#4a4a4a" : bodyColor}
                    metalness={material === "metallic" ? 0.8 : 0.4}
                    roughness={material === "metallic" ? 0.2 : 0.6}
                    emissive={isGlowing ? bodyColor : undefined}
                    emissiveIntensity={isGlowing ? 0.2 : 0}
                />
            </mesh>

            {/* Head */}
            <mesh position={[0, 0.9, 0]} castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#e8d4b8" />
            </mesh>

            {/* Legs */}
            {[-0.15, 0.15].map((x, i) => (
                <mesh key={i} position={[x, -0.4, 0]} castShadow>
                    <capsuleGeometry args={[0.12, 0.4, 8, 8]} />
                    <meshStandardMaterial
                        color={material === "basic" ? "#3a3a3a" : bodyColor}
                        metalness={0.6}
                        roughness={0.4}
                    />
                </mesh>
            ))}
        </group>
    );
};

// Name tag floating above avatar
const NameTag: React.FC<{ name: string; rank: number; tier: string; isSelected: boolean }> = ({
    name,
    rank,
    tier,
    isSelected,
}) => {
    const tierConfig = getTierConfig(tier as any);

    return (
        <Billboard position={[0, 2, 0]} follow lockX={false} lockY={false} lockZ={false}>
            <group>
                {/* Background */}
                <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[1.8, 0.5]} />
                    <meshBasicMaterial
                        color={isSelected ? tierConfig.color : "#1C1C1F"}
                        transparent
                        opacity={0.9}
                    />
                </mesh>

                {/* Rank badge */}
                <mesh position={[-0.7, 0, 0]}>
                    <circleGeometry args={[0.15, 16]} />
                    <meshBasicMaterial color={tierConfig.color} />
                </mesh>

                {/* Text would use drei Text - simplified here */}
                <Text
                    position={[0.1, 0, 0]}
                    fontSize={0.15}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/inter-medium.woff"
                >
                    #{rank} @{name}
                </Text>
            </group>
        </Billboard>
    );
};

// Main competitor avatar component
export const CompetitorAvatar: React.FC<CompetitorAvatarProps> = ({
    competitor,
    isSelected = false,
    onClick,
}) => {
    const groupRef = useRef<Group>(null);
    const tierConfig = getTierConfig(competitor.tier);
    const armor = TIER_ARMOR_CONFIGS[competitor.tier];

    // Animation for climbing/descending
    useFrame((state) => {
        if (!groupRef.current) return;

        // Idle bobbing animation
        if (!competitor.isAnimating) {
            groupRef.current.position.y =
                competitor.position.y + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }

        // Selection highlight
        if (isSelected) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
        }
    });

    return (
        <group
            ref={groupRef}
            position={[competitor.position.x, competitor.position.y, competitor.position.z]}
            rotation={[0, (competitor.position.rotation * Math.PI) / 180, 0]}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            data-testid={`arena-competitor-${competitor.userId}`}
        >
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
                {/* Aura effect */}
                {armor.aura && (
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[1.2, 16, 16]} />
                        <meshBasicMaterial
                            color={armor.aura}
                            transparent
                            opacity={0.1}
                        />
                    </mesh>
                )}

                {/* Particle effects */}
                {armor.particleEffect !== "none" && (
                    <AuraParticles color={tierConfig.color} type={armor.particleEffect} />
                )}

                {/* Avatar body */}
                <AvatarBody tier={competitor.tier} color={tierConfig.color} material={armor.materialType} />

                {/* Helmet */}
                <Helmet type={armor.helmet} color={tierConfig.color} />

                {/* Shoulder pads */}
                {armor.shoulderPads && (
                    <ShoulderPads color={tierConfig.color} material={armor.materialType} />
                )}

                {/* Cape */}
                {armor.cape && <Cape color={tierConfig.color} />}

                {/* Name tag */}
                <NameTag
                    name={competitor.displayName}
                    rank={competitor.rank}
                    tier={competitor.tier}
                    isSelected={isSelected}
                />

                {/* Selection ring */}
                {isSelected && (
                    <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.8, 1, 32]} />
                        <meshBasicMaterial color={tierConfig.color} transparent opacity={0.5} />
                    </mesh>
                )}
            </Float>
        </group>
    );
};

export default CompetitorAvatar;
