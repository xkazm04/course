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
                return <AlertCircle size={ICON_SIZES.xs} className="text-red-400 shrink-0" />;
            case "warn":
                return <AlertCircle size={ICON_SIZES.xs} className="text-amber-400 shrink-0" />;
            case "info":
                return <Info size={ICON_SIZES.xs} className="text-blue-400 shrink-0" />;
            default:
                return <CheckCircle2 size={ICON_SIZES.xs} className="text-emerald-400 shrink-0" />;
        }
    };

    const getConsoleColor = (type: ConsoleMessage["type"]) => {
        switch (type) {
            case "error":
                return "text-red-400";
            case "warn":
                return "text-amber-400";
            case "info":
                return "text-blue-400";
            default:
                return "text-neutral-300";
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Tab Bar */}
            <div className="flex items-center justify-between p-2 border-b border-[#3e3e42] bg-[#252526]">
                <div className="flex gap-1">
                    <button
                        onClick={() => onTabChange("preview")}
                        className={cn(
                            "px-3 py-1.5 text-xs rounded transition-colors",
                            activeTab === "preview"
                                ? "bg-[#3e3e42] text-white"
                                : "text-neutral-500 hover:text-neutral-300"
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
                                ? "bg-[#3e3e42] text-white"
                                : "text-neutral-500 hover:text-neutral-300"
                        )}
                        data-testid="console-tab-btn"
                    >
                        <Terminal size={ICON_SIZES.xs} />
                        Console
                        {consoleMessages.some(m => m.type === "error") && (
                            <span className="w-2 h-2 rounded-full bg-red-500 ml-1" />
                        )}
                    </button>
                </div>

                {activeTab === "console" && consoleMessages.length > 0 && (
                    <button
                        onClick={onClearConsole}
                        className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
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
                                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-10 flex items-center justify-center">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <RefreshCw size={ICON_SIZES.md} className="animate-spin" />
                                        <span>Compiling...</span>
                                    </div>
                                </div>
                            )}

                            {/* Error overlay */}
                            {error && !isRunning && (
                                <div className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-red-500/30 p-3 z-10">
                                    <div className="icon-text-align text-red-400 text-xs">
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
                            className="absolute inset-0 bg-[#1e1e1e] p-3 font-mono text-xs overflow-auto"
                            data-testid="console-output"
                        >
                            {consoleMessages.length === 0 ? (
                                <span className="text-neutral-600 italic">
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
                            <div className="mt-2 flex items-center gap-2 text-neutral-600">
                                <span className="text-emerald-500">&gt;</span>
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
