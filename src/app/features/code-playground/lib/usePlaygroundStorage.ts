"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CodeFile } from "./types";

const STORAGE_PREFIX = "code-playground-";
const AUTO_SAVE_DELAY = 1000; // 1 second debounce

export function usePlaygroundStorage(playgroundId: string, initialFiles: CodeFile[]) {
    const [files, setFiles] = useState<CodeFile[]>(initialFiles);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined" || isInitializedRef.current) return;

        const storageKey = `${STORAGE_PREFIX}${playgroundId}`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData) as CodeFile[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setFiles(parsed);
                    setHasUnsavedChanges(true);
                }
            } catch {
                // Invalid data, use initial files
                console.warn("Failed to parse saved playground data");
            }
        }

        isInitializedRef.current = true;
    }, [playgroundId]);

    // Auto-save to localStorage with debouncing
    const saveToStorage = useCallback((filesToSave: CodeFile[]) => {
        if (typeof window === "undefined") return;

        const storageKey = `${STORAGE_PREFIX}${playgroundId}`;
        localStorage.setItem(storageKey, JSON.stringify(filesToSave));
    }, [playgroundId]);

    // Update a specific file
    const updateFile = useCallback((fileId: string, newContent: string) => {
        setFiles(prevFiles => {
            const updatedFiles = prevFiles.map(file =>
                file.id === fileId ? { ...file, content: newContent } : file
            );

            // Schedule auto-save
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            autoSaveTimeoutRef.current = setTimeout(() => {
                saveToStorage(updatedFiles);
            }, AUTO_SAVE_DELAY);

            setHasUnsavedChanges(true);
            return updatedFiles;
        });
    }, [saveToStorage]);

    // Reset to original files
    const resetToOriginal = useCallback(() => {
        if (typeof window === "undefined") return;

        const storageKey = `${STORAGE_PREFIX}${playgroundId}`;
        localStorage.removeItem(storageKey);
        setFiles(initialFiles);
        setHasUnsavedChanges(false);

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
    }, [playgroundId, initialFiles]);

    // Manual save
    const saveNow = useCallback(() => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
        saveToStorage(files);
    }, [files, saveToStorage]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);

    return {
        files,
        updateFile,
        resetToOriginal,
        saveNow,
        hasUnsavedChanges,
    };
}
