"use client";

/**
 * LessonMarkdown - Comprehensive markdown renderer for lesson content
 *
 * Handles custom directives:
 * - :::callout[type="definition|warning|tip|info"] ... :::
 * - :::code[language="js" title="Example"] ... :::
 * - :::comparison[title="..." left="..." right="..."] LEFT: ... RIGHT: ... VERDICT: ... :::
 * - :::steps[title="..."] Step N: ... :::
 * - :::realworld[title="..."] ... :::
 * - :::pitfall[title="..."] WRONG: ... RIGHT: ... WHY: ... :::
 * - :::deepdive[title="..."] ... :::
 * - :::tabs[title="..."] TAB: Label ```lang code``` ... ::: (switchable code variants)
 * - :::animated[title="..." description="..."] ```lang code``` ::: (Remotion-style walkthrough)
 * - Standard markdown
 */

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Lightbulb, AlertTriangle, Info, BookOpen, Copy, Check,
  Sparkles, Zap, Target, Code2, ArrowRight, Layers,
  AlertCircle, Microscope, GitCompare, ListOrdered, Globe
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { TabbedCode, type CodeTab } from "./TabbedCode";
import { AnimatedCode } from "./AnimatedCode";

// ============================================================================
// TYPES
// ============================================================================

type CalloutType = "definition" | "warning" | "tip" | "info" | "example" | "note" | "protip" | "checkpoint";

interface ParsedBlock {
  type: "callout" | "code" | "comparison" | "steps" | "realworld" | "pitfall" | "deepdive" | "tabs" | "animated" | "keypoints" | "markdown";
  calloutType?: CalloutType;
  language?: string;
  title?: string;
  description?: string;
  content: string;
  // For keypoints
  keypoints?: string[];
  // For comparison
  leftLabel?: string;
  rightLabel?: string;
  leftContent?: string;
  rightContent?: string;
  verdict?: string;
  // For pitfall
  wrongContent?: string;
  rightContent2?: string;
  whyContent?: string;
  // For steps
  steps?: { title: string; content: string }[];
  // For tabs
  tabs?: CodeTab[];
}

// ============================================================================
// SYNTAX HIGHLIGHTER (Custom, no broken class attributes)
// ============================================================================

function highlightSyntax(code: string, lang: string): React.ReactNode[] {
  const lines = code.split('\n');

  const tokenize = (line: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Comments (// or /* */)
      const commentMatch = remaining.match(/^(\/\/.*|\/\*[\s\S]*?\*\/)/);
      if (commentMatch) {
        tokens.push(<span key={key++} className="text-slate-500 italic">{commentMatch[0]}</span>);
        remaining = remaining.slice(commentMatch[0].length);
        continue;
      }

      // Strings (single, double, template)
      const stringMatch = remaining.match(/^(["'`])(?:(?!\1)[^\\]|\\.)*?\1/);
      if (stringMatch) {
        tokens.push(<span key={key++} className="text-emerald-400">{stringMatch[0]}</span>);
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // Keywords
      const keywordMatch = remaining.match(/^(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|null|undefined|true|false|interface|type|extends|implements|readonly|public|private|protected|static|abstract|override|declare|namespace|module|enum|keyof|infer|never|unknown|any|void|in|of)\b/);
      if (keywordMatch) {
        tokens.push(<span key={key++} className="text-pink-400">{keywordMatch[0]}</span>);
        remaining = remaining.slice(keywordMatch[0].length);
        continue;
      }

      // Types (capitalized words, common TS types)
      const typeMatch = remaining.match(/^(string|number|boolean|object|symbol|bigint|Array|Object|Function|Promise|Map|Set|Record|Partial|Required|Pick|Omit|Exclude|Extract|NonNullable|ReturnType|Parameters|ConstructorParameters|InstanceType|ThisType|Readonly|Awaited)\b/);
      if (typeMatch) {
        tokens.push(<span key={key++} className="text-cyan-400">{typeMatch[0]}</span>);
        remaining = remaining.slice(typeMatch[0].length);
        continue;
      }

      // Numbers
      const numberMatch = remaining.match(/^\d+\.?\d*/);
      if (numberMatch) {
        tokens.push(<span key={key++} className="text-amber-400">{numberMatch[0]}</span>);
        remaining = remaining.slice(numberMatch[0].length);
        continue;
      }

      // Function calls
      const funcMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/);
      if (funcMatch) {
        tokens.push(<span key={key++} className="text-blue-400">{funcMatch[1]}</span>);
        remaining = remaining.slice(funcMatch[1].length);
        continue;
      }

      // Property access after dot
      const propMatch = remaining.match(/^\.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (propMatch) {
        tokens.push(<span key={key++} className="text-slate-300">.</span>);
        tokens.push(<span key={key++} className="text-violet-400">{propMatch[1]}</span>);
        remaining = remaining.slice(propMatch[0].length);
        continue;
      }

      // Operators
      const opMatch = remaining.match(/^(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%=<>!&|^~?:])/);
      if (opMatch) {
        tokens.push(<span key={key++} className="text-pink-300">{opMatch[0]}</span>);
        remaining = remaining.slice(opMatch[0].length);
        continue;
      }

      // Brackets
      const bracketMatch = remaining.match(/^[(){}\[\]]/);
      if (bracketMatch) {
        tokens.push(<span key={key++} className="text-slate-400">{bracketMatch[0]}</span>);
        remaining = remaining.slice(1);
        continue;
      }

      // Default: single character
      tokens.push(<span key={key++} className="text-slate-300">{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return tokens;
  };

  return lines.map((line, i) => (
    <div key={i} className="table-row">
      <span className="table-cell pr-4 text-right text-slate-600 select-none w-8 text-xs">
        {i + 1}
      </span>
      <span className="table-cell">{tokenize(line)}</span>
    </div>
  ));
}

// ============================================================================
// CODE BLOCK COMPONENT
// ============================================================================

function CodeBlock({ language = "typescript", title, children }: {
  language?: string;
  title?: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);
  const code = children.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = useMemo(() => highlightSyntax(code, language), [code, language]);

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700/50 bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          {title && (
            <span className="text-xs font-medium text-slate-400 ml-2">{title}</span>
          )}
          {!title && (
            <span className="text-xs text-slate-500 ml-2">{language}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-xs transition-all",
            copied ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          )}
        >
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      {/* Code */}
      <div className="p-3 overflow-x-auto text-sm font-mono leading-relaxed">
        <div className="table w-full">{highlighted}</div>
      </div>
    </div>
  );
}

// ============================================================================
// CALLOUT COMPONENTS
// ============================================================================

const calloutConfig: Record<CalloutType, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colors: string;
  label: string;
}> = {
  definition: { icon: BookOpen, colors: "border-violet-500/40 bg-violet-500/5", label: "Definition" },
  warning: { icon: AlertTriangle, colors: "border-amber-500/40 bg-amber-500/5", label: "Warning" },
  tip: { icon: Lightbulb, colors: "border-emerald-500/40 bg-emerald-500/5", label: "Tip" },
  info: { icon: Info, colors: "border-sky-500/40 bg-sky-500/5", label: "Note" },
  example: { icon: Sparkles, colors: "border-pink-500/40 bg-pink-500/5", label: "Example" },
  note: { icon: Target, colors: "border-slate-500/40 bg-slate-500/5", label: "Note" },
  protip: { icon: Zap, colors: "border-orange-500/40 bg-orange-500/5", label: "Pro Tip" },
  checkpoint: { icon: Target, colors: "border-cyan-500/40 bg-cyan-500/5", label: "Checkpoint" },
};

function Callout({ type, title, children }: { type: CalloutType; title?: string; children: React.ReactNode }) {
  const config = calloutConfig[type] || calloutConfig.info;
  const Icon = config.icon;

  return (
    <div className={cn("my-4 p-4 rounded-lg border-l-4", config.colors)}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="flex-shrink-0 mt-0.5 opacity-70" />
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-sm mb-1">{title}</div>}
          <div className="text-sm text-[var(--forge-text-secondary)] [&>p]:mb-2 [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KEYPOINTS COMPONENT
// ============================================================================

function KeypointsBlock({ points, title }: { points: string[]; title?: string }) {
  return (
    <div className="my-6 p-5 rounded-xl bg-gradient-to-br from-[var(--ember)]/5 to-orange-500/5 border border-[var(--ember)]/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[var(--ember)]/10 flex items-center justify-center">
          <Zap size={16} className="text-[var(--ember)]" />
        </div>
        <h4 className="text-base font-semibold text-[var(--forge-text-primary)]">
          {title || "Key Points"}
        </h4>
      </div>
      <ul className="space-y-2.5">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-[var(--forge-text-secondary)]">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--ember)]/15 flex items-center justify-center mt-0.5">
              <span className="text-[10px] font-bold text-[var(--ember)]">{i + 1}</span>
            </span>
            <span className="leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// COMPARISON COMPONENT
// ============================================================================

function ComparisonBlock({ title, leftLabel, rightLabel, leftContent, rightContent, verdict }: {
  title?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftContent?: string;
  rightContent?: string;
  verdict?: string;
}) {
  return (
    <div className="my-6 rounded-xl border border-slate-700/50 overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-2">
          <GitCompare size={16} className="text-blue-400" />
          <span className="font-medium text-sm">{title}</span>
        </div>
      )}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
        {/* Left */}
        <div className="p-4">
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
            {leftLabel || "Before"}
          </div>
          <div className="text-sm">
            <LessonMarkdownInner content={leftContent || ""} />
          </div>
        </div>
        {/* Right */}
        <div className="p-4 bg-emerald-500/5">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            {rightLabel || "After"}
          </div>
          <div className="text-sm">
            <LessonMarkdownInner content={rightContent || ""} />
          </div>
        </div>
      </div>
      {verdict && (
        <div className="px-4 py-3 bg-blue-500/5 border-t border-slate-700/50">
          <div className="flex items-start gap-2 text-sm">
            <ArrowRight size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <span className="text-[var(--forge-text-secondary)]">{verdict}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STEPS COMPONENT
// ============================================================================

function StepsBlock({ title, steps }: { title?: string; steps: { title: string; content: string }[] }) {
  return (
    <div className="my-6 rounded-xl border border-slate-700/50 overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-2">
          <ListOrdered size={16} className="text-violet-400" />
          <span className="font-medium text-sm">{title}</span>
        </div>
      )}
      <div className="divide-y divide-slate-700/30">
        {steps.map((step, i) => (
          <div key={i} className="p-4 flex gap-4">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-violet-400">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm mb-2">{step.title}</div>
              <div className="text-sm text-[var(--forge-text-secondary)]">
                <LessonMarkdownInner content={step.content} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// REALWORLD COMPONENT
// ============================================================================

function RealworldBlock({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
      <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
        <Globe size={16} className="text-emerald-400" />
        <span className="font-medium text-sm text-emerald-300">{title || "Real-World Example"}</span>
      </div>
      <div className="p-4 text-sm">{children}</div>
    </div>
  );
}

// ============================================================================
// PITFALL COMPONENT
// ============================================================================

function PitfallBlock({ title, wrongContent, rightContent, whyContent }: {
  title?: string;
  wrongContent?: string;
  rightContent?: string;
  whyContent?: string;
}) {
  return (
    <div className="my-6 rounded-xl border border-red-500/30 overflow-hidden">
      <div className="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
        <AlertCircle size={16} className="text-red-400" />
        <span className="font-medium text-sm text-red-300">{title || "Common Pitfall"}</span>
      </div>
      <div className="divide-y divide-slate-700/30">
        {wrongContent && (
          <div className="p-4 bg-red-500/5">
            <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">✗ Wrong</div>
            <LessonMarkdownInner content={wrongContent} />
          </div>
        )}
        {rightContent && (
          <div className="p-4 bg-emerald-500/5">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">✓ Correct</div>
            <LessonMarkdownInner content={rightContent} />
          </div>
        )}
        {whyContent && (
          <div className="p-4">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Why?</div>
            <div className="text-sm text-[var(--forge-text-secondary)]">{whyContent}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DEEPDIVE COMPONENT
// ============================================================================

function DeepdiveBlock({ title, children }: { title?: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-6 rounded-xl border border-slate-600/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-slate-800/30 flex items-center gap-2 text-left hover:bg-slate-800/50 transition-colors"
      >
        <Microscope size={16} className="text-cyan-400" />
        <span className="font-medium text-sm flex-1">{title || "Deep Dive"}</span>
        <span className="text-xs text-slate-500">{expanded ? "Hide" : "Show"}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 text-sm border-t border-slate-700/50">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MARKDOWN COMPONENTS
// ============================================================================

// Helper to generate heading IDs
function generateHeadingId(children: React.ReactNode): string {
  const text = React.Children.toArray(children)
    .map(child => typeof child === "string" ? child : "")
    .join("");
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const markdownComponents = {
  h2: ({ children }: { children: React.ReactNode }) => {
    const id = generateHeadingId(children);
    return (
      <h2 id={id} className="text-xl font-bold text-[var(--forge-text-primary)] mt-8 mb-3 flex items-center gap-2 scroll-mt-20">
        <span className="w-1 h-5 bg-[var(--ember)] rounded-full" />
        {children}
      </h2>
    );
  },
  h3: ({ children }: { children: React.ReactNode }) => {
    const id = generateHeadingId(children);
    return (
      <h3 id={id} className="text-lg font-semibold text-[var(--forge-text-primary)] mt-6 mb-2 scroll-mt-20">
        {children}
      </h3>
    );
  },
  h4: ({ children }: { children: React.ReactNode }) => {
    const id = generateHeadingId(children);
    return (
      <h4 id={id} className="text-base font-semibold text-[var(--forge-text-primary)] mt-4 mb-2 scroll-mt-20">
        {children}
      </h4>
    );
  },
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="text-[var(--forge-text-secondary)] leading-relaxed mb-3 text-sm">
      {children}
    </p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="space-y-1.5 mb-4 ml-4">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="space-y-1.5 mb-4 ml-4 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-sm text-[var(--forge-text-secondary)] leading-relaxed flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ember)]/60 mt-2 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-2 border-[var(--ember)]/40 pl-4 my-4 text-sm italic text-[var(--forge-text-muted)]">
      {children}
    </blockquote>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-[var(--forge-text-primary)]">{children}</strong>
  ),
  code: ({ inline, className, children }: { inline?: boolean; className?: string; children: React.ReactNode }) => {
    const codeString = String(children);
    if (inline || (!codeString.includes('\n') && !className?.startsWith('language-'))) {
      return (
        <code className="px-1.5 py-0.5 bg-[var(--ember)]/10 text-[var(--ember)] rounded text-[0.85em] font-mono">
          {children}
        </code>
      );
    }
    const language = className?.replace("language-", "") || "typescript";
    return <CodeBlock language={language}>{codeString.replace(/\n$/, "")}</CodeBlock>;
  },
  pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href} className="text-[var(--ember)] hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  hr: () => <hr className="my-6 border-slate-700/50" />,
};

// ============================================================================
// DIRECTIVE PARSER
// ============================================================================

function parseContent(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];

  // Regex to match all directive types
  const directiveRegex = /:::(callout|code|comparison|steps|realworld|pitfall|deepdive|tabs|animated|keypoints|protip|checkpoint|definition|tip|warning|info|example|note)(?:\[([^\]]*)\])?\n([\s\S]*?):::/g;

  let lastIndex = 0;
  let match;

  while ((match = directiveRegex.exec(content)) !== null) {
    // Add markdown before directive
    if (match.index > lastIndex) {
      const before = content.slice(lastIndex, match.index).trim();
      if (before) blocks.push({ type: "markdown", content: before });
    }

    const directiveType = match[1];
    const attrs = match[2] || "";
    const innerContent = match[3].trim();

    // Parse attributes
    const getAttr = (name: string) => {
      const m = attrs.match(new RegExp(`${name}="([^"]+)"`));
      return m?.[1];
    };

    if (directiveType === "code") {
      blocks.push({
        type: "code",
        language: getAttr("language") || "typescript",
        title: getAttr("title"),
        content: innerContent,
      });
    } else if (directiveType === "comparison") {
      // Parse LEFT: ... RIGHT: ... VERDICT: ...
      const leftMatch = innerContent.match(/LEFT:\s*([\s\S]*?)(?=RIGHT:|$)/);
      const rightMatch = innerContent.match(/RIGHT:\s*([\s\S]*?)(?=VERDICT:|$)/);
      const verdictMatch = innerContent.match(/VERDICT:\s*([\s\S]*?)$/);

      blocks.push({
        type: "comparison",
        title: getAttr("title"),
        leftLabel: getAttr("left"),
        rightLabel: getAttr("right"),
        leftContent: leftMatch?.[1]?.trim(),
        rightContent: rightMatch?.[1]?.trim(),
        verdict: verdictMatch?.[1]?.trim(),
        content: "",
      });
    } else if (directiveType === "steps") {
      // Parse Step N: ...
      const stepRegex = /Step (\d+):\s*([^\n]*)\n([\s\S]*?)(?=Step \d+:|$)/g;
      const steps: { title: string; content: string }[] = [];
      let stepMatch;
      while ((stepMatch = stepRegex.exec(innerContent)) !== null) {
        steps.push({ title: stepMatch[2].trim(), content: stepMatch[3].trim() });
      }
      blocks.push({ type: "steps", title: getAttr("title"), steps, content: "" });
    } else if (directiveType === "pitfall") {
      // Parse WRONG: ... RIGHT: ... WHY: ...
      const wrongMatch = innerContent.match(/WRONG:\s*([\s\S]*?)(?=RIGHT:|$)/);
      const rightMatch = innerContent.match(/RIGHT:\s*([\s\S]*?)(?=WHY:|$)/);
      const whyMatch = innerContent.match(/WHY:\s*([\s\S]*?)$/);

      blocks.push({
        type: "pitfall",
        title: getAttr("title"),
        wrongContent: wrongMatch?.[1]?.trim(),
        rightContent2: rightMatch?.[1]?.trim(),
        whyContent: whyMatch?.[1]?.trim(),
        content: "",
      });
    } else if (directiveType === "realworld") {
      blocks.push({ type: "realworld", title: getAttr("title"), content: innerContent });
    } else if (directiveType === "deepdive") {
      blocks.push({ type: "deepdive", title: getAttr("title"), content: innerContent });
    } else if (directiveType === "tabs") {
      // Parse TAB: Label ... sections
      // Format: TAB: Label\n```language\ncode\n```
      const tabRegex = /TAB:\s*([^\n]+)\n```(\w+)?\n([\s\S]*?)```/g;
      const tabs: CodeTab[] = [];
      let tabMatch;
      while ((tabMatch = tabRegex.exec(innerContent)) !== null) {
        tabs.push({
          label: tabMatch[1].trim(),
          language: tabMatch[2] || "typescript",
          code: tabMatch[3].trim(),
        });
      }
      blocks.push({ type: "tabs", title: getAttr("title"), tabs, content: "" });
    } else if (directiveType === "animated") {
      // Extract code from markdown code fence
      const codeMatch = innerContent.match(/```(\w+)?\n([\s\S]*?)```/);
      const code = codeMatch?.[2]?.trim() || innerContent;
      const language = codeMatch?.[1] || getAttr("language") || "typescript";
      blocks.push({
        type: "animated",
        title: getAttr("title"),
        description: getAttr("description"),
        language,
        content: code,
      });
    } else if (directiveType === "keypoints") {
      // Parse bullet points from content
      const points = innerContent
        .split("\n")
        .map(line => line.replace(/^[-*]\s*/, "").trim())
        .filter(line => line.length > 0);
      blocks.push({
        type: "keypoints",
        title: getAttr("title"),
        keypoints: points,
        content: "",
      });
    } else if (directiveType === "protip" || directiveType === "checkpoint") {
      // Handle as callout types
      blocks.push({
        type: "callout",
        calloutType: directiveType as CalloutType,
        title: getAttr("title"),
        content: innerContent,
      });
    } else if (directiveType === "callout") {
      const calloutType = (getAttr("type") || "info") as CalloutType;
      blocks.push({ type: "callout", calloutType, title: getAttr("title"), content: innerContent });
    } else {
      // Simple callouts (:::tip, :::warning, etc.)
      blocks.push({
        type: "callout",
        calloutType: directiveType as CalloutType,
        title: getAttr("title"),
        content: innerContent,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining content
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) blocks.push({ type: "markdown", content: remaining });
  }

  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: "markdown", content: content.trim() });
  }

  return blocks;
}

// ============================================================================
// INNER RENDERER (for nested content)
// ============================================================================

function LessonMarkdownInner({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
      {content}
    </ReactMarkdown>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LessonMarkdown({ content, className }: { content: string; className?: string }) {
  const blocks = useMemo(() => parseContent(content), [content]);

  return (
    <div className={cn("lesson-content", className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "callout":
            return (
              <Callout key={i} type={block.calloutType || "info"} title={block.title}>
                <LessonMarkdownInner content={block.content} />
              </Callout>
            );
          case "code":
            return <CodeBlock key={i} language={block.language} title={block.title}>{block.content}</CodeBlock>;
          case "comparison":
            return (
              <ComparisonBlock
                key={i}
                title={block.title}
                leftLabel={block.leftLabel}
                rightLabel={block.rightLabel}
                leftContent={block.leftContent}
                rightContent={block.rightContent}
                verdict={block.verdict}
              />
            );
          case "steps":
            return <StepsBlock key={i} title={block.title} steps={block.steps || []} />;
          case "realworld":
            return (
              <RealworldBlock key={i} title={block.title}>
                <LessonMarkdownInner content={block.content} />
              </RealworldBlock>
            );
          case "pitfall":
            return (
              <PitfallBlock
                key={i}
                title={block.title}
                wrongContent={block.wrongContent}
                rightContent={block.rightContent2}
                whyContent={block.whyContent}
              />
            );
          case "deepdive":
            return (
              <DeepdiveBlock key={i} title={block.title}>
                <LessonMarkdownInner content={block.content} />
              </DeepdiveBlock>
            );
          case "tabs":
            return (
              <TabbedCode
                key={i}
                title={block.title}
                tabs={block.tabs || []}
              />
            );
          case "animated":
            return (
              <AnimatedCode
                key={i}
                code={block.content}
                title={block.title}
                description={block.description}
                language={block.language}
              />
            );
          case "keypoints":
            return (
              <KeypointsBlock
                key={i}
                points={block.keypoints || []}
                title={block.title}
              />
            );
          default:
            return <LessonMarkdownInner key={i} content={block.content} />;
        }
      })}
    </div>
  );
}

export default LessonMarkdown;
