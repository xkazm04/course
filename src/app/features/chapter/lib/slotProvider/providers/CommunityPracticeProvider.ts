/**
 * Community Practice Provider
 *
 * An example slot provider that injects community-contributed practice
 * problems into chapter layouts.
 */

import type {
    ISlotProvider,
    SlotProviderConfig,
    SlotProviderContext,
    SlotProviderResult,
    InjectedSlot,
} from "../types";
import { createSlotBuilder } from "../slotBuilders";

// ============================================================================
// Configuration
// ============================================================================

const PROVIDER_ID = "com.openforge.community-practice";

const config: SlotProviderConfig = {
    id: PROVIDER_ID,
    name: "Community Practice Problems",
    description: "Contributes practice problems from the community",
    version: "1.0.0",
    supportedSlotTypes: ["code", "text", "keyPoints"],
    supportedRegions: ["main", "footer"],
    enabledByDefault: true,
};

// ============================================================================
// Practice Problem Data
// ============================================================================

interface PracticeProblem {
    id: string;
    chapterId: string;
    sectionId?: string;
    difficulty: "easy" | "medium" | "hard";
    title: string;
    description: string;
    starterCode: string;
    hints: string[];
    author: string;
    upvotes: number;
}

// Mock practice problems - in production, these would come from an API
const mockPracticeProblems: PracticeProblem[] = [
    {
        id: "practice-1",
        chapterId: "custom-hooks",
        difficulty: "easy",
        title: "Create a useToggle Hook",
        description:
            "Create a custom hook that manages a boolean state with a toggle function.",
        starterCode: `// Create a useToggle hook that:
// 1. Accepts an optional initial value (default: false)
// 2. Returns [value, toggle] where toggle flips the value

export function useToggle(initial?: boolean) {
  // Your code here
}

// Usage example:
// const [isOpen, toggleOpen] = useToggle(false);`,
        hints: [
            "Use useState to store the boolean value",
            "useCallback can help memoize the toggle function",
            "Consider using a functional update for the toggle",
        ],
        author: "community_member_42",
        upvotes: 127,
    },
    {
        id: "practice-2",
        chapterId: "custom-hooks",
        difficulty: "medium",
        title: "Create a useDebounce Hook",
        description:
            "Create a custom hook that debounces a value by a specified delay.",
        starterCode: `// Create a useDebounce hook that:
// 1. Accepts a value and delay in milliseconds
// 2. Returns the debounced value

export function useDebounce<T>(value: T, delay: number): T {
  // Your code here
}

// Usage example:
// const debouncedSearch = useDebounce(searchTerm, 300);`,
        hints: [
            "You'll need useState to store the debounced value",
            "useEffect can handle the timeout logic",
            "Don't forget to clean up the timeout",
        ],
        author: "react_ninja",
        upvotes: 89,
    },
    {
        id: "practice-3",
        chapterId: "custom-hooks",
        difficulty: "hard",
        title: "Create a useFetch Hook",
        description:
            "Create a custom hook that fetches data from an API with loading and error states.",
        starterCode: `// Create a useFetch hook that:
// 1. Accepts a URL and optional options
// 2. Returns { data, loading, error, refetch }

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFetch<T>(url: string, options?: RequestInit): UseFetchResult<T> {
  // Your code here
}

// Usage example:
// const { data, loading, error } = useFetch<User[]>('/api/users');`,
        hints: [
            "Use multiple useState hooks for data, loading, and error",
            "useEffect with the URL as a dependency triggers fetches",
            "Consider using useCallback for the refetch function",
            "Handle the case when the component unmounts during fetch",
        ],
        author: "hooks_master",
        upvotes: 234,
    },
];

// ============================================================================
// Provider Implementation
// ============================================================================

/**
 * Creates a Community Practice Provider instance.
 *
 * @example
 * ```typescript
 * const provider = createCommunityPracticeProvider();
 * registry.register(provider);
 * ```
 */
export function createCommunityPracticeProvider(): ISlotProvider {
    const builder = createSlotBuilder({
        providerId: PROVIDER_ID,
        providerVersion: config.version,
    });

    return {
        config,

        shouldActivate(context: SlotProviderContext): boolean {
            // Active if we have practice problems for this chapter
            return mockPracticeProblems.some(
                (p) => p.chapterId === context.chapterId
            );
        },

        generateSlots(context: SlotProviderContext): SlotProviderResult {
            const slots: InjectedSlot[] = [];

            // Find relevant practice problems
            const relevantProblems = mockPracticeProblems.filter(
                (p) =>
                    p.chapterId === context.chapterId &&
                    (!p.sectionId || p.sectionId === context.sectionId)
            );

            // Add practice problems as slots
            for (const problem of relevantProblems) {
                // Add the main practice code slot
                const practiceSlot = builder.createPractice(
                    problem.id,
                    problem.starterCode,
                    {
                        filename: `practice-${problem.id}.tsx`,
                        description: problem.description,
                        region: "main",
                        priority: "normal",
                        difficulty: problem.difficulty,
                    }
                );

                // Add metadata to the slot
                practiceSlot.metadata.tags = [
                    ...(practiceSlot.metadata.tags || []),
                    `difficulty:${problem.difficulty}`,
                    `author:${problem.author}`,
                    `upvotes:${problem.upvotes}`,
                ];
                practiceSlot.metadata.reason = `${problem.title} (${problem.upvotes} upvotes)`;

                slots.push(practiceSlot);

                // Add hints as a key points slot
                if (problem.hints.length > 0) {
                    const hintsSlot = builder.createKeyPoints(
                        `${problem.id}-hints`,
                        problem.hints.map((h, i) => `${i + 1}. ${h}`),
                        {
                            title: "💡 Hints (click to reveal)",
                            icon: "sparkles",
                            region: "sidebar",
                            priority: "low",
                        }
                    );

                    hintsSlot.metadata.tags = ["hints", "collapsible"];
                    slots.push(hintsSlot);
                }
            }

            // Add a community contribution CTA if there are problems
            if (relevantProblems.length > 0) {
                const ctaSlot = builder.createHint(
                    "community-cta",
                    "Have a practice problem idea? Share it with the community and help other learners!",
                    {
                        title: "🤝 Contribute",
                        region: "footer",
                        priority: "low",
                        confidence: 1.0,
                        reason: "Community engagement CTA",
                    }
                );

                ctaSlot.metadata.tags = ["cta", "community"];
                slots.push(ctaSlot);
            }

            return { slots };
        },

        onSlotInteraction(slotId: string, type: string, data?: unknown): void {
            // Track engagement with practice problems
            if (type === "code-run") {
                console.log(`[${PROVIDER_ID}] Practice problem run:`, slotId);
            } else if (type === "upvote") {
                console.log(`[${PROVIDER_ID}] Practice problem upvoted:`, slotId);
            }
        },
    };
}

// Export singleton for convenience
export const communityPracticeProvider = createCommunityPracticeProvider();
