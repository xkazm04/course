/**
 * Generative Content React Hooks
 *
 * Custom hooks for managing generative content, including path creation,
 * content generation, ratings, annotations, and forking.
 *
 * This is a re-export module. Implementation is split into:
 * - hooks/useCurrentUser.ts - Current user hook (demo)
 * - hooks/useLearningPaths.ts - Learning path management
 * - hooks/useContentGeneration.ts - Content generation
 * - hooks/useGeneratedChapters.ts - Chapter management
 * - hooks/useContentRating.ts - Content rating
 * - hooks/useContentAnnotations.ts - Content annotations
 * - hooks/useContentVersions.ts - Content versioning
 * - hooks/useContentForking.ts - Content forking
 * - hooks/useGenerativeContentManager.ts - Combined manager
 */

"use client";

// Current user
export { useCurrentUser } from "./hooks";

// Path management
export { useLearningPaths } from "./hooks";

// Content generation
export { useContentGeneration } from "./hooks";

// Generated chapters
export { useGeneratedChapters } from "./hooks";

// Content rating
export { useContentRating } from "./hooks";

// Content annotations
export { useContentAnnotations } from "./hooks";

// Content versioning
export { useContentVersions } from "./hooks";

// Content forking
export { useContentForking } from "./hooks";

// Combined manager
export { useGenerativeContentManager } from "./hooks";
