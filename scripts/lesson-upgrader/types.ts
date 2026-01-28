/**
 * Lesson Upgrader Types
 */

export interface LessonNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  depth: number;
  domain_id: string;
}

export interface LessonContent {
  id: string;
  node_id: string;
  version: number;
  status: string;
  introduction: string | null;
  content_markdown: string;
  metadata: LessonMetadata;
}

export interface LessonMetadata {
  tags?: string[];
  difficulty?: string;
  key_takeaways?: string[];
  key_references?: Array<{
    url: string;
    type: string;
    title: string;
  }>;
  video_variants?: Array<{
    id: string;
    style: string;
    title: string;
    duration: string;
    search_query?: string;
    instructor?: string;
  }>;
  estimated_minutes?: number;
}

export interface LessonSection {
  id: string;
  lesson_content_id: string;
  sort_order: number;
  title: string;
  section_type: string;
  duration_minutes: number | null;
  content_markdown: string;
  code_snippet: string | null;
  code_language: string | null;
  key_points: string[] | null;
}

export interface UpgradeResult {
  nodeId: string;
  name: string;
  status: "success" | "skipped" | "error";
  message: string;
  previousQuality: string;
  newQuality?: string;
  changesApplied?: string[];
}

export interface UpgradeOptions {
  dryRun?: boolean;
  verbose?: boolean;
  maxLessons?: number;
  startFrom?: string; // node_id to start from
  onlyDomain?: string;
  skipHighQuality?: boolean;
}
