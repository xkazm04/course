"use client";

import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { SortKey, SortDir } from "./constants";

interface SortableHeaderProps {
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    currentDir: SortDir;
    onSort: (key: SortKey) => void;
    align?: "left" | "center" | "right";
    "data-testid"?: string;
}

export function SortableHeader({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
    align = "left",
    "data-testid": testId,
}: SortableHeaderProps) {
    const isActive = currentSort === sortKey;
    const alignClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

    return (
        <button
            onClick={() => onSort(sortKey)}
            className={cn(
                "flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors w-full",
                alignClass,
                isActive ? "text-[var(--ember)]" : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
            )}
            data-testid={testId}
            aria-label={`Sort by ${label}${isActive ? (currentDir === "asc" ? ", currently ascending" : ", currently descending") : ""}`}
        >
            {label}
            {isActive ? (
                currentDir === "asc" ? (
                    <ChevronUp size={14} aria-hidden="true" />
                ) : (
                    <ChevronDown size={14} aria-hidden="true" />
                )
            ) : (
                <ArrowUpDown size={12} className="opacity-40" aria-hidden="true" />
            )}
        </button>
    );
}
