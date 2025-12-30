"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Upload, Copy, Check, AlertCircle } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface ProgressExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: () => string;
    onDownload: (filename?: string) => void;
    onImport: (jsonString: string) => boolean;
}

export function ProgressExportModal({
    isOpen,
    onClose,
    onExport,
    onDownload,
    onImport,
}: ProgressExportModalProps) {
    const [activeTab, setActiveTab] = useState<"export" | "import">("export");
    const [copied, setCopied] = useState(false);
    const [importText, setImportText] = useState("");
    const [importError, setImportError] = useState("");
    const [importSuccess, setImportSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCopy = () => {
        const data = onExport();
        navigator.clipboard.writeText(data);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        onDownload();
    };

    const handleImport = () => {
        setImportError("");
        setImportSuccess(false);
        if (!importText.trim()) {
            setImportError("Please paste your progress data");
            return;
        }
        const success = onImport(importText);
        if (success) {
            setImportSuccess(true);
            setImportText("");
            setTimeout(() => {
                onClose();
            }, 1500);
        } else {
            setImportError("Invalid progress data format");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setImportText(content);
        };
        reader.readAsText(file);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="w-full max-w-lg bg-[var(--forge-bg-elevated)] rounded-2xl shadow-2xl overflow-hidden"
                            data-testid="progress-export-modal"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                                <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">
                                    Progress Data
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2"
                                    data-testid="modal-close-btn"
                                >
                                    <X size={ICON_SIZES.md} />
                                </button>
                            </div>

                            <div className="flex border-b border-[var(--forge-border-subtle)]">
                                <button
                                    onClick={() => setActiveTab("export")}
                                    className={cn(
                                        "flex-1 py-3 text-sm font-medium transition-colors",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ember)]",
                                        activeTab === "export"
                                            ? "text-[var(--ember)] border-b-2 border-[var(--ember)]"
                                            : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                                    )}
                                    data-testid="export-tab-btn"
                                >
                                    <Download size={ICON_SIZES.sm} className="inline-block mr-2" />
                                    Export
                                </button>
                                <button
                                    onClick={() => setActiveTab("import")}
                                    className={cn(
                                        "flex-1 py-3 text-sm font-medium transition-colors",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ember)]",
                                        activeTab === "import"
                                            ? "text-[var(--ember)] border-b-2 border-[var(--ember)]"
                                            : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                                    )}
                                    data-testid="import-tab-btn"
                                >
                                    <Upload size={ICON_SIZES.sm} className="inline-block mr-2" />
                                    Import
                                </button>
                            </div>

                            <div className="p-4">
                                {activeTab === "export" ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-[var(--forge-text-secondary)]">
                                            Export your learning progress to keep a backup or transfer to another device.
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleDownload}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--ember)] hover:opacity-90 text-[var(--forge-text-primary)] rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2"
                                                data-testid="download-json-btn"
                                            >
                                                <Download size={ICON_SIZES.md} />
                                                Download JSON
                                            </button>
                                            <button
                                                onClick={handleCopy}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--forge-bg-anvil)] hover:bg-[var(--forge-bg-workshop)] text-[var(--forge-text-primary)] rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2"
                                                data-testid="copy-json-btn"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check size={ICON_SIZES.md} />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={ICON_SIZES.md} />
                                                        Copy to Clipboard
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-[var(--forge-text-secondary)]">
                                            Import progress data from a backup file or paste JSON directly.
                                        </p>

                                        <div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".json"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                data-testid="file-input"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full py-3 border-2 border-dashed border-[var(--forge-border-subtle)] rounded-xl text-[var(--forge-text-secondary)] hover:border-[var(--ember)] hover:text-[var(--ember)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2"
                                                data-testid="upload-file-btn"
                                            >
                                                <Upload size={ICON_SIZES.md} className="inline-block mr-2" />
                                                Upload JSON File
                                            </button>
                                        </div>

                                        <div className="text-center text-xs text-[var(--forge-text-muted)]">
                                            or paste JSON below
                                        </div>

                                        <textarea
                                            value={importText}
                                            onChange={(e) => setImportText(e.target.value)}
                                            placeholder="Paste your progress JSON here..."
                                            className="w-full h-32 p-3 text-sm bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ember)]"
                                            data-testid="import-textarea"
                                        />

                                        {importError && (
                                            <div className="flex items-center gap-2 text-sm text-[var(--forge-error)]">
                                                <AlertCircle size={ICON_SIZES.sm} />
                                                {importError}
                                            </div>
                                        )}

                                        {importSuccess && (
                                            <div className="flex items-center gap-2 text-sm text-[var(--forge-success)]">
                                                <Check size={ICON_SIZES.sm} />
                                                Progress imported successfully!
                                            </div>
                                        )}

                                        <button
                                            onClick={handleImport}
                                            disabled={!importText.trim()}
                                            className={cn(
                                                "w-full py-3 rounded-xl font-medium transition-colors",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2",
                                                importText.trim()
                                                    ? "bg-[var(--ember)] hover:opacity-90 text-[var(--forge-text-primary)]"
                                                    : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] cursor-not-allowed"
                                            )}
                                            data-testid="import-btn"
                                        >
                                            Import Progress
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
