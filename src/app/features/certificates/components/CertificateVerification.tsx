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
        indigo: "from-indigo-500 to-indigo-600",
        purple: "from-purple-500 to-purple-600",
        blue: "from-blue-500 to-blue-600",
        orange: "from-orange-500 to-orange-600",
    };

    if (isLoading) {
        return (
            <div className={cn("flex flex-col items-center justify-center py-16", className)}>
                <Loader2 size={ICON_SIZES.xl} className="animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Verifying certificate...</p>
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
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/20 p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <XCircle size={ICON_SIZES.xl} className="text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-red-600/80 dark:text-red-400/80 text-sm">
                            {message}
                        </p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Success Header */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 text-center border-b border-emerald-100 dark:border-emerald-800/30">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle size={ICON_SIZES.xl} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Shield size={ICON_SIZES.sm} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                            Verified Certificate
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                        This Certificate is Authentic
                    </h2>
                </div>

                {/* Certificate Details */}
                <div className="p-6 space-y-6">
                    {/* Award Badge */}
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                "w-14 h-14 rounded-xl flex items-center justify-center text-white bg-gradient-to-br",
                                accentColors[template.accentColor] || accentColors.indigo
                            )}
                        >
                            <Award size={ICON_SIZES.xl} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                Certificate of Completion
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {certificate.courseTitle}
                            </p>
                        </div>
                    </div>

                    {/* Learner Info */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                            <User size={ICON_SIZES.sm} />
                            <span className="text-xs">Awarded to</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {certificate.learnerName}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                            <Calendar size={ICON_SIZES.sm} className="mx-auto mb-1 text-slate-400" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {formatCertificateDate(certificate.completionDate)}
                            </p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                            <Clock size={ICON_SIZES.sm} className="mx-auto mb-1 text-slate-400" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {certificate.metadata.totalHours} hours
                            </p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                            <BookOpen size={ICON_SIZES.sm} className="mx-auto mb-1 text-slate-400" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Modules</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {certificate.metadata.modulesCompleted}
                            </p>
                        </div>
                    </div>

                    {/* Skills */}
                    {certificate.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Skills Demonstrated
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {certificate.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium flex items-center gap-1"
                                    >
                                        <CheckCircle size={ICON_SIZES.xs} className="text-emerald-500" />
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Verification Details */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs">
                            <div className="text-slate-500 dark:text-slate-400">
                                <span className="font-medium">Certificate ID:</span> {certificate.id}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">
                                <span className="font-medium">Code:</span>{" "}
                                <span className="font-mono">{certificate.uniqueCode}</span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium">Issued by:</span> {certificate.issuerName}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
