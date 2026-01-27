"use client";

import { memo, useState, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import type { TreemapNode } from "../lib/types";
import { canShowLabel, calculateFontSize } from "../lib/layoutEngine";
import { ChildCountBadge } from "./ChildCountBadge";

export interface TerritoryProps {
  node: TreemapNode;
  onClick: (node: TreemapNode) => void;
  onKeyDown?: (e: React.KeyboardEvent, node: TreemapNode) => void;
  isFocused?: boolean;
}

/**
 * Difficulty border colors - subtle tinted borders instead of badges
 * Uses light tones that blend with the ember aesthetic
 */
const DIFFICULTY_BORDER_COLORS: Record<string, { border: string; glow: string }> = {
  beginner: { border: "rgba(74, 222, 128, 0.4)", glow: "rgba(74, 222, 128, 0.15)" },
  intermediate: { border: "rgba(251, 191, 36, 0.4)", glow: "rgba(251, 191, 36, 0.15)" },
  advanced: { border: "rgba(249, 115, 22, 0.5)", glow: "rgba(249, 115, 22, 0.2)" },
  expert: { border: "rgba(248, 113, 113, 0.5)", glow: "rgba(248, 113, 113, 0.2)" },
};

/**
 * Get Lucide icon component by name
 */
function getIconComponent(iconName: string | null): React.ComponentType<{ size?: number; className?: string }> | null {
  if (!iconName) return null;
  // Convert icon name to PascalCase (e.g., "file-code" -> "FileCode")
  const pascalName = iconName
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
  return (LucideIcons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[pascalName] || null;
}

/**
 * Territory component renders a single treemap node.
 *
 * Features:
 * - Dark background with glowing border on hover/focus
 * - Label text with icon and subtitle
 * - Difficulty badge (minimal)
 * - Child count badge
 * - Keyboard accessible (Tab, Enter, Space)
 */
export const Territory = memo(function Territory({
  node,
  onClick,
  onKeyDown,
  isFocused = false,
}: TerritoryProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onClick(node);
  }, [onClick, node]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(node);
      }
      onKeyDown?.(e, node);
    },
    [onClick, onKeyDown, node]
  );

  const showLabel = canShowLabel(node);
  const fontSize = calculateFontSize(node);

  // Visual state
  const isActive = isHovered || isFocused;

  // Determine what metadata to show based on card size
  const canShowSubtitle = node.width > 120 && node.height > 60 && node.description;
  const canShowIcon = node.width > 80 && node.height > 50;

  // Get icon component
  const IconComponent = canShowIcon ? getIconComponent(node.icon) : null;

  // Get difficulty border colors (subtle tinted border instead of badge)
  const difficultyBorder = node.difficulty ? DIFFICULTY_BORDER_COLORS[node.difficulty] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        node.nodeType === "lesson" || node.childCount === 0
          ? `${node.label}. Lesson. Press Enter to view details.`
          : `${node.label}. ${node.childCount} ${node.childCount === 1 ? "item" : "items"}. Press Enter to explore.`
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute cursor-pointer transition-all duration-150 ease-out"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: node.color,
        // Border: use difficulty tint when available, otherwise default white
        border: difficultyBorder
          ? `2px solid ${isActive ? difficultyBorder.border : difficultyBorder.glow}`
          : `1px solid ${isActive ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
        borderRadius: "6px",
        // Box shadow: combine node glow with difficulty glow
        boxShadow: isActive
          ? `0 0 20px ${node.color}80${difficultyBorder ? `, 0 0 12px ${difficultyBorder.glow}` : ""}, inset 0 1px 0 rgba(255,255,255,0.1)`
          : difficultyBorder
            ? `0 0 8px ${difficultyBorder.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
            : "inset 0 1px 0 rgba(255,255,255,0.05)",
        transform: isActive ? "scale(1.02)" : "scale(1)",
        zIndex: isActive ? 10 : 1,
      }}
    >
      {/* Child count badge - positioned relative to Territory, not affected by flex centering */}
      <ChildCountBadge count={node.childCount} nodeWidth={node.width} />

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-2 gap-1">
        {/* Icon */}
        {IconComponent && (
          <IconComponent
            size={Math.min(24, fontSize + 4)}
            className="text-white/70 flex-shrink-0"
          />
        )}

        {/* Label */}
        {showLabel && (
          <span
            className="max-w-full truncate text-center font-medium leading-tight text-white"
            style={{
              fontSize: `${fontSize}px`,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            {node.label}
          </span>
        )}

        {/* Subtitle (description) - truncated with title for hover */}
        {canShowSubtitle && (
          <span
            className="max-w-full truncate text-center text-white/60 leading-tight"
            style={{
              fontSize: `${Math.max(10, fontSize - 3)}px`,
              textShadow: "0 1px 1px rgba(0, 0, 0, 0.4)",
            }}
            title={node.description || undefined}
          >
            {node.description}
          </span>
        )}
      </div>

      {/* Focus ring (keyboard navigation) */}
      {isFocused && (
        <div
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{
            border: "2px solid var(--ember-bright)",
            boxShadow: "0 0 0 2px rgba(234, 88, 12, 0.3)",
          }}
        />
      )}
    </div>
  );
});
