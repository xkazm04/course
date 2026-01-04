"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
    AlertCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { CodeEditor } from "./CodeEditor";
import type { CodeEditorHandle } from "./CodeEditor";
import { PreviewPane } from "./PreviewPane";
import { DragHandle } from "./DragHandle";
import { usePlaygroundStorage } from "../lib/usePlaygroundStorage";
import { useSplitPaneStorage } from "../lib/useSplitPaneStorage";
import { generatePreviewHtml } from "../lib/iframeExecutor";
import { getPrimaryErrorLine } from "../lib/errorLineParser";
import { useConceptBridge } from "../lib/useConceptBridge";
import type { Concept } from "../lib/conceptBridge";
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
    /** Enable concept linking feature */
    enableConceptBridge?: boolean;
    /** Map of concept definitions (id -> Concept) */
    conceptDefinitions?: Map<string, Concept>;
    /** Currently active concept ID (from external curriculum content) */
    activeConceptId?: string | null;
    /** Callback when a concept is clicked in the code */
    onConceptClick?: (concept: Concept) => void;
    /** Callback when hovering over a concept region */
    onConceptHover?: (conceptIds: string[] | null) => void;
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
    title: _title = "Code Playground",
    showFileExplorer = true,
    height = "600px",
    onCodeChange,
    enableConceptBridge = false,
    conceptDefinitions,
    activeConceptId: externalActiveConceptId = null,
    onConceptClick,
    onConceptHover,
}: CodePlaygroundProps) {
    void _title; // Title prop preserved for API compatibility
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
    const [errorLines, setErrorLines] = useState<Set<number>>(new Set());
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

    // Ref to the code editor for scroll-to-line functionality
    const editorRef = useRef<CodeEditorHandle>(null);

    // Ref to the split pane container for calculating ratios
    const splitContainerRef = useRef<HTMLDivElement>(null);

    // Split pane storage and state
    const {
        ratio: splitRatio,
        isDragging,
        updateRatio,
        resetToDefault: resetSplitRatio,
        startDragging,
        stopDragging,
    } = useSplitPaneStorage({ storageId: playgroundId });

    // Concept bridge integration
    const conceptBridge = useConceptBridge({
        files,
        conceptDefinitions,
        initialEnabled: enableConceptBridge,
        onConceptActivate: () => {
            // When a concept is activated internally, we could sync with external state
        },
        onConceptHover,
    });

    // Sync external active concept ID with internal state
    useEffect(() => {
        if (externalActiveConceptId !== conceptBridge.state.activeConceptId) {
            conceptBridge.setActiveConcept(externalActiveConceptId);
        }
    }, [externalActiveConceptId, conceptBridge]);

    // Handle mouse move during drag
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!splitContainerRef.current) return;

            const containerRect = splitContainerRef.current.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const mouseX = e.clientX - containerRect.left;

            // Calculate the new ratio based on mouse position
            const newRatio = mouseX / containerWidth;
            updateRatio(newRatio);
        };

        const handleMouseUp = () => {
            stopDragging();
        };

        // Add listeners to document for drag handling outside component
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        // Prevent text selection during drag
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isDragging, updateRatio, stopDragging]);

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
        setErrorLines(new Set()); // Clear error lines on re-run
        setHighlightedLine(null);
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
            setErrorLines(new Set()); // Clear error indicators on reset
            setHighlightedLine(null);
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
        // Parse error line numbers from the message content
        const enrichedMessage = { ...message };
        if (message.type === "error" || message.type === "warn") {
            const errorLine = getPrimaryErrorLine(message.content);
            if (errorLine) {
                enrichedMessage.lineNumber = errorLine.lineNumber;
                enrichedMessage.columnNumber = errorLine.columnNumber;

                // Add to error lines set
                setErrorLines(prev => {
                    const newSet = new Set(prev);
                    newSet.add(errorLine.lineNumber);
                    return newSet;
                });
            }
        }

        setConsoleMessages(prev => [...prev, enrichedMessage]);
        if (message.type === "error") {
            setActiveTab("console");
        }
    }, []);

    // Clear console
    const handleClearConsole = useCallback(() => {
        setConsoleMessages([]);
        setErrorLines(new Set()); // Clear error indicators when console is cleared
        setHighlightedLine(null);
    }, []);

    // Handle clicking on an error line indicator or console error
    const handleErrorLineClick = useCallback((lineNumber: number) => {
        // Switch to preview/editor tab if in console and scroll to line
        editorRef.current?.scrollToLine(lineNumber);
        setHighlightedLine(lineNumber);
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

                    {/* Editor and Preview Split - Resizable */}
                    <div
                        ref={splitContainerRef}
                        className="flex-1 flex flex-col md:flex-row min-h-0"
                        data-testid="split-pane-container"
                    >
                        {/* Editor Pane */}
                        <div
                            className="flex flex-col min-w-0 overflow-hidden"
                            style={{
                                // On mobile (flex-col), take full width
                                // On desktop (flex-row), use the split ratio
                                flex: `0 0 ${splitRatio * 100}%`,
                            }}
                            data-testid="editor-pane"
                        >
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
                                        ref={editorRef}
                                        code={activeFile.content}
                                        language={activeFile.language}
                                        onChange={handleCodeChange}
                                        className="h-full"
                                        errorLines={errorLines}
                                        highlightedLine={highlightedLine}
                                        onErrorLineClick={handleErrorLineClick}
                                        conceptRegions={conceptBridge.getRegionsForFile(activeFile.id)}
                                        activeConceptId={conceptBridge.state.activeConceptId}
                                        conceptsEnabled={enableConceptBridge && conceptBridge.state.isEnabled}
                                        getConceptsForLine={(lineNumber) => conceptBridge.getConceptsForLine(activeFile.id, lineNumber)}
                                        onConceptClick={onConceptClick}
                                        onConceptLineHover={conceptBridge.setHoveredLine}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Drag Handle - only visible on md+ */}
                        <div className="hidden md:block">
                            <DragHandle
                                isDragging={isDragging}
                                onDragStart={startDragging}
                                onDoubleClick={resetSplitRatio}
                                className="h-full"
                            />
                        </div>

                        {/* Preview Pane */}
                        <div
                            className="flex-1 flex flex-col bg-[var(--forge-bg-void)] min-w-0 overflow-hidden"
                            data-testid="preview-pane"
                        >
                            <PreviewPane
                                html={previewHtml}
                                isRunning={isRunning}
                                consoleMessages={consoleMessages}
                                onConsoleMessage={handleConsoleMessage}
                                onClearConsole={handleClearConsole}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                onErrorClick={handleErrorLineClick}
                                playgroundId={playgroundId}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CodePlayground;
