/**
 * Lesson Upgrader - Systematic lesson content enhancement
 *
 * Usage:
 *   npx ts-node --esm scripts/upgrade-lessons.ts --dry-run --max 2 --verbose
 *   npx ts-node --esm scripts/upgrade-lessons.ts --max 5
 *   npx ts-node --esm scripts/upgrade-lessons.ts --start-from <node_id>
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic();

// ============================================================================
// TYPES
// ============================================================================

interface LessonNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  depth: number;
  domain_id: string;
}

interface LessonContent {
  id: string;
  node_id: string;
  version: number;
  status: string;
  introduction: string | null;
  content_markdown: string;
  metadata: {
    tags?: string[];
    difficulty?: string;
    key_takeaways?: string[];
  };
}

interface UpgradeResult {
  nodeId: string;
  name: string;
  status: "success" | "skipped" | "error";
  message: string;
  previousQuality: string;
  newQuality?: string;
  changesApplied?: string[];
}

interface UpgradeOptions {
  dryRun?: boolean;
  verbose?: boolean;
  maxLessons?: number;
  startFrom?: string;
  skipHighQuality?: boolean;
}

// ============================================================================
// CONTENT ANALYSIS
// ============================================================================

function analyzeContentQuality(content: string): {
  quality: "low" | "medium" | "high";
  directivesUsed: string[];
  hasCode: boolean;
  codeBlockCount: number;
  opportunities: string[];
} {
  const directives: string[] = [];
  const opportunities: string[] = [];

  const directiveRegex = /:::([\w-]+)/g;
  let match;
  while ((match = directiveRegex.exec(content)) !== null) {
    directives.push(match[1]);
  }

  const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
  const hasCode = codeBlocks.length > 0;

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

  if (codeBlocks.length >= 2 && !directives.includes("tabs")) {
    opportunities.push("Could use :::tabs");
  }
  if (!directives.includes("pitfall")) {
    opportunities.push("Missing :::pitfall");
  }
  if (!directives.includes("tip") && !directives.includes("warning")) {
    opportunities.push("Could add :::tip or :::warning");
  }

  return {
    quality,
    directivesUsed: [...new Set(directives)],
    hasCode,
    codeBlockCount: codeBlocks.length,
    opportunities,
  };
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

const SYSTEM_PROMPT = `You are an expert technical educator creating rich, interactive lesson content for a frontend development course.

Your task is to enhance lesson content using custom markdown directives. Available directives:

1. **:::code[language="..." title="..."]** - Syntax-highlighted code block
2. **:::tabs[title="..."]** - Switchable code variants (use TAB: Label before each \`\`\`code\`\`\`)
3. **:::animated[title="..." description="..."]** - Animated code walkthrough
4. **:::comparison[title="..." left="..." right="..."]** - Side-by-side with LEFT:, RIGHT:, VERDICT:
5. **:::pitfall[title="..."]** - Common mistakes with WRONG:, RIGHT:, WHY:
6. **:::tip[title="..."]** - Helpful suggestions
7. **:::warning[title="..."]** - Caution notices
8. **:::realworld[title="..."]** - Real-world examples
9. **:::deepdive[title="..."]** - Collapsible advanced content

## Guidelines

1. KEEP existing :::definition and :::keypoints blocks exactly as they are
2. Add 1-2 practical code examples using :::code blocks
3. Include at least one :::pitfall showing a common mistake
4. Add a :::tip or :::warning where appropriate
5. Consider :::realworld for practical applications
6. For multiple approaches, use :::tabs
7. Keep content focused and scannable
8. Use modern JavaScript/TypeScript syntax
9. Include helpful comments in code

Return ONLY the enhanced content_markdown. Keep it concise but valuable.`;

async function generateEnrichedContent(
  node: LessonNode,
  currentContent: LessonContent
): Promise<string> {
  const { name, description } = node;
  const { introduction, content_markdown, metadata } = currentContent;

  const userPrompt = `Enhance this lesson about "${name}".

## Current Introduction (context only, do not include in output)
${introduction || "No introduction"}

## Current Content (enhance this)
${content_markdown}

## Context
- Difficulty: ${metadata.difficulty || "intermediate"}
- Tags: ${metadata.tags?.join(", ") || "none"}
- Key Takeaways: ${metadata.key_takeaways?.slice(0, 3).join("; ") || "none"}
- Description: ${description || "none"}

Enhance with:
1. Keep existing :::definition and :::keypoints exactly
2. Add practical code examples
3. Add one :::pitfall for common mistakes
4. Add a :::tip or :::warning
5. Optionally add :::realworld example

Return ONLY the enhanced markdown.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response");
  }

  return textContent.text;
}

// ============================================================================
// MAIN UPGRADER
// ============================================================================

function parseArgs(): UpgradeOptions {
  const args = process.argv.slice(2);
  const options: UpgradeOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--max":
        options.maxLessons = parseInt(args[++i], 10);
        break;
      case "--start-from":
        options.startFrom = args[++i];
        break;
      case "--skip-high":
        options.skipHighQuality = true;
        break;
    }
  }

  return options;
}

async function fetchLessonsToUpgrade(options: UpgradeOptions): Promise<
  Array<{
    node: LessonNode;
    content: LessonContent;
    currentQuality: string;
  }>
> {
  const { data: lessons, error } = await supabase
    .from("lesson_content")
    .select("id, node_id, version, status, introduction, content_markdown, metadata")
    .eq("status", "published");

  if (error) throw new Error(`Failed to fetch lessons: ${error.message}`);
  if (!lessons || lessons.length === 0) return [];

  const nodeIds = lessons.map((l) => l.node_id);
  const { data: nodes } = await supabase
    .from("map_nodes")
    .select("id, name, slug, description, depth, domain_id")
    .in("id", nodeIds);

  const nodeMap = new Map<string, LessonNode>(nodes?.map((n) => [n.id, n as LessonNode]) || []);

  const result: Array<{ node: LessonNode; content: LessonContent; currentQuality: string }> = [];
  let startFound = !options.startFrom;

  for (const lesson of lessons) {
    const node = nodeMap.get(lesson.node_id);
    if (!node) continue;

    if (!startFound) {
      if (lesson.node_id === options.startFrom) startFound = true;
      else continue;
    }

    const analysis = analyzeContentQuality(lesson.content_markdown || "");

    if (options.skipHighQuality && analysis.quality === "high") continue;

    result.push({
      node,
      content: lesson as LessonContent,
      currentQuality: analysis.quality,
    });

    if (options.maxLessons && result.length >= options.maxLessons) break;
  }

  return result;
}

async function upgradeLesson(
  node: LessonNode,
  content: LessonContent,
  options: UpgradeOptions
): Promise<UpgradeResult> {
  const result: UpgradeResult = {
    nodeId: node.id,
    name: node.name,
    status: "success",
    message: "",
    previousQuality: "",
  };

  try {
    const beforeAnalysis = analyzeContentQuality(content.content_markdown || "");
    result.previousQuality = beforeAnalysis.quality;

    if (options.verbose) {
      console.log(`  Current: ${beforeAnalysis.directivesUsed.join(", ") || "none"}`);
      console.log(`  Code blocks: ${beforeAnalysis.codeBlockCount}`);
    }

    console.log(`  Generating enhanced content...`);
    const enhancedContent = await generateEnrichedContent(node, content);

    const afterAnalysis = analyzeContentQuality(enhancedContent);
    result.newQuality = afterAnalysis.quality;

    const newDirectives = afterAnalysis.directivesUsed.filter(
      (d) => !beforeAnalysis.directivesUsed.includes(d)
    );
    result.changesApplied = newDirectives.length > 0
      ? [`Added: ${newDirectives.join(", ")}`]
      : ["Restructured"];

    if (!options.dryRun) {
      const { error: updateError } = await supabase
        .from("lesson_content")
        .update({ content_markdown: enhancedContent })
        .eq("node_id", node.id);

      if (updateError) throw new Error(`Failed to save: ${updateError.message}`);
      result.message = "Saved";
    } else {
      result.message = "Dry run";
      if (options.verbose) {
        console.log(`\n  --- PREVIEW ---`);
        console.log(enhancedContent.slice(0, 800));
        console.log(`  --- END ---\n`);
      }
    }

    return result;
  } catch (error) {
    result.status = "error";
    result.message = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

async function main() {
  const options = parseArgs();

  console.log("=".repeat(60));
  console.log("LESSON UPGRADER");
  console.log("=".repeat(60));
  console.log(`Mode: ${options.dryRun ? "DRY RUN" : "LIVE"}`);
  if (options.maxLessons) console.log(`Max: ${options.maxLessons}`);
  console.log("");

  console.log("Fetching lessons...");
  const lessons = await fetchLessonsToUpgrade(options);

  if (lessons.length === 0) {
    console.log("No lessons to upgrade.");
    return;
  }

  console.log(`Found ${lessons.length} lessons.\n`);

  const results: UpgradeResult[] = [];
  let successCount = 0;

  for (let i = 0; i < lessons.length; i++) {
    const { node, content, currentQuality } = lessons[i];

    console.log(`[${i + 1}/${lessons.length}] ${node.name}`);
    console.log(`  Quality: ${currentQuality.toUpperCase()}`);

    const result = await upgradeLesson(node, content, options);
    results.push(result);

    if (result.status === "success") {
      successCount++;
      console.log(`  ✓ ${result.message}`);
      console.log(`  ${result.previousQuality} → ${result.newQuality}`);
      if (result.changesApplied) console.log(`  ${result.changesApplied.join(", ")}`);
    } else {
      console.log(`  ✗ ${result.message}`);
    }

    // Rate limiting
    if (!options.dryRun && i < lessons.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Done. Success: ${successCount}/${results.length}`);

  // Save log
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logDir = "scripts/upgrade-logs";
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(`${logDir}/${timestamp}.json`, JSON.stringify({ options, results }, null, 2));
}

main().catch(console.error);
