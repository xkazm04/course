"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    Search,
    Filter,
    Grid,
    List,
    Download,
    Share2,
    Trash2,
    MoreVertical,
    Calendar,
    Clock,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { PrismaticCard } from "@/app/shared/components";
import { CertificateGalleryItem, CERTIFICATE_TEMPLATES } from "../lib/types";
import { formatCertificateDate } from "../lib/certificateStorage";
import { CertificateDisplay } from "./CertificateDisplay";
import { CertificateModal } from "./CertificateModal";

interface CertificateGalleryProps {
    certificates: CertificateGalleryItem[];
    onDownload: (id: string, format: "pdf" | "png" | "jpg") => Promise<boolean>;
    onShare: (id: string, platform: "linkedin" | "twitter" | "facebook" | "email" | "copy") => Promise<boolean>;
    onDelete?: (id: string) => void;
    className?: string;
}

type ViewMode = "grid" | "list";
type SortBy = "date" | "name" | "shares";

export function CertificateGallery({
    certificates,
    onDownload,
    onShare,
    onDelete,
    className,
}: CertificateGalleryProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [sortBy, setSortBy] = useState<SortBy>("date");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCertificate, setSelectedCertificate] = useState<CertificateGalleryItem | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Filter and sort certificates
    const filteredCertificates = certificates
        .filter((item) =>
            item.certificate.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.certificate.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.certificate.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.certificate.courseTitle.localeCompare(b.certificate.courseTitle);
                case "shares":
                    return b.shareCount - a.shareCount;
                case "date":
                default:
                    return new Date(b.certificate.issuedDate).getTime() - new Date(a.certificate.issuedDate).getTime();
            }
        });

    const handleDownload = async (format: "pdf" | "png" | "jpg") => {
        if (!selectedCertificate) return;
        await onDownload(selectedCertificate.certificate.id, format);
    };

    const handleShare = async (platform: "linkedin" | "twitter" | "facebook" | "email" | "copy") => {
        if (!selectedCertificate) return false;
        return await onShare(selectedCertificate.certificate.id, platform);
    };

    if (certificates.length === 0) {
        return (
            <div className={cn("text-center py-16", className)}>
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Award size={ICON_SIZES.xl} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                    No Certificates Yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Complete courses to earn certificates that you can share on LinkedIn and add to your resume.
                </p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md w-full">
                    <Search
                        size={ICON_SIZES.sm}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Search certificates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                        data-testid="certificate-search-input"
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="appearance-none pl-8 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                            data-testid="certificate-sort-select"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="name">Sort by Name</option>
                            <option value="shares">Sort by Shares</option>
                        </select>
                        <Filter
                            size={ICON_SIZES.sm}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === "grid"
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                            data-testid="view-grid-btn"
                        >
                            <Grid size={ICON_SIZES.sm} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === "list"
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                            data-testid="view-list-btn"
                        >
                            <List size={ICON_SIZES.sm} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {certificates.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Certificates</p>
                </div>
                <div className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {certificates.reduce((sum, c) => sum + c.shareCount, 0)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Shares</p>
                </div>
                <div className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {certificates.reduce((sum, c) => sum + c.certificate.metadata.totalHours, 0)}h
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Learning Hours</p>
                </div>
                <div className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {new Set(certificates.flatMap((c) => c.certificate.skills)).size}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Skills Acquired</p>
                </div>
            </div>

            {/* Certificate List/Grid */}
            <AnimatePresence mode="wait">
                {viewMode === "grid" ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        data-testid="certificate-grid"
                    >
                        {filteredCertificates.map((item, index) => (
                            <motion.div
                                key={item.certificate.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <CertificateDisplay
                                    certificate={item.certificate}
                                    size="md"
                                    onClick={() => setSelectedCertificate(item)}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                        data-testid="certificate-list"
                    >
                        {filteredCertificates.map((item, index) => {
                            const template = CERTIFICATE_TEMPLATES.find(
                                (t) => t.id === item.certificate.templateId
                            ) || CERTIFICATE_TEMPLATES[0];

                            return (
                                <motion.div
                                    key={item.certificate.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <div
                                        className="flex items-center gap-4 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => setSelectedCertificate(item)}
                                        data-testid={`certificate-list-item-${item.certificate.id}`}
                                    >
                                        {/* Icon */}
                                        <div
                                            className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br",
                                                template.accentColor === "indigo" && "from-indigo-500 to-indigo-600",
                                                template.accentColor === "purple" && "from-purple-500 to-purple-600",
                                                template.accentColor === "blue" && "from-blue-500 to-blue-600",
                                                template.accentColor === "orange" && "from-orange-500 to-orange-600"
                                            )}
                                        >
                                            <Award size={ICON_SIZES.lg} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                                {item.certificate.courseTitle}
                                            </h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={ICON_SIZES.xs} />
                                                    {formatCertificateDate(item.certificate.completionDate)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={ICON_SIZES.xs} />
                                                    {item.certificate.metadata.totalHours}h
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Share2 size={ICON_SIZES.xs} />
                                                    {item.shareCount} shares
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDownload(item.certificate.id, "png");
                                                }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                data-testid={`download-btn-${item.certificate.id}`}
                                            >
                                                <Download size={ICON_SIZES.sm} className="text-slate-500" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onShare(item.certificate.id, "linkedin");
                                                }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                data-testid={`share-btn-${item.certificate.id}`}
                                            >
                                                <Share2 size={ICON_SIZES.sm} className="text-slate-500" />
                                            </button>
                                            {onDelete && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm("Delete this certificate?")) {
                                                            onDelete(item.certificate.id);
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    data-testid={`delete-btn-${item.certificate.id}`}
                                                >
                                                    <Trash2 size={ICON_SIZES.sm} className="text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* No Results */}
            {filteredCertificates.length === 0 && searchQuery && (
                <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">
                        No certificates found for "{searchQuery}"
                    </p>
                </div>
            )}

            {/* Certificate Modal */}
            <CertificateModal
                certificate={selectedCertificate?.certificate || null}
                isOpen={!!selectedCertificate}
                onClose={() => setSelectedCertificate(null)}
                onDownload={handleDownload}
                onShare={handleShare}
            />
        </div>
    );
}
