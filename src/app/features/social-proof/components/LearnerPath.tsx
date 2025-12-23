"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { LearnerJourney, JourneyNode } from "../lib/types";

interface LearnerPathProps {
  journey: LearnerJourney;
  isHighlighted: boolean;
  reducedMotion: boolean;
  index: number;
}

/**
 * SVG path component for a single learner journey
 * Renders animated path with pulsing nodes
 */
export function LearnerPath({
  journey,
  isHighlighted,
  reducedMotion,
  index,
}: LearnerPathProps) {
  // Generate smooth curve path through all nodes
  const pathD = useMemo(() => {
    const nodes = journey.nodes;
    if (nodes.length < 2) return "";

    // Start at first node
    let d = `M ${nodes[0].x} ${nodes[0].y}`;

    // Create smooth bezier curves through all points
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      const next = nodes[i + 1];

      // Control points for smooth curve
      const cp1x = prev.x + (curr.x - prev.x) * 0.5;
      const cp1y = prev.y;
      const cp2x = curr.x - (curr.x - prev.x) * 0.3;
      const cp2y = curr.y + (next ? (next.y - curr.y) * 0.1 : 0);

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    return d;
  }, [journey.nodes]);

  // Calculate path length for animation
  const pathLength = useMemo(() => {
    // Approximate path length based on node distances
    return journey.nodes.reduce((total, node, i, arr) => {
      if (i === 0) return 0;
      const prev = arr[i - 1];
      const dx = node.x - prev.x;
      const dy = node.y - prev.y;
      return total + Math.sqrt(dx * dx + dy * dy);
    }, 0);
  }, [journey.nodes]);

  const opacity = isHighlighted ? 1 : 0.3;
  const strokeWidth = isHighlighted ? 3 : 1.5;
  const animationDelay = index * 0.3;

  return (
    <g
      data-testid={`learner-path-${journey.id}`}
      style={{ opacity: reducedMotion ? opacity : undefined }}
    >
      {/* Glow effect for highlighted paths */}
      {isHighlighted && (
        <motion.path
          d={pathD}
          fill="none"
          stroke={journey.pathColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{
            pathLength: { duration: reducedMotion ? 0 : 2, delay: animationDelay },
            opacity: { duration: reducedMotion ? 0 : 0.5, delay: animationDelay },
          }}
        />
      )}

      {/* Main path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={journey.pathColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity }}
        transition={{
          pathLength: { duration: reducedMotion ? 0 : 2, delay: animationDelay },
          opacity: { duration: reducedMotion ? 0 : 0.5, delay: animationDelay },
        }}
      />

      {/* Traveling particle along path (activity pulse) */}
      {isHighlighted && !reducedMotion && (
        <motion.circle
          r={4}
          fill="white"
          filter="url(#glow-white)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 4 + index * 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: animationDelay,
          }}
          style={{
            offsetPath: `path("${pathD}")`,
          }}
        />
      )}

      {/* Journey nodes */}
      {journey.nodes.map((node, nodeIndex) => (
        <PathNode
          key={node.id}
          node={node}
          journeyColor={journey.pathColor}
          isHighlighted={isHighlighted}
          reducedMotion={reducedMotion}
          animationDelay={animationDelay + nodeIndex * 0.15}
        />
      ))}
    </g>
  );
}

interface PathNodeProps {
  node: JourneyNode;
  journeyColor: string;
  isHighlighted: boolean;
  reducedMotion: boolean;
  animationDelay: number;
}

/**
 * Individual node on the learner path
 */
function PathNode({
  node,
  journeyColor,
  isHighlighted,
  reducedMotion,
  animationDelay,
}: PathNodeProps) {
  const baseRadius = node.isMilestone ? 6 : 4;
  const radius = isHighlighted ? baseRadius : baseRadius * 0.7;

  return (
    <g data-testid={`path-node-${node.id}`}>
      {/* Pulse ring for milestones */}
      {node.isMilestone && isHighlighted && !reducedMotion && (
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={radius}
          fill="none"
          stroke={journeyColor}
          strokeWidth={2}
          initial={{ r: radius, opacity: 0.8 }}
          animate={{ r: radius + 10, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: animationDelay,
          }}
        />
      )}

      {/* Node circle */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={radius}
        fill={isHighlighted ? journeyColor : node.color}
        stroke={isHighlighted ? "white" : "transparent"}
        strokeWidth={isHighlighted ? 2 : 0}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: isHighlighted ? 1 : 0.5 }}
        transition={{
          duration: reducedMotion ? 0 : 0.3,
          delay: animationDelay,
        }}
      />
    </g>
  );
}
