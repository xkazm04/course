"use client";

/**
 * EmptyStateIllustration Component
 *
 * An immersive animated empty state for the Knowledge Map.
 * Features orbiting knowledge nodes with CSS animations,
 * gradient text heading, and subtle floating animation.
 */

import React from "react";
import { motion } from "framer-motion";

// Orbit configurations for the knowledge nodes
const ORBIT_NODES = [
    {
        id: "node-1",
        size: 14,
        orbitRadius: 50,
        duration: 8,
        delay: 0,
        color: "var(--ember)",
        glowColor: "rgba(194, 65, 12, 0.4)",
    },
    {
        id: "node-2",
        size: 10,
        orbitRadius: 75,
        duration: 12,
        delay: -4,
        color: "var(--forge-info)",
        glowColor: "rgba(29, 78, 216, 0.4)",
    },
    {
        id: "node-3",
        size: 8,
        orbitRadius: 95,
        duration: 16,
        delay: -8,
        color: "var(--ember-glow)",
        glowColor: "rgba(232, 111, 53, 0.4)",
    },
    {
        id: "node-4",
        size: 6,
        orbitRadius: 110,
        duration: 20,
        delay: -12,
        color: "var(--molten)",
        glowColor: "rgba(245, 158, 94, 0.3)",
    },
];

// Pre-defined particle positions to avoid hydration mismatch
const PARTICLES = [
    { id: "p1", top: 25, left: 30, duration: 2.5, delay: 0 },
    { id: "p2", top: 65, left: 70, duration: 3, delay: 0.5 },
    { id: "p3", top: 40, left: 55, duration: 2.8, delay: 1 },
    { id: "p4", top: 75, left: 35, duration: 3.2, delay: 1.5 },
    { id: "p5", top: 30, left: 65, duration: 2.6, delay: 0.3 },
    { id: "p6", top: 55, left: 25, duration: 3.5, delay: 0.8 },
];

// Orbital path style
const getOrbitPathStyle = (radius: number): React.CSSProperties => ({
    width: radius * 2,
    height: radius * 2,
    border: "1px dashed rgba(148, 163, 184, 0.15)",
    borderRadius: "50%",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
});

export const EmptyStateIllustration: React.FC = () => {
    return (
        <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            data-testid="map-empty-state"
        >
            {/* Main floating container */}
            <motion.div
                className="flex flex-col items-center gap-8"
                animate={{ y: [-5, 5, -5] }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {/* Orbiting illustration */}
                <div className="relative w-[280px] h-[280px]">
                    {/* Central core - pulsing knowledge sphere */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-full"
                            style={{
                                background: "linear-gradient(135deg, var(--ember) 0%, var(--ember-glow) 50%, var(--molten) 100%)",
                                boxShadow: "0 0 30px rgba(194, 65, 12, 0.5), 0 0 60px rgba(232, 111, 53, 0.3)",
                            }}
                        />
                    </motion.div>

                    {/* Orbit paths (static, dashed circles) */}
                    {ORBIT_NODES.map((node) => (
                        <div
                            key={`orbit-path-${node.id}`}
                            style={getOrbitPathStyle(node.orbitRadius)}
                        />
                    ))}

                    {/* Orbiting nodes with CSS keyframe animations */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 280 280"
                        style={{ overflow: "visible" }}
                    >
                        <defs>
                            {/* Glow filters for each node */}
                            {ORBIT_NODES.map((node) => (
                                <filter
                                    key={`filter-${node.id}`}
                                    id={`glow-${node.id}`}
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                >
                                    <feGaussianBlur
                                        stdDeviation="3"
                                        result="coloredBlur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            ))}
                        </defs>

                        {/* Animated orbiting circles */}
                        {ORBIT_NODES.map((node) => (
                            <g key={node.id}>
                                <circle
                                    cx="140"
                                    cy="140"
                                    r={node.orbitRadius}
                                    fill="none"
                                    stroke="transparent"
                                />
                                <circle
                                    r={node.size / 2}
                                    fill={node.color}
                                    filter={`url(#glow-${node.id})`}
                                    style={{
                                        transformOrigin: "140px 140px",
                                    }}
                                >
                                    <animateMotion
                                        dur={`${node.duration}s`}
                                        repeatCount="indefinite"
                                        begin={`${node.delay}s`}
                                    >
                                        <mpath
                                            xlinkHref={`#orbit-${node.id}`}
                                        />
                                    </animateMotion>
                                </circle>
                                {/* Hidden path for motion */}
                                <circle
                                    id={`orbit-${node.id}`}
                                    cx="140"
                                    cy="140"
                                    r={node.orbitRadius}
                                    fill="none"
                                    stroke="none"
                                />
                            </g>
                        ))}

                        {/* Connection lines (subtle, animated opacity) */}
                        <motion.line
                            x1="140"
                            y1="140"
                            x2="190"
                            y2="140"
                            stroke="rgba(148, 163, 184, 0.1)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                        <motion.line
                            x1="140"
                            y1="140"
                            x2="140"
                            y2="90"
                            stroke="rgba(148, 163, 184, 0.1)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1,
                            }}
                        />
                    </svg>

                    {/* Floating particle effects */}
                    {PARTICLES.map((particle) => (
                        <motion.div
                            key={particle.id}
                            className="absolute w-1 h-1 rounded-full bg-[var(--ember-glow)]/30"
                            style={{
                                top: `${particle.top}%`,
                                left: `${particle.left}%`,
                            }}
                            animate={{
                                y: [-10, 10, -10],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: particle.delay,
                            }}
                        />
                    ))}
                </div>

                {/* Text content */}
                <div className="text-center space-y-3">
                    {/* Gradient heading */}
                    <h2
                        className="text-2xl font-semibold bg-clip-text text-transparent"
                        style={{
                            backgroundImage: "linear-gradient(135deg, var(--ember) 0%, var(--ember-glow) 50%, var(--molten) 100%)",
                        }}
                        data-testid="empty-state-heading"
                    >
                        Your Knowledge Universe Awaits
                    </h2>

                    {/* Subtitle CTA */}
                    <motion.p
                        className="text-sm text-[var(--forge-text-secondary)]"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        data-testid="empty-state-cta"
                    >
                        Select a domain to begin exploring
                    </motion.p>
                </div>
            </motion.div>
        </div>
    );
};

export default EmptyStateIllustration;
