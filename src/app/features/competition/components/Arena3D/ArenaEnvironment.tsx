"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group, Color } from "three";

interface ArenaEnvironmentProps {
    ambientIntensity?: number;
    showGrid?: boolean;
}

// Stadium floor with grid pattern
const StadiumFloor: React.FC = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 5]} receiveShadow>
            <circleGeometry args={[50, 64]} />
            <meshStandardMaterial
                color="#141416"
                metalness={0.3}
                roughness={0.8}
            />
        </mesh>
    );
};

// Arena walls with tiered seating
const StadiumWalls: React.FC = () => {
    const tiers = useMemo(() => {
        const result = [];
        for (let i = 0; i < 5; i++) {
            const radius = 30 + i * 8;
            const height = i * 3;
            result.push({ radius, height, segments: 32 + i * 8 });
        }
        return result;
    }, []);

    return (
        <group>
            {tiers.map((tier, index) => (
                <mesh
                    key={index}
                    position={[0, tier.height + 1, 5]}
                    receiveShadow
                >
                    <torusGeometry args={[tier.radius, 0.5, 8, tier.segments, Math.PI]} />
                    <meshStandardMaterial
                        color={index % 2 === 0 ? "#1C1C1F" : "#252528"}
                        metalness={0.2}
                        roughness={0.9}
                    />
                </mesh>
            ))}
        </group>
    );
};

// Floating ember particles
const EmberParticles: React.FC = () => {
    const particlesRef = useRef<Group>(null);

    const particles = useMemo(() => {
        const result = [];
        for (let i = 0; i < 50; i++) {
            result.push({
                position: [
                    (Math.random() - 0.5) * 40,
                    Math.random() * 20,
                    (Math.random() - 0.5) * 40 + 5,
                ] as [number, number, number],
                scale: Math.random() * 0.1 + 0.05,
                speed: Math.random() * 0.5 + 0.2,
                offset: Math.random() * Math.PI * 2,
            });
        }
        return result;
    }, []);

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.children.forEach((child, i) => {
                const particle = particles[i];
                const mesh = child as Mesh;
                mesh.position.y = particle.position[1] + Math.sin(state.clock.elapsedTime * particle.speed + particle.offset) * 2;
                mesh.rotation.y = state.clock.elapsedTime * particle.speed;
            });
        }
    });

    return (
        <group ref={particlesRef}>
            {particles.map((particle, i) => (
                <mesh key={i} position={particle.position} scale={particle.scale}>
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshBasicMaterial color="#F97316" transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
};

// Atmospheric fog lights
const AtmosphericLights: React.FC = () => {
    const lightRef = useRef<Group>(null);

    useFrame((state) => {
        if (lightRef.current) {
            lightRef.current.rotation.y = state.clock.elapsedTime * 0.1;
        }
    });

    return (
        <group ref={lightRef}>
            {/* Main spotlight on podium */}
            <spotLight
                position={[0, 25, -5]}
                angle={0.4}
                penumbra={0.5}
                intensity={2}
                color="#FBBF24"
                castShadow
                shadow-mapSize={[2048, 2048]}
            />

            {/* Side accent lights */}
            <spotLight
                position={[-15, 15, 10]}
                angle={0.6}
                penumbra={0.8}
                intensity={1}
                color="#F97316"
            />
            <spotLight
                position={[15, 15, 10]}
                angle={0.6}
                penumbra={0.8}
                intensity={1}
                color="#C2410C"
            />

            {/* Rim lights */}
            <pointLight position={[0, 5, -15]} intensity={0.5} color="#60A5FA" />
        </group>
    );
};

// Championship arena banner
const ArenaBanner: React.FC = () => {
    return (
        <group position={[0, 18, -10]}>
            {/* Banner frame */}
            <mesh>
                <boxGeometry args={[20, 4, 0.5]} />
                <meshStandardMaterial color="#1C1C1F" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Glow behind banner */}
            <mesh position={[0, 0, -0.5]}>
                <planeGeometry args={[22, 5]} />
                <meshBasicMaterial color="#F97316" transparent opacity={0.3} />
            </mesh>
        </group>
    );
};

// Main environment component
export const ArenaEnvironment: React.FC<ArenaEnvironmentProps> = ({
    ambientIntensity = 0.3,
    showGrid = true,
}) => {
    return (
        <group>
            {/* Lighting */}
            <ambientLight intensity={ambientIntensity} />
            <AtmosphericLights />

            {/* Environment elements */}
            <StadiumFloor />
            <StadiumWalls />
            <EmberParticles />
            <ArenaBanner />

            {/* Fog for atmosphere */}
            <fog attach="fog" args={["#09090A", 30, 80]} />
        </group>
    );
};

export default ArenaEnvironment;
