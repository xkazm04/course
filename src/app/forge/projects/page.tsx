"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Search,
    Filter,
    Hammer,
    Users,
    Target,
    Star,
    GitBranch,
    ChevronDown,
    Grid,
    List,
    X,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { mockProjects } from "../lib/mockData";
import type { ProjectCategory, ProjectStatus } from "../lib/types";

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const categories: { value: ProjectCategory | "all"; label: string }[] = [
    { value: "all", label: "All Categories" },
    { value: "crm", label: "CRM" },
    { value: "project_management", label: "Project Management" },
    { value: "marketing", label: "Marketing" },
    { value: "analytics", label: "Analytics" },
    { value: "productivity", label: "Productivity" },
    { value: "developer_tools", label: "Developer Tools" },
];

const statuses: { value: ProjectStatus | "all"; label: string }[] = [
    { value: "all", label: "All Statuses" },
    { value: "planning", label: "Planning" },
    { value: "active", label: "Active" },
    { value: "mature", label: "Mature" },
];

const sortOptions = [
    { value: "contributors", label: "Most Contributors" },
    { value: "challenges", label: "Most Challenges" },
    { value: "stars", label: "Most Stars" },
    { value: "parity", label: "Feature Parity" },
];

// ============================================================================
// PROJECT CARD
// ============================================================================

function ProjectCard({ project, viewMode }: { project: typeof mockProjects[0]; viewMode: "grid" | "list" }) {
    const statusColors = {
        planning: "text-blue-500 bg-blue-500/10",
        active: "text-emerald-500 bg-emerald-500/10",
        mature: "text-purple-500 bg-purple-500/10",
    };

    if (viewMode === "list") {
        return (
            <Link
                href={`/forge/projects/${project.slug}`}
                className="group flex items-center gap-6 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-colors"
            >
                {/* Logo */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Hammer size={32} className="text-orange-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                            {project.name}
                        </h3>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[project.status])}>
                            {project.status}
                        </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">
                        Open-source {project.targetProduct} alternative
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
                        {project.tagline}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                        <div className="font-semibold text-[var(--text-primary)]">{project.contributorCount}</div>
                        <div className="text-xs text-[var(--text-muted)]">Contributors</div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-[var(--text-primary)]">{project.openChallenges}</div>
                        <div className="text-xs text-[var(--text-muted)]">Open</div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-[var(--text-primary)]">{project.featureParityPercent}%</div>
                        <div className="text-xs text-[var(--text-muted)]">Parity</div>
                    </div>
                </div>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {project.techStack.slice(0, 3).map((tech) => (
                        <span
                            key={tech}
                            className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/forge/projects/${project.slug}`}
            className="group flex flex-col bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden hover:border-[var(--accent-primary)] transition-colors"
        >
            {/* Header */}
            <div className="p-5 border-b border-[var(--border-subtle)]">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Hammer size={28} className="text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                                {project.name}
                            </h3>
                        </div>
                        <p className="text-sm text-[var(--text-muted)]">
                            {project.targetProduct} alternative
                        </p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0", statusColors[project.status])}>
                        {project.status}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1">
                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                    {project.tagline}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[var(--text-muted)]">Feature Parity</span>
                        <span className="font-medium text-[var(--text-primary)]">
                            {project.featureParityPercent}%
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-overlay)]">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                            style={{ width: `${project.featureParityPercent}%` }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-[var(--surface-overlay)]">
                        <Users size={16} className="mx-auto text-[var(--text-muted)] mb-1" />
                        <div className="text-sm font-medium text-[var(--text-primary)]">{project.contributorCount}</div>
                        <div className="text-xs text-[var(--text-muted)]">Contributors</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-[var(--surface-overlay)]">
                        <Target size={16} className="mx-auto text-[var(--text-muted)] mb-1" />
                        <div className="text-sm font-medium text-[var(--text-primary)]">{project.openChallenges}</div>
                        <div className="text-xs text-[var(--text-muted)]">Open</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-[var(--surface-overlay)]">
                        <Star size={16} className="mx-auto text-[var(--text-muted)] mb-1" />
                        <div className="text-sm font-medium text-[var(--text-primary)]">{project.starCount}</div>
                        <div className="text-xs text-[var(--text-muted)]">Stars</div>
                    </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                    <div className="text-xs text-[var(--text-muted)] mb-2">Skills you'll learn:</div>
                    <div className="flex flex-wrap gap-1">
                        {project.skillsTaught.slice(0, 4).map((skill) => (
                            <span
                                key={skill}
                                className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-600"
                            >
                                {skill}
                            </span>
                        ))}
                        {project.skillsTaught.length > 4 && (
                            <span className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]">
                                +{project.skillsTaught.length - 4}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-[var(--surface-overlay)] border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                        {project.techStack.slice(0, 3).map((tech) => (
                            <span
                                key={tech}
                                className="px-2 py-0.5 rounded text-xs bg-[var(--surface-base)] text-[var(--text-muted)]"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                        {project.difficultyRange}
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProjectsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState<ProjectCategory | "all">("all");
    const [status, setStatus] = useState<ProjectStatus | "all">("all");
    const [sort, setSort] = useState("contributors");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showFilters, setShowFilters] = useState(false);

    // Filter projects
    const filteredProjects = mockProjects.filter((project) => {
        if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !project.tagline.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (category !== "all" && project.category !== category) return false;
        if (status !== "all" && project.status !== status) return false;
        return true;
    });

    // Sort projects
    const sortedProjects = [...filteredProjects].sort((a, b) => {
        switch (sort) {
            case "contributors":
                return b.contributorCount - a.contributorCount;
            case "challenges":
                return b.openChallenges - a.openChallenges;
            case "stars":
                return b.starCount - a.starCount;
            case "parity":
                return b.featureParityPercent - a.featureParityPercent;
            default:
                return 0;
        }
    });

    const activeFilters = [
        category !== "all" && { type: "category", value: category },
        status !== "all" && { type: "status", value: status },
    ].filter(Boolean);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                    Projects
                </h1>
                <p className="text-[var(--text-secondary)]">
                    Choose a project to contribute to. Each is an open-source alternative to popular SaaS products.
                </p>
            </div>

            {/* Search & Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                </div>

                {/* Filter Button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors",
                        showFilters
                            ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                            : "bg-[var(--surface-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    )}
                >
                    <Filter size={18} />
                    Filters
                    {activeFilters.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)] text-white text-xs">
                            {activeFilters.length}
                        </span>
                    )}
                </button>

                {/* Sort */}
                <div className="relative">
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="appearance-none px-4 py-2.5 pr-10 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                    />
                </div>

                {/* View Mode */}
                <div className="flex items-center border border-[var(--border-default)] rounded-lg overflow-hidden">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-2.5 transition-colors",
                            viewMode === "grid"
                                ? "bg-[var(--accent-primary)] text-white"
                                : "bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        )}
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "p-2.5 transition-colors",
                            viewMode === "list"
                                ? "bg-[var(--accent-primary)] text-white"
                                : "bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        )}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-4 mb-6">
                    <div className="flex flex-wrap gap-6">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Category
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                            category === cat.value
                                                ? "bg-[var(--accent-primary)] text-white"
                                                : "bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Status
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {statuses.map((st) => (
                                    <button
                                        key={st.value}
                                        onClick={() => setStatus(st.value)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                            status === st.value
                                                ? "bg-[var(--accent-primary)] text-white"
                                                : "bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters */}
            {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm text-[var(--text-muted)]">Active filters:</span>
                    {activeFilters.map((filter: any) => (
                        <button
                            key={`${filter.type}-${filter.value}`}
                            onClick={() => {
                                if (filter.type === "category") setCategory("all");
                                if (filter.type === "status") setStatus("all");
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm"
                        >
                            <span className="capitalize">{filter.value.replace("_", " ")}</span>
                            <X size={14} />
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setCategory("all");
                            setStatus("all");
                        }}
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Results count */}
            <div className="text-sm text-[var(--text-muted)] mb-4">
                Showing {sortedProjects.length} project{sortedProjects.length !== 1 ? "s" : ""}
            </div>

            {/* Projects Grid/List */}
            {sortedProjects.length > 0 ? (
                <div
                    className={cn(
                        viewMode === "grid"
                            ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            : "space-y-4"
                    )}
                >
                    {sortedProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} viewMode={viewMode} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center mx-auto mb-4">
                        <Search size={24} className="text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        No projects found
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-4">
                        Try adjusting your search or filters
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setCategory("all");
                            setStatus("all");
                        }}
                        className="text-[var(--accent-primary)] hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
}
