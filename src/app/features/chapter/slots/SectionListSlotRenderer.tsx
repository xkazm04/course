"use client";

import React, { useRef, useState, useEffect, useMemo, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, ChevronDown, ChevronUp, Code2, FileText,
    Play, CheckCircle, Clock, ArrowRight, Sparkles, Image
} from "lucide-react";
import { PrismaticCard, CodeBlock } from "@/app/shared/components";
import { cn, buttonSizeClasses } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { TRANSITIONS, ANIMATION_VARIANTS } from "@/app/shared/lib/animationTiming";
import { BookmarkButton, BookmarkIndicator } from "@/app/features/bookmarks";
import type { SectionListSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

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
            >
                <PrismaticCard
                    glowColor={section.completed ? "emerald" : isActive ? "indigo" : "purple"}
                    static={true}
                >
                    {/* Section Header */}
                    <button
                        onClick={() => expandable && setExpandedSection(isExpanded ? null : section.id)}
                        className="w-full flex items-center gap-4 text-left"
                        style={{ padding: "var(--slot-padding-md)" }}
                        data-testid={`section-list-toggle-btn-${section.id}`}
                    >
                        {/* Status Icon */}
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            section.completed
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                : isActive
                                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-400"
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
                                <h3 className="font-bold text-slate-900 dark:text-white">{section.title}</h3>
                                <BookmarkIndicator
                                    courseId={courseInfo.courseId}
                                    chapterId={courseInfo.chapterId}
                                    sectionId={section.sectionId}
                                />
                                {isActive && !section.completed && (
                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full">
                                        Current
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Clock size={ICON_SIZES.xs} /> {section.duration}
                                </span>
                                <span className="capitalize">{section.type}</span>
                            </div>
                        </div>

                        {/* Expand Icon */}
                        {expandable && (
                            <div className="text-slate-400">
                                {isExpanded ? <ChevronUp size={ICON_SIZES.md} /> : <ChevronDown size={ICON_SIZES.md} />}
                            </div>
                        )}
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                        {expandable && isExpanded && (
                            <motion.div
                                initial={ANIMATION_VARIANTS.expand.initial}
                                animate={ANIMATION_VARIANTS.expand.animate}
                                exit={ANIMATION_VARIANTS.expand.exit}
                                transition={TRANSITIONS.expand}
                                className="overflow-hidden"
                            >
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700" style={{ paddingLeft: "var(--slot-padding-md)", paddingRight: "var(--slot-padding-md)", paddingBottom: "var(--slot-padding-md)" }}>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        {section.content.description}
                                    </p>

                                    {/* Code Preview */}
                                    {section.content.code && (
                                        <CodeBlock
                                            code={section.content.code}
                                            language="typescript"
                                            showLineNumbers={true}
                                            showCopy={true}
                                            showHeader={true}
                                            className="mb-4"
                                        />
                                    )}

                                    {/* Key Points */}
                                    {section.content.keyPoints && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                What you&apos;ll learn:
                                            </h4>
                                            <ul className="space-y-2">
                                                {section.content.keyPoints.map((point, j) => (
                                                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Sparkles size={ICON_SIZES.sm} className="text-indigo-500" />
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Screenshot Preview */}
                                    {section.content.screenshot && (
                                        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl mb-4 flex items-center justify-center">
                                            <div className="text-center">
                                                <Image size={ICON_SIZES.xl} className="mx-auto text-slate-400 mb-2" aria-hidden="true" />
                                                <span className="text-sm text-slate-500">Interactive Preview</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setActiveSection(section.id)}
                                            data-testid={`section-list-action-btn-${section.id}`}
                                            className={cn(
                                                buttonSizeClasses.lg,
                                                "flex-1 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                                                section.completed
                                                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                                                    : "bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500"
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
                                    </div>
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
