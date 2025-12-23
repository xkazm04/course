"use client";

import React, { useState, useRef, useEffect, Suspense, lazy, ComponentType } from "react";
import { VariantPlaceholder } from "./VariantPlaceholder";

type VariantType = "knowledge-map";

interface LazyVariantProps {
    variant: VariantType;
    rootMargin?: string;
    threshold?: number;
    className?: string;
}

/**
 * LazyVariant - Intersection Observer-based lazy loading wrapper for heavy variants.
 * Defers expensive computations (Math.sin/cos positions, SVG connection rendering)
 * until the variant is actually visible in the viewport.
 *
 * Uses React.lazy for code splitting combined with a lightweight placeholder.
 */
export const LazyVariant: React.FC<LazyVariantProps> = ({
    variant,
    rootMargin = "100px",
    threshold = 0.1,
    className,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer to detect when component enters viewport
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasLoaded) {
                        setIsVisible(true);
                        setHasLoaded(true);
                        // Once loaded, disconnect observer - no need to re-observe
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin,
                threshold,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [rootMargin, threshold, hasLoaded]);

    // Lazy-loaded component references
    const LazyComponent = React.useMemo(() => {
        if (!isVisible) return null;

        switch (variant) {
            case "knowledge-map":
                return lazy(() =>
                    import("../VariantD").then((module) => ({
                        default: module.VariantD,
                    }))
                );
            default:
                return null;
        }
    }, [isVisible, variant]);

    return (
        <div
            ref={containerRef}
            className={className}
            data-testid={`lazy-${variant}-container`}
        >
            {isVisible && LazyComponent ? (
                <Suspense fallback={<VariantPlaceholder variant={variant} />}>
                    <LazyComponent />
                </Suspense>
            ) : (
                <VariantPlaceholder variant={variant} />
            )}
        </div>
    );
};

/**
 * Pre-configured lazy variant for Knowledge Map (VariantD)
 */
export const LazyKnowledgeMap: React.FC<{ className?: string }> = ({ className }) => (
    <LazyVariant variant="knowledge-map" className={className} />
);

/**
 * Higher-order component for creating lazy-loaded variants with custom components
 */
export function withLazyLoading<P extends object>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    placeholderVariant: VariantType
): React.FC<P & { className?: string }> {
    const LazyComponent = lazy(importFn);

    return function LazyWrappedComponent(props: P & { className?: string }) {
        const [isVisible, setIsVisible] = useState(false);
        const [hasLoaded, setHasLoaded] = useState(false);
        const containerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const element = containerRef.current;
            if (!element) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !hasLoaded) {
                            setIsVisible(true);
                            setHasLoaded(true);
                            observer.disconnect();
                        }
                    });
                },
                {
                    rootMargin: "100px",
                    threshold: 0.1,
                }
            );

            observer.observe(element);

            return () => {
                observer.disconnect();
            };
        }, [hasLoaded]);

        return (
            <div ref={containerRef} className={props.className}>
                {isVisible ? (
                    <Suspense fallback={<VariantPlaceholder variant={placeholderVariant} />}>
                        <LazyComponent {...props} />
                    </Suspense>
                ) : (
                    <VariantPlaceholder variant={placeholderVariant} />
                )}
            </div>
        );
    };
}

export default LazyVariant;
