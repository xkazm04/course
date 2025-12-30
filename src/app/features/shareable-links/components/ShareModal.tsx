"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Twitter, Linkedin, Link2, ExternalLink } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { BG_COLORS, toDomainColor, DOMAIN_ICON_MAP } from "@/app/shared/lib/learningDomains";
import type { ShareModalState } from "../lib/types";

interface ShareModalProps {
    /** Modal state including path and share URL */
    state: ShareModalState;
    /** Close the modal */
    onClose: () => void;
    /** Copy URL to clipboard */
    onCopy: () => Promise<boolean>;
    /** Share to Twitter */
    onTwitterShare: () => void;
    /** Share to LinkedIn */
    onLinkedInShare: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    state,
    onClose,
    onCopy,
    onTwitterShare,
    onLinkedInShare,
}) => {
    const { isOpen, path, shareUrl, copied } = state;

    if (!path || !shareUrl) return null;

    const pathColor = toDomainColor(path.color);
    const PathIcon = DOMAIN_ICON_MAP[path.icon];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        data-testid="share-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        data-testid="share-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-default)] rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header with path info */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                                            BG_COLORS[pathColor]
                                        )}>
                                            {PathIcon && <PathIcon size={ICON_SIZES.lg} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-[var(--forge-text-primary)]">
                                                Share Learning Path
                                            </h3>
                                            <p className="text-sm text-[var(--forge-text-muted)]">
                                                {path.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        data-testid="share-modal-close-btn"
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                                    >
                                        <X size={ICON_SIZES.md} />
                                    </button>
                                </div>

                                {/* Path preview card */}
                                <div className="p-4 bg-[var(--forge-bg-workshop)] rounded-xl mb-4">
                                    <div className="flex items-center gap-3 text-sm text-[var(--forge-text-secondary)]">
                                        <span className="px-2 py-1 bg-[var(--forge-bg-anvil)] rounded-md">
                                            {path.courses} courses
                                        </span>
                                        <span className="px-2 py-1 bg-[var(--forge-bg-anvil)] rounded-md">
                                            {path.hours}h
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-[var(--forge-text-muted)]">
                                        {path.description}
                                    </p>
                                </div>

                                {/* Share URL input */}
                                <div className="flex items-center gap-2 p-3 bg-[var(--forge-bg-workshop)] rounded-xl border border-[var(--forge-border-default)]">
                                    <Link2 size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)] flex-shrink-0" />
                                    <input
                                        data-testid="share-url-input"
                                        type="text"
                                        readOnly
                                        value={shareUrl}
                                        className="flex-1 bg-transparent text-sm text-[var(--forge-text-primary)] outline-none truncate"
                                    />
                                    <button
                                        data-testid="copy-share-url-btn"
                                        onClick={onCopy}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                            copied
                                                ? "bg-[var(--forge-success)]/20 text-[var(--forge-success)]"
                                                : "bg-[var(--ember)] text-white hover:opacity-90"
                                        )}
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={ICON_SIZES.xs} />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={ICON_SIZES.xs} />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Social share buttons */}
                            <div className="p-6 pt-0">
                                <p className="text-xs text-[var(--forge-text-muted)] mb-3">Share on</p>
                                <div className="flex gap-3">
                                    <button
                                        data-testid="share-twitter-btn"
                                        onClick={onTwitterShare}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors"
                                    >
                                        <Twitter size={ICON_SIZES.md} />
                                        <span className="font-medium">Twitter</span>
                                        <ExternalLink size={ICON_SIZES.xs} className="opacity-50" />
                                    </button>
                                    <button
                                        data-testid="share-linkedin-btn"
                                        onClick={onLinkedInShare}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors"
                                    >
                                        <Linkedin size={ICON_SIZES.md} />
                                        <span className="font-medium">LinkedIn</span>
                                        <ExternalLink size={ICON_SIZES.xs} className="opacity-50" />
                                    </button>
                                </div>
                            </div>

                            {/* Footer note */}
                            <div className="px-6 pb-6">
                                <p className="text-xs text-center text-[var(--forge-text-muted)]">
                                    Anyone with this link can view your learning path
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;
