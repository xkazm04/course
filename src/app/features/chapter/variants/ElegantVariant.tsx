'use client'

/**
 * ElegantVariant - Consolidated OpenForge Chapter View
 *
 * Combines the best elements:
 * - Studio header with tabs (Lesson, Playground, Homework)
 * - Elegant clean layout and typography
 * - Discovery's compact sidebar sections (Resources, Branches, Videos)
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, CheckCircle, Circle, ChevronLeft, ChevronRight,
  Terminal, FileCode, GitFork, Youtube, BookOpen, Link2,
  Volume2, Maximize2, Flame, ExternalLink
} from 'lucide-react'
import { cn } from '@/app/shared/lib/utils'
import { useReducedMotion } from '@/app/shared/lib/animations'
import type { ChapterVariantProps } from './shared/types'

type TabType = 'lesson' | 'playground' | 'homework'

export function ElegantVariant({ state, className }: ChapterVariantProps) {
  const shouldReduceMotion = useReducedMotion()
  const { courseInfo, sections, currentSection, setCurrentSection } = state
  const [activeTab, setActiveTab] = useState<TabType>('lesson')

  return (
    <div
      className={cn(
        'min-h-screen',
        'bg-[var(--forge-bg-daylight)]',
        className
      )}
      data-testid="chapter-elegant-variant"
    >
      {/* Header */}
      <header className={cn(
        'sticky top-0 z-40 backdrop-blur-xl',
        'bg-[var(--forge-bg-workshop)]/95',
        'border-b border-[var(--forge-border-subtle)]'
      )}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-forge flex items-center justify-center shadow-ember-sm">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--ember)] uppercase tracking-wider">
                  {courseInfo.courseName}
                </p>
                <h1 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                  {courseInfo.chapterTitle}
                </h1>
              </div>
            </div>
            <ProgressIndicator current={currentSection + 1} total={sections.length} />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 -mb-px">
            <TabButton
              active={activeTab === 'lesson'}
              onClick={() => setActiveTab('lesson')}
              icon={<Play className="w-4 h-4" />}
              label="Lesson"
            />
            <TabButton
              active={activeTab === 'playground'}
              onClick={() => setActiveTab('playground')}
              icon={<Terminal className="w-4 h-4" />}
              label="Playground"
            />
            <TabButton
              active={activeTab === 'homework'}
              onClick={() => setActiveTab('homework')}
              icon={<FileCode className="w-4 h-4" />}
              label="Homework"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Primary Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === 'lesson' && (
                <LessonTab
                  key="lesson"
                  sections={sections}
                  currentSection={currentSection}
                  setCurrentSection={setCurrentSection}
                  shouldReduceMotion={shouldReduceMotion}
                />
              )}
              {activeTab === 'playground' && <PlaygroundTab key="playground" />}
              {activeTab === 'homework' && <HomeworkTab key="homework" />}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <LearningBranches />
            <RelatedResources />
            <RelatedVideos />
          </aside>
        </div>
      </main>
    </div>
  )
}

/* === Tab Button === */
function TabButton({
  active, onClick, icon, label
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all',
        active
          ? 'border-[var(--ember)] text-[var(--ember)]'
          : 'border-transparent text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

/* === Progress Indicator === */
function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--forge-text-muted)]">{current}/{total}</span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-6 h-1 rounded-full transition-all',
              i < current ? 'bg-gradient-forge' : 'bg-[var(--forge-border-default)]'
            )}
          />
        ))}
      </div>
    </div>
  )
}

/* === Lesson Tab === */
function LessonTab({
  sections, currentSection, setCurrentSection, shouldReduceMotion
}: {
  sections: ChapterVariantProps['state']['sections']
  currentSection: number
  setCurrentSection: (i: number) => void
  shouldReduceMotion: boolean
}) {
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, y: -16 }}
      className="space-y-6"
    >
      {/* Video Player */}
      <VideoPlayer />

      {/* Chapter Description */}
      <div className="space-y-3">
        <p className="text-[var(--forge-text-secondary)] leading-relaxed">
          Custom Hooks are JavaScript functions that start with "use" and can call
          other Hooks. They let you extract component logic into reusable functions.
        </p>
      </div>

      {/* Section List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider">
          Sections
        </h3>
        {sections.map((section, index) => (
          <SectionItem
            key={section.id}
            title={section.title}
            duration={section.duration}
            isActive={index === currentSection}
            isCompleted={section.completed}
            onClick={() => setCurrentSection(index)}
          />
        ))}
      </div>

      {/* Navigation */}
      <Navigation
        hasPrevious={currentSection > 0}
        hasNext={currentSection < sections.length - 1}
        onPrevious={() => setCurrentSection(currentSection - 1)}
        onNext={() => setCurrentSection(currentSection + 1)}
      />
    </motion.div>
  )
}

/* === Video Player === */
function VideoPlayer() {
  return (
    <div className={cn(
      'relative aspect-video rounded-xl overflow-hidden',
      'bg-[var(--forge-bg-void)]',
      'shadow-lg'
    )}>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.button
          className="w-16 h-16 rounded-full bg-gradient-forge flex items-center justify-center shadow-ember-glow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-6 h-6 text-white ml-1" />
        </motion.button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <button className="text-white/80 hover:text-white transition-colors">
            <Play className="w-5 h-5" />
          </button>
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="w-1/3 h-full molten-progress rounded-full" />
          </div>
          <span className="text-xs text-white/60 font-mono">8:30 / 25:00</span>
          <button className="text-white/60 hover:text-white transition-colors">
            <Volume2 className="w-4 h-4" />
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* === Section Item === */
function SectionItem({
  title, duration, isActive, isCompleted, onClick
}: {
  title: string
  duration: string
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 rounded-lg transition-all',
        isActive
          ? 'bg-gradient-forge text-white shadow-ember'
          : cn(
              'bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]',
              'hover:border-[var(--forge-border-default)]'
            )
      )}
      whileHover={{ x: isActive ? 0 : 4 }}
    >
      <div className="flex items-center gap-3">
        {isCompleted ? (
          <CheckCircle className={cn('w-4 h-4', isActive ? 'text-white/80' : 'text-[var(--forge-success)]')} />
        ) : (
          <Circle className={cn('w-4 h-4', isActive ? 'text-white/60' : 'text-[var(--forge-text-muted)]')} />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', !isActive && 'text-[var(--forge-text-primary)]')}>
            {title}
          </p>
          <p className={cn('text-xs', isActive ? 'text-white/70' : 'text-[var(--forge-text-muted)]')}>
            {duration}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

/* === Navigation === */
function Navigation({
  hasPrevious, hasNext, onPrevious, onNext
}: {
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center gap-2 pt-4">
      <motion.button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all',
          hasPrevious
            ? 'border-[var(--forge-border-default)] text-[var(--forge-text-primary)] hover:border-[var(--ember)] hover:text-[var(--ember)]'
            : 'border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)] cursor-not-allowed opacity-50'
        )}
        whileHover={hasPrevious ? { y: -1 } : {}}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Previous</span>
      </motion.button>
      <motion.button
        onClick={onNext}
        disabled={!hasNext}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all',
          hasNext
            ? 'bg-gradient-forge text-white shadow-ember hover:shadow-ember-glow'
            : 'bg-[var(--forge-bg-bench)] text-[var(--forge-text-muted)] cursor-not-allowed'
        )}
        whileHover={hasNext ? { y: -1 } : {}}
      >
        <span className="text-sm font-medium">Next</span>
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  )
}

/* === Playground Tab === */
function PlaygroundTab() {
  const output = [
    '> Running tests...',
    '✓ Test 1: Initial value is set correctly',
    '✓ Test 2: Value persists after update',
    '✗ Test 3: Handles JSON parse errors',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="space-y-4"
    >
      {/* Code Editor */}
      <div className={cn(
        'rounded-xl overflow-hidden border',
        'border-[var(--forge-border-subtle)]'
      )}>
        <div className={cn(
          'flex items-center justify-between px-4 py-2',
          'bg-[var(--forge-bg-bench)] border-b border-[var(--forge-border-subtle)]'
        )}>
          <span className="text-sm font-mono text-[var(--forge-text-muted)]">useLocalStorage.ts</span>
          <motion.button
            className="px-3 py-1 rounded-md bg-gradient-forge text-white text-xs font-medium shadow-ember-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Run Tests
          </motion.button>
        </div>
        <pre className="p-4 overflow-x-auto bg-[var(--forge-bg-workshop)]">
          <code className="text-sm font-mono text-[var(--forge-text-primary)]">
            <span className="text-[var(--ember)]">function</span>{' '}
            <span className="text-[var(--gold)]">useLocalStorage</span>
            {'<T>(key: string, initialValue: T) {\n'}
            {'  '}
            <span className="text-[var(--ember)]">const</span>
            {' [storedValue, setStoredValue] = '}
            <span className="text-[var(--gold)]">useState</span>
            {'<T>(() => {\n'}
            {'    '}
            <span className="text-[var(--ember)]">try</span>
            {' {\n'}
            {'      '}
            <span className="text-[var(--ember)]">const</span>
            {' item = window.localStorage.getItem(key);\n'}
            {'      '}
            <span className="text-[var(--ember)]">return</span>
            {' item ? JSON.parse(item) : initialValue;\n'}
            {'    } '}
            <span className="text-[var(--ember)]">catch</span>
            {' (error) {\n'}
            {'      '}
            <span className="text-[var(--ember)]">return</span>
            {' initialValue;\n'}
            {'    }\n'}
            {'  });\n\n'}
            {'  '}
            <span className="text-[var(--forge-text-muted)]">// TODO: Implement setValue function</span>
            {'\n\n'}
            {'  '}
            <span className="text-[var(--ember)]">return</span>
            {' [storedValue, setStoredValue] as const;\n}'}
          </code>
        </pre>
      </div>

      {/* Test Output */}
      <div className="rounded-xl overflow-hidden border border-[var(--forge-border-subtle)]">
        <div className={cn(
          'px-4 py-2 text-sm font-medium flex items-center gap-2',
          'bg-[var(--forge-bg-void)] text-[var(--forge-text-primary)]'
        )}>
          <Terminal className="w-4 h-4 text-[var(--ember)]" />
          Test Output
        </div>
        <div className="p-4 bg-[var(--forge-bg-void)] font-mono text-sm space-y-1">
          {output.map((line, i) => (
            <div
              key={i}
              className={cn(
                line.includes('✓') && 'text-[var(--forge-success)]',
                line.includes('✗') && 'text-[var(--forge-error)]',
                line.includes('>') && 'text-[var(--forge-text-muted)]'
              )}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* === Homework Tab === */
function HomeworkTab() {
  const assignments = [
    { id: 1, title: 'Build useLocalStorage Hook', difficulty: 'Medium', dueDate: '2 days left', points: 100 },
    { id: 2, title: 'Create useDebounce Hook', difficulty: 'Easy', dueDate: '5 days left', points: 75 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="space-y-4"
    >
      <p className="text-sm text-[var(--forge-text-secondary)]">
        Complete these assignments to reinforce your learning and earn XP.
      </p>

      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className={cn(
            'p-4 rounded-xl border forge-card',
            'bg-[var(--forge-bg-workshop)] border-[var(--forge-border-subtle)]'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-[var(--forge-text-primary)] mb-1">
                {assignment.title}
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  assignment.difficulty === 'Easy'
                    ? 'bg-[var(--forge-success)]/10 text-[var(--forge-success)]'
                    : 'bg-[var(--ember)]/10 text-[var(--ember)]'
                )}>
                  {assignment.difficulty}
                </span>
                <span className="text-[var(--forge-text-muted)]">{assignment.dueDate}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gradient-forge">+{assignment.points}</span>
              <span className="text-xs text-[var(--forge-text-muted)] block">XP</span>
            </div>
          </div>
          <motion.button
            className="w-full py-2 rounded-lg bg-gradient-forge text-white font-medium text-sm shadow-ember"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Start Assignment
          </motion.button>
        </div>
      ))}
    </motion.div>
  )
}

/* === Sidebar: Learning Branches === */
function LearningBranches() {
  const branches = [
    { title: 'Performance Deep Dive', modules: 4 },
    { title: 'Real Project Examples', modules: 6 },
    { title: 'Advanced Patterns', modules: 5 },
  ]

  return (
    <div className={cn(
      'p-4 rounded-xl border forge-card',
      'bg-[var(--forge-bg-workshop)] border-[var(--forge-border-subtle)]'
    )}>
      <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
        <GitFork className="w-4 h-4 text-[var(--ember)]" />
        Learning Branches
      </h3>
      <div className="space-y-2">
        {branches.map((branch, i) => (
          <motion.a
            key={i}
            href="#"
            className={cn(
              'block p-2 rounded-lg transition-colors',
              'hover:bg-[var(--forge-bg-bench)]'
            )}
            whileHover={{ x: 4 }}
          >
            <p className="text-sm font-medium text-[var(--forge-text-primary)]">{branch.title}</p>
            <p className="text-xs text-[var(--forge-text-muted)]">{branch.modules} modules</p>
          </motion.a>
        ))}
      </div>
    </div>
  )
}

/* === Sidebar: Related Resources === */
function RelatedResources() {
  const resources = [
    { title: 'React Docs: Custom Hooks', source: 'react.dev' },
    { title: 'Hooks FAQ', source: 'React Blog' },
    { title: 'usehooks-ts Library', source: 'GitHub' },
  ]

  return (
    <div className={cn(
      'p-4 rounded-xl border forge-card',
      'bg-[var(--forge-bg-workshop)] border-[var(--forge-border-subtle)]'
    )}>
      <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[var(--ember)]" />
        Resources
      </h3>
      <div className="space-y-2">
        {resources.map((resource, i) => (
          <motion.a
            key={i}
            href="#"
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg transition-colors group',
              'hover:bg-[var(--forge-bg-bench)]'
            )}
            whileHover={{ x: 4 }}
          >
            <Link2 className="w-3 h-3 text-[var(--forge-text-muted)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--forge-text-primary)] truncate group-hover:text-[var(--ember)]">
                {resource.title}
              </p>
              <p className="text-xs text-[var(--forge-text-muted)]">{resource.source}</p>
            </div>
            <ExternalLink className="w-3 h-3 text-[var(--forge-text-muted)] opacity-0 group-hover:opacity-100" />
          </motion.a>
        ))}
      </div>
    </div>
  )
}

/* === Sidebar: Related Videos === */
function RelatedVideos() {
  const videos = [
    { title: 'React Hooks Explained', channel: 'Fireship', duration: '12:34' },
    { title: 'Custom Hooks Patterns', channel: 'Jack Herrington', duration: '24:15' },
  ]

  return (
    <div className={cn(
      'p-4 rounded-xl border forge-card',
      'bg-[var(--forge-bg-workshop)] border-[var(--forge-border-subtle)]'
    )}>
      <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
        <Youtube className="w-4 h-4 text-[var(--forge-error)]" />
        Related Videos
      </h3>
      <div className="space-y-2">
        {videos.map((video, i) => (
          <motion.a
            key={i}
            href="#"
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-colors group',
              'hover:bg-[var(--forge-bg-bench)]'
            )}
            whileHover={{ x: 4 }}
          >
            <div className={cn(
              'w-12 h-8 rounded flex items-center justify-center text-xs',
              'bg-[var(--forge-bg-bench)] text-[var(--forge-text-muted)]'
            )}>
              <Play className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--forge-text-primary)] truncate group-hover:text-[var(--ember)]">
                {video.title}
              </p>
              <p className="text-xs text-[var(--forge-text-muted)]">
                {video.channel} · {video.duration}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
