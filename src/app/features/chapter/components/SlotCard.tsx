"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { cn, elevation, type ElevationLevel } from "@/app/shared/lib/utils";

/**
 * Slot card variant determines contextual styling
 */
export type SlotCardVariant = "default" | "highlighted" | "success" | "error";

/**
 * Slot card context for compound component pattern
 */
interface SlotCardContextValue {
    variant: SlotCardVariant;
}

const SlotCardContext = createContext<SlotCardContextValue | null>(null);

function useSlotCardContext() {
    const context = useContext(SlotCardContext);
    if (!context) {
        throw new Error("SlotCard compound components must be used within a SlotCard");
    }
    return context;
}

/**
 * Get variant-specific classes for the card container
 */
function getVariantClasses(variant: SlotCardVariant): string {
    switch (variant) {
        case "highlighted":
            return "border-[var(--ember)]/30 bg-[var(--ember)]/5";
        case "success":
            return "border-green-500/30 bg-green-500/5";
        case "error":
            return "border-red-500/30 bg-red-500/5";
        case "default":
        default:
            return "border-[var(--forge-border-subtle)] bg-[var(--forge-bg-card)]";
    }
}

/**
 * Get variant-specific classes for headers
 */
function getHeaderVariantClasses(variant: SlotCardVariant): string {
    switch (variant) {
        case "highlighted":
            return "border-[var(--ember)]/20";
        case "success":
            return "border-green-500/20";
        case "error":
            return "border-red-500/20";
        case "default":
        default:
            return "border-[var(--forge-border-subtle)]";
    }
}

export interface SlotCardProps {
    children: ReactNode;
    className?: string;
    variant?: SlotCardVariant;
    cardElevation?: ElevationLevel;
    "data-testid"?: string;
}

/**
 * SlotCard - A composable card component for slot renderers
 *
 * Provides consistent styling for slot content cards with Header/Body/Footer
 * compound components. Supports contextual variants (default, highlighted,
 * success, error) for different states.
 *
 * @example
 * ```tsx
 * <SlotCard variant="success" data-testid="homework-slot-123">
 *   <SlotCard.Header>
 *     <h3>Assignment Complete</h3>
 *   </SlotCard.Header>
 *   <SlotCard.Body>
 *     <p>Content here</p>
 *   </SlotCard.Body>
 *   <SlotCard.Footer>
 *     <button>Continue</button>
 *   </SlotCard.Footer>
 * </SlotCard>
 * ```
 */
export function SlotCard({
    children,
    className,
    variant = "default",
    cardElevation = "elevated",
    "data-testid": testId,
}: SlotCardProps) {
    return (
        <SlotCardContext.Provider value={{ variant }}>
            <div
                className={cn(
                    "rounded-xl border overflow-hidden",
                    elevation[cardElevation],
                    getVariantClasses(variant),
                    className
                )}
                data-testid={testId}
            >
                {children}
            </div>
        </SlotCardContext.Provider>
    );
}

export interface SlotCardHeaderProps {
    children: ReactNode;
    className?: string;
    /** Whether to show the bottom border (default: true) */
    bordered?: boolean;
}

/**
 * SlotCard.Header - Header section with consistent padding and optional border
 */
function SlotCardHeader({
    children,
    className,
    bordered = true,
}: SlotCardHeaderProps) {
    const { variant } = useSlotCardContext();

    return (
        <div
            className={cn(
                "px-5 py-4",
                bordered && "border-b",
                bordered && getHeaderVariantClasses(variant),
                className
            )}
        >
            {children}
        </div>
    );
}

export interface SlotCardBodyProps {
    children: ReactNode;
    className?: string;
    /** Whether to show the bottom border (default: false) */
    bordered?: boolean;
    /** Padding size: 'none', 'sm', 'md', 'lg' (default: 'md') */
    padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
    none: "",
    sm: "px-4 py-3",
    md: "px-5 py-4",
    lg: "px-6 py-5",
};

/**
 * SlotCard.Body - Main content section with configurable padding
 */
function SlotCardBody({
    children,
    className,
    bordered = false,
    padding = "md",
}: SlotCardBodyProps) {
    const { variant } = useSlotCardContext();

    return (
        <div
            className={cn(
                paddingClasses[padding],
                bordered && "border-b",
                bordered && getHeaderVariantClasses(variant),
                className
            )}
        >
            {children}
        </div>
    );
}

export interface SlotCardFooterProps {
    children: ReactNode;
    className?: string;
    /** Whether the footer has elevated background (default: true) */
    elevated?: boolean;
}

/**
 * SlotCard.Footer - Footer section with elevated background
 */
function SlotCardFooter({
    children,
    className,
    elevated = true,
}: SlotCardFooterProps) {
    return (
        <div
            className={cn(
                "px-5 py-4",
                elevated && "bg-[var(--forge-bg-elevated)]",
                className
            )}
        >
            {children}
        </div>
    );
}

export interface SlotCardSectionProps {
    children: ReactNode;
    className?: string;
    /** Whether to show the bottom border (default: true) */
    bordered?: boolean;
}

/**
 * SlotCard.Section - Collapsible/expandable section within body
 * Useful for file scopes, acceptance criteria, hints, etc.
 */
function SlotCardSection({
    children,
    className,
    bordered = true,
}: SlotCardSectionProps) {
    const { variant } = useSlotCardContext();

    return (
        <div
            className={cn(
                bordered && "border-b",
                bordered && getHeaderVariantClasses(variant),
                className
            )}
        >
            {children}
        </div>
    );
}

// Attach compound components to SlotCard
SlotCard.Header = SlotCardHeader;
SlotCard.Body = SlotCardBody;
SlotCard.Footer = SlotCardFooter;
SlotCard.Section = SlotCardSection;

export default SlotCard;
