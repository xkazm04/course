"use client";

import React, { useRef, useState, useEffect, useMemo, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    BookOpen, ChevronDown, ChevronUp, Code2, FileText,
    Play, CheckCircle, Clock, ArrowRight, Sparkles, Image
} from "lucide-react";
import { PrismaticCard, CodeBlock } from "@/app/shared/components";
import { cn, buttonSizeClasses } from "@/app/shared/lib/utils";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { TRANSITIONS, ANIMATION_VARIANTS } from "@/app/shared/lib/animationTiming";
import { BookmarkButton, BookmarkIndicator } from "@/app/features/bookmarks";
import type { SectionListSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

// Progressive content reveal animation variants
const expandedContainerVariants: Variants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: "auto",
        transition: {
            height: { duration: 0.3, ease: "easeOut" },
            opacity: { duration: 0.2, ease: "easeOut" },
            staggerChildren: 0.1,
            delayChildren: 0.15,
        },
    },
    exit: {
        opacity: 0,
        height: 0,
        transition: {
            height: { duration: 0.2, ease: "easeIn" },
            opacity: { duration: 0.1, ease: "easeIn" },
        },
    },
};

// Description fades in at 0ms (first child, no additional delay)
const descriptionVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: { opacity: 0, y: 5, transition: { duration: 0.1 } },
};

// Code block slides up at 150ms (handled by stagger)
const codeBlockVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.1 } },
};

// Key points container with its own stagger for individual items
const keyPointsContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        },
    },
    exit: { opacity: 0, transition: { duration: 0.1 } },
};

// Individual key point items stagger at 200ms+50ms each
const keyPointItemVariants: Variants = {
    hidden: { opacity: 0, x: -15 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: { opacity: 0, x: -10, transition: { duration: 0.1 } },
};

// Screenshot slides up
const screenshotVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.1 } },
};

// Action buttons scale in at 400ms (last items in stagger sequence)
const actionButtonsVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } },
};

export interface SectionListSlotRendererProps {
    slot: SectionListSlot;
    state: ChapterState;
    className?: string;
}

// Estimated height for each section item (collapsed state)
const ESTIMATED_ITEM_HEIGHT = 88;
// Overscan to render items slightly before they enter viewport
const OVERSCAN_COUNT = 3;
// Threshold for enabling virtualization
const VIRTUALIZATION_THRESHOLD = 6;

/**
 * Hook to handle IntersectionObserver-based reveal animation
 */
function useRevealAnimation(enabled: boolean = true) {
    // Initialize revealed state based on enabled flag
    const [isRevealed, setIsRevealed] = useState(() => !enabled);
    const ref = useRef<HTMLDivElement>(null);
    const hasObserved = useRef(false);

    useEffect(() => {
        // If not enabled, already revealed via initial state
        if (!enabled) return;

        const element = ref.current;
        if (!element || hasObserved.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsRevealed(true);
                        hasObserved.current = true;
                        observer.unobserve(element);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "50px 0px",
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [enabled]);

    return { ref, isRevealed };
}

interface SectionItemProps {
    section: ChapterState["sections"][number];
    index: number;
    expandable: boolean;
    isExpanded: boolean;
    isActive: boolean;
    courseInfo: ChapterState["courseInfo"];
    setExpandedSection: (id: number | null) => void;
    setActiveSection: (id: number) => void;
    enableRevealAnimation?: boolean;
}

/**
 * Individual section item component with IntersectionObserver-based reveal
 *
 * Visual hierarchy depth system:
 * - Active: Elevated with shadow-lg, ring accent, left border for quick scanning
 * - Completed: Recedes with reduced opacity
 * - Pending: Flat standard style
 */
const SectionItem: React.FC<SectionItemProps> = ({
    section,
    expandable,
    isExpanded,
    isActive,
    courseInfo,
    setExpandedSection,
    setActiveSection,
    enableRevealAnimation = true,
}) => {
    const { ref, isRevealed } = useRevealAnimation(enableRevealAnimation);

    // Determine depth-based styling for visual hierarchy
    const isCompleted = section.completed;

    return (
        <div
            ref={ref}
            className="py-2"
            data-testid={`section-item-${section.id}`}
        >
            <motion.div
                initial={enableRevealAnimation ? ANIMATION_VARIANTS.fadeInUp.initial : false}
                animate={isRevealed ? ANIMATION_VARIANTS.fadeInUp.animate : ANIMATION_VARIANTS.fadeInUp.initial}
                transition={TRANSITIONS.normal}
                className={cn(
                    "rounded-xl transition-all duration-200",
                    // Active: Elevated with shadow and ring
                    isActive && !isCompleted && "shadow-lg ring-1 ring-[var(--ember)]/20",
                    // Completed: Recedes with reduced opacity
                    isCompleted && "opacity-80",
                    // Pending: Standard flat style (no additional classes needed)
                )}
            >
                <PrismaticCard
                    glowColor={isCompleted ? "emerald" : isActive ? "indigo" : "purple"}
                    static={true}
                >
                    {/* Section Header */}
                    <button
                        onClick={() => expandable && setExpandedSection(isExpanded ? null : section.id)}
                        className="relative w-full flex items-center gap-4 text-left"
                        style={{ padding: "var(--slot-padding-md)" }}
                        data-testid={`section-list-toggle-btn-${section.id}`}
                    >
                        {/* Active state: Left border accent for quick visual scanning */}
                        {isActive && !isCompleted && (
                            <div
                                className="absolute left-0 top-2 bottom-2 w-[3px] bg-[var(--ember)] rounded-full"
                                data-testid={`section-active-indicator-${section.id}`}
                            />
                        )}
                        {/* Status Icon */}
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            section.completed
                                ? "bg-[var(--forge-success)]/10 text-[var(--forge-success)]"
                                : isActive
                                ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                        )}>
                            {section.completed ? (
                                <CheckCircle size={ICON_SIZES.md} />
                            ) : section.type === "video" ? (
                                <Play size={ICON_SIZES.md} />
                            ) : section.type === "lesson" ? (
                                <FileText size={ICON_SIZES.md} />
                            ) : section.type === "interactive" ? (
                                <Code2 size={ICON_SIZES.md} />
                            ) : (
                                <BookOpen size={ICON_SIZES.md} />
                            )}
                        </div>

                        {/* Section Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-[var(--forge-text-primary)]">{section.title}</h3>
                                <BookmarkIndicator
                                    courseId={courseInfo.courseId}
                                    chapterId={courseInfo.chapterId}
                                    sectionId={section.sectionId}
                                />
                                {isActive && !section.completed && (
                                    <span className="px-2 py-0.5 bg-[var(--ember)]/10 text-[var(--ember)] text-xs font-bold rounded-full">
                                        Current
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[var(--forge-text-muted)]">
                                <span className="flex items-center gap-1">
                                    <Clock size={ICON_SIZES.xs} /> {section.duration}
                                </span>
                                <span className="capitalize">{section.type}</span>
                            </div>
                        </div>

                        {/* Expand Icon */}
                        {expandable && (
                            <div className="text-[var(--forge-text-muted)]">
                                {isExpanded ? <ChevronUp size={ICON_SIZES.md} /> : <ChevronDown size={ICON_SIZES.md} />}
                            </div>
                        )}
                    </button>

                    {/* Expanded Content with Progressive Reveal */}
                    <AnimatePresence mode="wait">
                        {expandable && isExpanded && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={expandedContainerVariants}
                                className="overflow-hidden"
                                data-testid={`section-expanded-content-${section.id}`}
                            >
                                <div
                                    className="pt-2 border-t border-[var(--forge-border-subtle)]"
                                    style={{
                                        paddingLeft: "var(--slot-padding-md)",
                                        paddingRight: "var(--slot-padding-md)",
                                        paddingBottom: "var(--slot-padding-md)"
                                    }}
                                >
                                    {/* Description - fades in at 0ms, rendered as markdown */}
                                    <motion.div
                                        variants={descriptionVariants}
                                        className="mb-4"
                                        data-testid={`section-description-${section.id}`}
                                    >
                                        <MarkdownRenderer content={section.content.description} />
                                    </motion.div>

                                    {/* Code Preview - slides up at 150ms */}
                                    {section.content.code && (
                                        <motion.div
                                            variants={codeBlockVariants}
                                            data-testid={`section-code-block-${section.id}`}
                                        >
                                            <CodeBlock
                                                code={section.content.code}
                                                language="typescript"
                                                showLineNumbers={true}
                                                showCopy={true}
                                                showHeader={true}
                                                className="mb-4"
                                            />
                                        </motion.div>
                                    )}

                                    {/* Key Points - stagger at 200ms+50ms each */}
                                    {section.content.keyPoints && (
                                        <motion.div
                                            variants={keyPointsContainerVariants}
                                            className="mb-4"
                                            data-testid={`section-key-points-${section.id}`}
                                        >
                                            <h4 className="text-sm font-bold text-[var(--forge-text-secondary)] mb-2">
                                                What you&apos;ll learn:
                                            </h4>
                                            <ul className="space-y-2">
                                                {section.content.keyPoints.map((point, j) => (
                                                    <motion.li
                                                        key={j}
                                                        variants={keyPointItemVariants}
                                                        className="flex items-center gap-2 text-sm text-[var(--forge-text-secondary)]"
                                                        data-testid={`section-key-point-${section.id}-${j}`}
                                                    >
                                                        <Sparkles size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                                                        {point}
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}

                                    {/* Screenshot Preview - slides up */}
                                    {section.content.screenshot && (
                                        <motion.div
                                            variants={screenshotVariants}
                                            className="aspect-video bg-gradient-to-br from-[var(--forge-bg-elevated)] to-[var(--forge-bg-anvil)] rounded-xl mb-4 flex items-center justify-center"
                                            data-testid={`section-screenshot-${section.id}`}
                                        >
                                            <div className="text-center">
                                                <Image size={ICON_SIZES.xl} className="mx-auto text-[var(--forge-text-muted)] mb-2" aria-hidden="true" />
                                                <span className="text-sm text-[var(--forge-text-muted)]">Interactive Preview</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Action Buttons - scale in at 400ms */}
                                    <motion.div
                                        variants={actionButtonsVariants}
                                        className="flex gap-3"
                                        data-testid={`section-action-buttons-${section.id}`}
                                    >
                                        <button
                                            onClick={() => setActiveSection(section.id)}
                                            data-testid={`section-list-action-btn-${section.id}`}
                                            className={cn(
                                                buttonSizeClasses.lg,
                                                "flex-1 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                                                section.completed
                                                    ? "bg-[var(--forge-success)]/10 text-[var(--forge-success)] hover:bg-[var(--forge-success)]/20"
                                                    : "bg-[var(--ember)] text-white hover:bg-[var(--ember-glow)]"
                                            )}
                                        >
                                            {section.completed ? (
                                                <>Review Section</>
                                            ) : (
                                                <>
                                                    {section.type === "video" ? "Watch Video" :
                                                     section.type === "interactive" ? "Start Coding" :
                                                     section.type === "exercise" ? "Begin Exercise" :
                                                     "Start Lesson"}
                                                    <ArrowRight size={ICON_SIZES.md} />
                                                </>
                                            )}
                                        </button>
                                        <BookmarkButton
                                            courseId={courseInfo.courseId}
                                            courseName={courseInfo.courseName}
                                            chapterId={courseInfo.chapterId}
                                            chapterTitle={courseInfo.chapterTitle}
                                            sectionId={section.sectionId}
                                            sectionTitle={section.title}
                                            variant="full"
                                        />
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </PrismaticCard>
            </motion.div>
        </div>
    );
};

/**
 * Memoized SectionItem to prevent re-renders of individual items
 * when unrelated items change
 */
const MemoizedSectionItem = memo(SectionItem, (prevProps, nextProps) => {
    return (
        prevProps.section.id === nextProps.section.id &&
        prevProps.section.completed === nextProps.section.completed &&
        prevProps.index === nextProps.index &&
        prevProps.expandable === nextProps.expandable &&
        prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.isActive === nextProps.isActive &&
        prevProps.courseInfo.courseId === nextProps.courseInfo.courseId &&
        prevProps.setExpandedSection === nextProps.setExpandedSection &&
        prevProps.setActiveSection === nextProps.setActiveSection &&
        prevProps.enableRevealAnimation === nextProps.enableRevealAnimation
    );
});

/**
 * Virtualized section list for large chapters
 */
const VirtualizedSectionList: React.FC<{
    sections: ChapterState["sections"];
    expandable: boolean;
    expandedSection: number | null;
    activeSection: number;
    courseInfo: ChapterState["courseInfo"];
    setExpandedSection: (id: number | null) => void;
    setActiveSection: (id: number) => void;
    slotId: string;
}> = ({
    sections,
    expandable,
    expandedSection,
    activeSection,
    courseInfo,
    setExpandedSection,
    setActiveSection,
    slotId,
}) => {
    const parentRef = useRef<HTMLDivElement>(null);

    // Calculate dynamic size estimation based on expanded state
    const estimateSize = useMemo(() => {
        return (index: number) => {
            const section = sections[index];
            const isExpanded = expandedSection === section.id;

            // Base height for collapsed section
            let height = ESTIMATED_ITEM_HEIGHT;

            // Add height for expanded content
            if (isExpanded) {
                height += 300; // Approximate expanded content height

                // Add extra height for code block if present
                if (section.content.code) {
                    height += 150;
                }

                // Add extra height for key points
                if (section.content.keyPoints) {
                    height += section.content.keyPoints.length * 28;
                }

                // Add extra height for screenshot
                if (section.content.screenshot) {
                    height += 200;
                }
            }

            return height + 16; // Add padding
        };
    }, [sections, expandedSection]);

    const virtualizer = useVirtualizer({
        count: sections.length,
        getScrollElement: () => parentRef.current,
        estimateSize,
        getItemKey: (index) => sections[index].id,
        overscan: OVERSCAN_COUNT,
    });

    // Re-measure when expanded section changes
    useEffect(() => {
        virtualizer.measure();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- virtualizer.measure is stable
    }, [expandedSection]);

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div
            ref={parentRef}
            className="h-[600px] overflow-auto"
            data-testid={`section-list-slot-${slotId}`}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualItems.map((virtualRow) => {
                    const section = sections[virtualRow.index];
                    const isExpanded = expandedSection === section.id;
                    const isActive = activeSection === section.id;

                    return (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <MemoizedSectionItem
                                section={section}
                                index={virtualRow.index}
                                expandable={expandable}
                                isExpanded={isExpanded}
                                isActive={isActive}
                                courseInfo={courseInfo}
                                setExpandedSection={setExpandedSection}
                                setActiveSection={setActiveSection}
                                enableRevealAnimation={true}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Non-virtualized section list for small chapters
 */
const SimpleSectionList: React.FC<{
    sections: ChapterState["sections"];
    expandable: boolean;
    expandedSection: number | null;
    activeSection: number;
    courseInfo: ChapterState["courseInfo"];
    setExpandedSection: (id: number | null) => void;
    setActiveSection: (id: number) => void;
    slotId: string;
    className?: string;
}> = ({
    sections,
    expandable,
    expandedSection,
    activeSection,
    courseInfo,
    setExpandedSection,
    setActiveSection,
    slotId,
    className,
}) => {
    return (
        <div className={`space-y-2 ${className ?? ""}`} data-testid={`section-list-slot-${slotId}`}>
            {sections.map((section, i) => {
                const isExpanded = expandedSection === section.id;
                const isActive = activeSection === section.id;

                return (
                    <MemoizedSectionItem
                        key={section.id}
                        section={section}
                        index={i}
                        expandable={expandable}
                        isExpanded={isExpanded}
                        isActive={isActive}
                        courseInfo={courseInfo}
                        setExpandedSection={setExpandedSection}
                        setActiveSection={setActiveSection}
                        enableRevealAnimation={true}
                    />
                );
            })}
        </div>
    );
};

/**
 * SectionListSlotRenderer - Renders expandable section list with virtualization for long chapters
 *
 * Uses @tanstack/react-virtual for virtualization when section count exceeds threshold.
 * IntersectionObserver is used for staggered reveal animations instead of index-based delays,
 * eliminating O(n) animation cost for large chapter lists.
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 */
const SectionListSlotRendererComponent: React.FC<SectionListSlotRendererProps> = ({ slot, state, className }) => {
    const { data } = slot;

    // Memoize slot data defaults
    const sectionListConfig = useMemo(() => ({
        expandable: data?.expandable ?? true,
    }), [data?.expandable]);

    const { expandable } = sectionListConfig;

    const {
        expandedSection,
        setExpandedSection,
        activeSection,
        setActiveSection,
        courseInfo,
        sections,
    } = state;

    const shouldVirtualize = sections.length >= VIRTUALIZATION_THRESHOLD;

    if (shouldVirtualize) {
        return (
            <VirtualizedSectionList
                sections={sections}
                expandable={expandable}
                expandedSection={expandedSection}
                activeSection={activeSection}
                courseInfo={courseInfo}
                setExpandedSection={setExpandedSection}
                setActiveSection={setActiveSection}
                slotId={slot.id}
            />
        );
    }

    return (
        <SimpleSectionList
            sections={sections}
            expandable={expandable}
            expandedSection={expandedSection}
            activeSection={activeSection}
            courseInfo={courseInfo}
            setExpandedSection={setExpandedSection}
            setActiveSection={setActiveSection}
            slotId={slot.id}
            className={className}
        />
    );
};

/**
 * Custom comparison function for SectionListSlotRenderer
 * Only re-renders when section-list-specific props change
 */
function areSectionListPropsEqual(
    prevProps: SectionListSlotRendererProps,
    nextProps: SectionListSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;

    // Check slot data
    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    if (prevData?.expandable !== nextData?.expandable) {
        return false;
    }

    // Check state - only section-list-related properties
    const prevState = prevProps.state;
    const nextState = nextProps.state;

    // Check sections array identity (or length as a quick check)
    if (prevState.sections !== nextState.sections) {
        if (prevState.sections.length !== nextState.sections.length) return false;
    }

    return (
        prevState.expandedSection === nextState.expandedSection &&
        prevState.activeSection === nextState.activeSection &&
        prevState.courseInfo.courseId === nextState.courseInfo.courseId &&
        prevState.courseInfo.courseName === nextState.courseInfo.courseName &&
        prevState.courseInfo.chapterId === nextState.courseInfo.chapterId &&
        prevState.courseInfo.chapterTitle === nextState.courseInfo.chapterTitle &&
        prevState.setExpandedSection === nextState.setExpandedSection &&
        prevState.setActiveSection === nextState.setActiveSection
    );
}

export const SectionListSlotRenderer = memo(SectionListSlotRendererComponent, areSectionListPropsEqual);

export default SectionListSlotRenderer;
