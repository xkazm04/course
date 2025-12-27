"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Grid, List } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ProjectDomain, ProjectDifficulty } from "../lib/types";
import { useSeedProject } from "../lib/useSeedProject";
import { ProjectCard } from "./ProjectCard";

interface ProjectBrowserProps {
    onSelectProject: (id: string) => void;
    onStartAssignment: (id: string) => void;
}

const DOMAINS: { value: ProjectDomain | "all"; label: string; icon: string }[] = [
    { value: "all", label: "All Domains", icon: "🌟" },
    { value: "web_app", label: "Web App", icon: "🌐" },
    { value: "api", label: "API", icon: "🔌" },
    { value: "cli_tool", label: "CLI Tool", icon: "💻" },
    { value: "mobile_app", label: "Mobile App", icon: "📱" },
    { value: "data_pipeline", label: "Data Pipeline", icon: "🔄" },
    { value: "library", label: "Library", icon: "📚" },
];

const DIFFICULTIES: { value: ProjectDifficulty | "all"; label: string; color: string }[] = [
    { value: "all", label: "All Levels", color: "text-[var(--text-muted)]" },
    { value: "beginner", label: "Beginner", color: "text-emerald-400" },
    { value: "intermediate", label: "Intermediate", color: "text-amber-400" },
    { value: "advanced", label: "Advanced", color: "text-red-400" },
];

export const ProjectBrowser: React.FC<ProjectBrowserProps> = ({
    onSelectProject,
    onStartAssignment,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const {
        projects,
        isLoading,
        filterByDomain,
        filterByDifficulty,
    } = useSeedProject();

    const [activeDomain, setActiveDomain] = useState<ProjectDomain | "all">("all");
    const [activeDifficulty, setActiveDifficulty] = useState<ProjectDifficulty | "all">("all");

    const handleDomainFilter = (domain: ProjectDomain | "all") => {
        setActiveDomain(domain);
        filterByDomain(domain === "all" ? null : domain);
    };

    const handleDifficultyFilter = (difficulty: ProjectDifficulty | "all") => {
        setActiveDifficulty(difficulty);
        filterByDifficulty(difficulty === "all" ? null : difficulty);
    };

    const filteredProjects = projects.filter((p) =>
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Search and View Toggle */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search
                        size={ICON_SIZES.sm}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-overlay)]">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-2 rounded transition-colors",
                            viewMode === "grid"
                                ? "bg-[var(--accent-primary)] text-white"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        )}
                    >
                        <Grid size={ICON_SIZES.sm} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "p-2 rounded transition-colors",
                            viewMode === "list"
                                ? "bg-[var(--accent-primary)] text-white"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        )}
                    >
                        <List size={ICON_SIZES.sm} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                    {DOMAINS.map((domain) => (
                        <button
                            key={domain.value}
                            onClick={() => handleDomainFilter(domain.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                                activeDomain === domain.value
                                    ? "bg-[var(--accent-primary)] text-white"
                                    : "bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <span className="mr-1">{domain.icon}</span>
                            {domain.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-4" />
                    {DIFFICULTIES.map((diff) => (
                        <button
                            key={diff.value}
                            onClick={() => handleDifficultyFilter(diff.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                                activeDifficulty === diff.value
                                    ? "bg-[var(--accent-primary)] text-white"
                                    : "bg-[var(--surface-overlay)]",
                                activeDifficulty !== diff.value && diff.color
                            )}
                        >
                            {diff.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="text-center py-12 text-[var(--text-muted)]">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)]">
                    No projects match your filters
                </div>
            ) : (
                <motion.div
                    className={cn(
                        viewMode === "grid"
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            : "space-y-4"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={onSelectProject}
                            onStartAssignment={onStartAssignment}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
};
