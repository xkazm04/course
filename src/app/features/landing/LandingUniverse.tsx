"use client";

/**
 * Landing Universe Variant
 *
 * A new landing page variant that replaces static module cards with
 * a miniature preview of the full knowledge graph rendered as an
 * explorable universe. Users can pinch-zoom from galaxy view down to
 * individual lessons.
 *
 * This creates a "show don't tell" experience - rather than describing
 * the curriculum, we let users explore it directly as a cosmic journey.
 */

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Sparkles, ArrowRight, Compass, Target, BookOpen, Star,
    Globe2, Layers, Sun, ChevronRight
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Button } from "@/app/shared/components";
import { useReducedMotion } from "@/app/shared/lib/motionPrimitives";
import { KnowledgeUniverse, KnowledgeUniversePreview } from "@/app/features/knowledge-universe";
import type { UniverseNode } from "@/app/features/knowledge-universe";

// ============================================================================
// TYPES
// ============================================================================

export interface LandingUniverseProps {
    className?: string;
    defaultExpanded?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LandingUniverse({
    className,
    defaultExpanded = false,
}: LandingUniverseProps) {
    const router = useRouter();
    const prefersReducedMotion = useReducedMotion();
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [selectedNode, setSelectedNode] = useState<UniverseNode | null>(null);

    const handleExpand = useCallback(() => {
        setIsExpanded(true);
    }, []);

    const handleCollapse = useCallback(() => {
        setIsExpanded(false);
        setSelectedNode(null);
    }, []);

    const handleNodeSelect = useCallback((node: UniverseNode) => {
        setSelectedNode(node);
    }, []);

    const handleExplore = useCallback(() => {
        router.push("/overview");
    }, [router]);

    return (
        <div
            className={cn(
                "min-h-screen bg-slate-950 text-white overflow-hidden",
                className
            )}
            data-testid="landing-universe"
        >
            {/* Fullscreen Universe View */}
            {isExpanded ? (
                <ExpandedUniverseView
                    selectedNode={selectedNode}
                    onNodeSelect={handleNodeSelect}
                    onCollapse={handleCollapse}
                    prefersReducedMotion={prefersReducedMotion}
                />
            ) : (
                <CompactUniverseView
                    onExpand={handleExpand}
                    onExplore={handleExplore}
                    prefersReducedMotion={prefersReducedMotion}
                />
            )}
        </div>
    );
}

// ============================================================================
// COMPACT VIEW (Initial landing state)
// ============================================================================

interface CompactUniverseViewProps {
    onExpand: () => void;
    onExplore: () => void;
    prefersReducedMotion: boolean;
}

function CompactUniverseView({
    onExpand,
    onExplore,
    prefersReducedMotion,
}: CompactUniverseViewProps) {
    const router = useRouter();

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Background Stars */}
            <div className="absolute inset-0 overflow-hidden">
                {!prefersReducedMotion &&
                    Array.from({ length: 100 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                opacity: 0.1 + Math.random() * 0.4,
                            }}
                            animate={{
                                opacity: [0.1, 0.5, 0.1],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
            </div>

            {/* Nebula Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-purple-950/20 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 container max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12 flex-1">
                {/* Left: Hero Content */}
                <div className="flex-1 space-y-8 text-center lg:text-left">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
                            <Globe2 size={ICON_SIZES.sm} />
                            Knowledge Universe
                        </span>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-black tracking-tight"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200">
                            Your Learning
                        </span>
                        <br />
                        <span className="text-indigo-400">Cosmos</span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.2 }}
                        className="text-lg text-slate-300 max-w-xl mx-auto lg:mx-0"
                    >
                        Explore hundreds of interconnected lessons as a cosmic journey.
                        Zoom from galaxies of knowledge domains down to individual star systems
                        of lessons. See the full scope of your learning path at a glance.
                    </motion.p>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.3 }}
                        className="flex flex-wrap gap-8 justify-center lg:justify-start"
                    >
                        <StatItem icon={Sun} value="6" label="Domains" color="text-orange-400" />
                        <StatItem icon={Layers} value="60+" label="Chapters" color="text-indigo-400" />
                        <StatItem icon={Star} value="200+" label="Lessons" color="text-yellow-400" />
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.4 }}
                        className="flex flex-wrap gap-4 justify-center lg:justify-start"
                    >
                        <Button
                            size="lg"
                            variant="primary"
                            dark
                            onClick={onExpand}
                            className="group"
                            data-testid="explore-universe-btn"
                        >
                            <Sparkles size={ICON_SIZES.md} />
                            Explore Universe
                            <ArrowRight
                                size={ICON_SIZES.md}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </Button>
                        <Link href="/goal-path">
                            <Button
                                size="lg"
                                variant="secondary"
                                dark
                                onMouseEnter={() => router.prefetch("/goal-path")}
                                data-testid="set-goals-btn"
                            >
                                <Target size={ICON_SIZES.md} />
                                Set Your Goals
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* Right: Universe Preview */}
                <motion.div
                    initial={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: 0.3 }}
                    className="flex-1 w-full max-w-2xl aspect-[4/3]"
                >
                    <KnowledgeUniversePreview onEnter={onExpand} />
                </motion.div>
            </div>

            {/* Quick Links */}
            <QuickLinks prefersReducedMotion={prefersReducedMotion} />
        </div>
    );
}

// ============================================================================
// EXPANDED VIEW (Full universe exploration)
// ============================================================================

interface ExpandedUniverseViewProps {
    selectedNode: UniverseNode | null;
    onNodeSelect: (node: UniverseNode) => void;
    onCollapse: () => void;
    prefersReducedMotion: boolean;
}

function ExpandedUniverseView({
    selectedNode,
    onNodeSelect,
    onCollapse,
    prefersReducedMotion,
}: ExpandedUniverseViewProps) {
    return (
        <motion.div
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-screen"
        >
            {/* Universe Canvas */}
            <KnowledgeUniverse
                className="w-full h-full"
                showControls={true}
                showStats={true}
                interactive={true}
                initialZoomLevel="solar"
                onNodeSelect={onNodeSelect}
            />

            {/* Back Button */}
            <motion.button
                initial={{ opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={onCollapse}
                className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-white/10 text-white hover:bg-slate-800/90 transition-colors"
                data-testid="back-to-landing-btn"
            >
                <ChevronRight size={ICON_SIZES.md} className="rotate-180" />
                Back to Overview
            </motion.button>

            {/* Selected Node Panel */}
            {selectedNode && (
                <SelectedNodePanel node={selectedNode} />
            )}

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute top-6 right-6 flex gap-2"
            >
                <Link href="/overview">
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 rounded-lg font-medium hover:bg-indigo-400 transition-colors"
                        data-testid="start-learning-btn"
                    >
                        <BookOpen size={ICON_SIZES.sm} />
                        Start Learning
                    </button>
                </Link>
            </motion.div>
        </motion.div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatItemProps {
    icon: typeof Star;
    value: string;
    label: string;
    color: string;
}

function StatItem({ icon: Icon, value, label, color }: StatItemProps) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-white/5", color)}>
                <Icon size={ICON_SIZES.md} />
            </div>
            <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-slate-400">{label}</div>
            </div>
        </div>
    );
}

interface QuickLinksProps {
    prefersReducedMotion: boolean;
}

function QuickLinks({ prefersReducedMotion }: QuickLinksProps) {
    const links = [
        { icon: Compass, label: "Learning Paths", href: "/overview" },
        { icon: Target, label: "Set Goals", href: "/goal-path" },
        { icon: BookOpen, label: "Start Chapter", href: "/chapter" },
    ];

    return (
        <motion.div
            initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.5 }}
            className="relative z-10 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm"
        >
            <div className="container max-w-7xl mx-auto px-6 py-6">
                <div className="flex flex-wrap justify-center gap-6">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href}>
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white"
                                data-testid={`quick-link-${link.label.toLowerCase().replace(" ", "-")}`}
                            >
                                <link.icon size={ICON_SIZES.sm} />
                                <span className="font-medium">{link.label}</span>
                                <ChevronRight size={ICON_SIZES.xs} className="text-slate-500" />
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

interface SelectedNodePanelProps {
    node: UniverseNode;
}

function SelectedNodePanel({ node }: SelectedNodePanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-80 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl overflow-hidden"
            data-testid="selected-node-panel"
        >
            {/* Header */}
            <div
                className="p-4 border-b border-white/10"
                style={{ backgroundColor: `${node.color}20` }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: node.color }}
                    >
                        {node.type === "planet" && <Sun size={ICON_SIZES.md} className="text-white" />}
                        {node.type === "moon" && <Layers size={ICON_SIZES.md} className="text-white" />}
                        {node.type === "star" && <Star size={ICON_SIZES.md} className="text-white" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white">{node.name}</h3>
                        <p className="text-sm text-slate-400 capitalize">
                            {node.type === "planet" && "Learning Domain"}
                            {node.type === "moon" && "Chapter"}
                            {node.type === "star" && "Lesson"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {node.type === "planet" && (
                    <>
                        <p className="text-sm text-slate-300">
                            Explore this domain to discover chapters and lessons that will
                            build your expertise.
                        </p>
                        <Link href={`/overview?domain=${(node as { domainId: string }).domainId}`}>
                            <button
                                className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg font-medium transition-colors"
                                data-testid="explore-domain-btn"
                            >
                                Explore Domain
                            </button>
                        </Link>
                    </>
                )}

                {node.type === "moon" && (
                    <>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Sections</span>
                            <span className="text-white font-medium">
                                {(node as { sectionCount: number }).sectionCount}
                            </span>
                        </div>
                        <Link href="/chapter">
                            <button
                                className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg font-medium transition-colors"
                                data-testid="start-chapter-btn"
                            >
                                Start Chapter
                            </button>
                        </Link>
                    </>
                )}

                {node.type === "star" && (
                    <>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Type</span>
                                <span className="text-white font-medium capitalize">
                                    {(node as { lessonType: string }).lessonType}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Duration</span>
                                <span className="text-white font-medium">
                                    {(node as { duration: string }).duration}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Status</span>
                                <span
                                    className={cn(
                                        "font-medium",
                                        (node as { completed: boolean }).completed
                                            ? "text-green-400"
                                            : "text-slate-400"
                                    )}
                                >
                                    {(node as { completed: boolean }).completed ? "Completed" : "Not started"}
                                </span>
                            </div>
                        </div>
                        <Link href="/chapter">
                            <button
                                className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg font-medium transition-colors"
                                data-testid="start-lesson-btn"
                            >
                                {(node as { completed: boolean }).completed ? "Review Lesson" : "Start Lesson"}
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default LandingUniverse;
