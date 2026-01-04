"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Circle, Moon, Star, Move, ZoomIn, MousePointer2, BookOpen, Clock, Zap, ChevronRight, Loader2 } from "lucide-react";
import { KnowledgeUniverse } from "@/app/features/knowledge-universe";
import type { UniverseNode, PlanetNode, MoonNode } from "@/app/features/knowledge-universe/lib/types";

// Compact legend items
const LEGEND_ITEMS = [
    { icon: Circle, label: "Domains", description: "Major learning areas", color: "var(--ember)" },
    { icon: Moon, label: "Topics", description: "Chapters & modules", color: "var(--gold)" },
    { icon: Star, label: "Lessons", description: "Individual content", color: "var(--ember-glow)" },
];

const CONTROLS_INFO = [
    { icon: Move, label: "Drag to pan" },
    { icon: ZoomIn, label: "Scroll to zoom" },
    { icon: MousePointer2, label: "Click to select" },
];

interface ChapterInfo {
    id: string;
    name: string;
    sectionCount: number;
}

export function KnowledgeUniverseSection() {
    const universeContainerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<UniverseNode | null>(null);
    const [chapters, setChapters] = useState<ChapterInfo[]>([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);

    // Prevent page scroll when mouse is over the universe container
    useEffect(() => {
        const container = universeContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
        };

        container.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel);
        };
    }, []);

    // Fetch chapters when a planet is selected
    const fetchChapters = useCallback(async (node: UniverseNode) => {
        if (node.type === "planet" && "moons" in node) {
            setIsLoadingChapters(true);
            // Extract chapter info from the planet's moons (already available in node data)
            const planetNode = node as PlanetNode;
            const chapterList: ChapterInfo[] = planetNode.moons
                .map((moon: MoonNode) => ({
                    id: moon.id,
                    name: moon.name,
                    sectionCount: moon.sectionCount,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            // Simulate small delay for UX feedback
            await new Promise(resolve => setTimeout(resolve, 150));
            setChapters(chapterList);
            setIsLoadingChapters(false);
        } else {
            setChapters([]);
        }
    }, []);

    const handleNodeSelectChange = useCallback((node: UniverseNode | null) => {
        setSelectedNode(node);
        if (node) {
            fetchChapters(node);
        } else {
            setChapters([]);
        }
    }, [fetchChapters]);

    return (
        <section className="relative py-20">
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--ember)]/5 to-transparent pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--ember)]/10 border border-[var(--ember)]/20 mb-4">
                        <Compass size={16} className="text-[var(--ember)]" />
                        <span className="text-sm font-medium text-[var(--ember)]">Explore Knowledge</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Navigate Your Learning Universe
                    </h2>
                    <p className="text-[var(--forge-text-secondary)] max-w-2xl mx-auto">
                        An interactive map of all available learning domains. Zoom in to explore topics,
                        chapters, and individual lessons - all connected in a cosmic visualization.
                    </p>
                </motion.div>

                {/* Main Content: Universe + Side Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col lg:flex-row gap-6"
                >
                    {/* Universe Container */}
                    <div className="flex-1 relative group">
                        <div className="relative rounded-2xl overflow-hidden border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/40 backdrop-blur-sm">
                            {/* Header bar */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/60">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center">
                                        <Compass size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-[var(--forge-text-primary)]">Knowledge Universe</h3>
                                        <p className="text-xs text-[var(--forge-text-muted)]">Interactive learning map</p>
                                    </div>
                                </div>
                                {/* Controls hint */}
                                <div className="hidden sm:flex items-center gap-4">
                                    {CONTROLS_INFO.map((control) => {
                                        const Icon = control.icon;
                                        return (
                                            <div key={control.label} className="flex items-center gap-1.5 text-xs text-[var(--forge-text-muted)]">
                                                <Icon size={12} />
                                                <span>{control.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Universe Canvas */}
                            <div
                                ref={universeContainerRef}
                                className="h-[500px] sm:h-[625px]"
                                style={{ touchAction: "none" }}
                            >
                                <KnowledgeUniverse
                                    showControls={true}
                                    showStats={false}
                                    interactive={true}
                                    initialZoomLevel="galaxy"
                                    useRealData={true}
                                    onNodeSelectChange={handleNodeSelectChange}
                                />
                            </div>

                            {/* Bottom gradient overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--forge-bg-elevated)] to-transparent pointer-events-none" />
                        </div>

                        {/* Decorative glow on hover */}
                        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[var(--ember)]/0 via-[var(--ember)]/20 to-[var(--ember)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />
                    </div>

                    {/* Side Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="lg:w-72 flex flex-col gap-4"
                    >
                        {/* Compact Legend */}
                        <div className="p-4 rounded-xl bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm border border-[var(--forge-border-subtle)]">
                            <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-3">
                                Legend
                            </h4>
                            <div className="space-y-2">
                                {LEGEND_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.label} className="flex items-center gap-3">
                                            <div
                                                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `color-mix(in srgb, ${item.color} 20%, transparent)` }}
                                            >
                                                <Icon size={14} style={{ color: item.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-[var(--forge-text-primary)] font-medium">
                                                    {item.label}
                                                </span>
                                                <span className="text-xs text-[var(--forge-text-muted)] ml-2">
                                                    {item.description}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dynamic Node Info Panel */}
                        <div className="flex-1 p-4 rounded-xl bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm border border-[var(--forge-border-subtle)] min-h-[300px] overflow-hidden">
                            <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-3">
                                Selected Node
                            </h4>

                            <AnimatePresence mode="wait">
                                {selectedNode ? (
                                    <motion.div
                                        key={selectedNode.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        {/* Node Title */}
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    backgroundColor: `color-mix(in srgb, ${selectedNode.color} 20%, transparent)`,
                                                }}
                                            >
                                                {selectedNode.type === "planet" && <Circle size={20} style={{ color: selectedNode.color }} />}
                                                {selectedNode.type === "moon" && <Moon size={20} style={{ color: selectedNode.color }} />}
                                                {selectedNode.type === "star" && <Star size={20} style={{ color: selectedNode.color }} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-[var(--forge-text-primary)] leading-tight">
                                                    {selectedNode.name}
                                                </h3>
                                                <span className="text-xs text-[var(--forge-text-muted)] capitalize">
                                                    {selectedNode.type === "planet" ? "Domain" : selectedNode.type === "moon" ? "Topic" : "Lesson"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Node Stats - type-specific */}
                                        <div className="space-y-2">
                                            {selectedNode.type === "planet" && "moons" in selectedNode && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <BookOpen size={14} className="text-[var(--forge-text-muted)]" />
                                                    <span className="text-[var(--forge-text-secondary)]">
                                                        {selectedNode.moons.length} chapters
                                                    </span>
                                                </div>
                                            )}
                                            {selectedNode.type === "moon" && "sectionCount" in selectedNode && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <BookOpen size={14} className="text-[var(--forge-text-muted)]" />
                                                    <span className="text-[var(--forge-text-secondary)]">
                                                        {selectedNode.sectionCount} sections
                                                    </span>
                                                </div>
                                            )}
                                            {selectedNode.type === "star" && "duration" in selectedNode && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock size={14} className="text-[var(--forge-text-muted)]" />
                                                    <span className="text-[var(--forge-text-secondary)]">
                                                        {selectedNode.duration}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedNode.type === "star" && "lessonType" in selectedNode && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Zap size={14} className="text-[var(--ember)]" />
                                                    <span className="text-[var(--forge-text-secondary)] capitalize">
                                                        {selectedNode.lessonType}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Completion status for stars */}
                                        {selectedNode.type === "star" && "completed" in selectedNode && (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${selectedNode.completed ? "bg-[var(--forge-success)]" : "bg-[var(--forge-text-muted)]"}`} />
                                                <span className={`text-xs ${selectedNode.completed ? "text-[var(--forge-success)]" : "text-[var(--forge-text-muted)]"}`}>
                                                    {selectedNode.completed ? "Completed" : "Not started"}
                                                </span>
                                            </div>
                                        )}

                                        {/* Chapter List for Planets */}
                                        {selectedNode.type === "planet" && (
                                            <div className="pt-3 border-t border-[var(--forge-border-subtle)]">
                                                <h5 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-2">
                                                    Chapters
                                                </h5>
                                                {isLoadingChapters ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 size={16} className="animate-spin text-[var(--ember)]" />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--forge-border-subtle)] scrollbar-track-transparent">
                                                        {chapters.map((chapter, index) => (
                                                            <motion.div
                                                                key={chapter.id}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.03 }}
                                                                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--forge-bg-void)]/50 transition-colors group/chapter cursor-pointer"
                                                            >
                                                                <ChevronRight size={12} className="text-[var(--forge-text-muted)] group-hover/chapter:text-[var(--ember)] transition-colors" />
                                                                <span className="text-sm text-[var(--forge-text-secondary)] group-hover/chapter:text-[var(--forge-text-primary)] transition-colors flex-1 truncate">
                                                                    {chapter.name}
                                                                </span>
                                                                <span className="text-xs text-[var(--forge-text-muted)]">
                                                                    {chapter.sectionCount}
                                                                </span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-full flex flex-col items-center justify-center text-center py-8"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[var(--forge-bg-void)] flex items-center justify-center mb-3">
                                            <MousePointer2 size={20} className="text-[var(--forge-text-muted)]" />
                                        </div>
                                        <p className="text-sm text-[var(--forge-text-muted)]">
                                            Click a node to see details
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
