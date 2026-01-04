"use client";

import { useId } from "react";
import { Search } from "lucide-react";
import type { Challenge } from "../../lib/types";
import type { SortKey, SortDir } from "./constants";
import { SortableHeader } from "./SortableHeader";
import { ChallengeRow } from "./ChallengeRow";

interface ChallengesTableProps {
    challenges: Challenge[];
    totalCount: number;
    sortKey: SortKey;
    sortDir: SortDir;
    onSort: (key: SortKey) => void;
    onClearFilters: () => void;
}

export function ChallengesTable({
    challenges,
    totalCount,
    sortKey,
    sortDir,
    onSort,
    onClearFilters,
}: ChallengesTableProps) {
    const tableId = useId();
    const captionId = `${tableId}-caption`;

    // Helper to get aria-sort value
    const getAriaSort = (key: SortKey): "ascending" | "descending" | "none" => {
        if (sortKey === key) {
            return sortDir === "asc" ? "ascending" : "descending";
        }
        return "none";
    };

    // Grid column template for consistent layout
    const gridCols = "grid-cols-[2fr_100px_80px_100px_80px_70px_70px_60px]";

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm overflow-hidden">
            <table
                className="w-full border-collapse table-fixed"
                aria-rowcount={totalCount}
                aria-describedby={captionId}
                data-testid="challenges-table"
            >
                <caption id={captionId} className="sr-only">
                    Challenges table. Showing {challenges.length} of {totalCount} challenges.
                    Use column headers to sort.
                </caption>

                {/* Table header - using CSS grid with display:contents trick */}
                <thead className="bg-[var(--forge-bg-elevated)] border-b border-[var(--forge-border-subtle)]">
                    <tr
                        className={`grid ${gridCols} gap-4 px-4 py-3`}
                        role="row"
                    >
                        <th
                            scope="col"
                            aria-sort={getAriaSort("title")}
                            className="text-left"
                        >
                            <SortableHeader
                                label="Challenge"
                                sortKey="title"
                                currentSort={sortKey}
                                currentDir={sortDir}
                                onSort={onSort}
                                data-testid="sort-header-title"
                            />
                        </th>
                        <th
                            scope="col"
                            aria-sort={getAriaSort("difficulty")}
                            className="text-left"
                        >
                            <SortableHeader
                                label="Difficulty"
                                sortKey="difficulty"
                                currentSort={sortKey}
                                currentDir={sortDir}
                                onSort={onSort}
                                data-testid="sort-header-difficulty"
                            />
                        </th>
                        <th
                            scope="col"
                            className="text-left text-xs font-medium uppercase tracking-wider text-[var(--forge-text-muted)]"
                        >
                            Type
                        </th>
                        <th
                            scope="col"
                            aria-sort={getAriaSort("xpReward")}
                            className="text-right"
                        >
                            <SortableHeader
                                label="XP"
                                sortKey="xpReward"
                                currentSort={sortKey}
                                currentDir={sortDir}
                                onSort={onSort}
                                align="right"
                                data-testid="sort-header-xp"
                            />
                        </th>
                        <th
                            scope="col"
                            aria-sort={getAriaSort("estimatedMinutes")}
                            className="text-right"
                        >
                            <SortableHeader
                                label="Time"
                                sortKey="estimatedMinutes"
                                currentSort={sortKey}
                                currentDir={sortDir}
                                onSort={onSort}
                                align="right"
                                data-testid="sort-header-time"
                            />
                        </th>
                        <th
                            scope="col"
                            aria-sort={getAriaSort("timesCompleted")}
                            className="text-center"
                        >
                            <SortableHeader
                                label="Done"
                                sortKey="timesCompleted"
                                currentSort={sortKey}
                                currentDir={sortDir}
                                onSort={onSort}
                                align="center"
                                data-testid="sort-header-done"
                            />
                        </th>
                        <th
                            scope="col"
                            aria-sort={getAriaSort("successRate")}
                            className="text-center"
                        >
                            <SortableHeader
                                label="Success"
                                sortKey="successRate"
                                currentSort={sortKey}
                                currentDir={sortDir}
                                onSort={onSort}
                                align="center"
                                data-testid="sort-header-success"
                            />
                        </th>
                        <th scope="col">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>

                {/* Table body */}
                <tbody className="divide-y divide-[var(--forge-border-subtle)]">
                    {challenges.length > 0 ? (
                        challenges.map((challenge, index) => (
                            <ChallengeRow
                                key={challenge.id}
                                challenge={challenge}
                                index={index}
                                rowIndex={index + 2}
                                gridCols={gridCols}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="text-center py-16">
                                <div className="w-12 h-12 rounded-full bg-[var(--forge-bg-elevated)] flex items-center justify-center mx-auto mb-3">
                                    <Search size={20} className="text-[var(--forge-text-muted)]" />
                                </div>
                                <h3 className="font-medium text-[var(--forge-text-primary)] mb-1">No challenges found</h3>
                                <p className="text-sm text-[var(--forge-text-muted)] mb-4">Try adjusting your filters</p>
                                <button
                                    onClick={onClearFilters}
                                    className="text-sm text-[var(--ember)] hover:underline"
                                    data-testid="clear-filters-btn"
                                >
                                    Clear all filters
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>

                {/* Table footer */}
                {challenges.length > 0 && (
                    <tfoot>
                        <tr>
                            <td
                                colSpan={8}
                                className="px-4 py-3 bg-[var(--forge-bg-elevated)] border-t border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-secondary)]"
                            >
                                Showing {challenges.length} of {totalCount} challenges
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}
