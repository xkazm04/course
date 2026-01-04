'use client'

/**
 * ElegantVariant - Showcase Chapter View (v2)
 *
 * Features:
 * - Wider layout with full-width Chapter Content
 * - Tab switcher for sections (no scrolling/expanding)
 * - Homework tab with CodePlayground integration
 * - Homework progress in sidebar
 * - Section completion toggles
 * - Reading progress indicator
 * - Enhanced code blocks
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Award, BookOpen, ChevronRight, Home, Keyboard,
  List, X, CheckCircle, Circle, PlayCircle, ChevronUp,
  Lightbulb, Settings, Moon, Sun, Type, Video, FileText,
  Code2, ChevronLeft, CheckSquare, Square, GitPullRequest,
  ClipboardList, Play, ArrowRight, ArrowLeft, Timer
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/app/shared/lib/utils'
import { VideoPlayer } from '../components/VideoPlayer'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { CodeBlock } from '@/app/shared/components'
import { CodePlayground } from '@/app/features/code-playground'
import type { CodeFile } from '@/app/features/code-playground'
import { CONTENT_METADATA, COURSE_INFO, CHAPTER_SECTIONS, type VideoVariant, type CourseInfo, type ChapterSection } from '../lib/chapterData'

// ============================================================================
// Props Types
// ============================================================================

export interface ElegantVariantProps {
  /** Course and chapter info - optional, uses defaults if not provided */
  courseInfo?: CourseInfo
  /** Chapter sections - optional, uses defaults if not provided */
  sections?: ChapterSection[]
  /** Additional class names */
  className?: string
}

// ============================================================================
// Reading Preferences
// ============================================================================

type FontSize = 'small' | 'medium' | 'large' | 'xl'
type ReadingMode = 'default' | 'focus' | 'night'

const fontSizeLabels: Record<FontSize, string> = {
  small: 'S', medium: 'M', large: 'L', xl: 'XL',
}

const readingModeLabels: Record<ReadingMode, { label: string; icon: typeof Sun }> = {
  default: { label: 'Default', icon: Sun },
  focus: { label: 'Focus', icon: Settings },
  night: { label: 'Night', icon: Moon },
}

function useReadingPreferences() {
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [readingMode, setReadingMode] = useState<ReadingMode>('default')

  const increaseFontSize = useCallback(() => {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'xl']
    const idx = sizes.indexOf(fontSize)
    if (idx < sizes.length - 1) setFontSize(sizes[idx + 1])
  }, [fontSize])

  const decreaseFontSize = useCallback(() => {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'xl']
    const idx = sizes.indexOf(fontSize)
    if (idx > 0) setFontSize(sizes[idx - 1])
  }, [fontSize])

  const toggleReadingMode = useCallback(() => {
    setReadingMode(m => m === 'default' ? 'focus' : m === 'focus' ? 'night' : 'default')
  }, [])

  return { fontSize, readingMode, setFontSize, setReadingMode, increaseFontSize, decreaseFontSize, toggleReadingMode }
}

// ============================================================================
// Homework State
// ============================================================================

interface HomeworkStatus {
  assigned: boolean
  prCreated: boolean
  completed: boolean
}

// ============================================================================
// Reading Controls Button
// ============================================================================

function ReadingControlsButton({ fontSize, readingMode, onFontSizeChange, onReadingModeChange }: {
  fontSize: FontSize
  readingMode: ReadingMode
  onFontSizeChange: (size: FontSize) => void
  onReadingModeChange: (mode: ReadingMode) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)] transition-colors text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
        title="Reading preferences"
      >
        <Type className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 w-56 p-3 bg-[var(--forge-bg-daylight)] border border-[var(--forge-border-subtle)] rounded-xl shadow-lg"
            >
              <div className="mb-3">
                <label className="text-xs font-medium text-[var(--forge-text-muted)] mb-2 block">Font Size</label>
                <div className="flex gap-1">
                  {(['small', 'medium', 'large', 'xl'] as FontSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => onFontSizeChange(size)}
                      className={cn(
                        'flex-1 py-1.5 text-sm font-medium rounded transition-colors',
                        fontSize === size
                          ? 'bg-[var(--ember)] text-white'
                          : 'bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-bench)]'
                      )}
                    >
                      {fontSizeLabels[size]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--forge-text-muted)] mb-2 block">Reading Mode</label>
                <div className="flex gap-1">
                  {(['default', 'focus', 'night'] as ReadingMode[]).map(mode => {
                    const Icon = readingModeLabels[mode].icon
                    return (
                      <button
                        key={mode}
                        onClick={() => onReadingModeChange(mode)}
                        className={cn(
                          'flex-1 py-1.5 text-sm font-medium rounded transition-colors flex items-center justify-center gap-1',
                          readingMode === mode
                            ? 'bg-[var(--ember)] text-white'
                            : 'bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-bench)]'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// Table of Contents Sidebar with Homework Section
// ============================================================================

interface TOCProps {
  sections: ChapterSection[]
  activeSection: number
  onNavigate: (sectionId: number) => void
  onToggleComplete: (sectionId: number) => void
  courseName: string
  progress: number
  homeworkStatus: HomeworkStatus
  onHomeworkStatusChange: (status: Partial<HomeworkStatus>) => void
}

function TableOfContents({
  sections, activeSection, onNavigate, onToggleComplete,
  courseName, progress, homeworkStatus, onHomeworkStatusChange
}: TOCProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeSection])

  if (isMinimized) {
    return (
      <motion.div
        initial={{ width: 48 }}
        animate={{ width: 48 }}
        className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 z-40"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 rounded-xl bg-[var(--forge-bg-daylight)] border border-[var(--forge-border-subtle)] shadow-lg flex items-center justify-center hover:bg-[var(--forge-bg-elevated)] transition-colors"
        >
          <List className="w-5 h-5 text-[var(--forge-text-muted)]" />
        </button>
        <div className="mt-2 w-12 h-1 rounded-full bg-[var(--forge-bg-elevated)] overflow-hidden">
          <div className="h-full bg-[var(--ember)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:block fixed left-4 top-20 w-72 z-40 max-h-[calc(100vh-6rem)]"
    >
      <div className="bg-[var(--forge-bg-elevated)]/90 backdrop-blur-xl border border-[var(--forge-border-subtle)] rounded-xl shadow-lg overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--forge-border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-[var(--forge-text-muted)]" />
            <span className="text-sm font-medium text-[var(--forge-text-primary)]">Contents</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--forge-text-muted)]">{Math.round(progress)}%</span>
            <button onClick={() => setIsMinimized(true)} className="p-1 rounded hover:bg-[var(--forge-bg-elevated)] transition-colors" title="Minimize">
              <ChevronUp className="w-4 h-4 text-[var(--forge-text-muted)]" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-[var(--forge-bg-elevated)] flex-shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--ember)] to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Course Context */}
        <div className="px-3 py-2 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30 flex-shrink-0">
          <div className="flex items-center gap-2 text-[var(--forge-text-muted)]">
            <BookOpen className="w-3 h-3" />
            <span className="text-xs font-medium uppercase tracking-wider">Course</span>
          </div>
          <p className="text-xs text-[var(--forge-text-secondary)] mt-1 truncate" title={courseName}>
            {courseName}
          </p>
        </div>

        {/* Sections */}
        <div className="p-2 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-0.5">
            {sections.map((section) => {
              const isActive = activeSection === section.id
              return (
                <div key={section.id} ref={isActive ? activeRef : undefined} className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleComplete(section.id)}
                    className="p-1 rounded hover:bg-[var(--forge-bg-elevated)] transition-colors flex-shrink-0"
                    title={section.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {section.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--forge-text-muted)] hover:text-[var(--ember)]" />
                    )}
                  </button>
                  <button
                    onClick={() => onNavigate(section.id)}
                    className={cn(
                      'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition-all truncate',
                      'hover:bg-[var(--forge-bg-elevated)]',
                      isActive && 'bg-[var(--ember)]/10 text-[var(--ember)]',
                      !isActive && 'text-[var(--forge-text-muted)]'
                    )}
                  >
                    <span className={cn('flex-1 truncate', section.completed && 'line-through opacity-60')}>
                      {section.title}
                    </span>
                    <span className="text-xs text-[var(--forge-text-muted)] flex-shrink-0">
                      {section.duration}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Homework Section */}
        <div className="p-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30 flex-shrink-0">
          <div className="flex items-center gap-2 text-[var(--forge-text-muted)] mb-3">
            <ClipboardList className="w-3 h-3" />
            <span className="text-xs font-medium uppercase tracking-wider">Homework</span>
          </div>
          <div className="space-y-2">
            {[
              { key: 'assigned' as const, label: 'Assigned', icon: Square },
              { key: 'prCreated' as const, label: 'PR Created', icon: GitPullRequest },
              { key: 'completed' as const, label: 'Completed', icon: CheckSquare },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onHomeworkStatusChange({ [key]: !homeworkStatus[key] })}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition-all hover:bg-[var(--forge-bg-elevated)]"
              >
                {homeworkStatus[key] ? (
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Square className="w-4 h-4 text-[var(--forge-text-muted)]" />
                )}
                <span className={cn(
                  'text-sm',
                  homeworkStatus[key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--forge-text-secondary)]'
                )}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="p-2 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30 flex-shrink-0">
          <p className="text-[10px] text-[var(--forge-text-muted)] text-center">
            <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]">J</kbd>
            <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] ml-1">K</kbd>
            {' '}navigate •{' '}
            <kbd className="px-1 py-0.5 rounded bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]">?</kbd>
            {' '}shortcuts
          </p>
        </div>
      </div>
    </motion.aside>
  )
}

// ============================================================================
// Reading Progress Bar
// ============================================================================

function ReadingProgressBar({ currentSection, totalSections, estimatedTimeRemaining }: {
  currentSection: number
  totalSections: number
  estimatedTimeRemaining: number
}) {
  const progress = totalSections > 0 ? ((currentSection) / totalSections) * 100 : 0

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--forge-bg-elevated)]">
      <motion.div
        className="h-full bg-gradient-to-r from-[var(--ember)] to-emerald-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
      {/* Time remaining indicator */}
      <div className="absolute right-4 top-2 flex items-center gap-1.5 text-xs text-[var(--forge-text-muted)] bg-[var(--forge-bg-daylight)]/80 backdrop-blur-sm px-2 py-1 rounded-full border border-[var(--forge-border-subtle)]">
        <Timer className="w-3 h-3" />
        <span>{estimatedTimeRemaining} min left</span>
      </div>
    </div>
  )
}

// ============================================================================
// Section Tab Content
// ============================================================================

interface SectionTabProps {
  section: ChapterSection
  isActive: boolean
}

function SectionTabContent({ section }: SectionTabProps) {
  const typeConfig = {
    video: { icon: Video, label: 'Video', color: 'text-red-500' },
    lesson: { icon: FileText, label: 'Lesson', color: 'text-blue-500' },
    interactive: { icon: Code2, label: 'Interactive', color: 'text-purple-500' },
    exercise: { icon: BookOpen, label: 'Exercise', color: 'text-amber-500' },
  }
  const config = typeConfig[section.type] || typeConfig.lesson
  const TypeIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              section.completed ? 'bg-emerald-500/10' : 'bg-[var(--forge-bg-elevated)]'
            )}>
              {section.completed ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <TypeIcon className={cn('w-5 h-5', config.color)} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">{section.title}</h2>
              <div className="flex items-center gap-3 text-sm text-[var(--forge-text-muted)]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {section.duration}
                </span>
                <span className={cn('flex items-center gap-1.5', config.color)}>
                  <TypeIcon className="w-3.5 h-3.5" />
                  {config.label}
                </span>
              </div>
            </div>
          </div>
        </div>
        {section.completed && (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Completed
          </span>
        )}
      </div>

      {/* Main Content - Markdown */}
      <div className="prose-section">
        <MarkdownRenderer content={section.content.description} />
      </div>

      {/* Code Block - Enhanced */}
      {section.content.code && (
        <div className="rounded-xl overflow-hidden border border-[var(--forge-border-subtle)]">
          <CodeBlock
            code={section.content.code}
            language="typescript"
            showLineNumbers={true}
            showCopy={true}
            showHeader={true}
          />
        </div>
      )}

      {/* Key Points */}
      {section.content.keyPoints && section.content.keyPoints.length > 0 && (
        <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 mb-4">
            <Lightbulb className="w-4 h-4" />
            Key Takeaways
          </h4>
          <ul className="space-y-3">
            {section.content.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-[var(--forge-text-secondary)]">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {idx + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Homework Tab with CodePlayground
// ============================================================================

const HOMEWORK_FILES: CodeFile[] = [
  {
    id: 'useDebounce.ts',
    name: 'useDebounce.ts',
    language: 'typescript',
    isEntry: true,
    content: `import { useState, useEffect } from 'react';

/**
 * useDebounce - Delays updating a value until after a specified delay
 *
 * Your task: Complete the implementation!
 *
 * Requirements:
 * - Accept a value and delay (in milliseconds)
 * - Return the debounced value
 * - Reset the timer when the input value changes
 * - Clean up the timer on unmount
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // TODO: Set up a timer to update debouncedValue after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // TODO: Return a cleanup function that clears the timer
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;`,
  },
  {
    id: 'App.tsx',
    name: 'App.tsx',
    language: 'tsx',
    content: `import React, { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

// Mock API search function
const searchAPI = async (query: string) => {
  console.log('Searching for:', query);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return ['Result 1', 'Result 2', 'Result 3'].filter(r =>
    r.toLowerCase().includes(query.toLowerCase())
  );
};

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce the search query by 500ms
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      setIsLoading(true);
      searchAPI(debouncedQuery).then(results => {
        setResults(results);
        setIsLoading(false);
      });
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Search Demo</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
        style={{
          padding: '10px',
          fontSize: '16px',
          width: '300px',
          borderRadius: '8px',
          border: '1px solid #ccc'
        }}
      />
      <p style={{ color: '#666', marginTop: '10px' }}>
        Debounced: {debouncedQuery || '(empty)'}
      </p>
      {isLoading && <p>Loading...</p>}
      <ul>
        {results.map((result, i) => (
          <li key={i}>{result}</li>
        ))}
      </ul>
    </div>
  );
}`,
  },
]

function HomeworkTab() {
  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Build useDebounce Hook</h2>
              <div className="flex items-center gap-3 text-sm text-[var(--forge-text-muted)]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  ~20 min
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                  Medium
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-gradient-forge">+100</span>
          <span className="text-xs text-[var(--forge-text-muted)] block">XP</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-xl bg-[var(--forge-bg-elevated)]/50 border border-[var(--forge-border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-2">Instructions</h3>
        <p className="text-sm text-[var(--forge-text-secondary)] mb-3">
          Implement a <code className="px-1.5 py-0.5 rounded bg-[var(--forge-bg-bench)] text-[var(--ember)] font-mono text-xs">useDebounce</code> hook
          that delays updating a value until after a specified time has passed since the last change.
        </p>
        <ul className="space-y-1 text-sm text-[var(--forge-text-secondary)]">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Accept a value and delay (in milliseconds)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Return the debounced value
          </li>
          <li className="flex items-center gap-2">
            <Circle className="w-3.5 h-3.5 text-[var(--forge-text-muted)]" />
            Reset the timer when the input value changes
          </li>
          <li className="flex items-center gap-2">
            <Circle className="w-3.5 h-3.5 text-[var(--forge-text-muted)]" />
            Clean up the timer on unmount
          </li>
        </ul>
      </div>

      {/* Code Playground */}
      <CodePlayground
        playgroundId="homework-useDebounce"
        initialFiles={HOMEWORK_FILES}
        title="useDebounce Implementation"
        showFileExplorer={true}
        height="500px"
      />
    </div>
  )
}

// ============================================================================
// Introduction Section
// ============================================================================

function Introduction({ content, keyTakeaways }: { content?: string; keyTakeaways?: string[] }) {
  if (!content && (!keyTakeaways || keyTakeaways.length === 0)) return null

  return (
    <div className="mb-8">
      {content && (
        <div className="prose-section mb-6">
          <MarkdownRenderer content={content} />
        </div>
      )}

      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="p-5 bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[var(--ember)]/10 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-[var(--ember)]" />
            </span>
            What you'll learn
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {keyTakeaways.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-[var(--forge-text-secondary)]">
                <span className="w-6 h-6 rounded-full bg-[var(--ember)]/10 text-[var(--ember)] flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {idx + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Quick Actions Bar
// ============================================================================

function QuickActionsBar({
  currentIndex,
  totalSections,
  onPrev,
  onNext,
  onMarkAllComplete,
  allCompleted
}: {
  currentIndex: number
  totalSections: number
  onPrev: () => void
  onNext: () => void
  onMarkAllComplete: () => void
  allCompleted: boolean
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-xl border border-[var(--forge-border-subtle)] rounded-full shadow-lg">
      <button
        onClick={onPrev}
        disabled={currentIndex <= 0}
        className="p-2 rounded-full hover:bg-[var(--forge-bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Previous section"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <span className="text-sm text-[var(--forge-text-muted)] px-3">
        {currentIndex + 1} / {totalSections}
      </span>

      <button
        onClick={onNext}
        disabled={currentIndex >= totalSections - 1}
        className="p-2 rounded-full hover:bg-[var(--forge-bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Next section"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[var(--forge-border-subtle)]" />

      <button
        onClick={onMarkAllComplete}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5',
          allCompleted
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:bg-[var(--ember)]/10 hover:text-[var(--ember)]'
        )}
      >
        <CheckCircle className="w-3.5 h-3.5" />
        {allCompleted ? 'All Done!' : 'Mark All Complete'}
      </button>
    </div>
  )
}

// ============================================================================
// Main ElegantVariant Component
// ============================================================================

export function ElegantVariant({
  courseInfo = COURSE_INFO,
  sections: initialSections = CHAPTER_SECTIONS,
  className
}: ElegantVariantProps) {

  // Mutable sections state for completion toggling
  const [sections, setSections] = useState(initialSections)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [showHomework, setShowHomework] = useState(false)
  const [isMobileTOCOpen, setIsMobileTOCOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [homeworkStatus, setHomeworkStatus] = useState<HomeworkStatus>({
    assigned: true,
    prCreated: false,
    completed: false,
  })

  const { fontSize, readingMode, setFontSize, setReadingMode, increaseFontSize, decreaseFontSize, toggleReadingMode } = useReadingPreferences()

  const contentMetadata = CONTENT_METADATA

  const videoVariants: VideoVariant[] = useMemo(() => {
    if (contentMetadata?.video_variants && contentMetadata.video_variants.length > 0) {
      return contentMetadata.video_variants
    }
    return [{
      id: 'placeholder',
      title: courseInfo.chapterTitle,
      searchQuery: `${courseInfo.courseName} ${courseInfo.chapterTitle} tutorial`,
      style: 'tutorial' as const,
    }]
  }, [contentMetadata?.video_variants, courseInfo])

  const completedCount = sections.filter(s => s.completed).length
  const progress = sections.length > 0 ? (completedCount / sections.length) * 100 : 0
  const allCompleted = completedCount === sections.length

  // Calculate estimated time remaining
  const estimatedTimeRemaining = useMemo(() => {
    return sections
      .slice(activeTabIndex)
      .filter(s => !s.completed)
      .reduce((acc, s) => acc + (parseInt(s.duration.replace(/\D/g, '')) || 5), 0)
  }, [sections, activeTabIndex])

  const activeSection = sections[activeTabIndex]

  // Toggle section completion
  const toggleComplete = useCallback((sectionId: number) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, completed: !s.completed } : s
    ))
  }, [])

  // Mark all complete
  const markAllComplete = useCallback(() => {
    setSections(prev => prev.map(s => ({ ...s, completed: true })))
  }, [])

  // Navigation
  const navigateToSection = useCallback((sectionId: number) => {
    const idx = sections.findIndex(s => s.id === sectionId)
    if (idx !== -1) {
      setActiveTabIndex(idx)
      setShowHomework(false)
    }
  }, [sections])

  const goToNext = useCallback(() => {
    if (activeTabIndex < sections.length - 1) {
      setActiveTabIndex(activeTabIndex + 1)
      setShowHomework(false)
    }
  }, [activeTabIndex, sections.length])

  const goToPrev = useCallback(() => {
    if (activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1)
      setShowHomework(false)
    }
  }, [activeTabIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'j':
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case 'k':
        case 'ArrowLeft':
          e.preventDefault()
          goToPrev()
          break
        case '?':
          e.preventDefault()
          setShowShortcuts(s => !s)
          break
        case '+':
        case '=':
          e.preventDefault()
          increaseFontSize()
          break
        case '-':
          e.preventDefault()
          decreaseFontSize()
          break
        case 'm':
          e.preventDefault()
          toggleReadingMode()
          break
        case 'h':
          e.preventDefault()
          setShowHomework(h => !h)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, increaseFontSize, decreaseFontSize, toggleReadingMode])

  const readingModeClass = readingMode === 'focus' ? 'reading-mode-focus' : readingMode === 'night' ? 'reading-mode-night' : ''
  const fontSizeClass = `reading-font-${fontSize}`

  return (
    <div
      className={cn('min-h-screen reading-transition pt-2', readingModeClass, className)}
      data-testid="chapter-elegant-variant"
    >

      {/* Table of Contents Sidebar */}
      <TableOfContents
        sections={sections}
        activeSection={activeSection?.id || 1}
        onNavigate={navigateToSection}
        onToggleComplete={toggleComplete}
        courseName={courseInfo.courseName}
        progress={progress}
        homeworkStatus={homeworkStatus}
        onHomeworkStatusChange={(partial) => setHomeworkStatus(prev => ({ ...prev, ...partial }))}
      />

      {/* Main Content - Full width within parent container */}
      <div className="w-full px-4 py-8 lg:pl-80 lg:pr-4">
        {/* Header with Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <nav className="flex items-center gap-2 text-sm text-[var(--forge-text-muted)]">
            <Link href="/showcase" className="hover:text-[var(--ember)] transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              Showcase
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--forge-text-secondary)]">{courseInfo.courseName}</span>
          </nav>
          <div className="flex items-center gap-2">
            <ReadingControlsButton
              fontSize={fontSize}
              readingMode={readingMode}
              onFontSizeChange={setFontSize}
              onReadingModeChange={setReadingMode}
            />
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)] transition-colors text-[var(--forge-text-muted)]"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Meta */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--forge-text-primary)] mb-3">
            {courseInfo.chapterTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
              <Clock className="w-4 h-4" />
              <span>{contentMetadata?.estimated_time_minutes || 45} min</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
              <BookOpen className="w-4 h-4" />
              <span>{sections.length} sections</span>
            </div>
            {contentMetadata?.difficulty && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                contentMetadata.difficulty === 'beginner' && 'bg-green-500/10 text-green-600 dark:text-green-400',
                contentMetadata.difficulty === 'intermediate' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                contentMetadata.difficulty === 'advanced' && 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}>
                {contentMetadata.difficulty}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-[var(--ember)]">
              <Award className="w-4 h-4" />
              <span>{completedCount}/{sections.length} completed</span>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <VideoPlayer variants={videoVariants} />
        </motion.div>

        {/* Introduction */}
        <Introduction
          content={contentMetadata?.introduction}
          keyTakeaways={contentMetadata?.key_takeaways}
        />

        {/* Chapter Content - Full width with tab switcher */}
        <div className={cn('reading-content max-w-none', fontSizeClass)}>
          <div className="bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm rounded-2xl border border-[var(--forge-border-subtle)] overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30 overflow-x-auto">
              {sections.map((section, idx) => {
                const isActive = idx === activeTabIndex && !showHomework
                const typeConfig = {
                  video: { icon: Video, color: 'text-red-500' },
                  lesson: { icon: FileText, color: 'text-blue-500' },
                  interactive: { icon: Code2, color: 'text-purple-500' },
                  exercise: { icon: BookOpen, color: 'text-amber-500' },
                }
                const config = typeConfig[section.type] || typeConfig.lesson
                const TypeIcon = config.icon

                return (
                  <button
                    key={section.id}
                    onClick={() => { setActiveTabIndex(idx); setShowHomework(false) }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                      isActive
                        ? 'border-[var(--ember)] text-[var(--ember)] bg-white/50 dark:bg-black/20'
                        : 'border-transparent text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)]/50'
                    )}
                  >
                    {section.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TypeIcon className={cn('w-4 h-4', isActive ? 'text-[var(--ember)]' : config.color)} />
                    )}
                    <span className="hidden sm:inline">{section.title}</span>
                    <span className="sm:hidden">{idx + 1}</span>
                  </button>
                )
              })}

              {/* Homework Tab */}
              <button
                onClick={() => setShowHomework(true)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ml-auto',
                  showHomework
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/5'
                    : 'border-transparent text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)]/50'
                )}
              >
                <Code2 className="w-4 h-4" />
                <span>Homework</span>
                {homeworkStatus.completed && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {showHomework ? (
                  <motion.div
                    key="homework"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HomeworkTab />
                  </motion.div>
                ) : activeSection && (
                  <motion.div
                    key={activeSection.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SectionTabContent section={activeSection} isActive={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Showcase Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center"
        >
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            This is a showcase of the chapter view component.
            <Link href="/forge" className="ml-1 underline hover:no-underline">
              Visit Forge
            </Link>
            {' '}to see real course content.
          </p>
        </motion.div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActionsBar
        currentIndex={activeTabIndex}
        totalSections={sections.length}
        onPrev={goToPrev}
        onNext={goToNext}
        onMarkAllComplete={markAllComplete}
        allCompleted={allCompleted}
      />

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcuts(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-[var(--forge-bg-elevated)]/95 backdrop-blur-xl border border-[var(--forge-border-subtle)] rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--forge-text-primary)]">Keyboard Shortcuts</h2>
                <button onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-[var(--forge-bg-elevated)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { key: 'J / →', desc: 'Next section' },
                  { key: 'K / ←', desc: 'Previous section' },
                  { key: 'H', desc: 'Toggle homework' },
                  { key: '+', desc: 'Increase font size' },
                  { key: '-', desc: 'Decrease font size' },
                  { key: 'M', desc: 'Toggle reading mode' },
                  { key: '?', desc: 'Toggle shortcuts' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[var(--forge-text-secondary)]">{desc}</span>
                    <kbd className="px-2 py-1 bg-[var(--forge-bg-elevated)] rounded text-[var(--forge-text-muted)] font-mono text-xs">{key}</kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ElegantVariant
