"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";

interface ForgeCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: "none" | "sm" | "md" | "lg";
    variant?: "default" | "elevated" | "outlined";
    as?: "div" | "article" | "section";
}

export function ForgeCard({
    children,
    className,
    hover = true,
    padding = "md",
    variant = "default",
    as: Component = "div",
}: ForgeCardProps) {
    const paddingClasses = {
        none: "",
        sm: "p-3",
        md: "p-4 sm:p-5",
        lg: "p-6 sm:p-8",
    };

    const variantClasses = {
        default: "bg-[var(--forge-bg-elevated)]/80 backdrop-blur-xl border border-[var(--forge-border-subtle)] shadow-sm",
        elevated: "bg-[var(--forge-bg-elevated)]/90 backdrop-blur-xl border border-[var(--forge-border-subtle)] shadow-lg shadow-[var(--ember)]/5",
        outlined: "bg-[var(--forge-bg-elevated)]/50 backdrop-blur-lg border-2 border-[var(--ember)]/20",
    };

    return (
        <Component
            className={cn(
                "rounded-xl transition-all duration-300",
                variantClasses[variant],
                paddingClasses[padding],
                hover && "hover:shadow-lg hover:shadow-[var(--ember)]/10 hover:border-[var(--ember)]/30 hover:bg-[var(--forge-bg-elevated)]",
                className
            )}
        >
            {children}
        </Component>
    );
}

interface ForgeCardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function ForgeCardHeader({ children, className }: ForgeCardHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between mb-4", className)}>
            {children}
        </div>
    );
}

interface ForgeCardTitleProps {
    children: React.ReactNode;
    className?: string;
    subtitle?: string;
}

export function ForgeCardTitle({ children, className, subtitle }: ForgeCardTitleProps) {
    return (
        <div>
            <h3 className={cn("text-lg font-semibold text-[var(--forge-text-primary)]", className)}>
                {children}
            </h3>
            {subtitle && (
                <p className="text-sm text-[var(--forge-text-muted)] mt-0.5">{subtitle}</p>
            )}
        </div>
    );
}

interface ForgeCardContentProps {
    children: React.ReactNode;
    className?: string;
}

export function ForgeCardContent({ children, className }: ForgeCardContentProps) {
    return (
        <div className={cn("text-[var(--forge-text-secondary)]", className)}>
            {children}
        </div>
    );
}

interface ForgeCardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function ForgeCardFooter({ children, className }: ForgeCardFooterProps) {
    return (
        <div className={cn("mt-4 pt-4 border-t border-[var(--forge-border-subtle)] flex items-center gap-3", className)}>
            {children}
        </div>
    );
}
