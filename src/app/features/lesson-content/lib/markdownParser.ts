/**
 * Custom Markdown Parser for Lesson Content
 *
 * Parses custom markdown blocks and converts them to structured data
 * for rendering rich, interactive lesson components.
 *
 * Block Types:
 * - Basic: video, code, callout, keypoints, exercise, quiz
 * - Extended: tabs, comparison, scenario, steps, pitfall, deepdive, realworld, syntax, checkpoint, protip
 */

// ============================================================================
// Types
// ============================================================================

export type CustomBlockType =
    // Basic blocks
    | "video"
    | "code"
    | "callout"
    | "keypoints"
    | "exercise"
    | "quiz"
    | "definition"
    | "example"
    | "warning"
    | "tip"
    | "info"
    // Extended blocks
    | "tabs"
    | "tab"
    | "comparison"
    | "scenario"
    | "steps"
    | "step"
    | "pitfall"
    | "deepdive"
    | "realworld"
    | "syntax"
    | "checkpoint"
    | "protip";

export interface ParsedBlock {
    type: "text" | "custom";
    content: string;
}

export interface TextBlock extends ParsedBlock {
    type: "text";
}

export interface CustomBlock extends ParsedBlock {
    type: "custom";
    blockType: CustomBlockType;
    attributes: Record<string, string>;
    innerContent: string;
}

// ============================================================================
// Block Data Types - Basic
// ============================================================================

export interface VideoBlockData {
    type: "video";
    youtubeId?: string;
    title?: string;
    description?: string;
}

export interface CodeBlockData {
    type: "code";
    language: string;
    title?: string;
    code: string;
    highlightLines?: number[];
    filename?: string;
}

export interface CalloutBlockData {
    type: "callout";
    variant: "info" | "warning" | "tip" | "definition" | "example";
    title?: string;
    content: string;
}

export interface KeypointsBlockData {
    type: "keypoints";
    title?: string;
    points: string[];
}

export interface ExerciseBlockData {
    type: "exercise";
    title?: string;
    description: string;
    hints?: string[];
}

export interface QuizBlockData {
    type: "quiz";
    question: string;
    options: Array<{ text: string; correct: boolean }>;
}

// ============================================================================
// Block Data Types - Extended
// ============================================================================

/** Tabbed content - show same concept in different contexts */
export interface TabsBlockData {
    type: "tabs";
    tabs: Array<{
        label: string;
        language?: string;
        content: string;
    }>;
}

/** Side-by-side comparison */
export interface ComparisonBlockData {
    type: "comparison";
    title?: string;
    leftLabel: string;
    rightLabel: string;
    leftContent: string;
    rightContent: string;
    verdict?: string;
}

/** Decision guidance - when to use something */
export interface ScenarioBlockData {
    type: "scenario";
    title: string;
    description?: string;
    useWhen: string[];
    avoidWhen?: string[];
    example?: string;
}

/** Step-by-step procedural guide */
export interface StepsBlockData {
    type: "steps";
    title?: string;
    steps: Array<{
        title: string;
        content: string;
        code?: string;
    }>;
}

/** Common mistake/pitfall warning */
export interface PitfallBlockData {
    type: "pitfall";
    title: string;
    description: string;
    wrongCode?: string;
    rightCode?: string;
    explanation?: string;
}

/** Collapsible advanced content */
export interface DeepDiveBlockData {
    type: "deepdive";
    title: string;
    content: string;
}

/** Real-world application example */
export interface RealWorldBlockData {
    type: "realworld";
    title: string;
    context: string;
    code?: string;
    explanation?: string;
}

/** API/syntax reference */
export interface SyntaxBlockData {
    type: "syntax";
    name: string;
    signature: string;
    description?: string;
    parameters?: Array<{
        name: string;
        type: string;
        description: string;
        optional?: boolean;
    }>;
    returns?: {
        type: string;
        description: string;
    };
    examples?: string[];
}

/** Quick understanding checkpoint */
export interface CheckpointBlockData {
    type: "checkpoint";
    question: string;
    answer: string;
    hint?: string;
}

/** Expert tip/insight */
export interface ProTipBlockData {
    type: "protip";
    content: string;
    author?: string;
}

export type BlockData =
    | VideoBlockData
    | CodeBlockData
    | CalloutBlockData
    | KeypointsBlockData
    | ExerciseBlockData
    | QuizBlockData
    | TabsBlockData
    | ComparisonBlockData
    | ScenarioBlockData
    | StepsBlockData
    | PitfallBlockData
    | DeepDiveBlockData
    | RealWorldBlockData
    | SyntaxBlockData
    | CheckpointBlockData
    | ProTipBlockData
    | { type: "text"; content: string };

// ============================================================================
// Parser
// ============================================================================

/**
 * Parse custom markdown blocks from content
 *
 * Syntax:
 * :::blockType[attr1="value1" attr2="value2"]
 * content
 * :::
 */
export function parseCustomMarkdown(markdown: string): Array<TextBlock | CustomBlock> {
    const blocks: Array<TextBlock | CustomBlock> = [];

    // Regex to match custom blocks
    // Matches :::blockType[attributes]\ncontent\n:::
    const blockRegex = /^:::(\w+)(?:\[([^\]]*)\])?\s*\n([\s\S]*?)^:::/gm;

    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(markdown)) !== null) {
        // Add text before this block
        if (match.index > lastIndex) {
            const textBefore = markdown.slice(lastIndex, match.index).trim();
            if (textBefore) {
                blocks.push({
                    type: "text",
                    content: textBefore,
                });
            }
        }

        const blockType = match[1].toLowerCase() as CustomBlockType;
        const attributeString = match[2] || "";
        const innerContent = match[3].trim();

        // Parse attributes
        const attributes = parseAttributes(attributeString);

        blocks.push({
            type: "custom",
            content: match[0],
            blockType,
            attributes,
            innerContent,
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < markdown.length) {
        const remaining = markdown.slice(lastIndex).trim();
        if (remaining) {
            blocks.push({
                type: "text",
                content: remaining,
            });
        }
    }

    // If no custom blocks found, return entire content as text
    if (blocks.length === 0 && markdown.trim()) {
        blocks.push({
            type: "text",
            content: markdown,
        });
    }

    return blocks;
}

/**
 * Parse attribute string like: attr1="value1" attr2="value2"
 */
function parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};

    if (!attrString) return attrs;

    // Match key="value" or key='value' patterns
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = attrRegex.exec(attrString)) !== null) {
        attrs[match[1]] = match[2];
    }

    return attrs;
}

/**
 * Convert a CustomBlock to typed BlockData
 */
export function blockToData(block: CustomBlock): BlockData {
    switch (block.blockType) {
        case "video":
            return {
                type: "video",
                youtubeId: block.attributes.youtube_id || block.attributes.youtubeId,
                title: block.attributes.title,
                description: block.innerContent,
            };

        case "code":
            return {
                type: "code",
                language: block.attributes.language || "javascript",
                title: block.attributes.title,
                code: block.innerContent,
                filename: block.attributes.filename,
                highlightLines: block.attributes.highlight
                    ? block.attributes.highlight.split(",").map((n) => parseInt(n.trim(), 10))
                    : undefined,
            };

        case "callout":
        case "info":
        case "warning":
        case "tip":
        case "definition":
        case "example":
            return {
                type: "callout",
                variant: (block.attributes.type || block.blockType) as CalloutBlockData["variant"],
                title: block.attributes.title,
                content: block.innerContent,
            };

        case "keypoints":
            return {
                type: "keypoints",
                title: block.attributes.title,
                points: parseKeypoints(block.innerContent),
            };

        case "exercise":
            return {
                type: "exercise",
                title: block.attributes.title,
                description: block.innerContent,
                hints: block.attributes.hints ? block.attributes.hints.split("|") : undefined,
            };

        case "quiz":
            return {
                type: "quiz",
                question: block.attributes.question || "",
                options: parseQuizOptions(block.innerContent),
            };

        // Extended blocks
        case "tabs":
            return {
                type: "tabs",
                tabs: parseTabs(block.innerContent),
            };

        case "comparison":
            return parseComparison(block);

        case "scenario":
            return parseScenario(block);

        case "steps":
            return {
                type: "steps",
                title: block.attributes.title,
                steps: parseSteps(block.innerContent),
            };

        case "pitfall":
            return parsePitfall(block);

        case "deepdive":
            return {
                type: "deepdive",
                title: block.attributes.title || "Deep Dive",
                content: block.innerContent,
            };

        case "realworld":
            return parseRealWorld(block);

        case "syntax":
            return parseSyntax(block);

        case "checkpoint":
            return {
                type: "checkpoint",
                question: block.attributes.question || "",
                answer: block.innerContent,
                hint: block.attributes.hint,
            };

        case "protip":
            return {
                type: "protip",
                content: block.innerContent,
                author: block.attributes.author,
            };

        default:
            return {
                type: "text",
                content: block.innerContent,
            };
    }
}

// ============================================================================
// Extended Block Parsers
// ============================================================================

/**
 * Parse tabs content
 * Format:
 * ## Tab Label 1
 * content...
 * ## Tab Label 2
 * content...
 */
function parseTabs(content: string): TabsBlockData["tabs"] {
    const tabs: TabsBlockData["tabs"] = [];
    const tabRegex = /^##\s*(.+?)(?:\s*\[(\w+)\])?\s*\n([\s\S]*?)(?=^##\s|\z)/gm;

    let match;
    while ((match = tabRegex.exec(content)) !== null) {
        tabs.push({
            label: match[1].trim(),
            language: match[2],
            content: match[3].trim(),
        });
    }

    // If no ## headers found, treat whole content as single tab
    if (tabs.length === 0 && content.trim()) {
        tabs.push({
            label: "Default",
            content: content.trim(),
        });
    }

    return tabs;
}

/**
 * Parse comparison block
 * Format:
 * LEFT:
 * content...
 * RIGHT:
 * content...
 * VERDICT:
 * content...
 */
function parseComparison(block: CustomBlock): ComparisonBlockData {
    const content = block.innerContent;
    const sections = content.split(/^(LEFT|RIGHT|VERDICT):\s*$/gm);

    let leftContent = "";
    let rightContent = "";
    let verdict = "";

    for (let i = 0; i < sections.length; i++) {
        if (sections[i] === "LEFT" && sections[i + 1]) {
            leftContent = sections[i + 1].trim();
        } else if (sections[i] === "RIGHT" && sections[i + 1]) {
            rightContent = sections[i + 1].trim();
        } else if (sections[i] === "VERDICT" && sections[i + 1]) {
            verdict = sections[i + 1].trim();
        }
    }

    return {
        type: "comparison",
        title: block.attributes.title,
        leftLabel: block.attributes.left || "Before",
        rightLabel: block.attributes.right || "After",
        leftContent,
        rightContent,
        verdict: verdict || undefined,
    };
}

/**
 * Parse scenario block
 * Format:
 * Description text...
 *
 * USE WHEN:
 * - condition 1
 * - condition 2
 *
 * AVOID WHEN:
 * - condition 1
 *
 * EXAMPLE:
 * code...
 */
function parseScenario(block: CustomBlock): ScenarioBlockData {
    const content = block.innerContent;
    const parts = content.split(/^(USE WHEN|AVOID WHEN|EXAMPLE):\s*$/gm);

    let description = "";
    let useWhen: string[] = [];
    let avoidWhen: string[] = [];
    let example = "";

    // First part before any keyword is description
    if (parts[0] && !["USE WHEN", "AVOID WHEN", "EXAMPLE"].includes(parts[0])) {
        description = parts[0].trim();
    }

    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "USE WHEN" && parts[i + 1]) {
            useWhen = parseKeypoints(parts[i + 1]);
        } else if (parts[i] === "AVOID WHEN" && parts[i + 1]) {
            avoidWhen = parseKeypoints(parts[i + 1]);
        } else if (parts[i] === "EXAMPLE" && parts[i + 1]) {
            example = parts[i + 1].trim();
        }
    }

    return {
        type: "scenario",
        title: block.attributes.title || "When to Use",
        description: description || undefined,
        useWhen,
        avoidWhen: avoidWhen.length > 0 ? avoidWhen : undefined,
        example: example || undefined,
    };
}

/**
 * Parse steps from content
 * Format:
 * ## Step 1: Title
 * content...
 * ```code```
 */
function parseSteps(content: string): StepsBlockData["steps"] {
    const steps: StepsBlockData["steps"] = [];
    const stepRegex = /^##\s*(?:Step\s*\d+[:.]\s*)?(.+?)\s*\n([\s\S]*?)(?=^##\s|\z)/gm;

    let match;
    while ((match = stepRegex.exec(content)) !== null) {
        const stepContent = match[2].trim();

        // Extract code block if present
        const codeMatch = stepContent.match(/```(\w*)\n([\s\S]*?)```/);
        const code = codeMatch ? codeMatch[2].trim() : undefined;
        const textContent = codeMatch
            ? stepContent.replace(/```\w*\n[\s\S]*?```/, "").trim()
            : stepContent;

        steps.push({
            title: match[1].trim(),
            content: textContent,
            code,
        });
    }

    return steps;
}

/**
 * Parse pitfall block
 * Format:
 * Description...
 *
 * WRONG:
 * ```code```
 *
 * RIGHT:
 * ```code```
 *
 * WHY:
 * explanation...
 */
function parsePitfall(block: CustomBlock): PitfallBlockData {
    const content = block.innerContent;
    const parts = content.split(/^(WRONG|RIGHT|WHY):\s*$/gm);

    let description = "";
    let wrongCode = "";
    let rightCode = "";
    let explanation = "";

    // First part is description
    if (parts[0] && !["WRONG", "RIGHT", "WHY"].includes(parts[0])) {
        description = parts[0].trim();
    }

    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "WRONG" && parts[i + 1]) {
            const codeMatch = parts[i + 1].match(/```\w*\n([\s\S]*?)```/);
            wrongCode = codeMatch ? codeMatch[1].trim() : parts[i + 1].trim();
        } else if (parts[i] === "RIGHT" && parts[i + 1]) {
            const codeMatch = parts[i + 1].match(/```\w*\n([\s\S]*?)```/);
            rightCode = codeMatch ? codeMatch[1].trim() : parts[i + 1].trim();
        } else if (parts[i] === "WHY" && parts[i + 1]) {
            explanation = parts[i + 1].trim();
        }
    }

    return {
        type: "pitfall",
        title: block.attributes.title || "Common Mistake",
        description,
        wrongCode: wrongCode || undefined,
        rightCode: rightCode || undefined,
        explanation: explanation || undefined,
    };
}

/**
 * Parse real-world example block
 */
function parseRealWorld(block: CustomBlock): RealWorldBlockData {
    const content = block.innerContent;
    const codeMatch = content.match(/```(\w*)\n([\s\S]*?)```/);

    let context = content;
    let code: string | undefined;
    let explanation: string | undefined;

    if (codeMatch) {
        const parts = content.split(/```\w*\n[\s\S]*?```/);
        context = parts[0]?.trim() || "";
        explanation = parts[1]?.trim() || undefined;
        code = codeMatch[2].trim();
    }

    return {
        type: "realworld",
        title: block.attributes.title || "Real-World Example",
        context,
        code,
        explanation,
    };
}

/**
 * Parse syntax/API reference block
 * Format:
 * SIGNATURE:
 * function signature
 *
 * PARAMETERS:
 * - name: type - description
 *
 * RETURNS:
 * type - description
 *
 * EXAMPLES:
 * ```code```
 */
function parseSyntax(block: CustomBlock): SyntaxBlockData {
    const content = block.innerContent;
    const parts = content.split(/^(SIGNATURE|PARAMETERS|RETURNS|EXAMPLES):\s*$/gm);

    let signature = "";
    let description = "";
    const parameters: SyntaxBlockData["parameters"] = [];
    let returns: SyntaxBlockData["returns"];
    const examples: string[] = [];

    // First part is description
    if (parts[0] && !["SIGNATURE", "PARAMETERS", "RETURNS", "EXAMPLES"].includes(parts[0])) {
        description = parts[0].trim();
    }

    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "SIGNATURE" && parts[i + 1]) {
            signature = parts[i + 1].trim().replace(/```\w*\n?|\n?```/g, "");
        } else if (parts[i] === "PARAMETERS" && parts[i + 1]) {
            const paramLines = parts[i + 1].trim().split("\n");
            for (const line of paramLines) {
                const paramMatch = line.match(/^[-*]\s*(\w+)(\?)?\s*:\s*(\w+(?:\[\])?)\s*[-–]\s*(.+)$/);
                if (paramMatch) {
                    parameters.push({
                        name: paramMatch[1],
                        optional: !!paramMatch[2],
                        type: paramMatch[3],
                        description: paramMatch[4].trim(),
                    });
                }
            }
        } else if (parts[i] === "RETURNS" && parts[i + 1]) {
            const returnMatch = parts[i + 1].trim().match(/^(\w+(?:\[\])?)\s*[-–]\s*(.+)$/);
            if (returnMatch) {
                returns = {
                    type: returnMatch[1],
                    description: returnMatch[2].trim(),
                };
            }
        } else if (parts[i] === "EXAMPLES" && parts[i + 1]) {
            const exampleMatches = parts[i + 1].matchAll(/```\w*\n([\s\S]*?)```/g);
            for (const match of exampleMatches) {
                examples.push(match[1].trim());
            }
        }
    }

    return {
        type: "syntax",
        name: block.attributes.name || "Function",
        signature,
        description: description || undefined,
        parameters: parameters.length > 0 ? parameters : undefined,
        returns,
        examples: examples.length > 0 ? examples : undefined,
    };
}

// ============================================================================
// Basic Parsers
// ============================================================================

/**
 * Parse keypoints from markdown list
 */
function parseKeypoints(content: string): string[] {
    return content
        .split("\n")
        .map((line) => line.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);
}

/**
 * Parse quiz options from markdown checkboxes
 * - [ ] Wrong answer
 * - [x] Correct answer
 */
function parseQuizOptions(content: string): Array<{ text: string; correct: boolean }> {
    return content
        .split("\n")
        .filter((line) => line.includes("["))
        .map((line) => {
            const correct = line.includes("[x]") || line.includes("[X]");
            const text = line.replace(/^[-*]\s*\[[xX\s]\]\s*/, "").trim();
            return { text, correct };
        });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse all blocks and convert to typed data
 */
export function parseMarkdownToBlocks(markdown: string): BlockData[] {
    const parsed = parseCustomMarkdown(markdown);

    return parsed.map((block) => {
        if (block.type === "text") {
            return { type: "text" as const, content: block.content };
        }
        return blockToData(block as CustomBlock);
    });
}

/**
 * Extract all code blocks from markdown (both custom and standard)
 */
export function extractCodeBlocks(markdown: string): CodeBlockData[] {
    const codeBlocks: CodeBlockData[] = [];

    // Extract custom :::code blocks
    const parsed = parseCustomMarkdown(markdown);
    for (const block of parsed) {
        if (block.type === "custom" && (block as CustomBlock).blockType === "code") {
            const data = blockToData(block as CustomBlock);
            if (data.type === "code") {
                codeBlocks.push(data);
            }
        }
    }

    // Also extract standard ```language code ``` blocks from text sections
    const fencedCodeRegex = /```(\w*)\n([\s\S]*?)```/g;
    for (const block of parsed) {
        if (block.type === "text") {
            let match;
            while ((match = fencedCodeRegex.exec(block.content)) !== null) {
                codeBlocks.push({
                    type: "code",
                    language: match[1] || "text",
                    code: match[2].trim(),
                });
            }
        }
    }

    return codeBlocks;
}

/**
 * Extract video blocks
 */
export function extractVideoBlocks(markdown: string): VideoBlockData[] {
    const videos: VideoBlockData[] = [];

    const parsed = parseCustomMarkdown(markdown);
    for (const block of parsed) {
        if (block.type === "custom" && (block as CustomBlock).blockType === "video") {
            const data = blockToData(block as CustomBlock);
            if (data.type === "video") {
                videos.push(data);
            }
        }
    }

    return videos;
}

/**
 * Extract keypoints
 */
export function extractKeypoints(markdown: string): string[] {
    const parsed = parseCustomMarkdown(markdown);

    for (const block of parsed) {
        if (block.type === "custom" && (block as CustomBlock).blockType === "keypoints") {
            const data = blockToData(block as CustomBlock);
            if (data.type === "keypoints") {
                return data.points;
            }
        }
    }

    return [];
}

/**
 * Strip custom blocks from markdown, leaving only standard markdown
 */
export function stripCustomBlocks(markdown: string): string {
    return markdown.replace(/^:::(\w+)(?:\[([^\]]*)\])?\s*\n[\s\S]*?^:::/gm, "").trim();
}

/**
 * Check if markdown contains any custom blocks
 */
export function hasCustomBlocks(markdown: string): boolean {
    return /^:::(\w+)/m.test(markdown);
}
