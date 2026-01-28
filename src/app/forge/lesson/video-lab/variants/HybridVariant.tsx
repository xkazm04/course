"use client";

/**
 * Hybrid Variant - Consolidated Video Animation
 *
 * Layout: Vertical stack
 * - Top: Compact data flow visualization that reacts to code progress
 * - Bottom: Expanded code panel with typewriter animation and auto-scroll
 *
 * Features:
 * - Shadow preview of full code (cinematic)
 * - Character-by-character typing with cursor (typewriter)
 * - Reactive flow diagram showing current execution state (split flow)
 * - Smooth animated scrolling to follow cursor
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Play, Zap, Database, RefreshCw, ArrowRight, Sparkles } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface FlowStep {
  label: string;
  description: string;
  highlight: number[];
  charRange: [number, number];
  stateChanges?: Record<string, string>;
  activeNode?: "input" | "process" | "output";
  /** Optional bullet points for annotation sidebar */
  annotations?: string[];
}

interface HybridVariantProps {
  code: string;
  flowSteps: FlowStep[];
  isPlaying: boolean;
  onComplete: () => void;
  title?: string;
  /** Show thin annotation sidebar with key benefits */
  showAnnotations?: boolean;
}

type TokenType = "keyword" | "string" | "comment" | "number" | "function" | "type" | "operator" | "punctuation" | "default";

// ============================================================================
// SYNTAX HIGHLIGHTING
// ============================================================================

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "text-pink-400",
  string: "text-emerald-400",
  comment: "text-slate-500 italic",
  number: "text-amber-400",
  function: "text-blue-400",
  type: "text-cyan-400",
  operator: "text-pink-300",
  punctuation: "text-slate-400",
  default: "text-slate-300",
};

const TOKEN_COLORS_SHADOW: Record<TokenType, string> = {
  keyword: "text-pink-400/15",
  string: "text-emerald-400/15",
  comment: "text-slate-500/10",
  number: "text-amber-400/15",
  function: "text-blue-400/15",
  type: "text-cyan-400/15",
  operator: "text-pink-300/15",
  punctuation: "text-slate-400/10",
  default: "text-slate-500/10",
};

function tokenizeLine(line: string): { text: string; type: TokenType }[] {
  const tokens: { text: string; type: TokenType }[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    const commentMatch = remaining.match(/^(\/\/.*|\/\*[\s\S]*?\*\/)/);
    if (commentMatch) {
      tokens.push({ text: commentMatch[0], type: "comment" });
      remaining = remaining.slice(commentMatch[0].length);
      continue;
    }

    const stringMatch = remaining.match(/^(["'`])(?:(?!\1)[^\\]|\\.)*?\1/);
    if (stringMatch) {
      tokens.push({ text: stringMatch[0], type: "string" });
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    const keywordMatch = remaining.match(
      /^(const|let|var|function|return|if|else|for|while|import|export|from|async|await|new|typeof|interface|type)\b/
    );
    if (keywordMatch) {
      tokens.push({ text: keywordMatch[0], type: "keyword" });
      remaining = remaining.slice(keywordMatch[0].length);
      continue;
    }

    const typeMatch = remaining.match(/^(string|number|boolean|void|null|undefined|any|T)\b/);
    if (typeMatch) {
      tokens.push({ text: typeMatch[0], type: "type" });
      remaining = remaining.slice(typeMatch[0].length);
      continue;
    }

    const numberMatch = remaining.match(/^\d+\.?\d*/);
    if (numberMatch) {
      tokens.push({ text: numberMatch[0], type: "number" });
      remaining = remaining.slice(numberMatch[0].length);
      continue;
    }

    const funcMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/);
    if (funcMatch) {
      tokens.push({ text: funcMatch[1], type: "function" });
      remaining = remaining.slice(funcMatch[1].length);
      continue;
    }

    const opMatch = remaining.match(/^(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%=<>!&|^~?:])/);
    if (opMatch) {
      tokens.push({ text: opMatch[0], type: "operator" });
      remaining = remaining.slice(opMatch[0].length);
      continue;
    }

    const punctMatch = remaining.match(/^[(){}\[\];,.<>]/);
    if (punctMatch) {
      tokens.push({ text: punctMatch[0], type: "punctuation" });
      remaining = remaining.slice(1);
      continue;
    }

    tokens.push({ text: remaining[0], type: "default" });
    remaining = remaining.slice(1);
  }

  return tokens;
}

// ============================================================================
// COMPACT FLOW NODE
// ============================================================================

const NODE_CONFIGS = {
  input: {
    icon: Play,
    label: "Input",
    gradient: "from-orange-500 to-amber-500",
    border: "border-orange-500",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
  },
  process: {
    icon: RefreshCw,
    label: "Timer",
    gradient: "from-violet-500 to-purple-500",
    border: "border-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
  },
  output: {
    icon: Database,
    label: "State",
    gradient: "from-emerald-500 to-teal-500",
    border: "border-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
  },
};

type NodeType = keyof typeof NODE_CONFIGS;

function CompactFlowNode({
  type,
  isActive,
  value
}: {
  type: NodeType;
  isActive: boolean;
  value: string;
}) {
  const config = NODE_CONFIGS[type];
  const Icon = config.icon;

  return (
    <motion.div
      className="flex items-center gap-3"
      animate={{ opacity: isActive ? 1 : 0.4 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon */}
      <motion.div
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
          isActive ? `${config.bg} ${config.border}` : "bg-white/5 border-white/10"
        }`}
        animate={{ scale: isActive ? 1.05 : 1 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <Icon size={18} className={isActive ? config.text : "text-white/30"} />
        {isActive && (
          <motion.div
            className={`absolute inset-0 rounded-xl border ${config.border}`}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Label and value */}
      <div className="min-w-0">
        <div className={`text-[10px] uppercase tracking-wider ${isActive ? config.text : "text-white/30"}`}>
          {config.label}
        </div>
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-mono text-white/80 truncate max-w-[100px]"
        >
          {value}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// CONNECTION ARROW
// ============================================================================

function FlowArrow({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center px-2">
      <motion.div
        className="flex items-center"
        animate={{ opacity: isActive ? 1 : 0.2 }}
      >
        <div className={`w-8 h-0.5 ${isActive ? "bg-gradient-to-r from-orange-500 to-violet-500" : "bg-white/10"}`} />
        <ArrowRight size={12} className={isActive ? "text-violet-400 -ml-1" : "text-white/20 -ml-1"} />
      </motion.div>
    </div>
  );
}

// ============================================================================
// ANNOTATION SIDEBAR
// ============================================================================

function AnnotationSidebar({
  annotations,
  stepLabel,
}: {
  annotations: string[];
  stepLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-56 flex-shrink-0 border-l border-white/10 bg-black/20 overflow-hidden"
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <Sparkles size={14} className="text-[var(--ember)]" />
          <span className="text-xs font-semibold text-[var(--ember)] uppercase tracking-wider">
            Key Benefits
          </span>
        </div>

        {/* Annotations list */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {annotations.map((annotation, i) => (
            <motion.div
              key={`${stepLabel}-${i}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-2.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <span className="text-xs text-white/70 leading-relaxed">
                {annotation}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Step indicator */}
        <div className="pt-3 mt-3 border-t border-white/10">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">
            Current Step
          </div>
          <div className="text-sm font-medium text-white/80 mt-0.5">
            {stepLabel}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// CODE LINE COMPONENT
// ============================================================================

function CodeLine({
  lineNumber,
  tokens,
  visibleChars,
  totalChars,
  isHighlighted,
  showCursor,
  isShadow,
}: {
  lineNumber: number;
  tokens: { text: string; type: TokenType }[];
  visibleChars: number;
  totalChars: number;
  isHighlighted: boolean;
  showCursor: boolean;
  isShadow: boolean;
}) {
  const colors = isShadow ? TOKEN_COLORS_SHADOW : TOKEN_COLORS;
  let charCount = 0;

  return (
    <div className="flex relative min-h-[1.5rem]">
      {/* Highlight background */}
      {isHighlighted && !isShadow && (
        <motion.div
          className="absolute inset-0 -mx-4 bg-gradient-to-r from-[var(--ember)]/10 via-[var(--ember)]/5 to-transparent border-l-2 border-[var(--ember)]"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Line number */}
      <span className={`w-10 text-right pr-4 select-none relative z-10 text-xs font-mono ${
        isHighlighted && !isShadow ? "text-[var(--ember)]/70" : isShadow ? "text-slate-700" : "text-slate-600"
      }`}>
        {lineNumber}
      </span>

      {/* Code content */}
      <span className="relative z-10 flex-1 whitespace-pre">
        {tokens.map((token, i) => {
          const tokenStart = charCount;
          charCount += token.text.length;

          const visibleLength = Math.max(0, Math.min(token.text.length, visibleChars - tokenStart));
          const visibleText = token.text.slice(0, visibleLength);
          const isPartiallyVisible = visibleLength > 0 && visibleLength < token.text.length;

          if (isShadow) {
            return (
              <span key={i} className={colors[token.type]}>
                {token.text}
              </span>
            );
          }

          if (visibleLength === 0) return null;

          return (
            <span key={i}>
              <span className={colors[token.type]}>{visibleText}</span>
              {showCursor && isPartiallyVisible && (
                <motion.span
                  className="inline-block w-[2px] h-[1.1em] bg-[var(--ember)] ml-[1px] -mb-[2px] rounded-sm"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
                />
              )}
            </span>
          );
        })}

        {/* Cursor at end of line */}
        {showCursor && !isShadow && visibleChars >= totalChars && totalChars > 0 && (
          <motion.span
            className="inline-block w-[2px] h-[1.1em] bg-[var(--ember)] ml-[1px] -mb-[2px] rounded-sm"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
          />
        )}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HybridVariant({
  code,
  flowSteps,
  isPlaying,
  onComplete,
  title = "useDebounce.ts",
  showAnnotations = false,
}: HybridVariantProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [charIndex, setCharIndex] = useState(0);
  const [stateValues, setStateValues] = useState<Record<string, string>>({
    input: '""',
    timer: "null",
    output: '""',
  });

  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<number>(0);
  const currentScrollRef = useRef<number>(0);
  const scrollAnimationRef = useRef<number | null>(null);

  const lines = code.split("\n");
  const tokenizedLines = useMemo(() => lines.map(tokenizeLine), [code]);
  const totalChars = code.length;

  // Calculate line char offsets
  const lineCharOffsets = useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;
    for (const line of lines) {
      offsets.push(offset);
      offset += line.length + 1;
    }
    return offsets;
  }, [lines]);

  // Get current line from char index
  const currentLineIndex = useMemo(() => {
    for (let i = lineCharOffsets.length - 1; i >= 0; i--) {
      if (charIndex >= lineCharOffsets[i]) return i;
    }
    return 0;
  }, [charIndex, lineCharOffsets]);

  // Get current step data
  const activeStep = currentStep >= 0 && currentStep < flowSteps.length ? flowSteps[currentStep] : null;
  const highlightedLines = activeStep?.highlight || [];
  const activeNode = activeStep?.activeNode || (currentStep === 0 ? "input" : currentStep === 1 ? "process" : currentStep >= 2 ? "output" : null);

  // Smooth scroll animation
  const animateScroll = useCallback(() => {
    if (!codeContainerRef.current) return;

    const diff = scrollTargetRef.current - currentScrollRef.current;
    if (Math.abs(diff) < 1) {
      currentScrollRef.current = scrollTargetRef.current;
      codeContainerRef.current.scrollTop = scrollTargetRef.current;
      return;
    }

    // Ease out - faster when far, slower when close
    const step = diff * 0.12;
    currentScrollRef.current += step;
    codeContainerRef.current.scrollTop = currentScrollRef.current;

    scrollAnimationRef.current = requestAnimationFrame(animateScroll);
  }, []);

  // Update scroll target when current line changes
  useEffect(() => {
    if (!codeContainerRef.current) return;

    const container = codeContainerRef.current;
    const lineHeight = 24; // 1.5rem = 24px
    const containerHeight = container.clientHeight;
    const visibleLines = Math.floor(containerHeight / lineHeight);

    // Keep cursor roughly in the middle-bottom third of the view
    const targetLine = currentLineIndex;
    const idealScrollLine = Math.max(0, targetLine - Math.floor(visibleLines * 0.4));
    const targetScroll = idealScrollLine * lineHeight;

    // Only scroll if we need to
    const currentScroll = container.scrollTop;
    const cursorPosition = targetLine * lineHeight;
    const viewTop = currentScroll;
    const viewBottom = currentScroll + containerHeight - lineHeight * 2;

    if (cursorPosition < viewTop || cursorPosition > viewBottom) {
      scrollTargetRef.current = targetScroll;

      // Cancel any existing animation
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }

      // Start smooth scroll animation
      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }
  }, [currentLineIndex, animateScroll]);

  // Cleanup scroll animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) clearTimeout(animationRef.current);
      return;
    }

    // Initial delay before starting
    if (currentStep === -1) {
      animationRef.current = setTimeout(() => {
        setCurrentStep(0);
      }, 400);
      return;
    }

    // Check if we've completed all steps
    if (currentStep >= flowSteps.length) {
      setTimeout(onComplete, 800);
      return;
    }

    const step = flowSteps[currentStep];
    const [, endChar] = step.charRange;

    // Type characters for this step
    if (charIndex < endChar) {
      const currentChar = code[charIndex];
      // Variable speed: faster for whitespace and newlines
      let delay = 30;
      if (currentChar === '\n') delay = 80;
      else if (/\s/.test(currentChar)) delay = 12;
      else if (/[{}()\[\]]/.test(currentChar)) delay = 50;

      animationRef.current = setTimeout(() => {
        setCharIndex((i) => Math.min(i + 1, endChar));
      }, delay);
    } else {
      // Step complete - update state and move to next
      if (step.stateChanges) {
        setStateValues((prev) => ({ ...prev, ...step.stateChanges }));
      }

      animationRef.current = setTimeout(() => {
        setCurrentStep((s) => s + 1);
      }, 1200);
    }

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isPlaying, currentStep, charIndex, flowSteps, code, onComplete]);

  const overallProgress = (charIndex / totalChars) * 100;

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0f]">
      {/* Top: Compact Flow Visualization */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/40">
        <div className="px-5 py-4">
          {/* Flow nodes in a row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <CompactFlowNode
                type="input"
                isActive={activeNode === "input"}
                value={stateValues.input}
              />
              <FlowArrow isActive={currentStep >= 1} />
              <CompactFlowNode
                type="process"
                isActive={activeNode === "process"}
                value={stateValues.timer}
              />
              <FlowArrow isActive={currentStep >= 2} />
              <CompactFlowNode
                type="output"
                isActive={activeNode === "output"}
                value={stateValues.output}
              />
            </div>

            {/* Current step label */}
            <AnimatePresence mode="wait">
              {activeStep && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3"
                >
                  <div className="text-right max-w-[200px]">
                    <div className="flex items-center gap-1.5 justify-end mb-0.5">
                      <Zap size={12} className="text-[var(--ember)]" />
                      <span className="text-xs font-medium text-[var(--ember)]">{activeStep.label}</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-tight">
                      {activeStep.description}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--ember)] via-violet-500 to-emerald-500 rounded-full"
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Bottom: Code Panel (expanded) with optional annotation sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Main code area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Code header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-white/40 font-mono">{title}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>Line {currentLineIndex + 1}</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
        </div>

        {/* Code area with shadow and typed content */}
        <div
          ref={codeContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-sm leading-6 relative"
          style={{ scrollBehavior: "auto" }} // We handle smooth scrolling manually
        >
          {/* Shadow layer (full code, very dimmed) */}
          <div className="absolute inset-0 p-4 pointer-events-none select-none">
            {tokenizedLines.map((tokens, lineIndex) => (
              <CodeLine
                key={`shadow-${lineIndex}`}
                lineNumber={lineIndex + 1}
                tokens={tokens}
                visibleChars={Infinity}
                totalChars={tokens.reduce((acc, t) => acc + t.text.length, 0)}
                isHighlighted={false}
                showCursor={false}
                isShadow={true}
              />
            ))}
          </div>

          {/* Typed layer */}
          <div className="relative p-4">
            {tokenizedLines.map((tokens, lineIndex) => {
              const lineStart = lineCharOffsets[lineIndex];
              const lineLength = lines[lineIndex].length;
              const lineEnd = lineStart + lineLength;

              const visibleCharsInLine = Math.max(0, Math.min(lineLength, charIndex - lineStart));
              const isCurrentLine = charIndex >= lineStart && charIndex <= lineEnd;
              const isHighlighted = highlightedLines.includes(lineIndex + 1);

              // Skip rendering typed content for lines we haven't reached
              if (charIndex < lineStart) {
                return <div key={`typed-${lineIndex}`} className="min-h-[1.5rem]" />;
              }

              return (
                <CodeLine
                  key={`typed-${lineIndex}`}
                  lineNumber={lineIndex + 1}
                  tokens={tokens}
                  visibleChars={visibleCharsInLine}
                  totalChars={lineLength}
                  isHighlighted={isHighlighted}
                  showCursor={isCurrentLine && isPlaying}
                  isShadow={false}
                />
              );
            })}
          </div>
        </div>
        </div>

        {/* Optional annotation sidebar */}
        <AnimatePresence>
          {showAnnotations && activeStep?.annotations && activeStep.annotations.length > 0 && (
            <AnnotationSidebar
              annotations={activeStep.annotations}
              stepLabel={activeStep.label}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
