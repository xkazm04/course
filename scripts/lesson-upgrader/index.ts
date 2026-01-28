/**
 * Lesson Upgrader - Systematic lesson content enhancement
 *
 * Usage:
 *   npx ts-node --esm scripts/lesson-upgrader/index.ts
 *   npx ts-node --esm scripts/lesson-upgrader/index.ts --dry-run
 *   npx ts-node --esm scripts/lesson-upgrader/index.ts --max 5 --verbose
 *   npx ts-node --esm scripts/lesson-upgrader/index.ts --start-from <node_id>
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { generateEnrichedContent, analyzeContentQuality } from "./content-generator.js";
import type { LessonNode, LessonContent, UpgradeResult, UpgradeOptions } from "./types.js";

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse CLI arguments
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

async function fetchLessonsToUpgrade(options: UpgradeOptions): Promise<Array<{
  node: LessonNode;
  content: LessonContent;
  currentQuality: string;
}>> {
  // Fetch all lessons with their nodes
  const { data: lessons, error } = await supabase
    .from("lesson_content")
    .select(`
      id,
      node_id,
      version,
      status,
      introduction,
      content_markdown,
      metadata
    `)
    .eq("status", "published");

  if (error) {
    throw new Error(`Failed to fetch lessons: ${error.message}`);
  }

  if (!lessons || lessons.length === 0) {
    return [];
  }

  // Fetch node details
  const nodeIds = lessons.map((l) => l.node_id);
  const { data: nodes } = await supabase
    .from("map_nodes")
    .select("id, name, slug, description, depth, domain_id")
    .in("id", nodeIds);

  const nodeMap = new Map<string, LessonNode>(
    nodes?.map((n) => [n.id, n as LessonNode]) || []
  );

  // Build lesson list with quality analysis
  const result: Array<{
    node: LessonNode;
    content: LessonContent;
    currentQuality: string;
  }> = [];

  let startFound = !options.startFrom;

  for (const lesson of lessons) {
    const node = nodeMap.get(lesson.node_id);
    if (!node) continue;

    // Handle start-from option
    if (!startFound) {
      if (lesson.node_id === options.startFrom) {
        startFound = true;
      } else {
        continue;
      }
    }

    // Analyze current quality
    const analysis = analyzeContentQuality(lesson.content_markdown || "");

    // Skip high quality if option set
    if (options.skipHighQuality && analysis.quality === "high") {
      continue;
    }

    result.push({
      node,
      content: lesson as LessonContent,
      currentQuality: analysis.quality,
    });

    // Respect max limit
    if (options.maxLessons && result.length >= options.maxLessons) {
      break;
    }
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
    // Analyze current quality
    const beforeAnalysis = analyzeContentQuality(content.content_markdown || "");
    result.previousQuality = beforeAnalysis.quality;

    if (options.verbose) {
      console.log(`\n  Current directives: ${beforeAnalysis.directivesUsed.join(", ") || "none"}`);
      console.log(`  Code blocks: ${beforeAnalysis.codeBlockCount}`);
      console.log(`  Opportunities: ${beforeAnalysis.opportunities.join("; ")}`);
    }

    // Generate enhanced content
    console.log(`  Generating enhanced content...`);
    const enhancedContent = await generateEnrichedContent(node, content);

    // Analyze new quality
    const afterAnalysis = analyzeContentQuality(enhancedContent);
    result.newQuality = afterAnalysis.quality;

    if (options.verbose) {
      console.log(`  New directives: ${afterAnalysis.directivesUsed.join(", ")}`);
      console.log(`  New code blocks: ${afterAnalysis.codeBlockCount}`);
    }

    // Determine what changed
    const newDirectives = afterAnalysis.directivesUsed.filter(
      (d) => !beforeAnalysis.directivesUsed.includes(d)
    );
    result.changesApplied = newDirectives.length > 0
      ? [`Added directives: ${newDirectives.join(", ")}`]
      : ["Content restructured"];

    if (afterAnalysis.codeBlockCount > beforeAnalysis.codeBlockCount) {
      result.changesApplied.push(
        `Added ${afterAnalysis.codeBlockCount - beforeAnalysis.codeBlockCount} code blocks`
      );
    }

    // Save if not dry run
    if (!options.dryRun) {
      const { error: updateError } = await supabase
        .from("lesson_content")
        .update({ content_markdown: enhancedContent })
        .eq("node_id", node.id);

      if (updateError) {
        throw new Error(`Failed to save: ${updateError.message}`);
      }
      result.message = "Successfully upgraded and saved";
    } else {
      result.message = "Dry run - changes not saved";
      if (options.verbose) {
        console.log(`\n  --- PREVIEW (first 500 chars) ---`);
        console.log(enhancedContent.slice(0, 500));
        console.log(`  --- END PREVIEW ---\n`);
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
  if (options.maxLessons) console.log(`Max lessons: ${options.maxLessons}`);
  if (options.startFrom) console.log(`Starting from: ${options.startFrom}`);
  if (options.skipHighQuality) console.log(`Skipping high quality lessons`);
  console.log("");

  // Fetch lessons
  console.log("Fetching lessons to upgrade...");
  const lessons = await fetchLessonsToUpgrade(options);

  if (lessons.length === 0) {
    console.log("No lessons to upgrade.");
    return;
  }

  console.log(`Found ${lessons.length} lessons to process.\n`);

  // Process each lesson
  const results: UpgradeResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < lessons.length; i++) {
    const { node, content, currentQuality } = lessons[i];

    console.log(`[${i + 1}/${lessons.length}] ${node.name}`);
    console.log(`  ID: ${node.id}`);
    console.log(`  Quality: ${currentQuality.toUpperCase()}`);

    const result = await upgradeLesson(node, content, options);
    results.push(result);

    if (result.status === "success") {
      successCount++;
      console.log(`  ✓ ${result.message}`);
      if (result.changesApplied) {
        console.log(`  Changes: ${result.changesApplied.join(", ")}`);
      }
      console.log(`  Quality: ${result.previousQuality} → ${result.newQuality}`);
    } else {
      errorCount++;
      console.log(`  ✗ ERROR: ${result.message}`);
    }

    // Small delay to avoid rate limiting
    if (!options.dryRun && i < lessons.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total processed: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log("\nErrors:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => console.log(`  - ${r.name}: ${r.message}`));
  }

  // Save results log
  const fs = await import("fs");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = `scripts/lesson-upgrader/logs/upgrade-${timestamp}.json`;

  // Ensure logs directory exists
  if (!fs.existsSync("scripts/lesson-upgrader/logs")) {
    fs.mkdirSync("scripts/lesson-upgrader/logs", { recursive: true });
  }

  fs.writeFileSync(logFile, JSON.stringify({ options, results }, null, 2));
  console.log(`\nLog saved to: ${logFile}`);
}

main().catch(console.error);
