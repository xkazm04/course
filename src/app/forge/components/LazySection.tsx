"use client";

import React, { Suspense, lazy, ComponentType, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// SKELETON PRIMITIVES
// ============================================================================

export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-[var(--forge-bg-elevated)]",
                className
            )}
        />
    );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-2/3" : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn(
            "bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-6",
            className
        )}>
            <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <SkeletonText lines={2} />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 bg-[var(--forge-bg-elevated)] border-b border-[var(--forge-border-subtle)]">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24 ml-auto" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex items-center gap-4 px-4 py-4",
                        i % 2 === 0 ? "bg-[var(--forge-bg-daylight)]/40" : "bg-[var(--forge-bg-daylight)]/60"
                    )}
                >
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-4 w-12" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonGrid({ items = 6 }: { items?: number }) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: items }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-5"
                >
                    <div className="flex items-start justify-between mb-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="w-12 h-4" />
                    </div>
                    <Skeleton className="h-7 w-20 mb-2" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// LOADING SPINNER
// ============================================================================

export function LoadingSpinner({ size = 24, className }: { size?: number; className?: string }) {
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <Loader2 size={size} className="animate-spin text-[var(--ember)]" />
        </div>
    );
}

// ============================================================================
// SECTION LOADING WRAPPER
// ============================================================================

interface SectionLoaderProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    delay?: number;
    className?: string;
}

export function SectionLoader({ children, fallback, delay = 0, className }: SectionLoaderProps) {
    const [isReady, setIsReady] = useState(delay === 0);

    useEffect(() => {
        if (delay > 0) {
            const timer = setTimeout(() => setIsReady(true), delay);
            return () => clearTimeout(timer);
        }
    }, [delay]);

    if (!isReady) {
        return <>{fallback}</>;
    }

    return (
        <Suspense fallback={fallback || <LoadingSpinner className="py-8" />}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={className}
            >
                {children}
            </motion.div>
        </Suspense>
    );
}

// ============================================================================
// LAZY SECTION - Loads component lazily with delay
// ============================================================================

interface LazySectionProps<P extends object> {
    loader: () => Promise<{ default: ComponentType<P> }>;
    props?: P;
    fallback?: React.ReactNode;
    delay?: number;
    className?: string;
}

export function LazySection<P extends object>({
    loader,
    props,
    fallback,
    delay = 0,
    className,
}: LazySectionProps<P>) {
    const [Component, setComponent] = useState<ComponentType<P> | null>(null);
    const [isReady, setIsReady] = useState(delay === 0);

    useEffect(() => {
        // Load component
        loader().then((mod) => {
            setComponent(() => mod.default);
        });

        // Handle delay
        if (delay > 0) {
            const timer = setTimeout(() => setIsReady(true), delay);
            return () => clearTimeout(timer);
        }
    }, [loader, delay]);

    if (!Component || !isReady) {
        return <>{fallback || <LoadingSpinner className="py-8" />}</>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={className}
        >
            <Component {...(props as P)} />
        </motion.div>
    );
}

// ============================================================================
// PAGE SKELETON LAYOUTS
// ============================================================================

export function DashboardSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>
            {/* Stats */}
            <SkeletonStats count={4} />
            {/* Content grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <SkeletonCard className="h-32" />
                    <SkeletonCard className="h-64" />
                </div>
                <div className="space-y-6">
                    <SkeletonCard className="h-40" />
                    <SkeletonCard className="h-48" />
                </div>
            </div>
        </div>
    );
}

export function ChallengesListSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>
            {/* Filter bar */}
            <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 flex-1 max-w-xs" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            {/* Table */}
            <SkeletonTable rows={8} />
        </div>
    );
}

export function ProjectDetailSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-start gap-6">
                <Skeleton className="w-20 h-20 rounded-xl" />
                <div className="flex-1">
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-5 w-full max-w-lg mb-4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                </div>
            </div>
            {/* Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SkeletonCard className="h-96" />
                </div>
                <div className="space-y-6">
                    <SkeletonCard className="h-48" />
                    <SkeletonCard className="h-64" />
                </div>
            </div>
        </div>
    );
}

export function SetupGuideSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--surface-base)]">
            {/* Header */}
            <div className="border-b border-[var(--border-default)] bg-[var(--surface-elevated)]">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Skeleton className="h-5 w-32 mb-4" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-xl" />
                        <div>
                            <Skeleton className="h-7 w-48 mb-2" />
                            <Skeleton className="h-5 w-80" />
                        </div>
                    </div>
                </div>
            </div>
            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-64 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-lg" />
                        ))}
                    </div>
                    {/* Main */}
                    <div className="flex-1">
                        <SkeletonCard className="h-[500px]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
