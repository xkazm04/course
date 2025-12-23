"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Sparkles,
    Loader2,
    Zap,
    Users,
    TrendingUp,
    ChevronRight,
    X,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { PrismaticCard } from "@/app/shared/components";
import { useLearningPaths, useContentGeneration } from "../lib/useGenerativeContent";
import type { LearningPathSeed } from "../lib/types";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// ============================================================================
// TYPES
// ============================================================================

interface PathExplorerProps {
    className?: string;
    onPathSelect?: (path: LearningPathSeed) => void;
    onGenerateComplete?: (chapterId: string) => void;
}

interface TopicSuggestion {
    topic: string;
    category: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOPIC_SUGGESTIONS: TopicSuggestion[] = [
    { topic: "React", category: "Frontend" },
    { topic: "GraphQL", category: "API" },
    { topic: "Testing", category: "Quality" },
    { topic: "TypeScript", category: "Language" },
    { topic: "Node.js", category: "Backend" },
    { topic: "PostgreSQL", category: "Database" },
    { topic: "Docker", category: "DevOps" },
    { topic: "Authentication", category: "Security" },
    { topic: "Performance", category: "Optimization" },
    { topic: "State Management", category: "Architecture" },
    { topic: "REST API", category: "API" },
    { topic: "CI/CD", category: "DevOps" },
];

const DOMAIN_OPTIONS: { id: LearningDomainId; label: string }[] = [
    { id: "frontend", label: "Frontend Development" },
    { id: "backend", label: "Backend Development" },
    { id: "fullstack", label: "Full Stack" },
    { id: "databases", label: "Databases" },
    { id: "mobile", label: "Mobile Development" },
    { id: "games", label: "Game Development" },
];

// ============================================================================
// PATH EXPLORER COMPONENT
// ============================================================================

export function PathExplorer({
    className,
    onPathSelect,
    onGenerateComplete,
}: PathExplorerProps) {
    const { paths, popularPaths, createPath, searchPaths } = useLearningPaths();
    const { isGenerating, currentJob, generateContent } = useContentGeneration();

    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [customTopic, setCustomTopic] = useState("");
    const [selectedDomain, setSelectedDomain] = useState<LearningDomainId>("fullstack");
    const [skillLevel, setSkillLevel] = useState<LearningPathSeed["skillLevel"]>("intermediate");
    const [userGoal, setUserGoal] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showExisting, setShowExisting] = useState(false);

    // Filter existing paths based on search
    const filteredPaths = searchQuery
        ? searchPaths(searchQuery.split(" "))
        : popularPaths;

    /**
     * Add a topic to selection
     */
    const addTopic = useCallback((topic: string) => {
        if (!selectedTopics.includes(topic) && selectedTopics.length < 5) {
            setSelectedTopics((prev) => [...prev, topic]);
        }
    }, [selectedTopics]);

    /**
     * Remove a topic from selection
     */
    const removeTopic = useCallback((topic: string) => {
        setSelectedTopics((prev) => prev.filter((t) => t !== topic));
    }, []);

    /**
     * Add custom topic
     */
    const handleAddCustomTopic = useCallback(() => {
        if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
            addTopic(customTopic.trim());
            setCustomTopic("");
        }
    }, [customTopic, selectedTopics, addTopic]);

    /**
     * Generate content for selected topics
     */
    const handleGenerate = useCallback(async () => {
        if (selectedTopics.length === 0) return;

        const path = createPath(selectedTopics, selectedDomain, {
            userGoal: userGoal || undefined,
            skillLevel,
        });

        if (path) {
            onPathSelect?.(path);
            const chapter = await generateContent(path);
            if (chapter) {
                onGenerateComplete?.(chapter.id);
            }
        }
    }, [
        selectedTopics,
        selectedDomain,
        userGoal,
        skillLevel,
        createPath,
        onPathSelect,
        generateContent,
        onGenerateComplete,
    ]);

    /**
     * Use existing path
     */
    const handleSelectExisting = useCallback(
        (path: LearningPathSeed) => {
            setSelectedTopics(path.topics);
            setSelectedDomain(path.domainId);
            setSkillLevel(path.skillLevel);
            setUserGoal(path.userGoal || "");
            setShowExisting(false);
            onPathSelect?.(path);
        },
        [onPathSelect]
    );

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    Create Your Learning Path
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Select topics to generate personalized course content
                </p>
            </div>

            {/* Topic Selection */}
            <PrismaticCard glowColor="indigo" className="p-6" data-testid="path-explorer-card">
                {/* Selected Topics */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                        Selected Topics ({selectedTopics.length}/5)
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)]">
                        <AnimatePresence mode="popLayout">
                            {selectedTopics.map((topic) => (
                                <motion.span
                                    key={topic}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-sm"
                                >
                                    {topic}
                                    <button
                                        onClick={() => removeTopic(topic)}
                                        className="hover:text-indigo-300 transition-colors"
                                        data-testid={`remove-topic-${topic}`}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.span>
                            ))}
                        </AnimatePresence>
                        {selectedTopics.length === 0 && (
                            <span className="text-[var(--text-muted)] text-sm">
                                Click topics below to add them
                            </span>
                        )}
                    </div>
                </div>

                {/* Custom Topic Input */}
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomTopic()}
                        placeholder="Add custom topic..."
                        className="flex-1 px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        data-testid="custom-topic-input"
                    />
                    <button
                        onClick={handleAddCustomTopic}
                        disabled={!customTopic.trim()}
                        className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        data-testid="add-custom-topic-btn"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Topic Suggestions */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                        Popular Topics
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {TOPIC_SUGGESTIONS.map((suggestion) => (
                            <button
                                key={suggestion.topic}
                                onClick={() => addTopic(suggestion.topic)}
                                disabled={
                                    selectedTopics.includes(suggestion.topic) ||
                                    selectedTopics.length >= 5
                                }
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm transition-all",
                                    selectedTopics.includes(suggestion.topic)
                                        ? "bg-indigo-500/30 text-indigo-300 cursor-default"
                                        : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
                                    selectedTopics.length >= 5 &&
                                        !selectedTopics.includes(suggestion.topic) &&
                                        "opacity-50 cursor-not-allowed"
                                )}
                                data-testid={`topic-suggestion-${suggestion.topic}`}
                            >
                                {suggestion.topic}
                                <span className="ml-1 text-xs opacity-60">
                                    {suggestion.category}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Domain Selection */}
                    <div>
                        <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                            Learning Domain
                        </label>
                        <select
                            value={selectedDomain}
                            onChange={(e) => setSelectedDomain(e.target.value as LearningDomainId)}
                            className="w-full px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            data-testid="domain-select"
                        >
                            {DOMAIN_OPTIONS.map((domain) => (
                                <option key={domain.id} value={domain.id}>
                                    {domain.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Skill Level */}
                    <div>
                        <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                            Skill Level
                        </label>
                        <select
                            value={skillLevel}
                            onChange={(e) =>
                                setSkillLevel(e.target.value as LearningPathSeed["skillLevel"])
                            }
                            className="w-full px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            data-testid="skill-level-select"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                {/* Goal Input */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                        Learning Goal (Optional)
                    </label>
                    <textarea
                        value={userGoal}
                        onChange={(e) => setUserGoal(e.target.value)}
                        placeholder="What do you want to build or achieve?"
                        rows={2}
                        className="w-full px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                        data-testid="goal-input"
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={selectedTopics.length === 0 || isGenerating}
                    className={cn(
                        "w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                        selectedTopics.length > 0 && !isGenerating
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                            : "bg-[var(--surface-sunken)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                    data-testid="generate-content-btn"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>
                                {currentJob?.currentStep || "Generating..."}
                                {currentJob?.progress ? ` (${currentJob.progress}%)` : ""}
                            </span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            <span>Generate Learning Path</span>
                        </>
                    )}
                </button>
            </PrismaticCard>

            {/* Existing Paths Toggle */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setShowExisting(!showExisting)}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors"
                    data-testid="toggle-existing-paths"
                >
                    <Users className="w-4 h-4" />
                    Browse existing learning paths ({paths.length})
                    <ChevronRight
                        className={cn(
                            "w-4 h-4 transition-transform",
                            showExisting && "rotate-90"
                        )}
                    />
                </button>
            </div>

            {/* Existing Paths */}
            <AnimatePresence>
                {showExisting && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search paths by topic..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                data-testid="search-paths-input"
                            />
                        </div>

                        {/* Path List */}
                        <div className="grid gap-3">
                            {filteredPaths.map((path) => (
                                <motion.button
                                    key={path.pathId}
                                    onClick={() => handleSelectExisting(path)}
                                    className="w-full p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-default)] hover:border-indigo-500/50 text-left transition-all"
                                    whileHover={{ scale: 1.01 }}
                                    data-testid={`existing-path-${path.pathId}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {path.topics.map((topic) => (
                                                    <span
                                                        key={topic}
                                                        className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs"
                                                    >
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {path.skillLevel} level • {path.domainId}
                                            </p>
                                            {path.userGoal && (
                                                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
                                                    Goal: {path.userGoal}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                            <TrendingUp className="w-4 h-4" />
                                            <Zap className="w-4 h-4" />
                                        </div>
                                    </div>
                                </motion.button>
                            ))}

                            {filteredPaths.length === 0 && (
                                <div className="text-center py-8 text-[var(--text-muted)]">
                                    No matching paths found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PathExplorer;
