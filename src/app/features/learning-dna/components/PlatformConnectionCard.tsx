"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Github,
    HelpCircle,
    Code2,
    GraduationCap,
    BookOpen,
    Trophy,
    Swords,
    Linkedin,
    Layers,
    Link,
    Unlink,
    RefreshCw,
    Check,
    X,
    Loader2,
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { PlatformConnection, ExternalPlatform, PlatformSyncStatus } from "../lib/types";
import { getPlatformConfig } from "../lib/platformConfig";

interface PlatformConnectionCardProps {
    connection: PlatformConnection;
    syncStatus?: PlatformSyncStatus;
    onConnect: (platform: ExternalPlatform, username?: string) => Promise<void>;
    onDisconnect: (platform: ExternalPlatform) => void;
    onSync: (platform: ExternalPlatform) => Promise<void>;
}

// Icon mapping
const PLATFORM_ICONS: Record<ExternalPlatform, React.ComponentType<{ size?: number; className?: string }>> = {
    github: Github,
    stackoverflow: HelpCircle,
    leetcode: Code2,
    coursera: GraduationCap,
    udemy: BookOpen,
    hackerrank: Trophy,
    codewars: Swords,
    linkedin: Linkedin,
    pluralsight: Layers,
};

/**
 * Platform Connection Card - Individual platform connection management
 */
export function PlatformConnectionCard({
    connection,
    syncStatus,
    onConnect,
    onDisconnect,
    onSync,
}: PlatformConnectionCardProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [username, setUsername] = useState("");
    const [showUsernameInput, setShowUsernameInput] = useState(false);

    const config = getPlatformConfig(connection.platform);
    const Icon = PLATFORM_ICONS[connection.platform];
    const isConnected = connection.status === "connected";
    const isSyncing = syncStatus?.status === "syncing";

    const handleConnect = async () => {
        if (connection.supportsOAuth) {
            setIsConnecting(true);
            await onConnect(connection.platform);
        } else {
            setShowUsernameInput(true);
        }
    };

    const handleUsernameSubmit = async () => {
        if (!username.trim()) return;
        setIsConnecting(true);
        try {
            await onConnect(connection.platform, username.trim());
            setShowUsernameInput(false);
            setUsername("");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        onDisconnect(connection.platform);
    };

    const handleSync = async () => {
        await onSync(connection.platform);
    };

    return (
        <PrismaticCard
            glowColor={isConnected ? "emerald" : "purple"}
            static
            className="transition-transform hover:scale-[1.01]"
        >
            <div
                className="p-4"
                data-testid={`platform-card-${connection.platform}`}
            >
                <div className="flex items-center gap-4">
                    {/* Platform Icon */}
                    <div
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            isConnected
                                ? "bg-[var(--status-success-bg)]"
                                : "bg-[var(--surface-inset)]"
                        )}
                        style={{
                            borderColor: isConnected ? config.color : undefined,
                            borderWidth: isConnected ? 2 : 0,
                        }}
                    >
                        <Icon
                            size={ICON_SIZES.lg}
                            className={cn(
                                isConnected
                                    ? "text-[var(--status-success-text)]"
                                    : "text-[var(--text-muted)]"
                            )}
                        />
                    </div>

                    {/* Platform Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[var(--text-primary)]">
                                {connection.displayName}
                            </h4>
                            {isConnected && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success-text)]">
                                    Connected
                                </span>
                            )}
                        </div>
                        {isConnected && connection.username && (
                            <p className="text-sm text-[var(--text-muted-high)] truncate">
                                @{connection.username}
                            </p>
                        )}
                        {!isConnected && (
                            <p className="text-xs text-[var(--text-muted)]">
                                {config.supportsOAuth ? "OAuth" : "Username"}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <>
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        "bg-[var(--surface-inset)] hover:bg-[var(--surface-overlay)]",
                                        isSyncing && "opacity-50 cursor-not-allowed"
                                    )}
                                    data-testid={`platform-sync-${connection.platform}-btn`}
                                >
                                    <RefreshCw
                                        size={ICON_SIZES.sm}
                                        className={cn(
                                            "text-[var(--text-secondary)]",
                                            isSyncing && "animate-spin"
                                        )}
                                    />
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="p-2 rounded-lg bg-[var(--surface-inset)] hover:bg-[var(--status-error-bg)] transition-colors group"
                                    data-testid={`platform-disconnect-${connection.platform}-btn`}
                                >
                                    <Unlink
                                        size={ICON_SIZES.sm}
                                        className="text-[var(--text-secondary)] group-hover:text-[var(--status-error-text)]"
                                    />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className={cn(
                                    "px-4 py-2 rounded-xl font-medium transition-all",
                                    "bg-[var(--surface-inset)] hover:bg-[var(--surface-overlay)]",
                                    "text-[var(--text-primary)] text-sm",
                                    "flex items-center gap-2",
                                    isConnecting && "opacity-50 cursor-not-allowed"
                                )}
                                data-testid={`platform-connect-${connection.platform}-btn`}
                            >
                                {isConnecting ? (
                                    <Loader2 size={ICON_SIZES.sm} className="animate-spin" />
                                ) : (
                                    <Link size={ICON_SIZES.sm} />
                                )}
                                Connect
                            </button>
                        )}
                    </div>
                </div>

                {/* Username Input for non-OAuth platforms */}
                <AnimatePresence>
                    {showUsernameInput && !isConnected && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-[var(--border-subtle)]"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={`Enter your ${connection.displayName} username`}
                                    className={cn(
                                        "flex-1 px-3 py-2 rounded-lg text-sm",
                                        "bg-[var(--surface-inset)] border border-[var(--border-default)]",
                                        "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                        "focus:outline-none focus:ring-2 focus:ring-[var(--color-indigo)]"
                                    )}
                                    data-testid={`platform-username-input-${connection.platform}`}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleUsernameSubmit();
                                    }}
                                />
                                <button
                                    onClick={handleUsernameSubmit}
                                    disabled={!username.trim() || isConnecting}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        "bg-[var(--color-emerald)] hover:opacity-90",
                                        (!username.trim() || isConnecting) && "opacity-50 cursor-not-allowed"
                                    )}
                                    data-testid={`platform-username-submit-${connection.platform}-btn`}
                                >
                                    {isConnecting ? (
                                        <Loader2 size={ICON_SIZES.sm} className="animate-spin text-white" />
                                    ) : (
                                        <Check size={ICON_SIZES.sm} className="text-white" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowUsernameInput(false);
                                        setUsername("");
                                    }}
                                    className="p-2 rounded-lg bg-[var(--surface-inset)] hover:bg-[var(--status-error-bg)] transition-colors"
                                    data-testid={`platform-username-cancel-${connection.platform}-btn`}
                                >
                                    <X size={ICON_SIZES.sm} className="text-[var(--text-secondary)]" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sync Status */}
                {isConnected && syncStatus && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-muted)]">
                                {syncStatus.signalsCount} signals collected
                            </span>
                            {syncStatus.lastSyncAt && (
                                <span className="text-[var(--text-muted)]">
                                    Last sync: {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {connection.status === "error" && connection.errorMessage && (
                    <div className="mt-3 p-2 rounded-lg bg-[var(--status-error-bg)] text-[var(--status-error-text)] text-xs">
                        {connection.errorMessage}
                    </div>
                )}
            </div>
        </PrismaticCard>
    );
}
