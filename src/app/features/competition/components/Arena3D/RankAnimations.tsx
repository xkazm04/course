"use client";

import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3, CatmullRomCurve3 } from "three";
import { RankChangeAnimation, ArenaPosition } from "../../lib/arenaTypes";

interface RankAnimationProps {
    animation: RankChangeAnimation;
    children: React.ReactNode;
    onComplete?: () => void;
}

// Interpolate between two positions with easing
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Convert ArenaPosition to Vector3
function positionToVector3(pos: ArenaPosition): Vector3 {
    return new Vector3(pos.x, pos.y, pos.z);
}

// Generate a curved path for climbing animation
function generateClimbPath(from: ArenaPosition, to: ArenaPosition): CatmullRomCurve3 {
    const start = positionToVector3(from);
    const end = positionToVector3(to);
    const midHeight = Math.max(from.y, to.y) + 3;

    const mid1 = new Vector3(
        start.x + (end.x - start.x) * 0.25,
        midHeight * 0.6,
        start.z + (end.z - start.z) * 0.25
    );

    const mid2 = new Vector3(
        start.x + (end.x - start.x) * 0.75,
        midHeight,
        start.z + (end.z - start.z) * 0.75
    );

    return new CatmullRomCurve3([start, mid1, mid2, end], false, "catmullrom", 0.5);
}

// Generate entry path (descending from above)
function generateEntryPath(from: ArenaPosition, to: ArenaPosition): CatmullRomCurve3 {
    const start = positionToVector3(from);
    const end = positionToVector3(to);

    const mid = new Vector3(
        end.x + (Math.random() - 0.5) * 5,
        (start.y + end.y) / 2,
        end.z + (Math.random() - 0.5) * 5
    );

    return new CatmullRomCurve3([start, mid, end], false, "catmullrom", 0.5);
}

// Main animation wrapper component
export const RankAnimationWrapper: React.FC<RankAnimationProps> = ({
    animation,
    children,
    onComplete,
}) => {
    const groupRef = useRef<Group>(null);
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const pathRef = useRef<CatmullRomCurve3 | null>(null);

    // Generate path based on animation type
    useEffect(() => {
        switch (animation.type) {
            case "climb":
            case "celebrate":
                pathRef.current = generateClimbPath(animation.fromPosition, animation.toPosition);
                break;
            case "enter":
                pathRef.current = generateEntryPath(animation.fromPosition, animation.toPosition);
                break;
            case "descend":
            case "exit":
                pathRef.current = new CatmullRomCurve3([
                    positionToVector3(animation.fromPosition),
                    positionToVector3(animation.toPosition),
                ]);
                break;
        }
        startTimeRef.current = null;
        setProgress(0);
    }, [animation]);

    useFrame((state) => {
        if (!groupRef.current || !pathRef.current) return;

        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime * 1000;
        }

        const elapsed = state.clock.elapsedTime * 1000 - startTimeRef.current;
        const rawProgress = Math.min(elapsed / animation.duration, 1);
        const easedProgress = easeInOutCubic(rawProgress);

        // Get position along curve
        const position = pathRef.current.getPoint(easedProgress);
        groupRef.current.position.copy(position);

        // Add celebration effects
        if (animation.type === "celebrate" && rawProgress < 1) {
            groupRef.current.rotation.y = Math.sin(elapsed * 0.01) * 0.3;
            groupRef.current.scale.setScalar(1 + Math.sin(elapsed * 0.02) * 0.1);
        }

        // Add enter spiral effect
        if (animation.type === "enter" && rawProgress < 1) {
            groupRef.current.rotation.y = rawProgress * Math.PI * 4;
        }

        setProgress(rawProgress);

        if (rawProgress >= 1 && onComplete) {
            onComplete();
        }
    });

    return <group ref={groupRef}>{children}</group>;
};

// Celebration particles for rank up
interface CelebrationEffectProps {
    position: ArenaPosition;
    color: string;
    duration?: number;
}

export const CelebrationEffect: React.FC<CelebrationEffectProps> = ({
    position,
    color,
    duration = 2000,
}) => {
    const groupRef = useRef<Group>(null);
    const [particles] = useState(() =>
        Array.from({ length: 30 }, () => ({
            velocity: new Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 8 + 2,
                (Math.random() - 0.5) * 10
            ),
            rotation: Math.random() * Math.PI * 2,
            scale: Math.random() * 0.3 + 0.1,
        }))
    );
    const [visible, setVisible] = useState(true);
    const startTimeRef = useRef<number | null>(null);

    useFrame((state) => {
        if (!groupRef.current || !visible) return;

        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime * 1000;
        }

        const elapsed = state.clock.elapsedTime * 1000 - startTimeRef.current;
        const progress = elapsed / duration;

        if (progress >= 1) {
            setVisible(false);
            return;
        }

        groupRef.current.children.forEach((child, i) => {
            const particle = particles[i];
            const t = progress;

            // Apply gravity and velocity
            child.position.x = particle.velocity.x * t;
            child.position.y = particle.velocity.y * t - 4.9 * t * t;
            child.position.z = particle.velocity.z * t;
            child.rotation.z = particle.rotation + t * 5;

            // Fade out
            (child as any).material.opacity = 1 - progress;
        });
    });

    if (!visible) return null;

    return (
        <group ref={groupRef} position={[position.x, position.y + 1, position.z]}>
            {particles.map((particle, i) => (
                <mesh key={i} scale={particle.scale}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={color} transparent opacity={1} />
                </mesh>
            ))}
        </group>
    );
};

// Trail effect for climbing
interface ClimbTrailProps {
    positions: Vector3[];
    color: string;
}

export const ClimbTrail: React.FC<ClimbTrailProps> = ({ positions, color }) => {
    const lineRef = useRef<any>(null);

    useFrame(() => {
        if (lineRef.current && positions.length > 1) {
            // Update line positions
        }
    });

    if (positions.length < 2) return null;

    return (
        <group>
            {positions.map((pos, i) => (
                <mesh key={i} position={pos} scale={0.1 * (1 - i / positions.length)}>
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.5 * (1 - i / positions.length)}
                    />
                </mesh>
            ))}
        </group>
    );
};

// Lightning effect for dramatic rank changes
export const LightningEffect: React.FC<{ from: Vector3; to: Vector3 }> = ({ from, to }) => {
    const [segments] = useState(() => {
        const result: Vector3[] = [from];
        const numSegments = 10;

        for (let i = 1; i < numSegments; i++) {
            const t = i / numSegments;
            const base = new Vector3().lerpVectors(from, to, t);
            base.x += (Math.random() - 0.5) * 2;
            base.y += (Math.random() - 0.5) * 2;
            base.z += (Math.random() - 0.5) * 2;
            result.push(base);
        }

        result.push(to);
        return result;
    });

    const [opacity, setOpacity] = useState(1);

    useFrame((state) => {
        setOpacity(Math.random() > 0.3 ? 1 : 0.3);
    });

    return (
        <group>
            {segments.slice(0, -1).map((seg, i) => {
                const next = segments[i + 1];
                const mid = new Vector3().lerpVectors(seg, next, 0.5);
                const length = seg.distanceTo(next);

                return (
                    <mesh
                        key={i}
                        position={mid}
                        lookAt={next}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <cylinderGeometry args={[0.02, 0.02, length, 4]} />
                        <meshBasicMaterial color="#60A5FA" transparent opacity={opacity} />
                    </mesh>
                );
            })}
        </group>
    );
};

export default RankAnimationWrapper;
