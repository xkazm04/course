"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "../lib/utils";
import { ICON_SIZES } from "../lib/iconSizes";

export interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
    href?: string; // URL-based navigation
    active?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn(
                "flex items-center gap-1 text-sm",
                className
            )}
            data-testid="breadcrumb-nav"
        >
            {items.map((item, index) => {
                const commonClassName = cn(
                    "icon-text-align-tight px-2 py-1 rounded-lg transition-all",
                    "text-[var(--text-secondary)]",
                    "hover:text-[var(--text-primary)]",
                    "hover:bg-[var(--hover-overlay)]"
                );

                const content = (
                    <>
                        {index === 0 && <Home size={ICON_SIZES.sm} data-icon />}
                        <span className="font-medium">{item.label}</span>
                    </>
                );

                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <ChevronRight
                                size={ICON_SIZES.sm}
                                className="text-[var(--text-muted)] flex-shrink-0"
                                aria-hidden="true"
                            />
                        )}
                        {item.href && !item.active ? (
                            <Link
                                href={item.href}
                                className={commonClassName}
                                data-testid={`breadcrumb-item-${index}`}
                            >
                                {content}
                            </Link>
                        ) : item.onClick && !item.active ? (
                            <button
                                onClick={item.onClick}
                                className={commonClassName}
                                data-testid={`breadcrumb-item-${index}`}
                            >
                                {content}
                            </button>
                        ) : (
                            <span
                                className={cn(
                                    "icon-text-align-tight px-2 py-1 rounded-lg",
                                    item.active
                                        ? "text-[var(--text-primary)] font-semibold"
                                        : "text-[var(--text-secondary)] font-medium"
                                )}
                                data-testid={`breadcrumb-item-${index}`}
                                aria-current={item.active ? "page" : undefined}
                            >
                                {index === 0 && <Home size={ICON_SIZES.sm} data-icon />}
                                <span>{item.label}</span>
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
