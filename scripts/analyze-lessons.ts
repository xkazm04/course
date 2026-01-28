import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LessonStats {
  total: number;
  published: number;
  draft: number;
  withSections: number;
  avgContentLength: number;
  directivesUsed: Record<string, number>;
  byDomain: Record<string, number>;
  needsEnrichment: string[];
}

async function analyzeLesson(content: string): Promise<{
  directives: string[];
  hasCode: boolean;
  codeBlockCount: number;
  estimatedQuality: "low" | "medium" | "high";
  opportunities: string[];
}> {
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

  if (directives.length >= 3 && hasCode) {
    quality = "high";
  } else if (directives.length >= 1 || codeBlocks.length >= 2) {
    quality = "medium";
  }

  // Find opportunities
  if (codeBlocks.length >= 2 && !directives.includes("tabs")) {
    opportunities.push("Multiple code blocks could use :::tabs for comparison");
  }

  if (codeBlocks.length >= 1 && !directives.includes("animated")) {
    opportunities.push("Code blocks could use :::animated for step-by-step explanation");
  }

  if (!directives.includes("definition") && content.length > 500) {
    opportunities.push("Could benefit from :::definition for key terms");
  }

  if (!directives.includes("tip") && !directives.includes("warning")) {
    opportunities.push("Could add :::tip or :::warning callouts");
  }

  if (hasCode && !directives.includes("pitfall")) {
    opportunities.push("Could add :::pitfall for common mistakes");
  }

  return {
    directives: [...new Set(directives)],
    hasCode,
    codeBlockCount: codeBlocks.length,
    estimatedQuality: quality,
    opportunities,
  };
}

async function main() {
  console.log("=== LESSON DATABASE ANALYSIS ===\n");

  // Get all lessons with their nodes
  const { data: lessons, error } = await supabase
    .from("lesson_content")
    .select(`
      id,
      node_id,
      status,
      content_markdown,
      introduction,
      metadata
    `);

  if (error) {
    console.error("Error fetching lessons:", error.message);
    return;
  }

  console.log(`Total lessons in database: ${lessons?.length || 0}\n`);

  if (!lessons || lessons.length === 0) {
    console.log("No lessons found.");
    return;
  }

  // Get node details for all lessons
  const nodeIds = lessons.map(l => l.node_id);
  const { data: nodes } = await supabase
    .from("map_nodes")
    .select("id, name, slug, domain_id, depth")
    .in("id", nodeIds);

  const nodeMap = new Map(nodes?.map(n => [n.id, n]) || []);

  // Analyze each lesson
  const stats: LessonStats = {
    total: lessons.length,
    published: 0,
    draft: 0,
    withSections: 0,
    avgContentLength: 0,
    directivesUsed: {},
    byDomain: {},
    needsEnrichment: [],
  };

  const detailedAnalysis: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    contentLength: number;
    quality: string;
    directives: string[];
    opportunities: string[];
  }> = [];

  let totalLength = 0;

  for (const lesson of lessons) {
    const node = nodeMap.get(lesson.node_id);
    const content = lesson.content_markdown || "";

    if (lesson.status === "published") stats.published++;
    else stats.draft++;

    totalLength += content.length;

    // Domain tracking
    const domain = node?.domain_id || "unknown";
    stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;

    // Analyze content
    const analysis = await analyzeLesson(content);

    // Track directives
    for (const dir of analysis.directives) {
      stats.directivesUsed[dir] = (stats.directivesUsed[dir] || 0) + 1;
    }

    // Track lessons needing enrichment
    if (analysis.estimatedQuality === "low" || analysis.estimatedQuality === "medium") {
      stats.needsEnrichment.push(lesson.node_id);
    }

    detailedAnalysis.push({
      id: lesson.node_id,
      name: node?.name || "Unknown",
      slug: node?.slug || "unknown",
      status: lesson.status,
      contentLength: content.length,
      quality: analysis.estimatedQuality,
      directives: analysis.directives,
      opportunities: analysis.opportunities,
    });
  }

  stats.avgContentLength = Math.round(totalLength / lessons.length);

  // Print summary
  console.log("=== SUMMARY ===");
  console.log(`Published: ${stats.published}`);
  console.log(`Draft: ${stats.draft}`);
  console.log(`Average content length: ${stats.avgContentLength} chars`);
  console.log(`Lessons needing enrichment: ${stats.needsEnrichment.length}`);

  console.log("\n=== DIRECTIVES USAGE ===");
  const sortedDirectives = Object.entries(stats.directivesUsed)
    .sort((a, b) => b[1] - a[1]);
  for (const [dir, count] of sortedDirectives) {
    console.log(`  ${dir}: ${count}`);
  }

  console.log("\n=== BY DOMAIN ===");
  for (const [domain, count] of Object.entries(stats.byDomain)) {
    console.log(`  ${domain}: ${count}`);
  }

  console.log("\n=== QUALITY DISTRIBUTION ===");
  const qualityDist = { low: 0, medium: 0, high: 0 };
  for (const item of detailedAnalysis) {
    qualityDist[item.quality as keyof typeof qualityDist]++;
  }
  console.log(`  Low: ${qualityDist.low}`);
  console.log(`  Medium: ${qualityDist.medium}`);
  console.log(`  High: ${qualityDist.high}`);

  // Show first 10 lessons needing enrichment with details
  console.log("\n=== LESSONS NEEDING ENRICHMENT (first 20) ===");
  const needsWork = detailedAnalysis
    .filter(l => l.quality !== "high")
    .sort((a, b) => a.contentLength - b.contentLength)
    .slice(0, 20);

  for (const lesson of needsWork) {
    console.log(`\n[${lesson.quality.toUpperCase()}] ${lesson.name}`);
    console.log(`  ID: ${lesson.id}`);
    console.log(`  Slug: ${lesson.slug}`);
    console.log(`  Status: ${lesson.status}`);
    console.log(`  Content: ${lesson.contentLength} chars`);
    console.log(`  Directives: ${lesson.directives.length > 0 ? lesson.directives.join(", ") : "none"}`);
    console.log(`  Opportunities:`);
    for (const opp of lesson.opportunities) {
      console.log(`    - ${opp}`);
    }
  }

  // Export full analysis to JSON
  const exportData = {
    summary: stats,
    lessons: detailedAnalysis,
  };

  console.log("\n\nExporting full analysis to scripts/lesson-analysis.json...");
  const fs = await import("fs");
  fs.writeFileSync(
    "scripts/lesson-analysis.json",
    JSON.stringify(exportData, null, 2)
  );
  console.log("Done!");
}

main().catch(console.error);
