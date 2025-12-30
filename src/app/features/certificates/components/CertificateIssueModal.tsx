"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Award,
    User,
    BookOpen,
    CheckCircle,
    Plus,
    Minus,
    Sparkles,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Certificate, CertificateTemplate, CERTIFICATE_TEMPLATES } from "../lib/types";

interface CertificateIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onIssue: (
        learnerName: string,
        courseTitle: string,
        courseId: string,
        skills: string[],
        metadata: Certificate["metadata"],
        templateId: string
    ) => Certificate;
    defaultCourseTitle?: string;
    defaultCourseId?: string;
    defaultSkills?: string[];
    defaultMetadata?: Partial<Certificate["metadata"]>;
}

export function CertificateIssueModal({
    isOpen,
    onClose,
    onIssue,
    defaultCourseTitle = "",
    defaultCourseId = "",
    defaultSkills = [],
    defaultMetadata = {},
}: CertificateIssueModalProps) {
    const [learnerName, setLearnerName] = useState("");
    const [courseTitle, setCourseTitle] = useState(defaultCourseTitle);
    const [skills, setSkills] = useState<string[]>(defaultSkills);
    const [newSkill, setNewSkill] = useState("");
    const [totalHours, setTotalHours] = useState(defaultMetadata.totalHours || 10);
    const [modulesCompleted, setModulesCompleted] = useState(
        defaultMetadata.modulesCompleted || 5
    );
    const [quizScore, setQuizScore] = useState(defaultMetadata.quizScore || 85);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");
    const [isIssuing, setIsIssuing] = useState(false);

    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill("");
        }
    };

    const handleRemoveSkill = (skill: string) => {
        setSkills(skills.filter((s) => s !== skill));
    };

    const handleIssue = async () => {
        if (!learnerName.trim() || !courseTitle.trim()) return;

        setIsIssuing(true);
        try {
            onIssue(
                learnerName.trim(),
                courseTitle.trim(),
                defaultCourseId || courseTitle.toLowerCase().replace(/\s+/g, "-"),
                skills,
                {
                    totalHours,
                    modulesCompleted,
                    quizScore,
                },
                selectedTemplate
            );
            // Reset form
            setLearnerName("");
            if (!defaultCourseTitle) setCourseTitle("");
            if (defaultSkills.length === 0) setSkills([]);
            onClose();
        } finally {
            setIsIssuing(false);
        }
    };

    const templateColors: Record<string, string> = {
        classic: "border-[var(--forge-border-subtle)]",
        modern: "border-[var(--ember)]",
        professional: "border-[var(--ember)]",
        elegant: "border-[var(--ember)]",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    data-testid="certificate-issue-modal-backdrop"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-[var(--forge-bg-elevated)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="certificate-issue-modal"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-forge flex items-center justify-center text-[var(--forge-text-primary)]">
                                    <Award size={ICON_SIZES.md} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[var(--forge-text-primary)]">
                                        Issue Certificate
                                    </h2>
                                    <p className="text-sm text-[var(--forge-text-muted)]">
                                        Create a new completion certificate
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors"
                                data-testid="certificate-issue-modal-close-btn"
                            >
                                <X size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
                            {/* Learner Name */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                    <User size={ICON_SIZES.sm} className="inline mr-2" />
                                    Learner Name
                                </label>
                                <input
                                    type="text"
                                    value={learnerName}
                                    onChange={(e) => setLearnerName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-2 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ember)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)]"
                                    data-testid="learner-name-input"
                                />
                            </div>

                            {/* Course Title */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                    <BookOpen size={ICON_SIZES.sm} className="inline mr-2" />
                                    Course Title
                                </label>
                                <input
                                    type="text"
                                    value={courseTitle}
                                    onChange={(e) => setCourseTitle(e.target.value)}
                                    placeholder="Enter course title"
                                    disabled={!!defaultCourseTitle}
                                    className="w-full px-4 py-2 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ember)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] disabled:opacity-60"
                                    data-testid="course-title-input"
                                />
                            </div>

                            {/* Skills */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                    <CheckCircle size={ICON_SIZES.sm} className="inline mr-2" />
                                    Skills Earned
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                                        placeholder="Add a skill"
                                        className="flex-1 px-4 py-2 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ember)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)]"
                                        data-testid="skill-input"
                                    />
                                    <button
                                        onClick={handleAddSkill}
                                        className="px-4 py-2 bg-[var(--ember)]/20 text-[var(--ember)] rounded-lg hover:bg-[var(--ember)]/30 transition-colors"
                                        data-testid="add-skill-btn"
                                    >
                                        <Plus size={ICON_SIZES.sm} />
                                    </button>
                                </div>
                                {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--forge-bg-anvil)] rounded-full text-sm text-[var(--forge-text-secondary)]"
                                            >
                                                {skill}
                                                <button
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="ml-1 hover:text-[var(--forge-error)]"
                                                    data-testid={`remove-skill-${index}-btn`}
                                                >
                                                    <X size={ICON_SIZES.xs} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--forge-text-muted)] mb-1">
                                        Total Hours
                                    </label>
                                    <input
                                        type="number"
                                        value={totalHours}
                                        onChange={(e) => setTotalHours(Number(e.target.value))}
                                        min={1}
                                        className="w-full px-3 py-2 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ember)] text-[var(--forge-text-primary)]"
                                        data-testid="total-hours-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--forge-text-muted)] mb-1">
                                        Modules
                                    </label>
                                    <input
                                        type="number"
                                        value={modulesCompleted}
                                        onChange={(e) => setModulesCompleted(Number(e.target.value))}
                                        min={1}
                                        className="w-full px-3 py-2 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ember)] text-[var(--forge-text-primary)]"
                                        data-testid="modules-completed-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--forge-text-muted)] mb-1">
                                        Quiz Score %
                                    </label>
                                    <input
                                        type="number"
                                        value={quizScore}
                                        onChange={(e) => setQuizScore(Number(e.target.value))}
                                        min={0}
                                        max={100}
                                        className="w-full px-3 py-2 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ember)] text-[var(--forge-text-primary)]"
                                        data-testid="quiz-score-input"
                                    />
                                </div>
                            </div>

                            {/* Template Selection */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                    <Sparkles size={ICON_SIZES.sm} className="inline mr-2" />
                                    Certificate Template
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {CERTIFICATE_TEMPLATES.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => setSelectedTemplate(template.id)}
                                            className={cn(
                                                "p-3 rounded-xl border-2 transition-all text-left",
                                                selectedTemplate === template.id
                                                    ? `${templateColors[template.id]} bg-[var(--forge-bg-anvil)]`
                                                    : "border-[var(--forge-border-subtle)] hover:border-[var(--forge-text-muted)]"
                                            )}
                                            data-testid={`template-${template.id}-btn`}
                                        >
                                            <div
                                                className={cn(
                                                    "w-8 h-8 rounded-lg mb-2 bg-gradient-to-br",
                                                    template.backgroundGradient
                                                )}
                                            />
                                            <p className="text-sm font-medium text-[var(--forge-text-primary)]">
                                                {template.name}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-anvil)]">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] text-sm font-medium transition-colors"
                                data-testid="cancel-issue-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleIssue}
                                disabled={!learnerName.trim() || !courseTitle.trim() || isIssuing}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-forge text-[var(--forge-text-primary)] rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid="issue-certificate-btn"
                            >
                                <Award size={ICON_SIZES.sm} />
                                {isIssuing ? "Issuing..." : "Issue Certificate"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
