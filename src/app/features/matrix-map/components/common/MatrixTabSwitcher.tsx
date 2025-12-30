"use client";

import React from "react";
import { motion } from "framer-motion";
import { Grid3X3, Hexagon, TrainFront } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { MatrixVariant } from "../../lib/types";
import { VARIANT_LABELS } from "../../lib/constants";

interface MatrixTabSwitcherProps {
    activeVariant: MatrixVariant;
    onVariantChange: (variant: MatrixVariant) => void;
    className?: string;
}

const VARIANT_ICONS: Record<MatrixVariant, React.ElementType> = {
    nested: Grid3X3,
    hex: Hexagon,
    metro: TrainFront,
};

export function MatrixTabSwitcher({
    activeVariant,
    onVariantChange,
    className,
}: MatrixTabSwitcherProps) {
    const variants: MatrixVariant[] = ["nested", "hex", "metro"];

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1 p-1 bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] shadow-sm",
                className
            )}
        >
            {variants.map((variant) => {
                const Icon = VARIANT_ICONS[variant];
                const isActive = variant === activeVariant;
                const { label } = VARIANT_LABELS[variant];

                return (
                    <button
                        key={variant}
                        onClick={() => onVariantChange(variant)}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                                ? "text-[var(--forge-text-primary)]"
                                : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)]/50"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-[var(--forge-bg-elevated)] rounded-lg shadow-sm border border-[var(--forge-border-subtle)]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Icon size={16} />
                            <span className="hidden sm:inline">{label}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
