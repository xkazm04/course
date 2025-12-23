"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Award, Calendar, Clock, BookOpen, CheckCircle } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Certificate, CERTIFICATE_TEMPLATES } from "../lib/types";
import { formatCertificateDate } from "../lib/certificateStorage";
import { generateCertificateSVG, svgToDataUrl } from "../lib/certificateGenerator";

interface CertificateDisplayProps {
    certificate: Certificate;
    size?: "sm" | "md" | "lg";
    showDetails?: boolean;
    className?: string;
    onClick?: () => void;
}

export function CertificateDisplay({
    certificate,
    size = "md",
    showDetails = true,
    className,
    onClick,
}: CertificateDisplayProps) {
    const template = CERTIFICATE_TEMPLATES.find((t) => t.id === certificate.templateId) || CERTIFICATE_TEMPLATES[0];

    const svgDataUrl = useMemo(() => {
        const svg = generateCertificateSVG(certificate);
        return svgToDataUrl(svg);
    }, [certificate]);

    const sizeClasses = {
        sm: "w-64",
        md: "w-96",
        lg: "w-[600px]",
    };

    const accentColors = {
        indigo: "from-indigo-500 to-indigo-600",
        purple: "from-purple-500 to-purple-600",
        blue: "from-blue-500 to-blue-600",
        orange: "from-orange-500 to-orange-600",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative group cursor-pointer",
                sizeClasses[size],
                className
            )}
            onClick={onClick}
            data-testid={`certificate-display-${certificate.id}`}
        >
            {/* Certificate Preview */}
            <div className="relative rounded-xl overflow-hidden shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-transform group-hover:scale-[1.02]">
                {/* SVG Certificate Preview */}
                <div className="aspect-[4/3] w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                    <img
                        src={svgDataUrl}
                        alt={`Certificate for ${certificate.courseTitle}`}
                        className="w-full h-full object-contain"
                        data-testid={`certificate-image-${certificate.id}`}
                    />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 bg-white dark:bg-slate-800 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Click to view
                    </span>
                </div>
            </div>

            {/* Details Section */}
            {showDetails && (
                <div className="mt-4 space-y-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                                {certificate.courseTitle}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {certificate.learnerName}
                            </p>
                        </div>
                        <div
                            className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br text-white",
                                accentColors[template.accentColor as keyof typeof accentColors] || accentColors.indigo
                            )}
                        >
                            <Award size={ICON_SIZES.sm} />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <Calendar size={ICON_SIZES.xs} />
                            {formatCertificateDate(certificate.completionDate)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={ICON_SIZES.xs} />
                            {certificate.metadata.totalHours}h
                        </span>
                        <span className="flex items-center gap-1">
                            <BookOpen size={ICON_SIZES.xs} />
                            {certificate.metadata.modulesCompleted} modules
                        </span>
                    </div>

                    {certificate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {certificate.skills.slice(0, 3).map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1"
                                >
                                    <CheckCircle size={ICON_SIZES.xs} className="text-emerald-500" />
                                    {skill}
                                </span>
                            ))}
                            {certificate.skills.length > 3 && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-400">
                                    +{certificate.skills.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
