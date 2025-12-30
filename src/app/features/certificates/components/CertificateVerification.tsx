"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    CheckCircle,
    XCircle,
    Award,
    Calendar,
    Clock,
    BookOpen,
    User,
    Shield,
    Loader2,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Certificate, CERTIFICATE_TEMPLATES } from "../lib/types";
import { formatCertificateDate } from "../lib/certificateStorage";

interface CertificateVerificationProps {
    isLoading: boolean;
    isValid: boolean;
    certificate: Certificate | null;
    message: string;
    className?: string;
}

export function CertificateVerification({
    isLoading,
    isValid,
    certificate,
    message,
    className,
}: CertificateVerificationProps) {
    const template = certificate
        ? CERTIFICATE_TEMPLATES.find((t) => t.id === certificate.templateId) || CERTIFICATE_TEMPLATES[0]
        : CERTIFICATE_TEMPLATES[0];

    const accentColors: Record<string, string> = {
        indigo: "bg-gradient-forge",
        purple: "bg-gradient-forge",
        blue: "bg-gradient-forge",
        orange: "bg-gradient-forge",
    };

    if (isLoading) {
        return (
            <div className={cn("flex flex-col items-center justify-center py-16", className)}>
                <Loader2 size={ICON_SIZES.xl} className="animate-spin text-[var(--ember)] mb-4" />
                <p className="text-[var(--forge-text-secondary)]">Verifying certificate...</p>
            </div>
        );
    }

    if (!isValid) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("max-w-md mx-auto", className)}
                data-testid="verification-invalid"
            >
                <div className="bg-[var(--forge-bg-elevated)] rounded-2xl shadow-xl border border-[var(--forge-border-subtle)] overflow-hidden">
                    <div className="bg-[var(--forge-error)]/20 p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-[var(--forge-error)]/30 rounded-full flex items-center justify-center">
                            <XCircle size={ICON_SIZES.xl} className="text-[var(--forge-error)]" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--forge-error)] mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-[var(--forge-error)]/80 text-sm">
                            {message}
                        </p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-[var(--forge-text-secondary)] text-sm">
                            The certificate could not be verified. Please check the verification code and try again.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!certificate) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("max-w-2xl mx-auto", className)}
            data-testid="verification-valid"
        >
            <div className="bg-[var(--forge-bg-elevated)] rounded-2xl shadow-xl border border-[var(--forge-border-subtle)] overflow-hidden">
                {/* Success Header */}
                <div className="bg-[var(--forge-success)]/20 p-6 text-center border-b border-[var(--forge-success)]/30">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[var(--forge-success)]/30 rounded-full flex items-center justify-center">
                        <CheckCircle size={ICON_SIZES.xl} className="text-[var(--forge-success)]" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Shield size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
                        <span className="text-[var(--forge-success)] font-semibold text-sm">
                            Verified Certificate
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--forge-success)]">
                        This Certificate is Authentic
                    </h2>
                </div>

                {/* Certificate Details */}
                <div className="p-6 space-y-6">
                    {/* Award Badge */}
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                "w-14 h-14 rounded-xl flex items-center justify-center text-[var(--forge-text-primary)]",
                                accentColors[template.accentColor] || accentColors.indigo
                            )}
                        >
                            <Award size={ICON_SIZES.xl} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--forge-text-primary)]">
                                Certificate of Completion
                            </h3>
                            <p className="text-sm text-[var(--forge-text-muted)]">
                                {certificate.courseTitle}
                            </p>
                        </div>
                    </div>

                    {/* Learner Info */}
                    <div className="p-4 bg-[var(--forge-bg-anvil)] rounded-xl">
                        <div className="flex items-center gap-2 text-[var(--forge-text-muted)] mb-2">
                            <User size={ICON_SIZES.sm} />
                            <span className="text-xs">Awarded to</span>
                        </div>
                        <p className="text-xl font-bold text-[var(--forge-text-primary)]">
                            {certificate.learnerName}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-[var(--forge-bg-anvil)] rounded-lg text-center">
                            <Calendar size={ICON_SIZES.sm} className="mx-auto mb-1 text-[var(--forge-text-muted)]" />
                            <p className="text-xs text-[var(--forge-text-muted)]">Completed</p>
                            <p className="text-sm font-semibold text-[var(--forge-text-primary)]">
                                {formatCertificateDate(certificate.completionDate)}
                            </p>
                        </div>
                        <div className="p-3 bg-[var(--forge-bg-anvil)] rounded-lg text-center">
                            <Clock size={ICON_SIZES.sm} className="mx-auto mb-1 text-[var(--forge-text-muted)]" />
                            <p className="text-xs text-[var(--forge-text-muted)]">Duration</p>
                            <p className="text-sm font-semibold text-[var(--forge-text-primary)]">
                                {certificate.metadata.totalHours} hours
                            </p>
                        </div>
                        <div className="p-3 bg-[var(--forge-bg-anvil)] rounded-lg text-center">
                            <BookOpen size={ICON_SIZES.sm} className="mx-auto mb-1 text-[var(--forge-text-muted)]" />
                            <p className="text-xs text-[var(--forge-text-muted)]">Modules</p>
                            <p className="text-sm font-semibold text-[var(--forge-text-primary)]">
                                {certificate.metadata.modulesCompleted}
                            </p>
                        </div>
                    </div>

                    {/* Skills */}
                    {certificate.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--forge-text-secondary)] mb-2">
                                Skills Demonstrated
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {certificate.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-[var(--ember)]/20 text-[var(--ember)] rounded-full text-xs font-medium flex items-center gap-1"
                                    >
                                        <CheckCircle size={ICON_SIZES.xs} className="text-[var(--forge-success)]" />
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Verification Details */}
                    <div className="pt-4 border-t border-[var(--forge-border-subtle)]">
                        <div className="flex items-center justify-between text-xs">
                            <div className="text-[var(--forge-text-muted)]">
                                <span className="font-medium">Certificate ID:</span> {certificate.id}
                            </div>
                            <div className="text-[var(--forge-text-muted)]">
                                <span className="font-medium">Code:</span>{" "}
                                <span className="font-mono">{certificate.uniqueCode}</span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-[var(--forge-text-muted)]">
                            <span className="font-medium">Issued by:</span> {certificate.issuerName}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
