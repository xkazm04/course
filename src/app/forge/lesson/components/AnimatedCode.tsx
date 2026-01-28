"use client";

/**
 * AnimatedCode - Remotion-style animated code walkthrough embedded in lessons
 *
 * Usage in markdown:
 * :::animated[title="How Generics Work" description="Step-by-step explanation"]
 * ```typescript
 * function identity<T>(arg: T): T {
 *   return arg;
 * }
 * ```
 * :::
 *
 * Auto-generates flow steps based on code structure, or accepts manual steps.
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Film, Maximize2, X } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { HybridVariant, type FlowStep } from "../video-lab/variants/HybridVariant";

// ============================================================================
// TYPES
// ============================================================================

export interface AnimatedCodeProps {
  code: string;
  title?: string;
  description?: string;
  language?: string;
  steps?: FlowStep[];
  className?: string;
  /** Show annotation sidebar with key benefits for each step */
  showAnnotations?: boolean;
}

// ============================================================================
// AUTO-GENERATE FLOW STEPS
// ============================================================================

function autoGenerateSteps(code: string): FlowStep[] {
  const lines = code.split("\n");
  const steps: FlowStep[] = [];
  let charOffset = 0;

  // Group lines into logical sections
  let currentSection: { startLine: number; startChar: number; lines: string[]; type: string } | null = null;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const lineLength = line.length + 1; // +1 for newline

    // Detect section boundaries
    const isImport = trimmed.startsWith("import ");
    const isFunctionStart = /^(export\s+)?(async\s+)?function\s+\w+/.test(trimmed) ||
                            /^(export\s+)?(const|let)\s+\w+\s*=\s*(async\s+)?\(/.test(trimmed);
    const isTypeDecl = /^(interface|type|class)\s+\w+/.test(trimmed);
    const isReturn = trimmed.startsWith("return ");
    const isComment = trimmed.startsWith("//") || trimmed.startsWith("/*");

    // Close current section and start new one
    const shouldCloseSection = (
      (currentSection && isImport && currentSection.type !== "import") ||
      (currentSection && isFunctionStart && currentSection.type !== "function") ||
      (currentSection && isTypeDecl && currentSection.type !== "type") ||
      (currentSection && isReturn)
    );

    if (shouldCloseSection && currentSection) {
      const endChar = charOffset;
      steps.push(createStep(currentSection, endChar, steps.length));
      currentSection = null;
    }

    // Start new section
    if (!currentSection) {
      let type = "code";
      if (isImport) type = "import";
      else if (isFunctionStart) type = "function";
      else if (isTypeDecl) type = "type";
      else if (isReturn) type = "return";
      else if (isComment) type = "comment";

      if (trimmed) {
        currentSection = {
          startLine: lineIndex,
          startChar: charOffset,
          lines: [],
          type,
        };
      }
    }

    if (currentSection && trimmed) {
      currentSection.lines.push(line);
    }

    charOffset += lineLength;
  });

  // Close final section
  if (currentSection) {
    steps.push(createStep(currentSection, charOffset, steps.length));
  }

  // Ensure we have at least 2-4 steps
  if (steps.length === 0) {
    // Fallback: split into thirds
    const third = Math.floor(code.length / 3);
    return [
      { label: "Setup", description: "Initialize the code structure", highlight: [1, 2, 3], charRange: [0, third], activeNode: "input" },
      { label: "Logic", description: "Core implementation", highlight: [4, 5, 6], charRange: [third, third * 2], activeNode: "process" },
      { label: "Result", description: "Return the result", highlight: [7, 8, 9], charRange: [third * 2, code.length], activeNode: "output" },
    ];
  }

  return steps;
}

function createStep(
  section: { startLine: number; startChar: number; lines: string[]; type: string },
  endChar: number,
  index: number
): FlowStep {
  const lineCount = section.lines.length;
  const highlight = Array.from({ length: lineCount }, (_, i) => section.startLine + i + 1);

  const labels: Record<string, { label: string; description: string; node: "input" | "process" | "output" }> = {
    import: { label: "Imports", description: "Load dependencies and modules", node: "input" },
    type: { label: "Type Definition", description: "Define the type structure", node: "input" },
    function: { label: "Function", description: "Define the function signature and body", node: "process" },
    return: { label: "Return", description: "Return the computed result", node: "output" },
    comment: { label: "Documentation", description: "Code documentation and comments", node: "input" },
    code: { label: `Step ${index + 1}`, description: "Execute this code block", node: "process" },
  };

  const config = labels[section.type] || labels.code;

  return {
    label: config.label,
    description: config.description,
    highlight,
    charRange: [section.startChar, endChar],
    activeNode: config.node,
    stateChanges: getStateChangesForType(section.type, index),
  };
}

function getStateChangesForType(type: string, index: number): Record<string, string> {
  const states: Record<string, Record<string, string>> = {
    import: { input: "deps", timer: "loading", output: '""' },
    type: { input: "Type<T>", timer: "defined", output: '""' },
    function: { input: "arg", timer: "exec", output: "..." },
    return: { input: "arg", timer: "done", output: "result" },
    code: { input: `v${index}`, timer: "run", output: "..." },
  };
  return states[type] || states.code;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AnimatedCode({
  code,
  title = "Code Walkthrough",
  description,
  language = "typescript",
  steps,
  className,
  showAnnotations = false,
}: AnimatedCodeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-generate steps if not provided
  const flowSteps = useMemo(() => steps || autoGenerateSteps(code), [code, steps]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setIsPlaying(false);
    setResetKey((k) => k + 1);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "r" || e.key === "R") {
        handleReset();
      } else if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  const videoContent = (
    <motion.div
      key={resetKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full"
    >
      <HybridVariant
        code={code}
        flowSteps={flowSteps}
        isPlaying={isPlaying}
        onComplete={() => setIsPlaying(false)}
        title={`${title}.${language === "typescript" ? "ts" : language}`}
        showAnnotations={showAnnotations}
      />
    </motion.div>
  );

  // Expanded fullscreen modal
  if (isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8"
        onClick={() => setIsExpanded(false)}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-full max-w-6xl aspect-video rounded-2xl overflow-hidden border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {videoContent}

          {/* Close button */}
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Play overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <button
                onClick={handlePlay}
                className="w-20 h-20 rounded-full bg-[var(--ember)] flex items-center justify-center shadow-2xl shadow-[var(--ember)]/30 hover:scale-105 transition-transform"
              >
                <Play size={32} className="text-white ml-1" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all",
              isPlaying
                ? "bg-white/20 text-white"
                : "bg-[var(--ember)] text-white shadow-lg shadow-[var(--ember)]/20"
            )}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </motion.div>
    );
  }

  // Inline component
  return (
    <div
      ref={containerRef}
      className={cn("my-6 rounded-xl overflow-hidden border border-slate-700/50 bg-[#0a0a0f]", className)}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--ember)]/20 flex items-center justify-center">
            <Film size={16} className="text-[var(--ember)]" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">{title}</div>
            {description && (
              <div className="text-xs text-white/50">{description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Expand fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Video preview (compact) */}
      <div className="relative" style={{ height: "320px" }}>
        {videoContent}

        {/* Play overlay */}
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <button
              onClick={handlePlay}
              className="group relative"
            >
              <div className="absolute inset-0 bg-[var(--ember)] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-16 h-16 rounded-full bg-[var(--ember)] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                <Play size={24} className="text-white ml-0.5" />
              </div>
            </button>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-800/30 border-t border-slate-700/30">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
            isPlaying
              ? "bg-white/10 text-white"
              : "bg-[var(--ember)] text-white"
          )}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          {isPlaying ? "Pause" : "Play Animation"}
        </button>
        <span className="text-xs text-white/30">{flowSteps.length} steps</span>
      </div>
    </div>
  );
}
