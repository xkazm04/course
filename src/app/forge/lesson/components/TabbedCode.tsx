"use client";

/**
 * TabbedCode - Switchable code variants for showing multiple approaches
 *
 * Usage in markdown:
 * :::tabs[title="Implementation Approaches"]
 * TAB: JavaScript
 * ```javascript
 * code here
 * ```
 * TAB: TypeScript
 * ```typescript
 * code here
 * ```
 * :::
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Check, Copy } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface CodeTab {
  label: string;
  language: string;
  code: string;
}

export interface TabbedCodeProps {
  title?: string;
  tabs: CodeTab[];
  className?: string;
}

// ============================================================================
// SYNTAX HIGHLIGHTING (matching HybridVariant)
// ============================================================================

type TokenType = "keyword" | "string" | "comment" | "number" | "function" | "type" | "operator" | "punctuation" | "default";

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
      /^(const|let|var|function|return|if|else|for|while|import|export|from|async|await|new|typeof|interface|type|extends|implements|class|public|private|protected|static|readonly)\b/
    );
    if (keywordMatch) {
      tokens.push({ text: keywordMatch[0], type: "keyword" });
      remaining = remaining.slice(keywordMatch[0].length);
      continue;
    }

    const typeMatch = remaining.match(/^(string|number|boolean|void|null|undefined|any|never|unknown|T|K|U|V)\b/);
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

    const funcMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\(|<[^>]*>\s*\()/);
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
// CODE LINE
// ============================================================================

function CodeLine({ lineNumber, tokens }: { lineNumber: number; tokens: { text: string; type: TokenType }[] }) {
  return (
    <div className="flex">
      <span className="w-10 text-right pr-4 select-none text-xs text-slate-600 font-mono">
        {lineNumber}
      </span>
      <span className="flex-1 whitespace-pre">
        {tokens.map((token, i) => (
          <span key={i} className={TOKEN_COLORS[token.type]}>
            {token.text}
          </span>
        ))}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TabbedCode({ title, tabs, className }: TabbedCodeProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeTab = tabs[activeIndex];

  const tokenizedLines = useMemo(() => {
    const lines = activeTab.code.trim().split("\n");
    return lines.map(tokenizeLine);
  }, [activeTab.code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab.code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("my-6 rounded-xl overflow-hidden border border-slate-700/50 bg-[#0d1117]", className)}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between bg-slate-800/50 border-b border-slate-700/50">
        {/* Tab buttons */}
        <div className="flex items-center">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                i === activeIndex
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab.label}
              {i === activeIndex && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ember)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Title and copy */}
        <div className="flex items-center gap-3 px-3">
          {title && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Code2 size={12} />
              <span>{title}</span>
            </div>
          )}
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
      </div>

      {/* Code content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="p-4 overflow-x-auto font-mono text-sm leading-6"
        >
          {tokenizedLines.map((tokens, i) => (
            <CodeLine key={i} lineNumber={i + 1} tokens={tokens} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Language badge */}
      <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700/30 flex items-center justify-between">
        <span className="text-xs text-slate-500">{activeTab.language}</span>
        <span className="text-xs text-slate-600">{tokenizedLines.length} lines</span>
      </div>
    </div>
  );
}
