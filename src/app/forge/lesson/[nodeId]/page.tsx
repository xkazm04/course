"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  ArrowLeft, Loader2, AlertTriangle, Home, Clock, BookOpen,
  Layers, ChevronRight, ChevronLeft, Play, Sparkles, Youtube, ExternalLink,
  CheckCircle2, Circle, List, X
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { LessonMarkdown } from "../components/LessonMarkdown";

// ============================================================================
// TYPES
// ============================================================================

interface LessonSection {
  id: string;
  sort_order: number;
  title: string;
  section_type: string;
  duration_minutes: number | null;
  content_markdown: string;
  code_snippet: string | null;
  code_language: string | null;
  key_points: string[] | null;
}

interface LessonNode {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  depth: number;
  parent_id: string | null;
  domain_id: string;
  icon: string | null;
  color: string | null;
  estimated_hours: number | null;
  difficulty: string | null;
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
    video_variants?: Array<{
      id: string;
      title: string;
      style: string;
      duration: string;
      instructor: string;
      youtube_id?: string;
      search_query?: string;
    }>;
    estimated_minutes?: number;
  };
  is_ai_generated: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LessonNavigation {
  prev: { id: string; name: string; slug: string } | null;
  next: { id: string; name: string; slug: string } | null;
}

interface LessonData {
  content: LessonContent;
  sections: LessonSection[];
  node: LessonNode;
  breadcrumbs: {
    domain: string;
    topic: string;
    skill: string;
    area: string;
  };
  navigation: LessonNavigation;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// ============================================================================
// DIFFICULTY BADGE
// ============================================================================

const difficultyConfig: Record<string, { color: string; bg: string; label: string }> = {
  beginner: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Beginner" },
  intermediate: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Intermediate" },
  advanced: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: "Advanced" },
  expert: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Expert" },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = difficultyConfig[difficulty] || difficultyConfig.beginner;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.bg} ${config.color}`}>
      <Layers size={14} />
      {config.label}
    </span>
  );
}

// ============================================================================
// SECTION TYPES
// ============================================================================

const sectionTypeConfig: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  video: { icon: Play, color: "text-red-400" },
  lesson: { icon: BookOpen, color: "text-blue-400" },
  interactive: { icon: Sparkles, color: "text-purple-400" },
  exercise: { icon: Layers, color: "text-emerald-400" },
};

// ============================================================================
// VIDEO CARD
// ============================================================================

interface VideoVariant {
  id: string;
  title: string;
  style: string;
  duration: string;
  instructor: string;
  youtube_id?: string;
  search_query?: string;
}

function VideoCard({ video }: { video: VideoVariant }) {
  const searchUrl = video.youtube_id
    ? `https://www.youtube.com/watch?v=${video.youtube_id}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(video.search_query || video.title)}`;

  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 p-4 rounded-xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] hover:border-red-500/30 transition-all hover:shadow-lg hover:shadow-red-500/5"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
        <Youtube className="text-red-400" size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--forge-text-primary)] truncate group-hover:text-red-400 transition-colors">
          {video.title}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)] mt-1">
          <span>{video.instructor}</span>
          <span>•</span>
          <span>{video.duration}</span>
          <span>•</span>
          <span className="capitalize">{video.style}</span>
        </div>
      </div>
      <ExternalLink size={16} className="text-[var(--forge-text-muted)] group-hover:text-red-400 transition-colors" />
    </a>
  );
}

// ============================================================================
// KEY TAKEAWAYS
// ============================================================================

function KeyTakeaways({ takeaways }: { takeaways: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-[var(--ember)]/10 to-orange-500/5 border border-[var(--ember)]/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[var(--ember)]/20 flex items-center justify-center">
          <Sparkles size={16} className="text-[var(--ember)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">Key Takeaways</h3>
      </div>
      <ul className="space-y-3">
        {takeaways.map((takeaway, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 text-[var(--forge-text-secondary)]"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--ember)]/20 flex items-center justify-center mt-0.5">
              <span className="text-xs font-bold text-[var(--ember)]">{i + 1}</span>
            </span>
            <span className="leading-relaxed">{takeaway}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================

function TableOfContents({
  items,
  activeId,
  onItemClick
}: {
  items: TOCItem[];
  activeId: string;
  onItemClick: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={`block w-full text-left text-sm py-1.5 transition-colors ${
            item.level === 2 ? "pl-0" : item.level === 3 ? "pl-4" : "pl-8"
          } ${
            activeId === item.id
              ? "text-[var(--ember)] font-medium"
              : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
          }`}
        >
          {item.text}
        </button>
      ))}
    </nav>
  );
}

// ============================================================================
// READING PROGRESS
// ============================================================================

function ReadingProgress({ progress }: { progress: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-[var(--forge-bg-elevated)]">
      <motion.div
        className="h-full bg-gradient-to-r from-[var(--ember)] to-orange-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}

// ============================================================================
// LESSON NAVIGATION
// ============================================================================

function LessonNav({ navigation }: { navigation: LessonNavigation }) {
  if (!navigation.prev && !navigation.next) return null;

  return (
    <div className="flex items-stretch gap-4 mt-12 pt-8 border-t border-[var(--forge-border-subtle)]">
      {navigation.prev ? (
        <Link
          href={`/forge/lesson/${navigation.prev.id}`}
          className="flex-1 group p-4 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 hover:border-[var(--ember)]/30 hover:bg-[var(--ember)]/5 transition-all"
        >
          <div className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)] mb-1">
            <ChevronLeft size={14} />
            Previous Lesson
          </div>
          <div className="text-sm font-medium text-[var(--forge-text-secondary)] group-hover:text-[var(--forge-text-primary)] transition-colors line-clamp-1">
            {navigation.prev.name}
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {navigation.next ? (
        <Link
          href={`/forge/lesson/${navigation.next.id}`}
          className="flex-1 group p-4 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 hover:border-[var(--ember)]/30 hover:bg-[var(--ember)]/5 transition-all text-right"
        >
          <div className="flex items-center justify-end gap-2 text-xs text-[var(--forge-text-muted)] mb-1">
            Next Lesson
            <ChevronRight size={14} />
          </div>
          <div className="text-sm font-medium text-[var(--forge-text-secondary)] group-hover:text-[var(--forge-text-primary)] transition-colors line-clamp-1">
            {navigation.next.name}
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}

// ============================================================================
// FLOATING ACTION BAR
// ============================================================================

function FloatingActionBar({
  isCompleted,
  onToggleComplete,
  showTOC,
  onToggleTOC,
  hasTOC
}: {
  isCompleted: boolean;
  onToggleComplete: () => void;
  showTOC: boolean;
  onToggleTOC: () => void;
  hasTOC: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-6 right-6 flex items-center gap-2 z-40"
    >
      {hasTOC && (
        <button
          onClick={onToggleTOC}
          className={`p-3 rounded-full shadow-lg transition-all ${
            showTOC
              ? "bg-[var(--ember)] text-white"
              : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] border border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/30"
          }`}
          title="Table of Contents"
        >
          {showTOC ? <X size={20} /> : <List size={20} />}
        </button>
      )}
      <button
        onClick={onToggleComplete}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all ${
          isCompleted
            ? "bg-emerald-500 text-white"
            : "bg-gradient-to-r from-[var(--ember)] to-orange-500 text-white hover:shadow-xl hover:shadow-[var(--ember)]/20"
        }`}
      >
        {isCompleted ? (
          <>
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">Completed</span>
          </>
        ) : (
          <>
            <Circle size={18} />
            <span className="text-sm font-medium">Mark Complete</span>
          </>
        )}
      </button>
    </motion.div>
  );
}

// ============================================================================
// CELEBRATION PARTICLES
// ============================================================================

function CelebrationParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: "100vh", x: `${p.x}vw`, opacity: 1, scale: 0 }}
          animate={{
            y: "-20vh",
            opacity: [1, 1, 0],
            scale: [0, 1, 0.5],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2,
            delay: p.delay,
            ease: "easeOut",
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// STICKY HEADER
// ============================================================================

function StickyHeader({
  title,
  progress,
  isVisible
}: {
  title: string;
  progress: number;
  isVisible: boolean;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-40 bg-[var(--forge-bg-daylight)]/95 backdrop-blur-md border-b border-[var(--forge-border-subtle)]"
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--forge-text-primary)] truncate">
              {title}
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-xs text-[var(--forge-text-muted)]">
                {Math.round(progress)}%
              </div>
              <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--ember)] to-orange-500"
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// SECTION CARD
// ============================================================================

function SectionCard({ section, index }: { section: LessonSection; index: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const typeConfig = sectionTypeConfig[section.section_type] || sectionTypeConfig.lesson;
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 overflow-hidden"
    >
      {/* Section header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${typeConfig.color}`}>
          <TypeIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-[var(--forge-text-primary)]">
            {section.title}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)] mt-1">
            <span className="capitalize">{section.section_type}</span>
            {section.duration_minutes && (
              <>
                <span>•</span>
                <span>{section.duration_minutes} min</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight
          size={20}
          className={`text-[var(--forge-text-muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Section content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-[var(--forge-border-subtle)]">
              {/* Section markdown content */}
              {section.content_markdown && (
                <div className="pt-5">
                  <LessonMarkdown content={section.content_markdown} />
                </div>
              )}

              {/* Code snippet */}
              {section.code_snippet && (
                <div className="mt-4">
                  <LessonMarkdown
                    content={`\`\`\`${section.code_language || "javascript"}\n${section.code_snippet}\n\`\`\``}
                  />
                </div>
              )}

              {/* Key points */}
              {section.key_points && section.key_points.length > 0 && (
                <div className="mt-5 p-4 rounded-xl bg-[var(--ember)]/5 border border-[var(--ember)]/10">
                  <h4 className="text-sm font-semibold text-[var(--ember)] mb-3">Key Points</h4>
                  <ul className="space-y-2">
                    {section.key_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ember)] mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

// Helper to extract TOC items from markdown
function extractTOCItems(content: string): TOCItem[] {
  const items: TOCItem[] = [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    items.push({ id, text, level });
  }

  return items;
}

// Local storage helpers for lesson completion
function getCompletedLessons(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const stored = localStorage.getItem("completed-lessons");
  return new Set(stored ? JSON.parse(stored) : []);
}

function setLessonComplete(nodeId: string, isComplete: boolean) {
  const completed = getCompletedLessons();
  if (isComplete) {
    completed.add(nodeId);
  } else {
    completed.delete(nodeId);
  }
  localStorage.setItem("completed-lessons", JSON.stringify([...completed]));
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const nodeId = params.nodeId as string;
  const contentRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Check completion status on mount
  useEffect(() => {
    setIsCompleted(getCompletedLessons().has(nodeId));
  }, [nodeId]);

  // Track scroll for reading progress and sticky header
  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setReadingProgress(Math.min(100, Math.max(0, progress)));
      setShowStickyHeader(scrollTop > 300);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchLesson() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/lessons/${nodeId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load lesson");
        }

        const lessonData = await response.json();
        setData(lessonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLesson();
  }, [nodeId]);

  const handleBack = () => {
    router.back();
  };

  const [showCelebration, setShowCelebration] = useState(false);

  const handleToggleComplete = useCallback(() => {
    setIsCompleted((prev) => {
      const newValue = !prev;
      setLessonComplete(nodeId, newValue);
      // Show celebration when marking complete
      if (newValue) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
      return newValue;
    });
  }, [nodeId]);

  const handleTOCItemClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeading(id);
    }
  }, []);

  // Extract TOC from content
  const tocItems = useMemo(() => {
    if (!data?.content.content_markdown) return [];
    return extractTOCItems(data.content.content_markdown);
  }, [data?.content.content_markdown]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--forge-bg-daylight)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--ember)]/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="relative w-12 h-12 text-[var(--ember)] animate-spin" />
          </div>
          <p className="text-[var(--forge-text-secondary)]">Loading lesson...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--forge-bg-daylight)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 p-8 bg-[var(--forge-bg-elevated)] rounded-2xl border border-[var(--forge-border-subtle)] shadow-2xl max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--forge-text-primary)] mb-2">
              Lesson Not Found
            </h2>
            <p className="text-[var(--forge-text-secondary)]">
              {error || "This lesson doesn't exist or hasn't been created yet."}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] rounded-xl transition-colors"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
            <Link
              href="/forge/map"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--ember)] to-orange-500 text-white rounded-xl shadow-lg shadow-[var(--ember)]/20 hover:shadow-xl transition-shadow"
            >
              <Home size={16} />
              Back to Map
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const { content, sections, node, breadcrumbs, navigation } = data;
  const metadata = content.metadata || {};

  return (
    <div className="min-h-screen bg-[var(--forge-bg-daylight)]">
      {/* Celebration particles */}
      <AnimatePresence>
        {showCelebration && <CelebrationParticles />}
      </AnimatePresence>

      {/* Reading progress bar */}
      <ReadingProgress progress={readingProgress} />

      {/* Sticky header */}
      <StickyHeader
        title={node.name}
        progress={readingProgress}
        isVisible={showStickyHeader}
      />

      {/* Floating action bar */}
      <FloatingActionBar
        isCompleted={isCompleted}
        onToggleComplete={handleToggleComplete}
        showTOC={showTOC}
        onToggleTOC={() => setShowTOC(!showTOC)}
        hasTOC={tocItems.length > 0}
      />

      {/* Mobile TOC drawer */}
      <AnimatePresence>
        {showTOC && tocItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 bottom-0 w-72 bg-[var(--forge-bg-elevated)] border-l border-[var(--forge-border-subtle)] z-50 overflow-y-auto p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--forge-text-primary)]">Contents</h3>
              <button
                onClick={() => setShowTOC(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X size={18} className="text-[var(--forge-text-muted)]" />
              </button>
            </div>
            <TableOfContents
              items={tocItems}
              activeId={activeHeading}
              onItemClick={(id) => {
                handleTOCItemClick(id);
                setShowTOC(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero header */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--ember)]/10 via-[var(--forge-bg-daylight)] to-[var(--forge-bg-daylight)]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02]" />

        <div className="relative max-w-4xl mx-auto px-4 pt-6 pb-10">
          {/* Back button and breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-[var(--forge-text-muted)] overflow-hidden">
              {[breadcrumbs.domain, breadcrumbs.topic, breadcrumbs.skill, breadcrumbs.area].filter(Boolean).map((crumb, i, arr) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight size={14} className="flex-shrink-0" />}
                  <span className={i === arr.length - 1 ? "text-[var(--forge-text-secondary)] font-medium truncate" : "truncate"}>
                    {crumb}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-[var(--forge-text-primary)] mb-4"
          >
            {node.name}
          </motion.h1>

          {/* Description */}
          {node.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg text-[var(--forge-text-secondary)] mb-6 leading-relaxed"
            >
              {node.description}
            </motion.p>
          )}

          {/* Metadata badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-3"
          >
            {(node.difficulty || metadata.difficulty) && (
              <DifficultyBadge difficulty={node.difficulty || metadata.difficulty!} />
            )}
            {(metadata.estimated_minutes || node.estimated_hours) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-white/5 border-white/10 text-[var(--forge-text-secondary)]">
                <Clock size={14} />
                {metadata.estimated_minutes
                  ? `${metadata.estimated_minutes} min`
                  : `${node.estimated_hours}h`}
              </span>
            )}
            {sections.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-white/5 border-white/10 text-[var(--forge-text-secondary)]">
                <BookOpen size={14} />
                {sections.length} sections
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div ref={contentRef} className="max-w-4xl mx-auto px-4 pb-16">
        {/* Introduction */}
        {content.introduction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-10 p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20"
          >
            <LessonMarkdown content={content.introduction} />
          </motion.div>
        )}

        {/* Video resources */}
        {metadata.video_variants && metadata.video_variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <h2 className="text-xl font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
              <Youtube className="text-red-400" size={20} />
              Video Resources
            </h2>
            <div className="grid gap-3">
              {metadata.video_variants.map((video, i) => (
                <VideoCard key={video.id || i} video={video} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Main content */}
        {content.content_markdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-10"
          >
            <LessonMarkdown content={content.content_markdown} />
          </motion.div>
        )}

        {/* Sections */}
        {sections.length > 0 && (
          <div className="space-y-4 mb-10">
            <h2 className="text-xl font-semibold text-[var(--forge-text-primary)] mb-4">
              Lesson Sections
            </h2>
            {sections.map((section, index) => (
              <SectionCard key={section.id} section={section} index={index} />
            ))}
          </div>
        )}

        {/* Key takeaways */}
        {metadata.key_takeaways && metadata.key_takeaways.length > 0 && (
          <KeyTakeaways takeaways={metadata.key_takeaways} />
        )}

        {/* Tags */}
        {metadata.tags && metadata.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10"
          >
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-[var(--forge-text-muted)] border border-white/10 hover:border-[var(--ember)]/30 hover:text-[var(--ember)] transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation to prev/next lessons */}
        {navigation && <LessonNav navigation={navigation} />}

        {/* Bottom spacing for floating action bar */}
        <div className="h-24" />
      </div>
    </div>
  );
}
