"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Award, Plus, Settings, Download, Upload } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { PrismaticCard } from "@/app/shared/components";
import { useCertificates } from "../lib/useCertificates";
import { CertificateGallery } from "./CertificateGallery";
import { CertificateIssueModal } from "./CertificateIssueModal";
import {
    exportCertificatesData,
    importCertificatesData,
} from "../lib/certificateStorage";

interface CertificatesPageProps {
    className?: string;
}

export function CertificatesPage({ className }: CertificatesPageProps) {
    const {
        certificates,
        isLoading,
        issue,
        download,
        share,
        remove,
        refresh,
    } = useCertificates();

    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [showImportExport, setShowImportExport] = useState(false);

    const handleExport = () => {
        const data = exportCertificatesData();
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `certificates-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                const success = importCertificatesData(content);
                if (success) {
                    refresh();
                    alert("Certificates imported successfully!");
                } else {
                    alert("Failed to import certificates. Invalid file format.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Sample courses for demo certificate issuance
    const sampleCourses = [
        {
            title: "Complete React Development",
            id: "react-dev",
            skills: ["React", "Hooks", "State Management", "Component Design"],
        },
        {
            title: "Full-Stack JavaScript",
            id: "fullstack-js",
            skills: ["Node.js", "Express", "MongoDB", "REST APIs"],
        },
        {
            title: "Modern CSS & Tailwind",
            id: "css-tailwind",
            skills: ["CSS3", "Tailwind CSS", "Responsive Design", "Animations"],
        },
        {
            title: "TypeScript Mastery",
            id: "typescript",
            skills: ["TypeScript", "Type Safety", "Generics", "Advanced Types"],
        },
    ];

    return (
        <div className={cn("space-y-8", className)} data-testid="certificates-page">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--forge-text-primary)]">
                        My Certificates
                    </h1>
                    <p className="text-[var(--forge-text-secondary)] mt-1">
                        Your earned certificates and achievements
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Import/Export Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setShowImportExport(!showImportExport)}
                            className="p-2 hover:bg-[var(--forge-bg-elevated)] rounded-lg transition-colors text-[var(--forge-text-muted)]"
                            data-testid="import-export-toggle-btn"
                        >
                            <Settings size={ICON_SIZES.md} />
                        </button>
                        {showImportExport && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 top-full mt-2 bg-[var(--forge-bg-elevated)] rounded-lg shadow-lg border border-[var(--forge-border-subtle)] overflow-hidden z-10"
                            >
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                    data-testid="export-certificates-btn"
                                >
                                    <Download size={ICON_SIZES.sm} />
                                    Export Certificates
                                </button>
                                <button
                                    onClick={handleImport}
                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                    data-testid="import-certificates-btn"
                                >
                                    <Upload size={ICON_SIZES.sm} />
                                    Import Certificates
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Issue Certificate Button */}
                    <button
                        onClick={() => setIsIssueModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-forge text-[var(--forge-text-primary)] rounded-lg font-medium transition-all hover:opacity-90"
                        data-testid="issue-certificate-btn"
                    >
                        <Plus size={ICON_SIZES.md} />
                        Issue Certificate
                    </button>
                </div>
            </div>

            {/* Quick Issue Cards (Demo) */}
            {certificates.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-lg font-semibold text-[var(--forge-text-secondary)] mb-4">
                        Quick Demo: Issue a Sample Certificate
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sampleCourses.map((course) => (
                            <PrismaticCard
                                key={course.id}
                                className="cursor-pointer"
                                glowColor="indigo"
                                data-testid={`sample-course-card-${course.id}`}
                            >
                                <button
                                    onClick={() => {
                                        const cert = issue(
                                            "Demo Learner",
                                            course.title,
                                            course.id,
                                            course.skills,
                                            {
                                                totalHours: Math.floor(Math.random() * 20) + 10,
                                                modulesCompleted: Math.floor(Math.random() * 10) + 5,
                                                quizScore: Math.floor(Math.random() * 20) + 80,
                                            }
                                        );
                                    }}
                                    className="w-full p-4 text-left"
                                    data-testid={`quick-issue-${course.id}-btn`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-forge flex items-center justify-center text-[var(--forge-text-primary)]">
                                            <Award size={ICON_SIZES.md} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[var(--forge-text-primary)] text-sm truncate">
                                                {course.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {course.skills.slice(0, 2).map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-2 py-0.5 bg-[var(--forge-bg-elevated)] rounded text-xs text-[var(--forge-text-secondary)]"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            </PrismaticCard>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Certificate Gallery */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[var(--ember)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <CertificateGallery
                    certificates={certificates}
                    onDownload={download}
                    onShare={share}
                    onDelete={remove}
                />
            )}

            {/* Issue Certificate Modal */}
            <CertificateIssueModal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                onIssue={issue}
            />
        </div>
    );
}
