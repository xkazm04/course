/**
 * Shared chapter section data types and mock data
 * Consolidates duplicate section patterns from VariantA and VariantC
 *
 * ChapterSection is a LearningNode in the curriculum graph:
 * - It has an id, sectionId, content with code/keyPoints, and completed status
 * - This structure matches exactly what a LearningNode represents
 * - By using the unified LearningNode base type, chapter progress integrates
 *   naturally with the learning graph for cross-chapter prerequisites and
 *   smarter path recommendations.
 */

import type {
    LearningNodeBase,
    LearningContentType,
} from "@/app/features/knowledge-map/lib/learningNode";

// Section type for content categorization
// Maps directly to LearningContentType for unified typing
export type SectionType = "video" | "lesson" | "interactive" | "exercise";

/**
 * Section content with optional fields based on type
 *
 * Aligns with LearningNodeContent from the knowledge-map domain:
 * - description: matches LearningNodeContent.description
 * - code: matches LearningNodeContent.code
 * - keyPoints: matches LearningNodeContent.keyPoints
 * - screenshot: section-specific field (maps to LearningNodeContent.hasVisuals)
 *
 * @see LearningNodeContent for the canonical content type
 */
export interface SectionContent {
    description: string;
    code?: string;
    keyPoints?: string[];
    screenshot?: boolean;
}

/**
 * ChapterSection - A learning node specialized for chapter content
 *
 * This interface implements the LearningNode pattern from the curriculum DAG
 * while maintaining backward compatibility with existing chapter components.
 *
 * Mapping to LearningNodeBase:
 * - sectionId -> LearningNodeBase.id (unique identifier)
 * - title -> LearningNodeBase.title
 * - type -> LearningNodeBase.contentType
 * - duration -> LearningNodeBase.duration
 * - completed -> derived from LearningNodeBase.status
 *
 * Additional section-specific fields:
 * - id: numeric order within chapter
 * - time: video timestamp
 * - content: rich content descriptor
 */
export interface ChapterSection {
    /**
     * Numeric order within the chapter (1-based)
     * Used for sequential navigation and implicit dependencies
     */
    id: number;

    /**
     * Unique string identifier for this section
     * This is the canonical LearningNode id
     */
    sectionId: string;

    /**
     * Human-readable title
     */
    title: string;

    /**
     * Estimated duration as string (e.g., "5 min")
     */
    duration: string;

    /**
     * Video timestamp for this section (e.g., "0:00", "2:15")
     */
    time: string;

    /**
     * Content type classification
     * Maps to LearningContentType for unified handling
     */
    type: SectionType;

    /**
     * Whether this section has been completed
     * Maps to LearningNodeBase.status === "completed"
     */
    completed: boolean;

    /**
     * Rich content descriptor with code, key points, etc.
     */
    content: SectionContent;
}

/**
 * Convert a ChapterSection to a LearningNodeBase for graph operations
 */
export function chapterSectionToLearningNode(section: ChapterSection): LearningNodeBase {
    return {
        id: section.sectionId,
        title: section.title,
        status: section.completed ? "completed" : "available",
        contentType: section.type as LearningContentType,
        duration: section.duration,
        progress: section.completed ? 100 : 0,
    };
}

/**
 * Convert a LearningNodeBase back to ChapterSection fields
 * (partial, for updates)
 */
export function learningNodeToChapterSectionUpdate(
    node: LearningNodeBase
): Partial<ChapterSection> {
    return {
        sectionId: node.id,
        title: node.title,
        completed: node.status === "completed",
        type: node.contentType as SectionType,
        duration: typeof node.duration === "string" ? node.duration : `${node.duration} min`,
    };
}

// Simplified section for sidebar display (VariantA)
export interface SimplifiedSection {
    id: string;
    title: string;
    time: string;
    completed: boolean;
}

// Course/Chapter metadata
export interface CourseInfo {
    courseId: string;
    courseName: string;
    chapterId: string;
    chapterTitle: string;
}

// ============================================================================
// Content Metadata Types (for showcase)
// ============================================================================

export interface VideoVariant {
    id: string;
    title: string;
    youtubeId?: string;
    searchQuery: string;
    instructorName?: string;
    style?: 'lecture' | 'tutorial' | 'walkthrough' | 'animated';
    duration?: string;
}

export interface ContentMetadata {
    key_takeaways?: string[];
    video_variants?: VideoVariant[];
    estimated_time_minutes?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    introduction?: string;
}

// Shared course metadata
export const COURSE_INFO: CourseInfo = {
    courseId: "react-hooks",
    courseName: "React Hooks Mastery",
    chapterId: "custom-hooks",
    chapterTitle: "Building Your First Custom Hook",
};

// ============================================================================
// Showcase Content Metadata
// ============================================================================

export const CONTENT_METADATA: ContentMetadata = {
    difficulty: "intermediate",
    estimated_time_minutes: 45,
    introduction: `Custom Hooks are **JavaScript functions** that start with "use" and can call other Hooks. They let you extract component logic into reusable functions, making your code more modular and easier to test.

In this chapter, you'll learn how to identify opportunities for custom hooks, build your first hook from scratch, and apply best practices for hook design.`,
    key_takeaways: [
        "Understand the motivation behind custom hooks",
        "Extract component logic into reusable functions",
        "Learn naming conventions and best practices",
        "Build real-world hooks like useLocalStorage",
        "Handle complex state and side effects",
    ],
    video_variants: [
        {
            id: "fireship-hooks",
            title: "React Hooks in 100 Seconds",
            youtubeId: "TNhaISOUy6Q",
            searchQuery: "React custom hooks tutorial",
            instructorName: "Fireship",
            style: "animated",
            duration: "2:15",
        },
        {
            id: "jack-custom",
            title: "Building Custom Hooks - Deep Dive",
            searchQuery: "React custom hooks patterns Jack Herrington",
            instructorName: "Jack Herrington",
            style: "walkthrough",
            duration: "24:15",
        },
        {
            id: "net-ninja",
            title: "Custom Hooks Tutorial",
            searchQuery: "React custom hooks tutorial for beginners",
            instructorName: "The Net Ninja",
            style: "tutorial",
            duration: "18:42",
        },
    ],
};

// Alternative course info for VariantC (hooks fundamentals focus)
export const HOOKS_FUNDAMENTALS_COURSE_INFO: CourseInfo = {
    courseId: "react-hooks",
    courseName: "React Hooks Mastery",
    chapterId: "hooks-fundamentals",
    chapterTitle: "React Hooks Fundamentals",
};

// Main chapter sections data - single source of truth
export const CHAPTER_SECTIONS: ChapterSection[] = [
    {
        id: 1,
        sectionId: "intro",
        title: "Introduction to Custom Hooks",
        duration: "5 min",
        time: "0:00",
        type: "video",
        completed: true,
        content: {
            description: `Before diving into custom hooks, let's understand **why they exist** and what problems they solve.

React Hooks were introduced in React 16.8 to solve the problem of sharing stateful logic between components. Before hooks, developers had to use:

- **Higher-Order Components (HOCs)** - which led to "wrapper hell"
- **Render props** - which made component trees complex and hard to follow

Custom hooks provide a cleaner way to extract and share logic while keeping your components focused on what they render.`,
            keyPoints: [
                "Hooks solve the problem of sharing stateful logic",
                "They replace HOCs and render props patterns",
                "Custom hooks must start with 'use' prefix",
            ],
        },
    },
    {
        id: 2,
        sectionId: "understanding",
        title: "Understanding Hook Rules",
        duration: "12 min",
        time: "5:00",
        type: "lesson",
        completed: true,
        content: {
            description: `There are two fundamental rules you must follow when using hooks:

### Rule 1: Only Call Hooks at the Top Level
Don't call hooks inside loops, conditions, or nested functions. This ensures hooks are called in the same order each render.

### Rule 2: Only Call Hooks from React Functions
Call hooks from React function components or from custom hooks — not from regular JavaScript functions.`,
            code: `// ✅ Good - hooks at top level
function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// ❌ Bad - hook inside condition
function BadCounter() {
  if (someCondition) {
    const [count, setCount] = useState(0); // This will break!
  }
}`,
            keyPoints: [
                "Always call hooks at the top level",
                "Never call hooks inside conditions or loops",
                "Only call hooks from React function components",
            ],
        },
    },
    {
        id: 3,
        sectionId: "building",
        title: "Building Your First Hook",
        duration: "15 min",
        time: "17:00",
        type: "interactive",
        completed: false,
        content: {
            description: `Let's build a practical custom hook: \`useLocalStorage\`. This hook will persist state to localStorage and sync it across browser tabs.

The hook will:
1. Initialize state from localStorage (or use a default value)
2. Update localStorage whenever the state changes
3. Handle JSON serialization/deserialization
4. Provide error handling for storage failures`,
            code: `import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  // Get stored value or use initial
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  // Sync to localStorage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}`,
            keyPoints: [
                "Custom hooks can use other hooks",
                "Return tuple for familiar useState-like API",
                "Handle errors gracefully in production",
            ],
            screenshot: true,
        },
    },
    {
        id: 4,
        sectionId: "best-practices",
        title: "Best Practices & Patterns",
        duration: "10 min",
        time: "32:00",
        type: "lesson",
        completed: false,
        content: {
            description: `Follow these best practices to write maintainable custom hooks:

### Naming Conventions
- Always prefix with \`use\` (required by React)
- Use descriptive names: \`useAuth\`, \`useWindowSize\`, \`useFetch\`

### Single Responsibility
Each hook should do one thing well. If your hook is getting complex, consider splitting it into smaller hooks.

### Return Consistent Types
Make your hooks predictable by returning consistent types and structures.`,
            code: `// Pattern: Return object for complex hooks
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = async (credentials) => { /* ... */ };
  const logout = async () => { /* ... */ };

  return { user, loading, error, login, logout };
}

// Pattern: Return tuple for simple state hooks
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = () => setValue(v => !v);
  return [value, toggle] as const;
}`,
            keyPoints: [
                "Use descriptive hook names with 'use' prefix",
                "Keep hooks focused on single responsibility",
                "Return objects for complex hooks, tuples for simple ones",
            ],
        },
    },
    {
        id: 5,
        sectionId: "exercise",
        title: "Practice Exercise",
        duration: "20 min",
        time: "42:00",
        type: "exercise",
        completed: false,
        content: {
            description: `Now it's your turn! Build a \`useDebounce\` hook that delays updating a value until a specified time has passed.

**Requirements:**
- Accept a value and delay (in milliseconds)
- Return the debounced value
- Reset the timer when the input value changes
- Clean up the timer on unmount

This is useful for search inputs, form validation, and preventing excessive API calls.`,
            code: `// Your task: Implement useDebounce
function useDebounce<T>(value: T, delay: number): T {
  // TODO: Implement debouncing logic
  // Hint: Use useState and useEffect
}

// Usage example:
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    // Only called 500ms after user stops typing
    searchAPI(debouncedQuery);
  }, [debouncedQuery]);
}`,
            keyPoints: [
                "Use setTimeout for debouncing",
                "Clean up timer in useEffect return",
                "Consider edge cases like unmounting",
            ],
        },
    },
];

// Helper to get simplified sections for VariantA sidebar
export function getSimplifiedSections(): SimplifiedSection[] {
    return CHAPTER_SECTIONS.map((section) => ({
        id: section.sectionId,
        title: section.title,
        time: section.time,
        completed: section.completed,
    }));
}

// Helper to get section by sectionId
export function getSectionById(sectionId: string): ChapterSection | undefined {
    return CHAPTER_SECTIONS.find((s) => s.sectionId === sectionId);
}

// Helper to get section by numeric id
export function getSectionByNumericId(id: number): ChapterSection | undefined {
    return CHAPTER_SECTIONS.find((s) => s.id === id);
}

// Helper to calculate progress
export function calculateProgress(sections: ChapterSection[]): number {
    const completedCount = sections.filter((s) => s.completed).length;
    return (completedCount / sections.length) * 100;
}

// Helper to get total duration as a string
export function getTotalDuration(sections: ChapterSection[]): string {
    const totalMinutes = sections.reduce((sum, section) => {
        const minutes = parseInt(section.duration, 10);
        return sum + (isNaN(minutes) ? 0 : minutes);
    }, 0);
    return `~${totalMinutes} min`;
}
