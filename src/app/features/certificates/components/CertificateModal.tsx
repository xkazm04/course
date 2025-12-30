"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Download,
    Share2,
    Linkedin,
    Twitter,
    Facebook,
    Mail,
    Link,
    Check,
    Award,
    Calendar,
    Clock,
    BookOpen,
    CheckCircle,
    ExternalLink,
    FileText,
    Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Certificate, CERTIFICATE_TEMPLATES } from "../lib/types";
import { formatCertificateDate } from "../lib/certificateStorage";
import { generateCertificateSVG, svgToDataUrl } from "../lib/certificateGenerator";

interface CertificateModalProps {
    certificate: Certificate | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (format: "pdf" | "png" | "jpg") => Promise<void>;
    onShare: (platform: "linkedin" | "twitter" | "facebook" | "email" | "copy") => Promise<boolean>;
}

export function CertificateModal({
    certificate,
    isOpen,
    onClose,
    onDownload,
    onShare,
}: CertificateModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<"pdf" | "png" | "jpg" | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    const svgDataUrl = useMemo(() => {
        if (!certificate) return "";
        const svg = generateCertificateSVG(certificate);
        return svgToDataUrl(svg);
    }, [certificate]);

    const template = certificate
        ? CERTIFICATE_TEMPLATES.find((t) => t.id === certificate.templateId) || CERTIFICATE_TEMPLATES[0]
        : CERTIFICATE_TEMPLATES[0];

    const handleDownload = async (format: "pdf" | "png" | "jpg") => {
        setIsDownloading(true);
        setDownloadFormat(format);
        try {
            await onDownload(format);
        } finally {
            setIsDownloading(false);
            setDownloadFormat(null);
            setShowDownloadMenu(false);
        }
    };

    const handleShare = async (platform: "linkedin" | "twitter" | "facebook" | "email" | "copy") => {
        const success = await onShare(platform);
        if (platform === "copy" && success) {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
        setShowShareMenu(false);
    };

    const accentColors = {
        indigo: "bg-gradient-forge",
        purple: "bg-gradient-forge",
        blue: "bg-gradient-forge",
        orange: "bg-gradient-forge",
    };

    if (!certificate) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    data-testid="certificate-modal-backdrop"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-[var(--forge-bg-elevated)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="certificate-modal"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-[var(--forge-text-primary)]",
                                        accentColors[template.accentColor as keyof typeof accentColors] || accentColors.indigo
                                    )}
                                >
                                    <Award size={ICON_SIZES.md} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[var(--forge-text-primary)]">
                                        Certificate of Completion
                                    </h2>
                                    <p className="text-sm text-[var(--forge-text-muted)]">
                                        {certificate.courseTitle}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors"
                                data-testid="certificate-modal-close-btn"
                            >
                                <X size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Certificate Preview */}
                                <div className="space-y-4">
                                    <div className="rounded-xl overflow-hidden shadow-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-anvil)]">
                                        <img
                                            src={svgDataUrl}
                                            alt={`Certificate for ${certificate.courseTitle}`}
                                            className="w-full h-auto"
                                            data-testid="certificate-modal-image"
                                        />
                                    </div>

                                    {/* Verification Code */}
                                    <div className="flex items-center justify-between p-3 bg-[var(--forge-bg-anvil)] rounded-lg border border-[var(--forge-border-subtle)]">
                                        <div>
                                            <p className="text-xs text-[var(--forge-text-muted)]">
                                                Verification Code
                                            </p>
                                            <p className="font-mono text-sm font-bold text-[var(--forge-text-primary)]">
                                                {certificate.uniqueCode}
                                            </p>
                                        </div>
                                        <a
                                            href={certificate.verificationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-[var(--ember)] hover:underline"
                                            data-testid="certificate-verify-link"
                                        >
                                            <ExternalLink size={ICON_SIZES.xs} />
                                            Verify
                                        </a>
                                    </div>
                                </div>

                                {/* Certificate Details */}
                                <div className="space-y-6">
                                    {/* Learner Info */}
                                    <div>
                                        <h3 className="text-lg font-bold text-[var(--forge-text-primary)] mb-2">
                                            {certificate.learnerName}
                                        </h3>
                                        <p className="text-[var(--forge-text-secondary)]">
                                            has successfully completed <strong>{certificate.courseTitle}</strong>
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-[var(--forge-bg-anvil)] rounded-lg">
                                            <div className="flex items-center gap-2 text-[var(--forge-text-muted)] mb-1">
                                                <Calendar size={ICON_SIZES.sm} />
                                                <span className="text-xs">Completed</span>
                                            </div>
                                            <p className="font-semibold text-[var(--forge-text-primary)] text-sm">
                                                {formatCertificateDate(certificate.completionDate)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-[var(--forge-bg-anvil)] rounded-lg">
                                            <div className="flex items-center gap-2 text-[var(--forge-text-muted)] mb-1">
                                                <Clock size={ICON_SIZES.sm} />
                                                <span className="text-xs">Duration</span>
                                            </div>
                                            <p className="font-semibold text-[var(--forge-text-primary)] text-sm">
                                                {certificate.metadata.totalHours} hours
                                            </p>
                                        </div>
                                        <div className="p-3 bg-[var(--forge-bg-anvil)] rounded-lg">
                                            <div className="flex items-center gap-2 text-[var(--forge-text-muted)] mb-1">
                                                <BookOpen size={ICON_SIZES.sm} />
                                                <span className="text-xs">Modules</span>
                                            </div>
                                            <p className="font-semibold text-[var(--forge-text-primary)] text-sm">
                                                {certificate.metadata.modulesCompleted} completed
                                            </p>
                                        </div>
                                        {certificate.metadata.quizScore && (
                                            <div className="p-3 bg-[var(--forge-bg-anvil)] rounded-lg">
                                                <div className="flex items-center gap-2 text-[var(--forge-text-muted)] mb-1">
                                                    <CheckCircle size={ICON_SIZES.sm} />
                                                    <span className="text-xs">Quiz Score</span>
                                                </div>
                                                <p className="font-semibold text-[var(--forge-text-primary)] text-sm">
                                                    {certificate.metadata.quizScore}%
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-[var(--forge-text-secondary)] mb-2">
                                            Skills Earned
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

                                    {/* Issuer */}
                                    <div className="pt-4 border-t border-[var(--forge-border-subtle)]">
                                        <p className="text-xs text-[var(--forge-text-muted)]">Issued by</p>
                                        <p className="font-semibold text-[var(--forge-text-primary)]">
                                            {certificate.issuerName}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between p-4 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-anvil)]">
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                Certificate ID: {certificate.id}
                            </p>
                            <div className="flex items-center gap-2">
                                {/* Download Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                        disabled={isDownloading}
                                        className="flex items-center gap-2 px-4 py-2 bg-[var(--forge-bg-elevated)] hover:bg-[var(--forge-bg-workshop)] rounded-lg text-[var(--forge-text-primary)] text-sm font-medium transition-colors disabled:opacity-50"
                                        data-testid="certificate-download-btn"
                                    >
                                        <Download size={ICON_SIZES.sm} />
                                        {isDownloading ? "Downloading..." : "Download"}
                                    </button>
                                    <AnimatePresence>
                                        {showDownloadMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute bottom-full right-0 mb-2 bg-[var(--forge-bg-elevated)] rounded-lg shadow-lg border border-[var(--forge-border-subtle)] overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => handleDownload("pdf")}
                                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                                    data-testid="download-pdf-btn"
                                                >
                                                    <FileText size={ICON_SIZES.sm} />
                                                    Download PDF
                                                </button>
                                                <button
                                                    onClick={() => handleDownload("png")}
                                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                                    data-testid="download-png-btn"
                                                >
                                                    <ImageIcon size={ICON_SIZES.sm} />
                                                    Download PNG
                                                </button>
                                                <button
                                                    onClick={() => handleDownload("jpg")}
                                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                                    data-testid="download-jpg-btn"
                                                >
                                                    <ImageIcon size={ICON_SIZES.sm} />
                                                    Download JPG
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Share Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowShareMenu(!showShareMenu)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[var(--ember)] hover:opacity-90 rounded-lg text-[var(--forge-text-primary)] text-sm font-medium transition-colors"
                                        data-testid="certificate-share-btn"
                                    >
                                        <Share2 size={ICON_SIZES.sm} />
                                        Share
                                    </button>
                                    <AnimatePresence>
                                        {showShareMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute bottom-full right-0 mb-2 bg-[var(--forge-bg-elevated)] rounded-lg shadow-lg border border-[var(--forge-border-subtle)] overflow-hidden min-w-[160px]"
                                            >
                                                <button
                                                    onClick={() => handleShare("linkedin")}
                                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                                    data-testid="share-linkedin-btn"
                                                >
                                                    <Linkedin size={ICON_SIZES.sm} className="text-[#0A66C2]" />
                                                    LinkedIn
                                                </button>
                                                <button
                                                    onClick={() => handleShare("twitter")}
                                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                                    data-testid="share-twitter-btn"
                                                >
                                                    <Twitter size={ICON_SIZES.sm} className="text-[#1DA1F2]" />
                                                    Twitter
                                                </button>
                                                <button
                                                    onClick={() => handleShare("facebook")}
                                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                                    data-testid="share-facebook-btn"
                                                >
                                                    <Facebook size={ICON_SIZES.sm} className="text-[#1877F2]" />
                                                    Facebook
                                                </button>
                                                <button
                                                    onClick={() => handleShare("email")}
                                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)]"
                                                    data-testid="share-email-btn"
                                                >
                                                    <Mail size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                                                    Email
                                                </button>
                                                <button
                                                    onClick={() => handleShare("copy")}
                                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[var(--forge-bg-anvil)] text-left text-sm text-[var(--forge-text-primary)] border-t border-[var(--forge-border-subtle)]"
                                                    data-testid="share-copy-btn"
                                                >
                                                    {copiedLink ? (
                                                        <>
                                                            <Check size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                                                            Copy Link
                                                        </>
                                                    )}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
