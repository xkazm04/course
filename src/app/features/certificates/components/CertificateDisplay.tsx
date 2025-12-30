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
        indigo: "bg-gradient-forge",
        purple: "bg-gradient-forge",
        blue: "bg-gradient-forge",
        orange: "bg-gradient-forge",
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
            <div className="relative rounded-xl overflow-hidden shadow-lg bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] transition-transform group-hover:scale-[1.02]">
                {/* SVG Certificate Preview */}
                <div className="aspect-[4/3] w-full bg-[var(--forge-bg-anvil)]">
                    <img
                        src={svgDataUrl}
                        alt={`Certificate for ${certificate.courseTitle}`}
                        className="w-full h-full object-contain"
                        data-testid={`certificate-image-${certificate.id}`}
                    />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 bg-[var(--forge-bg-elevated)] rounded-full text-sm font-semibold text-[var(--forge-text-primary)]">
                        Click to view
                    </span>
                </div>
            </div>

            {/* Details Section */}
            {showDetails && (
                <div className="mt-4 space-y-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[var(--forge-text-primary)] truncate text-sm">
                                {certificate.courseTitle}
                            </h3>
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                {certificate.learnerName}
                            </p>
                        </div>
                        <div
                            className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--forge-text-primary)]",
                                accentColors[template.accentColor as keyof typeof accentColors] || accentColors.indigo
                            )}
                        >
                            <Award size={ICON_SIZES.sm} />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-[var(--forge-text-muted)]">
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
                                    className="px-2 py-0.5 bg-[var(--forge-bg-elevated)] rounded-full text-xs text-[var(--forge-text-secondary)] flex items-center gap-1"
                                >
                                    <CheckCircle size={ICON_SIZES.xs} className="text-[var(--forge-success)]" />
                                    {skill}
                                </span>
                            ))}
                            {certificate.skills.length > 3 && (
                                <span className="px-2 py-0.5 bg-[var(--forge-bg-elevated)] rounded-full text-xs text-[var(--forge-text-muted)]">
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
