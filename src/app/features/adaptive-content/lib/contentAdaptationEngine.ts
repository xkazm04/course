/**
 * Content Adaptation Engine
 *
 * Generates adaptive content slots based on comprehension level.
 * This engine creates additional explanations, simplified examples,
 * or advanced challenges that can be injected into the slot-based layout.
 */

import type {
    ComprehensionLevel,
    AdaptationConfig,
    AdaptiveSlot,
    AdaptiveSlotContent,
} from "./types";
import { DEFAULT_ADAPTATION_CONFIGS } from "./types";
import type {
    ContentSlot,
    TextSlot,
    CodeSlot,
    KeyPointsSlot,
} from "../../chapter/lib/contentSlots";

// ============================================================================
// Adaptive Slot Generators
// ============================================================================

/**
 * Generate a simplified explanation slot for beginners
 */
function generateSimplifiedExplanation(
    baseContent: string,
    topic: string
): AdaptiveSlot {
    return {
        slotType: "explanation",
        targetLevel: ["beginner"],
        priority: 10,
        content: {
            title: `Understanding ${topic}`,
            description: `Let's break this down into simpler terms: ${simplifyExplanation(baseContent)}`,
        },
    };
}

/**
 * Generate a simplified code example for beginners
 */
function generateSimplifiedExample(
    originalCode: string,
    topic: string
): AdaptiveSlot {
    return {
        slotType: "example",
        targetLevel: ["beginner"],
        priority: 8,
        content: {
            title: `Simpler ${topic} Example`,
            description: "Here's a more basic version to start with:",
            code: simplifyCodeExample(originalCode),
            codeLanguage: "typescript",
        },
    };
}

/**
 * Generate an advanced challenge for proficient learners
 */
function generateAdvancedChallenge(topic: string): AdaptiveSlot {
    return {
        slotType: "challenge",
        targetLevel: ["advanced"],
        priority: 5,
        content: {
            title: `Challenge: ${topic}`,
            description: generateChallengeDescription(topic),
            points: generateChallengePoints(topic),
        },
    };
}

/**
 * Generate a hint for struggling learners
 */
function generateHint(topic: string, commonMistake: string): AdaptiveSlot {
    return {
        slotType: "hint",
        targetLevel: ["beginner"],
        priority: 9,
        content: {
            title: "Common Pitfall",
            description: `Many learners make this mistake: ${commonMistake}. Here's how to avoid it...`,
            points: [
                `Double-check your ${topic} syntax`,
                "Remember to handle edge cases",
                "Test with simple inputs first",
            ],
        },
    };
}

/**
 * Generate a deep dive for advanced learners
 */
function generateDeepDive(topic: string): AdaptiveSlot {
    return {
        slotType: "deepDive",
        targetLevel: ["advanced"],
        priority: 3,
        content: {
            title: `Deep Dive: ${topic} Internals`,
            description: generateDeepDiveContent(topic),
            points: generateDeepDivePoints(topic),
        },
    };
}

// ============================================================================
// Content Simplification Utilities
// ============================================================================

function simplifyExplanation(content: string): string {
    // Remove technical jargon and make it more accessible
    const simplifications: Record<string, string> = {
        "asynchronous": "running in the background",
        "synchronous": "running one at a time",
        "component": "building block",
        "render": "display on screen",
        "state": "remembered data",
        "props": "settings passed in",
        "hook": "special helper function",
        "lifecycle": "stages of a component",
        "virtual DOM": "faster way to update the screen",
        "callback": "function that runs later",
        "closure": "function that remembers its surroundings",
    };

    let simplified = content;
    for (const [term, replacement] of Object.entries(simplifications)) {
        const regex = new RegExp(term, "gi");
        simplified = simplified.replace(regex, `${replacement} (${term})`);
    }

    return simplified;
}

function simplifyCodeExample(code: string): string {
    // Remove advanced patterns and simplify
    let simplified = code;

    // Remove type annotations for beginners
    simplified = simplified.replace(/: \w+(\[\])?/g, "");
    simplified = simplified.replace(/<\w+>/g, "");

    // Simplify arrow functions to regular functions if complex
    if (code.includes("=>") && code.split("=>").length > 2) {
        // Keep it simple - just return the original for now
        // In a real implementation, this would be more sophisticated
    }

    // Add more comments
    const lines = simplified.split("\n");
    const commentedLines = lines.map((line) => {
        if (line.includes("function") || line.includes("const") && line.includes("=")) {
            return `// Define our function\n${line}`;
        }
        if (line.includes("return")) {
            return `// Return the result\n${line}`;
        }
        return line;
    });

    return commentedLines.join("\n");
}

function generateChallengeDescription(topic: string): string {
    const challenges: Record<string, string> = {
        "Custom Hooks": "Extend the hook to support caching and automatic cleanup.",
        "State Management": "Implement undo/redo functionality using the reducer pattern.",
        "Effects": "Create a debounced effect that handles race conditions.",
        "Context": "Build a theme system with persistent preferences.",
        "Performance": "Optimize rendering to handle 10,000+ list items smoothly.",
    };

    return challenges[topic] || `Apply ${topic} to solve a real-world problem.`;
}

function generateChallengePoints(topic: string): string[] {
    return [
        `Implement ${topic} from scratch`,
        "Handle edge cases and errors gracefully",
        "Write comprehensive tests",
        "Document your approach",
    ];
}

function generateDeepDiveContent(topic: string): string {
    const deepDives: Record<string, string> = {
        "Custom Hooks": "Under the hood, React hooks use a linked list to maintain state between renders. Each hook call reserves a 'slot' in this list...",
        "State Management": "The reducer pattern follows functional programming principles, treating state as immutable and actions as pure transformations...",
        "Effects": "useEffect uses a dependency array comparison based on Object.is. Understanding referential equality is key...",
        "Context": "Context creates a Provider-Consumer relationship using React's fiber architecture...",
        "Performance": "React's reconciliation algorithm uses heuristics to achieve O(n) complexity...",
    };

    return deepDives[topic] || `Explore the internals of ${topic} and how it works under the hood.`;
}

function generateDeepDivePoints(topic: string): string[] {
    return [
        "Understand the underlying implementation",
        "Learn common patterns used in production",
        "Explore performance implications",
        "Study real-world use cases",
    ];
}

// ============================================================================
// Main Adaptation Engine
// ============================================================================

export interface AdaptationContext {
    sectionId: string;
    topic: string;
    currentSlots: ContentSlot[];
    comprehensionLevel: ComprehensionLevel;
    config: AdaptationConfig;
}

/**
 * Generate adaptive slots based on comprehension context
 */
export function generateAdaptiveSlots(context: AdaptationContext): AdaptiveSlot[] {
    const { config, topic, currentSlots, comprehensionLevel } = context;
    const adaptiveSlots: AdaptiveSlot[] = [];

    // Find existing content for reference
    const existingText = currentSlots.find((s) => s.type === "text") as TextSlot | undefined;
    const existingCode = currentSlots.find((s) => s.type === "code") as CodeSlot | undefined;

    // Generate beginner content
    if (config.showAdditionalExplanations && existingText) {
        adaptiveSlots.push(
            generateSimplifiedExplanation(existingText.data.content, topic)
        );
    }

    if (config.showSimplifiedExamples && existingCode) {
        adaptiveSlots.push(
            generateSimplifiedExample(existingCode.data.code, topic)
        );
    }

    if (config.showHints) {
        adaptiveSlots.push(
            generateHint(topic, `Forgetting to handle null values in ${topic}`)
        );
    }

    // Generate advanced content
    if (config.showAdvancedChallenges) {
        adaptiveSlots.push(generateAdvancedChallenge(topic));
    }

    if (config.showDeepDives) {
        adaptiveSlots.push(generateDeepDive(topic));
    }

    // Filter to only slots matching the current level
    return adaptiveSlots
        .filter((slot) => slot.targetLevel.includes(comprehensionLevel))
        .sort((a, b) => b.priority - a.priority);
}

/**
 * Convert adaptive slots to content slots for rendering
 */
export function adaptiveSlotsToContentSlots(
    adaptiveSlots: AdaptiveSlot[],
    baseId: string
): ContentSlot[] {
    return adaptiveSlots.map((adaptive, index) => {
        const id = `${baseId}-adaptive-${adaptive.slotType}-${index}`;

        if (adaptive.content.code) {
            return {
                id,
                type: "code",
                data: {
                    code: adaptive.content.code,
                    language: adaptive.content.codeLanguage || "typescript",
                    showLineNumbers: true,
                    showCopy: true,
                },
            } as CodeSlot;
        }

        if (adaptive.content.points && adaptive.content.points.length > 0) {
            return {
                id,
                type: "keyPoints",
                data: {
                    title: adaptive.content.title,
                    points: adaptive.content.points,
                    icon: adaptive.slotType === "hint" ? "message" : "sparkles",
                },
            } as KeyPointsSlot;
        }

        return {
            id,
            type: "text",
            data: {
                title: adaptive.content.title,
                content: adaptive.content.description,
                variant:
                    adaptive.slotType === "hint"
                        ? "highlight"
                        : adaptive.slotType === "deepDive"
                        ? "description"
                        : "prose",
            },
        } as TextSlot;
    });
}

/**
 * Get pace recommendation text
 */
export function getPaceRecommendation(
    config: AdaptationConfig
): { message: string; icon: string } {
    switch (config.paceRecommendation) {
        case "slower":
            return {
                message: "Take your time - we've added extra explanations for you",
                icon: "🐢",
            };
        case "faster":
            return {
                message: "You're doing great! We've added some challenges",
                icon: "🚀",
            };
        default:
            return {
                message: "You're progressing well at this pace",
                icon: "✨",
            };
    }
}

/**
 * Adjust quiz difficulty based on comprehension
 */
export function getAdjustedQuizParams(config: AdaptationConfig): {
    timeMultiplier: number;
    hintEnabled: boolean;
    showExplanations: boolean;
} {
    switch (config.quizDifficulty) {
        case "easy":
            return {
                timeMultiplier: 1.5,
                hintEnabled: true,
                showExplanations: true,
            };
        case "hard":
            return {
                timeMultiplier: 0.75,
                hintEnabled: false,
                showExplanations: false,
            };
        default:
            return {
                timeMultiplier: 1,
                hintEnabled: false,
                showExplanations: true,
            };
    }
}
