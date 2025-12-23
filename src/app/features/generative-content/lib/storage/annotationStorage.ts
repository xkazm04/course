/**
 * Annotation Storage
 *
 * Storage operations for content annotations.
 */

import type { ContentAnnotation } from "../types";
import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";

/**
 * Save an annotation
 */
export function saveAnnotation(annotation: ContentAnnotation): void {
    const annotations = getStorageItem<ContentAnnotation[]>(STORAGE_KEYS.ANNOTATIONS, []);
    const existingIndex = annotations.findIndex((a) => a.id === annotation.id);

    if (existingIndex >= 0) {
        annotations[existingIndex] = annotation;
    } else {
        annotations.push(annotation);
    }

    setStorageItem(STORAGE_KEYS.ANNOTATIONS, annotations);
}

/**
 * Get annotations for content
 */
export function getAnnotationsForContent(contentId: string): ContentAnnotation[] {
    const annotations = getStorageItem<ContentAnnotation[]>(STORAGE_KEYS.ANNOTATIONS, []);
    return annotations.filter((a) => a.contentId === contentId);
}

/**
 * Get public annotations for content
 */
export function getPublicAnnotations(contentId: string): ContentAnnotation[] {
    return getAnnotationsForContent(contentId).filter((a) => a.visibility === "public");
}

/**
 * Get user's annotations
 */
export function getUserAnnotations(userId: string): ContentAnnotation[] {
    const annotations = getStorageItem<ContentAnnotation[]>(STORAGE_KEYS.ANNOTATIONS, []);
    return annotations.filter((a) => a.userId === userId);
}

/**
 * Upvote an annotation
 */
export function upvoteAnnotation(annotationId: string): void {
    const annotations = getStorageItem<ContentAnnotation[]>(STORAGE_KEYS.ANNOTATIONS, []);
    const annotation = annotations.find((a) => a.id === annotationId);

    if (annotation && annotation.visibility === "public") {
        annotation.upvotes += 1;
        setStorageItem(STORAGE_KEYS.ANNOTATIONS, annotations);
    }
}

/**
 * Mark annotation as incorporated
 */
export function markAnnotationIncorporated(annotationId: string): void {
    const annotations = getStorageItem<ContentAnnotation[]>(STORAGE_KEYS.ANNOTATIONS, []);
    const annotation = annotations.find((a) => a.id === annotationId);

    if (annotation) {
        annotation.incorporated = true;
        setStorageItem(STORAGE_KEYS.ANNOTATIONS, annotations);
    }
}

/**
 * Delete an annotation
 */
export function deleteAnnotation(annotationId: string): void {
    const annotations = getStorageItem<ContentAnnotation[]>(STORAGE_KEYS.ANNOTATIONS, []);
    const filtered = annotations.filter((a) => a.id !== annotationId);
    setStorageItem(STORAGE_KEYS.ANNOTATIONS, filtered);
}
