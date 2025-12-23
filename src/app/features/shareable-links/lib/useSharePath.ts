"use client";

/**
 * Hook for managing path sharing functionality
 */

import { useState, useCallback } from "react";
import type { LearningPath } from "@/app/shared/lib/types";
import type { ShareModalState } from "./types";
import {
    generateShareUrl,
    copyToClipboard,
    generateTwitterShareUrl,
    generateLinkedInShareUrl,
} from "./shareUtils";

interface UseSharePathOptions {
    /** Optional progress value to include in share */
    progress?: number;
    /** Base URL for generating share links */
    baseUrl?: string;
}

interface UseSharePathReturn {
    /** Current modal state */
    modalState: ShareModalState;
    /** Open share modal for a path */
    openShare: (path: LearningPath) => void;
    /** Close share modal */
    closeShare: () => void;
    /** Copy share URL to clipboard */
    copyShareUrl: () => Promise<boolean>;
    /** Share to Twitter */
    shareToTwitter: () => void;
    /** Share to LinkedIn */
    shareToLinkedIn: () => void;
    /** Reset copied state */
    resetCopied: () => void;
}

export function useSharePath(options: UseSharePathOptions = {}): UseSharePathReturn {
    const { progress, baseUrl } = options;

    const [modalState, setModalState] = useState<ShareModalState>({
        isOpen: false,
        path: null,
        shareUrl: null,
        copied: false,
    });

    const openShare = useCallback((path: LearningPath) => {
        const shareUrl = generateShareUrl(path.id, progress, baseUrl);
        setModalState({
            isOpen: true,
            path,
            shareUrl,
            copied: false,
        });
    }, [progress, baseUrl]);

    const closeShare = useCallback(() => {
        setModalState(prev => ({
            ...prev,
            isOpen: false,
            copied: false,
        }));
    }, []);

    const copyShareUrl = useCallback(async (): Promise<boolean> => {
        if (!modalState.shareUrl) return false;

        const success = await copyToClipboard(modalState.shareUrl);
        if (success) {
            setModalState(prev => ({ ...prev, copied: true }));
        }
        return success;
    }, [modalState.shareUrl]);

    const shareToTwitter = useCallback(() => {
        if (!modalState.path || !modalState.shareUrl) return;

        const url = generateTwitterShareUrl(modalState.path, modalState.shareUrl, progress);
        window.open(url, "_blank", "noopener,noreferrer");
    }, [modalState.path, modalState.shareUrl, progress]);

    const shareToLinkedIn = useCallback(() => {
        if (!modalState.shareUrl) return;

        const url = generateLinkedInShareUrl(modalState.shareUrl);
        window.open(url, "_blank", "noopener,noreferrer");
    }, [modalState.shareUrl]);

    const resetCopied = useCallback(() => {
        setModalState(prev => ({ ...prev, copied: false }));
    }, []);

    return {
        modalState,
        openShare,
        closeShare,
        copyShareUrl,
        shareToTwitter,
        shareToLinkedIn,
        resetCopied,
    };
}
