export {
    useVariantAnimation,
    getStaggerDelay,
    getSpringConfig,
    containerVariants,
    itemVariants,
} from "./useVariantAnimation";

export type {
    AnimationPreset,
    AnimationDirection,
    SpringConfig,
    VariantAnimationConfig,
    VariantAnimationResult,
} from "./useVariantAnimation";

// Supabase hooks
export { useSupabase } from "./useSupabase";

// Categories/Taxonomy hooks
export {
    useCategories,
    useTopics,
    useCategoryBySlug,
    useSubcategoryBySlug,
    useTopicBySlug,
} from "./useCategories";

export type { UseCategoriesResult } from "./useCategories";

// Courses hooks
export {
    useCourses,
    useCourseDetails,
    useCourseMutations,
} from "./useCourses";

export type {
    CourseFilters,
    UseCourseResult,
    UseCourseDetailsResult,
} from "./useCourses";

// Knowledge Map hooks
export {
    useKnowledgeMap,
    useKnowledgeMapNodes,
    useKnowledgeMapNode,
    useNodeConnections,
    useNodePath,
} from "./useKnowledgeMap";

export type { UseKnowledgeMapOptions, UseKnowledgeMapResult } from "./useKnowledgeMap";

// Learning Paths hooks
export {
    useLearningPaths,
    useLearningPath,
    useLearningPathStats,
} from "./useLearningPaths";

export type { UseLearningPathsOptions, UseLearningPathsResult } from "./useLearningPaths";
