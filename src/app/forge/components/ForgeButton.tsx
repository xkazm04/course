"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/app/shared/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ForgeButtonBaseProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

interface ForgeButtonAsButtonProps extends ForgeButtonBaseProps {
    as?: "button";
    href?: never;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
}

interface ForgeButtonAsLinkProps extends ForgeButtonBaseProps {
    as: "link";
    href: string;
    onClick?: never;
    type?: never;
}

type ForgeButtonProps = ForgeButtonAsButtonProps | ForgeButtonAsLinkProps;

const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-[var(--forge-text-primary)] text-white hover:bg-[var(--forge-text-secondary)] shadow-md shadow-[var(--forge-text-primary)]/20 hover:shadow-lg hover:shadow-[var(--forge-text-primary)]/30",
    secondary: "bg-white/70 text-[var(--forge-text-secondary)] border border-[var(--forge-border-subtle)] hover:bg-white hover:border-[var(--forge-border-default)] shadow-sm",
    ghost: "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)]",
    outline: "border-2 border-[var(--ember)] text-[var(--ember)] hover:bg-[var(--ember)]/10 hover:border-[var(--ember)]",
    danger: "bg-[var(--forge-error)] text-white hover:bg-[var(--forge-error)]/90 shadow-md shadow-[var(--forge-error)]/20",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
};

export function ForgeButton({
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    className,
    ...props
}: ForgeButtonProps) {
    const baseClasses = cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/40 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
    );

    const content = (
        <>
            {loading ? (
                <Loader2 className="animate-spin" size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
            ) : leftIcon ? (
                leftIcon
            ) : null}
            {children}
            {!loading && rightIcon}
        </>
    );

    if (props.as === "link") {
        return (
            <Link href={props.href} className={baseClasses}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type={props.type || "button"}
            disabled={disabled || loading}
            onClick={props.onClick}
            className={baseClasses}
        >
            {content}
        </button>
    );
}

interface ForgeButtonGroupProps {
    children: React.ReactNode;
    className?: string;
}

export function ForgeButtonGroup({ children, className }: ForgeButtonGroupProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {children}
        </div>
    );
}
