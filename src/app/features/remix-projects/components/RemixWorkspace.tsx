"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitFork, Code, FileText, BarChart2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useSeedProject } from "../lib/useSeedProject";
import { useAssignment } from "../lib/useAssignment";
import { ProjectBrowser } from "./ProjectBrowser";
import { ProjectDetail } from "./ProjectDetail";
import { AssignmentPanel } from "./AssignmentPanel";
import { CodeExplorer } from "./CodeExplorer";
import { DiffViewer } from "./DiffViewer";
import { QualityReport } from "./QualityReport";
import { InlineDevContext } from "./PreviousDevContext";
import { getAssignmentsForProject } from "../lib/seedProjectTemplates";
import { generateDiff } from "../lib/diffAnalyzer";

type View = "browse" | "detail" | "workspace" | "results";
type Tab = "code" | "diff" | "assignment";

export const RemixWorkspace: React.FC = () => {
    const [view, setView] = useState<View>("browse");
    const [activeTab, setActiveTab] = useState<Tab>("code");
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const { projects, selectedProject, selectProject, projectAssignments } = useSeedProject();
    const {
        assignment,
        fork,
        claim,
        updateFile,
        revealNextHint,
        completeObjective,
        submit,
        modifiedFiles,
        canSubmit,
        isSubmitting,
    } = useAssignment();

    const handleSelectProject = (id: string) => {
        selectProject(id);
        setView("detail");
    };

    const handleStartAssignment = (projectId: string) => {
        const assignments = getAssignmentsForProject(projectId);
        if (assignments.length > 0) {
            const claimed = claim(assignments[0]);
            setView("workspace");
        }
    };

    const handleSubmit = async () => {
        const result = await submit();
        if (result) {
            setView("results");
        }
    };

    const handleBack = () => {
        if (view === "results") setView("workspace");
        else if (view === "workspace") setView("detail");
        else if (view === "detail") {
            selectProject(null);
            setView("browse");
        }
    };

    return (
        <div className="min-h-screen bg-[var(--forge-bg-workshop)]">
            {/* Header */}
            <header className="border-b border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GitFork size={ICON_SIZES.lg} className="text-[var(--ember)]" />
                            <div>
                                <h1 className="text-xl font-bold text-[var(--forge-text-primary)]">
                                    Remix & Extend
                                </h1>
                                <p className="text-sm text-[var(--forge-text-muted)]">
                                    Inherit, improve, and evolve real-world codebases
                                </p>
                            </div>
                        </div>

                        {assignment && view === "workspace" && selectedProject && (
                            <InlineDevContext developer={selectedProject.previousDeveloper} />
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                <AnimatePresence mode="wait">
                    {view === "browse" && (
                        <motion.div
                            key="browse"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <ProjectBrowser
                                onSelectProject={handleSelectProject}
                                onStartAssignment={handleStartAssignment}
                            />
                        </motion.div>
                    )}

                    {view === "detail" && selectedProject && (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <ProjectDetail
                                project={selectedProject}
                                assignments={projectAssignments}
                                onBack={handleBack}
                                onStartAssignment={() => handleStartAssignment(selectedProject.id)}
                            />
                        </motion.div>
                    )}

                    {view === "workspace" && assignment && fork && selectedProject && (
                        <motion.div
                            key="workspace"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <WorkspaceLayout
                                assignment={assignment}
                                fork={fork}
                                project={selectedProject}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                selectedFile={selectedFile}
                                setSelectedFile={setSelectedFile}
                                modifiedFiles={modifiedFiles.map((f) => f.path)}
                                onRevealHint={revealNextHint}
                                onCompleteObjective={completeObjective}
                                onSubmit={handleSubmit}
                                canSubmit={canSubmit}
                                isSubmitting={isSubmitting}
                            />
                        </motion.div>
                    )}

                    {view === "results" && assignment?.submission && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <QualityReport submission={assignment.submission} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

// Workspace layout component (split for file size)
interface WorkspaceLayoutProps {
    assignment: ReturnType<typeof useAssignment>["assignment"];
    fork: ReturnType<typeof useAssignment>["fork"];
    project: ReturnType<typeof useSeedProject>["selectedProject"];
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    selectedFile: string | null;
    setSelectedFile: (path: string | null) => void;
    modifiedFiles: string[];
    onRevealHint: () => void;
    onCompleteObjective: (id: string) => void;
    onSubmit: () => void;
    canSubmit: boolean;
    isSubmitting: boolean;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
    assignment,
    fork,
    project,
    activeTab,
    setActiveTab,
    selectedFile,
    setSelectedFile,
    modifiedFiles,
    onRevealHint,
    onCompleteObjective,
    onSubmit,
    canSubmit,
    isSubmitting,
}) => {
    if (!assignment || !fork || !project) return null;

    const diff = generateDiff(fork.files);

    const tabs = [
        { id: "code" as Tab, label: "Code", icon: Code },
        { id: "diff" as Tab, label: "Changes", icon: FileText },
        { id: "assignment" as Tab, label: "Assignment", icon: BarChart2 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - File Explorer */}
            <div className="lg:col-span-1 rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] overflow-hidden">
                <div className="p-3 border-b border-[var(--forge-border-subtle)]">
                    <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">Files</h3>
                </div>
                <CodeExplorer
                    structure={project.repository.structure}
                    files={project.repository.files}
                    selectedFile={selectedFile}
                    onSelectFile={setSelectedFile}
                    modifiedFiles={modifiedFiles}
                />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 p-1 rounded-lg bg-[var(--forge-bg-anvil)] w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors",
                                activeTab === tab.id
                                    ? "bg-gradient-forge text-white"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                            )}
                        >
                            <tab.icon size={ICON_SIZES.sm} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === "code" && (
                        <motion.div
                            key="code"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4 min-h-[400px]"
                        >
                            {selectedFile ? (
                                <CodePreview
                                    file={fork.files.find((f) => f.path === selectedFile)}
                                />
                            ) : (
                                <div className="text-center py-12 text-[var(--forge-text-muted)]">
                                    Select a file to view
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "diff" && (
                        <motion.div
                            key="diff"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <DiffViewer diff={diff} />
                        </motion.div>
                    )}

                    {activeTab === "assignment" && (
                        <motion.div
                            key="assignment"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <AssignmentPanel
                                assignment={assignment}
                                onRevealHint={onRevealHint}
                                onCompleteObjective={onCompleteObjective}
                                onSubmit={onSubmit}
                                canSubmit={canSubmit}
                                isSubmitting={isSubmitting}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Simple code preview
interface CodePreviewProps {
    file?: { path: string; currentContent: string };
}

const CodePreview: React.FC<CodePreviewProps> = ({ file }) => {
    if (!file) return null;

    return (
        <div className="font-mono text-sm">
            <div className="text-xs text-[var(--forge-text-muted)] mb-3 pb-2 border-b border-[var(--forge-border-subtle)]">
                {file.path}
            </div>
            <pre className="overflow-x-auto text-[var(--forge-text-secondary)] whitespace-pre-wrap">
                {file.currentContent}
            </pre>
        </div>
    );
};
