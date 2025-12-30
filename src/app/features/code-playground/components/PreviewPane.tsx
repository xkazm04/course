"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, RefreshCw, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { ConsoleMessage } from "../lib/types";

interface PreviewPaneProps {
    html: string;
    isRunning: boolean;
    consoleMessages: ConsoleMessage[];
    onConsoleMessage: (message: ConsoleMessage) => void;
    onClearConsole: () => void;
    activeTab: "preview" | "console";
    onTabChange: (tab: "preview" | "console") => void;
}

export function PreviewPane({
    html,
    isRunning,
    consoleMessages,
    onConsoleMessage,
    onClearConsole,
    activeTab,
    onTabChange,
}: PreviewPaneProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Listen for messages from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "console") {
                onConsoleMessage(event.data.payload as ConsoleMessage);
                if (event.data.payload.type === "error") {
                    setError(event.data.payload.content);
                }
            } else if (event.data?.type === "ready") {
                setIsReady(true);
                setError(null);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [onConsoleMessage]);

    // Update iframe content
    useEffect(() => {
        if (!iframeRef.current) return;

        setIsReady(false);
        setError(null);

        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;

        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
        }
    }, [html]);

    const getConsoleIcon = (type: ConsoleMessage["type"]) => {
        switch (type) {
            case "error":
                return <AlertCircle size={ICON_SIZES.xs} className="text-[var(--forge-error)] shrink-0" />;
            case "warn":
                return <AlertCircle size={ICON_SIZES.xs} className="text-[var(--forge-warning)] shrink-0" />;
            case "info":
                return <Info size={ICON_SIZES.xs} className="text-[var(--forge-info)] shrink-0" />;
            default:
                return <CheckCircle2 size={ICON_SIZES.xs} className="text-[var(--forge-success)] shrink-0" />;
        }
    };

    const getConsoleColor = (type: ConsoleMessage["type"]) => {
        switch (type) {
            case "error":
                return "text-[var(--forge-error)]";
            case "warn":
                return "text-[var(--forge-warning)]";
            case "info":
                return "text-[var(--forge-info)]";
            default:
                return "text-[var(--forge-text-secondary)]";
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--forge-bg-void)]">
            {/* Tab Bar */}
            <div className="flex items-center justify-between p-2 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-forge)]">
                <div className="flex gap-1">
                    <button
                        onClick={() => onTabChange("preview")}
                        className={cn(
                            "px-3 py-1.5 text-xs rounded transition-colors",
                            activeTab === "preview"
                                ? "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-bright)]"
                                : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        )}
                        data-testid="preview-tab-btn"
                    >
                        Preview
                        {isRunning && (
                            <RefreshCw size={ICON_SIZES.xs} className="ml-1.5 inline animate-spin" />
                        )}
                    </button>
                    <button
                        onClick={() => onTabChange("console")}
                        className={cn(
                            "px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1",
                            activeTab === "console"
                                ? "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-bright)]"
                                : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        )}
                        data-testid="console-tab-btn"
                    >
                        <Terminal size={ICON_SIZES.xs} />
                        Console
                        {consoleMessages.some(m => m.type === "error") && (
                            <span className="w-2 h-2 rounded-full bg-[var(--forge-error)] ml-1" />
                        )}
                    </button>
                </div>

                {activeTab === "console" && consoleMessages.length > 0 && (
                    <button
                        onClick={onClearConsole}
                        className="px-2 py-1 text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                        data-testid="clear-console-btn"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === "preview" ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                        >
                            {/* Loading overlay */}
                            {isRunning && (
                                <div className="absolute inset-0 bg-[var(--forge-bg-workshop)]/90 z-10 flex items-center justify-center">
                                    <div className="flex items-center gap-2 text-[var(--forge-text-secondary)]">
                                        <RefreshCw size={ICON_SIZES.md} className="animate-spin text-[var(--ember)]" />
                                        <span>Compiling...</span>
                                    </div>
                                </div>
                            )}

                            {/* Error overlay */}
                            {error && !isRunning && (
                                <div className="absolute top-0 left-0 right-0 bg-[var(--forge-error)]/10 border-b border-[var(--forge-error)]/30 p-3 z-10">
                                    <div className="icon-text-align text-[var(--forge-error)] text-xs">
                                        <AlertCircle size={ICON_SIZES.sm} data-icon />
                                        <span className="font-mono">{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* Iframe sandbox */}
                            <iframe
                                ref={iframeRef}
                                title="Preview"
                                sandbox="allow-scripts allow-same-origin"
                                className="w-full h-full bg-white border-0"
                                data-testid="preview-iframe"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="console"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[var(--forge-bg-void)] p-3 font-mono text-xs overflow-auto"
                            data-testid="console-output"
                        >
                            {consoleMessages.length === 0 ? (
                                <span className="text-[var(--forge-text-muted)] italic">
                                    Console output will appear here...
                                </span>
                            ) : (
                                <div className="space-y-1">
                                    {consoleMessages.map((msg, i) => (
                                        <motion.div
                                            key={`${msg.timestamp}-${i}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={cn(
                                                "flex items-start gap-2 py-0.5",
                                                getConsoleColor(msg.type)
                                            )}
                                        >
                                            {getConsoleIcon(msg.type)}
                                            <span className="break-all">{msg.content}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-2 flex items-center gap-2 text-[var(--forge-text-muted)]">
                                <span className="text-[var(--ember)]">&gt;</span>
                                <span className="animate-pulse">_</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default PreviewPane;
