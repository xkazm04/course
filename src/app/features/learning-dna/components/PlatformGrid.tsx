"use client";

import React from "react";
import { motion } from "framer-motion";
import { Link2, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { PlatformConnection, ExternalPlatform, PlatformSyncStatus } from "../lib/types";
import { PlatformConnectionCard } from "./PlatformConnectionCard";

interface PlatformGridProps {
    connections: PlatformConnection[];
    syncStatus: Record<ExternalPlatform, PlatformSyncStatus>;
    onConnect: (platform: ExternalPlatform, username?: string) => Promise<void>;
    onDisconnect: (platform: ExternalPlatform) => void;
    onSync: (platform: ExternalPlatform) => Promise<void>;
    onSyncAll: () => Promise<void>;
    isSyncing: boolean;
    className?: string;
}

/**
 * Platform Grid - Displays all platform connections in a grid layout
 */
export function PlatformGrid({
    connections,
    syncStatus,
    onConnect,
    onDisconnect,
    onSync,
    onSyncAll,
    isSyncing,
    className,
}: PlatformGridProps) {
    const connectedCount = connections.filter((c) => c.status === "connected").length;

    return (
        <div className={className} data-testid="platform-grid">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Link2 size={ICON_SIZES.lg} className="text-[var(--color-indigo)]" />
                        Connected Platforms
                    </h2>
                    <p className="text-sm text-[var(--text-muted-high)] mt-1">
                        {connectedCount} of {connections.length} platforms connected
                    </p>
                </div>

                {connectedCount > 0 && (
                    <button
                        onClick={onSyncAll}
                        disabled={isSyncing}
                        className={cn(
                            "px-4 py-2 rounded-xl font-medium transition-all",
                            "bg-[var(--surface-elevated)] hover:bg-[var(--surface-overlay)]",
                            "text-[var(--text-primary)] text-sm",
                            "flex items-center gap-2 border border-[var(--border-default)]",
                            isSyncing && "opacity-50 cursor-not-allowed"
                        )}
                        data-testid="sync-all-platforms-btn"
                    >
                        {isSyncing ? (
                            <Loader2 size={ICON_SIZES.sm} className="animate-spin" />
                        ) : (
                            <RefreshCw size={ICON_SIZES.sm} />
                        )}
                        Sync All
                    </button>
                )}
            </div>

            {/* Connected Platforms */}
            {connectedCount > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted-high)] mb-3">
                        Active Connections
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {connections
                            .filter((c) => c.status === "connected")
                            .map((connection, i) => (
                                <motion.div
                                    key={connection.platform}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <PlatformConnectionCard
                                        connection={connection}
                                        syncStatus={syncStatus[connection.platform]}
                                        onConnect={onConnect}
                                        onDisconnect={onDisconnect}
                                        onSync={onSync}
                                    />
                                </motion.div>
                            ))}
                    </div>
                </div>
            )}

            {/* Available Platforms */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted-high)] mb-3">
                    Available Platforms
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {connections
                        .filter((c) => c.status !== "connected")
                        .map((connection, i) => (
                            <motion.div
                                key={connection.platform}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <PlatformConnectionCard
                                    connection={connection}
                                    syncStatus={syncStatus[connection.platform]}
                                    onConnect={onConnect}
                                    onDisconnect={onDisconnect}
                                    onSync={onSync}
                                />
                            </motion.div>
                        ))}
                </div>
            </div>

            {/* Empty State */}
            {connections.length === 0 && (
                <div className="text-center py-12">
                    <Link2
                        size={ICON_SIZES.xl}
                        className="mx-auto mb-4 text-[var(--text-muted)]"
                    />
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                        No Platforms Available
                    </h3>
                    <p className="text-sm text-[var(--text-muted-high)]">
                        Platform integrations are being configured
                    </p>
                </div>
            )}
        </div>
    );
}
