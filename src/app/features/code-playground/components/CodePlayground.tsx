"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    RotateCcw,
    Copy,
    Check,
    FileCode,
    FolderOpen,
    ChevronDown,
    ChevronRight,
    X,
    Maximize2,
    Minimize2,
    Save,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { CodeEditor } from "./CodeEditor";
import { PreviewPane } from "./PreviewPane";
import { usePlaygroundStorage } from "../lib/usePlaygroundStorage";
import { generatePreviewHtml } from "../lib/iframeExecutor";
import type { CodeFile, ConsoleMessage, SupportedLanguage } from "../lib/types";

interface CodePlaygroundProps {
    /** Unique identifier for this playground (used for localStorage) */
    playgroundId: string;
    /** Initial files to load */
    initialFiles: CodeFile[];
    /** Title shown in the header */
    title?: string;
    /** Whether to show the file explorer sidebar */
    showFileExplorer?: boolean;
    /** Default height of the playground */
    height?: string;
    /** Callback when code changes */
    onCodeChange?: (files: CodeFile[]) => void;
}

const FILE_ICONS: Record<SupportedLanguage, string> = {
    javascript: "text-[var(--forge-warning)]",
    jsx: "text-[var(--forge-warning)]",
    typescript: "text-[var(--forge-info)]",
    tsx: "text-[var(--forge-info)]",
    css: "text-[var(--molten)]",
    html: "text-[var(--ember)]",
    json: "text-[var(--gold)]",
};

export function CodePlayground({
    playgroundId,
    initialFiles,
    title = "Code Playground",
    showFileExplorer = true,
    height = "600px",
    onCodeChange,
}: CodePlaygroundProps) {
    // State management
    const { files, updateFile, resetToOriginal, hasUnsavedChanges } = usePlaygroundStorage(
        playgroundId,
        initialFiles
    );
    const [activeFileId, setActiveFileId] = useState(
        initialFiles.find(f => f.isEntry)?.id || initialFiles[0]?.id
    );
    const [sidebarOpen, setSidebarOpen] = useState(showFileExplorer);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
    const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");
    const [previewHtml, setPreviewHtml] = useState("");

    // Get current active file
    const activeFile = useMemo(
        () => files.find(f => f.id === activeFileId) || files[0],
        [files, activeFileId]
    );

    // Handle code changes
    const handleCodeChange = useCallback(
        (newCode: string) => {
            updateFile(activeFileId, newCode);
            onCodeChange?.(files);
        },
        [activeFileId, updateFile, onCodeChange, files]
    );

    // Run the code
    const handleRun = useCallback(() => {
        setIsRunning(true);
        setConsoleMessages([]);
        setActiveTab("preview");

        // Generate preview HTML
        const html = generatePreviewHtml(files);
        setPreviewHtml(html);

        // Simulate compile time
        setTimeout(() => {
            setIsRunning(false);
        }, 500);
    }, [files]);

    // Reset to original code
    const handleReset = useCallback(() => {
        if (confirm("Reset all files to their original state? This cannot be undone.")) {
            resetToOriginal();
            setConsoleMessages([]);
            setPreviewHtml("");
        }
    }, [resetToOriginal]);

    // Copy current file code
    const handleCopy = useCallback(() => {
        if (activeFile) {
            navigator.clipboard.writeText(activeFile.content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }, [activeFile]);

    // Handle console messages from iframe
    const handleConsoleMessage = useCallback((message: ConsoleMessage) => {
        setConsoleMessages(prev => [...prev, message]);
        if (message.type === "error") {
            setActiveTab("console");
        }
    }, []);

    // Clear console
    const handleClearConsole = useCallback(() => {
        setConsoleMessages([]);
    }, []);

    // Get file icon color
    const getFileIconColor = (lang: SupportedLanguage) => FILE_ICONS[lang] || "text-[var(--forge-text-muted)]";

    return (
        <div
            className={cn(
                "bg-[var(--forge-bg-void)] rounded-2xl overflow-hidden shadow-2xl border border-[var(--forge-border-subtle)]",
                isFullscreen ? "fixed inset-4 z-50" : ""
            )}
            style={{ height: isFullscreen ? "auto" : height }}
            data-testid="code-playground"
        >
            <div className="h-full flex text-[var(--forge-text-secondary)] font-mono text-sm">
                {/* Sidebar - File Explorer */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 200, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-[var(--forge-bg-forge)] border-r border-[var(--forge-border-subtle)] flex flex-col shrink-0"
                            data-testid="file-explorer"
                        >
                            <div className="p-3 text-xs font-bold uppercase tracking-wider text-[var(--forge-text-muted)] flex justify-between items-center border-b border-[var(--forge-border-subtle)]">
                                <span className="flex items-center gap-2">
                                    <FolderOpen size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                                    Explorer
                                </span>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="hover:text-white transition-colors"
                                    data-testid="close-explorer-btn"
                                >
                                    <X size={ICON_SIZES.sm} />
                                </button>
                            </div>

                            <div className="p-2 space-y-0.5 flex-1 overflow-auto">
                                <div className="text-xs text-[var(--forge-text-muted)] px-2 py-1 uppercase tracking-wider flex items-center gap-1">
                                    <ChevronDown size={ICON_SIZES.xs} />
                                    src
                                </div>
                                {files.map((file) => (
                                    <button
                                        key={file.id}
                                        onClick={() => setActiveFileId(file.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors",
                                            activeFileId === file.id
                                                ? "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-bright)]"
                                                : "text-[var(--forge-text-muted)] hover:bg-[var(--forge-bg-anvil)] hover:text-[var(--forge-text-primary)]"
                                        )}
                                        data-testid={`file-item-${file.name}`}
                                    >
                                        <FileCode size={ICON_SIZES.sm} className={getFileIconColor(file.language)} />
                                        <span className="truncate">{file.name}</span>
                                        {file.isEntry && (
                                            <span className="text-[10px] px-1 py-0.5 bg-[var(--forge-success)]/20 text-[var(--forge-success)] rounded">
                                                entry
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Unsaved changes indicator */}
                            {hasUnsavedChanges && (
                                <div className="p-3 border-t border-[var(--forge-border-subtle)] text-xs text-[var(--forge-warning)] flex items-center gap-2">
                                    <AlertCircle size={ICON_SIZES.xs} />
                                    Modified from original
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar */}
                    <div className="h-10 bg-[var(--forge-bg-void)] border-b border-[var(--forge-border-subtle)] flex items-center px-4 gap-2">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="mr-2 p-1 hover:bg-[var(--forge-bg-elevated)] rounded transition-colors"
                                data-testid="open-explorer-btn"
                            >
                                <FolderOpen size={ICON_SIZES.sm} />
                            </button>
                        )}

                        <span className="text-[var(--forge-text-muted)]">src</span>
                        <ChevronRight size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                        <span className="text-[var(--forge-text-bright)]">{activeFile?.name}</span>

                        {hasUnsavedChanges && (
                            <span className="w-2 h-2 rounded-full bg-[var(--forge-warning)]" title="Modified" />
                        )}

                        <div className="ml-auto flex items-center gap-2 text-xs text-[var(--forge-text-muted)]">
                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                disabled={!hasUnsavedChanges}
                                className={cn(
                                    "px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors",
                                    hasUnsavedChanges
                                        ? "text-[var(--forge-warning)] hover:bg-[var(--forge-warning)]/10"
                                        : "text-[var(--forge-text-muted)] cursor-not-allowed"
                                )}
                                title="Reset to Original"
                                data-testid="reset-code-btn"
                            >
                                <RotateCcw size={ICON_SIZES.xs} />
                                Reset
                            </button>

                            {/* Copy Button */}
                            <button
                                onClick={handleCopy}
                                className="px-3 py-1.5 rounded flex items-center gap-1.5 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-bright)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
                                data-testid="copy-code-btn"
                            >
                                {isCopied ? (
                                    <>
                                        <Check size={ICON_SIZES.xs} className="text-[var(--forge-success)]" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy size={ICON_SIZES.xs} />
                                        Copy
                                    </>
                                )}
                            </button>

                            {/* Run Button */}
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                className="px-4 py-1.5 bg-gradient-forge hover:shadow-ember disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 font-bold transition-all"
                                data-testid="run-code-btn"
                            >
                                {isRunning ? (
                                    <>
                                        <RotateCcw size={ICON_SIZES.xs} className="animate-spin" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play size={ICON_SIZES.xs} />
                                        Run
                                    </>
                                )}
                            </button>

                            {/* Fullscreen Toggle */}
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-1.5 hover:bg-[var(--forge-bg-elevated)] rounded transition-colors"
                                data-testid="fullscreen-toggle-btn"
                            >
                                {isFullscreen ? (
                                    <Minimize2 size={ICON_SIZES.sm} />
                                ) : (
                                    <Maximize2 size={ICON_SIZES.sm} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Editor and Preview Split */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0">
                        {/* Editor Pane */}
                        <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--forge-border-subtle)]">
                            {/* Editor Tab Bar */}
                            <div className="flex bg-[var(--forge-bg-forge)] overflow-x-auto">
                                {files.map((file) => (
                                    <button
                                        key={file.id}
                                        onClick={() => setActiveFileId(file.id)}
                                        className={cn(
                                            "px-4 py-2 flex items-center gap-2 transition-colors",
                                            activeFileId === file.id
                                                ? "bg-[var(--forge-bg-void)] text-[var(--forge-text-bright)] border-t-2 border-t-[var(--ember)]"
                                                : "text-[var(--forge-text-muted)] hover:bg-[var(--forge-bg-void)] hover:text-[var(--forge-text-secondary)]"
                                        )}
                                        data-testid={`editor-tab-${file.name}`}
                                    >
                                        <FileCode size={ICON_SIZES.sm} className={getFileIconColor(file.language)} />
                                        <span className="text-sm">{file.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Editor Content */}
                            <div className="flex-1 overflow-hidden">
                                {activeFile && (
                                    <CodeEditor
                                        code={activeFile.content}
                                        language={activeFile.language}
                                        onChange={handleCodeChange}
                                        className="h-full"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Preview Pane */}
                        <div className="w-full md:w-[400px] flex flex-col bg-[var(--forge-bg-void)]">
                            <PreviewPane
                                html={previewHtml}
                                isRunning={isRunning}
                                consoleMessages={consoleMessages}
                                onConsoleMessage={handleConsoleMessage}
                                onClearConsole={handleClearConsole}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CodePlayground;
