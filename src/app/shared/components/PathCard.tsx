"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Share2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { DOMAIN_ICON_MAP, BG_COLORS, TEXT_COLORS, toDomainColor } from "@/app/shared/lib/learningDomains";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useVariantAnimation } from "@/app/shared/hooks";
import type { LearningPath } from "@/app/shared/lib/types";
import type { DomainColorKey } from "@/app/shared/lib/learningDomains";

/**
 * PathCard variant types for different display contexts
 */
export type PathCardVariant = "sidebar" | "tooltip" | "preview";

/**
 * PathCard component props
 */
export interface PathCardProps {
    /** Learning path data to display */
    path: LearningPath;
    /** Display variant determining layout and information shown */
    variant: PathCardVariant;
    /** Whether this card is currently selected */
    isSelected?: boolean;
    /** Whether this card is currently hovered */
    isHovered?: boolean;
    /** Click handler for selection */
    onClick?: () => void;
    /** Hover enter handler */
    onMouseEnter?: () => void;
    /** Hover leave handler */
    onMouseLeave?: () => void;
    /** Animation delay for staggered animations */
    animationDelay?: number;
    /** Additional class names */
    className?: string;
    /** Maximum number of skills to show (for tooltip variant) */
    maxSkills?: number;
    /** Optional badge text to display (e.g., hierarchy level) */
    badge?: string;
}

/**
 * PathCard - Reusable component for displaying learning path information
 *
 * Supports three variants:
 * - `sidebar`: Compact horizontal layout with icon, name, courses count, and chevron
 * - `tooltip`: Floating tooltip with name, description, courses, hours, and skills
 * - `preview`: Not implemented here - handled separately in VariantB's preview panel
 */
export const PathCard: React.FC<PathCardProps> = ({
    path,
    variant,
    isSelected = false,
    isHovered = false,
    onClick,
    onMouseEnter,
    onMouseLeave,
    animationDelay = 0,
    className,
    maxSkills = 3,
    badge,
}) => {
    const PathIcon = DOMAIN_ICON_MAP[path.icon];
    const pathColor = toDomainColor(path.color);

    if (variant === "sidebar") {
        return (
            <SidebarPathCard
                path={path}
                pathColor={pathColor}
                PathIcon={PathIcon}
                isSelected={isSelected}
                onClick={onClick}
                animationDelay={animationDelay}
                className={className}
                badge={badge}
            />
        );
    }

    if (variant === "tooltip") {
        return (
            <TooltipPathCard
                path={path}
                isHovered={isHovered}
                maxSkills={maxSkills}
                className={className}
            />
        );
    }

    return null;
};

/**
 * Sidebar variant - Compact button style for list navigation
 */
interface SidebarPathCardProps {
    path: LearningPath;
    pathColor: DomainColorKey;
    PathIcon: React.ComponentType<{ size?: number }>;
    isSelected: boolean;
    onClick?: () => void;
    animationDelay: number;
    className?: string;
    badge?: string;
}

const SidebarPathCard: React.FC<SidebarPathCardProps> = ({
    path,
    pathColor,
    PathIcon,
    isSelected,
    onClick,
    animationDelay,
    className,
    badge,
}) => {
    const animation = useVariantAnimation({
        preset: "stagger-fast",
        baseDelay: animationDelay,
        direction: "left",
    });

    return (
        <motion.button
            data-testid={`path-card-sidebar-${path.id}`}
            initial={animation.initial}
            animate={animation.animate}
            transition={animation.transition}
            onClick={onClick}
            className={cn(
                "w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left",
                isSelected
                    ? "bg-[var(--surface-overlay)] shadow-lg border-2 border-[var(--text-primary)]"
                    : "bg-[var(--surface-elevated)] border border-[var(--border-default)] hover:bg-[var(--surface-overlay)]",
                className
            )}
        >
            <div className={cn(
                "w-12 h-12 rounded-xl icon-container-align text-white",
                BG_COLORS[pathColor]
            )}>
                {PathIcon && <PathIcon size={ICON_SIZES.lg} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[var(--text-primary)] truncate">{path.name}</h3>
                    {badge && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-inset)] text-[var(--text-muted)] rounded-md whitespace-nowrap">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-[var(--text-muted)]">{path.courses} courses</p>
            </div>
            <ChevronRight
                size={ICON_SIZES.md}
                className={cn(
                    "transition-transform",
                    isSelected ? "rotate-90 text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                )}
            />
        </motion.button>
    );
};

/**
 * Tooltip variant - Floating info card for hover states
 */
interface TooltipPathCardProps {
    path: LearningPath;
    isHovered: boolean;
    maxSkills: number;
    className?: string;
}

const TooltipPathCard: React.FC<TooltipPathCardProps> = ({
    path,
    isHovered,
    maxSkills,
    className,
}) => {
    const animation = useVariantAnimation({
        preset: "scale-fade",
        hoverScale: 1,
    });

    return (
        <AnimatePresence>
            {isHovered && (
                <motion.div
                    data-testid={`path-card-tooltip-${path.id}`}
                    initial={animation.initial}
                    animate={animation.animate}
                    exit={animation.exit}
                    className={cn(
                        "absolute top-full mt-4 left-1/2 -translate-x-1/2 w-56 bg-[var(--surface-overlay)] backdrop-blur-md border border-[var(--border-default)] p-4 rounded-2xl shadow-2xl z-50 text-left",
                        className
                    )}
                >
                    <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">{path.name}</h4>
                    <p className="text-xs text-[var(--text-muted)] mb-3">{path.description}</p>
                    <div className="flex gap-2 text-[10px] text-[var(--text-muted)]">
                        <span className="bg-[var(--surface-inset)] px-2 py-0.5 rounded-full">{path.courses} courses</span>
                        <span className="bg-[var(--surface-inset)] px-2 py-0.5 rounded-full">{path.hours}h</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {path.skills.slice(0, maxSkills).map((skill, i) => (
                            <span key={i} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                {skill}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * PathStats - Reusable component for displaying path statistics (courses, hours, skills)
 * Used in preview panels and detail views
 */
export interface PathStatsProps {
    path: LearningPath;
    pathColor: DomainColorKey;
    className?: string;
}

export const PathStats: React.FC<PathStatsProps> = ({
    path,
    pathColor,
    className,
}) => {
    return (
        <div className={cn("mb-8", className)}>
            <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-3">Skills you'll learn</h4>
            <div className="flex flex-wrap gap-2">
                {path.skills.map(skill => (
                    <span
                        key={skill}
                        data-testid={`path-skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                        className="icon-text-align-tight px-3 py-1.5 bg-[var(--surface-overlay)] rounded-lg text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-strong)]"
                    >
                        <Check size={ICON_SIZES.sm} className={TEXT_COLORS[pathColor]} data-icon />
                        <span>{skill}</span>
                    </span>
                ))}
            </div>
        </div>
    );
};

/**
 * PathHeader - Reusable component for path icon and course count display
 * Used in preview panels
 */
export interface PathHeaderProps {
    path: LearningPath;
    pathColor: DomainColorKey;
    className?: string;
    /** Optional share handler to show share button */
    onShare?: (path: LearningPath) => void;
}

export const PathHeader: React.FC<PathHeaderProps> = ({
    path,
    pathColor,
    className,
    onShare,
}) => {
    const Icon = DOMAIN_ICON_MAP[path.icon];

    return (
        <div className={cn("flex items-start justify-between mb-8", className)}>
            <div className={cn(
                "w-20 h-20 rounded-3xl icon-container-align text-white",
                BG_COLORS[pathColor]
            )}>
                {Icon && <Icon size={ICON_SIZES.xl} />}
            </div>
            <div className="flex items-start gap-3">
                {onShare && (
                    <motion.button
                        data-testid={`share-path-header-${path.id}-btn`}
                        onClick={() => onShare(path)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2.5 rounded-xl bg-[var(--surface-inset)] hover:bg-[var(--surface-overlay)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label={`Share ${path.name} learning path`}
                    >
                        <Share2 size={ICON_SIZES.md} />
                    </motion.button>
                )}
                <div className="text-right">
                    <div className="text-3xl font-black text-[var(--text-primary)]">{path.courses}</div>
                    <div className="text-sm text-[var(--text-muted)]">Courses</div>
                </div>
            </div>
        </div>
    );
};

export default PathCard;
