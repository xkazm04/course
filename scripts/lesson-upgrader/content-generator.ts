/**
 * Content Generator - Uses Claude API to generate enriched lesson content
 */

import Anthropic from "@anthropic-ai/sdk";
import type { LessonNode, LessonContent, LessonMetadata } from "./types.js";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert technical educator creating rich, interactive lesson content for a frontend development course.

Your task is to enhance lesson content using custom markdown directives. The available directives are:

## Available Directives

1. **:::code[language="..." title="..."]** - Syntax-highlighted code block
2. **:::tabs[title="..."]** - Switchable code variants (use TAB: Label before each code block)
3. **:::animated[title="..." description="..."]** - Animated code walkthrough for complex concepts
4. **:::comparison[title="..." left="..." right="..."]** - Side-by-side comparison with LEFT:, RIGHT:, VERDICT: sections
5. **:::pitfall[title="..."]** - Common mistakes with WRONG:, RIGHT:, WHY: sections
6. **:::tip[title="..."]** - Helpful suggestions
7. **:::warning[title="..."]** - Caution notices
8. **:::realworld[title="..."]** - Real-world practical examples
9. **:::deepdive[title="..."]** - Collapsible advanced content
10. **:::steps[title="..."]** - Numbered tutorial steps (Step N: Title followed by content)

## Guidelines

1. Keep :::definition and :::keypoints if they exist - they're valuable
2. Add 1-2 code examples using :::code blocks
3. For complex code, use :::animated for step-by-step explanation
4. Use :::tabs when showing multiple approaches (e.g., JavaScript vs TypeScript)
5. Include at least one :::pitfall for common mistakes
6. Add a :::tip or :::warning where appropriate
7. Add a :::realworld example if the concept has practical applications
8. Use :::comparison for before/after or approach comparisons
9. Keep content focused and scannable
10. Match the difficulty level indicated in metadata

## Code Style

- Use modern JavaScript/TypeScript syntax
- Include helpful comments in code examples
- Show practical, real-world patterns
- For React, use functional components with hooks
- Keep examples concise but complete

Return ONLY the enhanced content_markdown. Do not include introduction or metadata.`;

export async function generateEnrichedContent(
  node: LessonNode,
  currentContent: LessonContent,
): Promise<string> {
  const { name, description } = node;
  const { introduction, content_markdown, metadata } = currentContent;

  const userPrompt = `Enhance this lesson about "${name}".

## Current Introduction (keep this context in mind)
${introduction || "No introduction provided"}

## Current Content
${content_markdown}

## Metadata Context
- Difficulty: ${metadata.difficulty || "intermediate"}
- Tags: ${metadata.tags?.join(", ") || "none"}
- Key Takeaways: ${metadata.key_takeaways?.join("; ") || "none"}
- Description: ${description || "none"}

Please enhance the content by:
1. Keeping the existing :::definition and :::keypoints blocks
2. Adding practical code examples using :::code
3. Adding at least one :::pitfall for common mistakes
4. Adding a :::tip or :::warning callout
5. If appropriate, add a :::realworld example
6. For complex code, consider using :::animated or :::tabs

Return ONLY the enhanced markdown content.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response");
  }

  return textContent.text;
}

export function analyzeContentQuality(content: string): {
  quality: "low" | "medium" | "high";
  directivesUsed: string[];
  hasCode: boolean;
  codeBlockCount: number;
  opportunities: string[];
} {
  const directives: string[] = [];
  const opportunities: string[] = [];

  // Find all directives used
  const directiveRegex = /:::([\w-]+)/g;
  let match;
  while ((match = directiveRegex.exec(content)) !== null) {
    directives.push(match[1]);
  }

  // Count code blocks
  const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
  const hasCode = codeBlocks.length > 0;

  // Analyze quality
  let quality: "low" | "medium" | "high" = "low";

  const hasRichDirectives =
    directives.includes("animated") ||
    directives.includes("tabs") ||
    directives.includes("comparison") ||
    directives.includes("pitfall");

  if (hasRichDirectives && directives.length >= 4 && hasCode) {
    quality = "high";
  } else if (directives.length >= 3 || (codeBlocks.length >= 2 && directives.length >= 2)) {
    quality = "medium";
  }

  // Find opportunities
  if (codeBlocks.length >= 2 && !directives.includes("tabs")) {
    opportunities.push("Could use :::tabs for code comparison");
  }

  if (!directives.includes("pitfall")) {
    opportunities.push("Missing :::pitfall for common mistakes");
  }

  if (!directives.includes("tip") && !directives.includes("warning")) {
    opportunities.push("Could add :::tip or :::warning");
  }

  if (!directives.includes("realworld") && !directives.includes("example")) {
    opportunities.push("Could add :::realworld example");
  }

  return {
    quality,
    directivesUsed: [...new Set(directives)],
    hasCode,
    codeBlockCount: codeBlocks.length,
    opportunities,
  };
}
