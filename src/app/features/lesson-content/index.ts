/**
 * Lesson Content Feature
 *
 * Provides lesson content storage, retrieval, and rendering.
 * Uses markdown with custom parsing rules for flexible UI generation.
 */

// Types
export type {
    VideoVariant,
    KeyReference,
    LessonMetadata,
    LessonSection,
    LessonContent,
    FullLesson,
} from "./lib/types";

// Conversion utilities
export {
    lessonToCourseInfo,
    lessonToContentMetadata,
    lessonSectionToChapterSection,
    lessonToElegantVariantProps,
} from "./lib/types";

// Example data
export {
    EXAMPLE_LESSON_CONTENT,
    EXAMPLE_LESSON_SECTIONS,
    EXAMPLE_FULL_LESSON,
} from "./lib/exampleLesson";

// Markdown parser
export type {
    CustomBlockType,
    ParsedBlock,
    TextBlock,
    CustomBlock,
    BlockData,
    // Basic blocks
    VideoBlockData,
    CodeBlockData,
    CalloutBlockData,
    KeypointsBlockData,
    ExerciseBlockData,
    QuizBlockData,
    // Extended blocks
    TabsBlockData,
    ComparisonBlockData,
    ScenarioBlockData,
    StepsBlockData,
    PitfallBlockData,
    DeepDiveBlockData,
    RealWorldBlockData,
    SyntaxBlockData,
    CheckpointBlockData,
    ProTipBlockData,
} from "./lib/markdownParser";

export {
    parseCustomMarkdown,
    parseMarkdownToBlocks,
    blockToData,
    extractCodeBlocks,
    extractVideoBlocks,
    extractKeypoints,
    stripCustomBlocks,
    hasCustomBlocks,
} from "./lib/markdownParser";

// Components
export {
    LessonRenderer,
    SectionRenderer,
    MarkdownOnlyRenderer,
    ContentBlockRenderer,
    BlockRenderer,
    VideoBlock,
    CodeBlock,
    CalloutBlock,
    KeypointsBlock,
    ExerciseBlock,
    QuizBlock,
    LessonView,
    LessonViewLoading,
    LessonViewError,
} from "./components";

// Hooks
export { useLessonContent, useLessonList } from "./lib/useLessonContent";
