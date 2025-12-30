"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Play,
    Save,
    Upload,
    CheckCircle,
    Loader2,
    FileCode,
    Package,
    Terminal,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { CodeSnapshot, DeploymentStatus } from "../lib/types";

interface SubmissionEditorProps {
    challengeId: string;
    initialCode?: string;
    onSaveDraft?: (code: string) => void;
    onSubmit?: (snapshot: CodeSnapshot) => Promise<void>;
    deploymentStatus?: DeploymentStatus;
    isSubmitting?: boolean;
}

export const SubmissionEditor: React.FC<SubmissionEditorProps> = ({
    challengeId,
    initialCode = "",
    onSaveDraft,
    onSubmit,
    deploymentStatus = "pending",
    isSubmitting = false,
}) => {
    const [code, setCode] = useState(initialCode);
    const [activeTab, setActiveTab] = useState<"code" | "deps" | "config">("code");
    const [dependencies, setDependencies] = useState<Record<string, string>>({});
    const [buildCommand, setBuildCommand] = useState("npm run build");
    const [startCommand, setStartCommand] = useState("npm start");
    const [isSaving, setIsSaving] = useState(false);

    // Auto-save draft
    useEffect(() => {
        const timer = setTimeout(() => {
            if (code !== initialCode) {
                onSaveDraft?.(code);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [code, initialCode, onSaveDraft]);

    const handleSave = () => {
        setIsSaving(true);
        onSaveDraft?.(code);
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleSubmit = async () => {
        const snapshot: CodeSnapshot = {
            files: [{ path: "index.ts", content: code }],
            dependencies,
            buildCommand,
            startCommand,
        };
        await onSubmit?.(snapshot);
    };

    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--border-default)]",
                "bg-[var(--surface-elevated)] overflow-hidden",
                elevation.elevated
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                    <FileCode size={ICON_SIZES.md} className="text-[var(--accent-primary)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">
                        Submission Editor
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <DeploymentStatusBadge status={deploymentStatus} />
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:bg-[var(--surface-base)] transition-colors"
                    >
                        {isSaving ? (
                            <Loader2 size={ICON_SIZES.sm} className="animate-spin" />
                        ) : (
                            <Save size={ICON_SIZES.sm} />
                        )}
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !code.trim()}
                        className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 size={ICON_SIZES.sm} className="animate-spin" />
                        ) : (
                            <Upload size={ICON_SIZES.sm} />
                        )}
                        Submit
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-subtle)]">
                <TabButton
                    active={activeTab === "code"}
                    onClick={() => setActiveTab("code")}
                    icon={FileCode}
                    label="Code"
                />
                <TabButton
                    active={activeTab === "deps"}
                    onClick={() => setActiveTab("deps")}
                    icon={Package}
                    label="Dependencies"
                />
                <TabButton
                    active={activeTab === "config"}
                    onClick={() => setActiveTab("config")}
                    icon={Terminal}
                    label="Config"
                />
            </div>

            {/* Content */}
            <div className="p-4">
                {activeTab === "code" && (
                    <CodeEditor code={code} onChange={setCode} />
                )}
                {activeTab === "deps" && (
                    <DependenciesEditor
                        dependencies={dependencies}
                        onChange={setDependencies}
                    />
                )}
                {activeTab === "config" && (
                    <ConfigEditor
                        buildCommand={buildCommand}
                        startCommand={startCommand}
                        onBuildCommandChange={setBuildCommand}
                        onStartCommandChange={setStartCommand}
                    />
                )}
            </div>
        </div>
    );
};

// Tab button
interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            active
                ? "text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        )}
    >
        <Icon size={ICON_SIZES.sm} />
        {label}
    </button>
);

// Deployment status badge
interface DeploymentStatusBadgeProps {
    status: DeploymentStatus;
}

const DeploymentStatusBadge: React.FC<DeploymentStatusBadgeProps> = ({ status }) => {
    const config = {
        pending: { label: "Pending", color: "text-[var(--forge-text-muted)]", bg: "bg-[var(--forge-bg-elevated)]" },
        building: { label: "Building", color: "text-[var(--forge-info)]", bg: "bg-[var(--forge-info)]/20", animate: true },
        deploying: { label: "Deploying", color: "text-[var(--ember)]", bg: "bg-[var(--ember)]/20", animate: true },
        running: { label: "Running", color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/20" },
        failed: { label: "Failed", color: "text-[var(--forge-error)]", bg: "bg-[var(--forge-error)]/20" },
        terminated: { label: "Terminated", color: "text-[var(--forge-text-muted)]", bg: "bg-[var(--forge-bg-elevated)]" },
    }[status];

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                config.bg,
                config.color
            )}
        >
            {config.animate && <Loader2 size={12} className="animate-spin" />}
            {status === "running" && <CheckCircle size={12} />}
            {config.label}
        </span>
    );
};

// Code editor (simplified)
interface CodeEditorProps {
    code: string;
    onChange: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => (
    <div className="relative">
        <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            placeholder="// Write your solution here..."
            className={cn(
                "w-full h-[400px] p-4 rounded-lg font-mono text-sm",
                "bg-[var(--surface-base)] border border-[var(--border-default)]",
                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50",
                "resize-none"
            )}
        />
        <div className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)]">
            {code.length} characters
        </div>
    </div>
);

// Dependencies editor
interface DependenciesEditorProps {
    dependencies: Record<string, string>;
    onChange: (deps: Record<string, string>) => void;
}

const DependenciesEditor: React.FC<DependenciesEditorProps> = ({
    dependencies,
    onChange,
}) => {
    const [newPkg, setNewPkg] = useState("");
    const [newVersion, setNewVersion] = useState("latest");

    const addDependency = () => {
        if (newPkg.trim()) {
            onChange({ ...dependencies, [newPkg.trim()]: newVersion });
            setNewPkg("");
            setNewVersion("latest");
        }
    };

    const removeDependency = (pkg: string) => {
        const { [pkg]: _, ...rest } = dependencies;
        onChange(rest);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newPkg}
                    onChange={(e) => setNewPkg(e.target.value)}
                    placeholder="Package name"
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm"
                />
                <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="Version"
                    className="w-24 px-3 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm"
                />
                <button
                    onClick={addDependency}
                    className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm"
                >
                    Add
                </button>
            </div>
            <div className="space-y-2">
                {Object.entries(dependencies).map(([pkg, version]) => (
                    <div
                        key={pkg}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-overlay)]"
                    >
                        <div>
                            <span className="font-medium text-[var(--text-primary)]">{pkg}</span>
                            <span className="text-[var(--text-muted)] ml-2">@{version}</span>
                        </div>
                        <button
                            onClick={() => removeDependency(pkg)}
                            className="text-[var(--forge-error)] text-sm hover:underline"
                        >
                            Remove
                        </button>
                    </div>
                ))}
                {Object.keys(dependencies).length === 0 && (
                    <p className="text-center text-[var(--text-muted)] py-8">
                        No dependencies added yet
                    </p>
                )}
            </div>
        </div>
    );
};

// Config editor
interface ConfigEditorProps {
    buildCommand: string;
    startCommand: string;
    onBuildCommandChange: (cmd: string) => void;
    onStartCommandChange: (cmd: string) => void;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({
    buildCommand,
    startCommand,
    onBuildCommandChange,
    onStartCommandChange,
}) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Build Command
            </label>
            <input
                type="text"
                value={buildCommand}
                onChange={(e) => onBuildCommandChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-sm"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Start Command
            </label>
            <input
                type="text"
                value={startCommand}
                onChange={(e) => onStartCommandChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-sm"
            />
        </div>
    </div>
);
