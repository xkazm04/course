"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Filter,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Archive,
    Clock,
    ChevronLeft,
    LayoutGrid,
    List,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ChallengeReviewCard } from "./components/ChallengeReviewCard";

// Types matching the API
interface ChallengeLocation {
    file: string;
    startLine: number;
    endLine: number;
}

interface Challenge {
    id: string;
    project_id: string;
    type: "bug" | "smell" | "missing_feature" | "security" | "performance";
    severity: "low" | "medium" | "high" | "critical";
    difficulty: "beginner" | "intermediate" | "advanced";
    title: string;
    description: string;
    location: ChallengeLocation;
    code_snippet?: string;
    context_before?: string;
    context_after?: string;
    user_instructions: string;
    expected_output: string;
    hints?: string[];
    tags?: string[];
    estimated_minutes?: number;
    status: "pending" | "approved" | "rejected" | "archived";
    created_at: string;
    project?: {
        id: string;
        name: string;
        language: string;
        framework?: string;
    };
}

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "archived";
type ViewMode = "grid" | "list";

const STATUS_TABS: { value: StatusFilter; label: string; icon: React.ElementType }[] = [
    { value: "all", label: "All", icon: LayoutGrid },
    { value: "pending", label: "Pending", icon: Clock },
    { value: "approved", label: "Approved", icon: CheckCircle2 },
    { value: "rejected", label: "Rejected", icon: XCircle },
    { value: "archived", label: "Archived", icon: Archive },
];

export default function RemixAdminPage() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("list");

    const fetchChallenges = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") {
                params.set("status", statusFilter);
            }

            const response = await fetch(`/api/remix/challenges?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch challenges");
            }

            const data = await response.json();
            setChallenges(data.challenges || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    const handleApprove = async (id: string, notes?: string) => {
        const response = await fetch(`/api/remix/challenges/${id}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve", notes }),
        });

        if (!response.ok) {
            throw new Error("Failed to approve challenge");
        }

        // Remove from current list or update status
        setChallenges((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
        );
    };

    const handleReject = async (id: string, notes?: string) => {
        const response = await fetch(`/api/remix/challenges/${id}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reject", notes }),
        });

        if (!response.ok) {
            throw new Error("Failed to reject challenge");
        }

        setChallenges((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c))
        );
    };

    const handleArchive = async (id: string) => {
        const response = await fetch(`/api/remix/challenges/${id}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "archive" }),
        });

        if (!response.ok) {
            throw new Error("Failed to archive challenge");
        }

        setChallenges((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "archived" } : c))
        );
    };

    // Filter challenges by search query
    const filteredChallenges = challenges.filter((challenge) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            challenge.title.toLowerCase().includes(query) ||
            challenge.description.toLowerCase().includes(query) ||
            challenge.location.file.toLowerCase().includes(query) ||
            challenge.project?.name.toLowerCase().includes(query)
        );
    });

    // Count by status for badges
    const statusCounts = challenges.reduce(
        (acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            acc.all = (acc.all || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    return (
        <div className="min-h-screen bg-[var(--surface-base)]">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-[var(--border-default)] bg-[var(--surface-elevated)]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <a
                                href="/"
                                className="p-2 rounded-lg hover:bg-[var(--surface-overlay)] transition-colors text-[var(--text-muted)]"
                            >
                                <ChevronLeft size={ICON_SIZES.md} />
                            </a>
                            <div>
                                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                                    Remix Challenge Review
                                </h1>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Review and approve scanned challenges
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={fetchChallenges}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:bg-[var(--surface-base)] transition-colors disabled:opacity-50"
                        >
                            <RefreshCw
                                size={ICON_SIZES.sm}
                                className={cn(isLoading && "animate-spin")}
                            />
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            {/* Status Tabs */}
            <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-1">
                        {STATUS_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const count = statusCounts[tab.value] || 0;
                            const isActive = statusFilter === tab.value;

                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                        isActive
                                            ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                            : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                    )}
                                >
                                    <Icon size={ICON_SIZES.sm} />
                                    {tab.label}
                                    {count > 0 && (
                                        <span
                                            className={cn(
                                                "px-1.5 py-0.5 rounded text-xs",
                                                isActive
                                                    ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                                                    : "bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                            )}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search
                                size={ICON_SIZES.sm}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search challenges..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] p-1">
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "p-2 rounded transition-colors",
                                    viewMode === "list"
                                        ? "bg-[var(--surface-overlay)] text-[var(--text-primary)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                )}
                            >
                                <List size={ICON_SIZES.sm} />
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-2 rounded transition-colors",
                                    viewMode === "grid"
                                        ? "bg-[var(--surface-overlay)] text-[var(--text-primary)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                )}
                            >
                                <LayoutGrid size={ICON_SIZES.sm} />
                            </button>
                        </div>

                        {/* Filter Button (placeholder for future) */}
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] transition-colors">
                            <Filter size={ICON_SIZES.sm} />
                            Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                    >
                        <AlertCircle size={ICON_SIZES.md} className="text-red-400" />
                        <div>
                            <p className="font-medium text-red-400">Error loading challenges</p>
                            <p className="text-sm text-red-400/80">{error}</p>
                        </div>
                        <button
                            onClick={fetchChallenges}
                            className="ml-auto px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                            Retry
                        </button>
                    </motion.div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw size={ICON_SIZES.lg} className="animate-spin text-[var(--text-muted)]" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredChallenges.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-overlay)] flex items-center justify-center">
                            <Archive size={ICON_SIZES.lg} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                            No challenges found
                        </h3>
                        <p className="text-[var(--text-muted)]">
                            {searchQuery
                                ? "Try adjusting your search query"
                                : `No ${statusFilter === "all" ? "" : statusFilter} challenges to review`}
                        </p>
                    </motion.div>
                )}

                {/* Challenge List */}
                {!isLoading && !error && filteredChallenges.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                            viewMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                                : "space-y-4"
                        )}
                    >
                        {filteredChallenges.map((challenge) => (
                            <ChallengeReviewCard
                                key={challenge.id}
                                challenge={challenge}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onArchive={handleArchive}
                            />
                        ))}
                    </motion.div>
                )}

                {/* Summary Footer */}
                {!isLoading && filteredChallenges.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] text-center text-sm text-[var(--text-muted)]">
                        Showing {filteredChallenges.length} of {challenges.length} challenges
                    </div>
                )}
            </main>
        </div>
    );
}
