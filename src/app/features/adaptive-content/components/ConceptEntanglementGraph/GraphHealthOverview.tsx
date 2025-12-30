'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  TrendingDown,
} from 'lucide-react'
import { useGraphHealth } from '../../lib/useConceptEntanglement'
import { fadeInUp } from '@/app/shared/lib/animations'
import { StatBadge } from './StatBadge'
import { STATE_STYLES, getScoreClasses } from './config'
import type { GraphHealthOverviewProps } from './types'

export function GraphHealthOverview({
  className = '',
  onConceptClick,
}: GraphHealthOverviewProps) {
  const { score, stats, strugglingConcepts, hasIssues, criticalIssues } = useGraphHealth()
  const [showDetails, setShowDetails] = useState(false)

  const scoreClasses = getScoreClasses(score)

  return (
    <motion.div
      {...fadeInUp}
      className={`rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-anvil)]/50 backdrop-blur-sm p-4 ${className}`}
      data-testid="graph-health-overview"
    >
      <Header score={score} scoreClasses={scoreClasses} />
      <HealthBar score={score} scoreClasses={scoreClasses} />
      <StateDistribution stats={stats} />
      {hasIssues && <IssuesSection criticalIssues={criticalIssues} strugglingCount={stats.strugglingCount} />}
      {stats.recommendations.length > 0 && <Recommendations recommendations={stats.recommendations} />}
      <DetailsToggle showDetails={showDetails} onToggle={() => setShowDetails(!showDetails)} />
      <StrugglingConceptsList
        showDetails={showDetails}
        concepts={strugglingConcepts}
        onConceptClick={onConceptClick}
      />
    </motion.div>
  )
}

function Header({ score, scoreClasses }: { score: number; scoreClasses: ReturnType<typeof getScoreClasses> }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-[var(--ember)]" />
        <h3 className="font-semibold text-[var(--forge-text-primary)]">Knowledge Graph Health</h3>
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${scoreClasses.badge}`}>
        {score}%
      </div>
    </div>
  )
}

function HealthBar({ score, scoreClasses }: { score: number; scoreClasses: ReturnType<typeof getScoreClasses> }) {
  return (
    <div className="h-2 bg-[var(--forge-bg-elevated)]/50 rounded-full overflow-hidden mb-4">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.5 }}
        className={`h-full rounded-full ${scoreClasses.bar}`}
      />
    </div>
  )
}

function StateDistribution({ stats }: { stats: { masteredCount: number; stableCount: number; unstableCount: number } }) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <StatBadge label="Mastered" count={stats.masteredCount} color="purple" emoji="🚀" />
      <StatBadge label="Stable" count={stats.stableCount} color="emerald" emoji="✅" />
      <StatBadge label="Learning" count={stats.unstableCount} color="yellow" emoji="📚" />
    </div>
  )
}

function IssuesSection({ criticalIssues, strugglingCount }: { criticalIssues: number; strugglingCount: number }) {
  return (
    <div className="space-y-2 mb-4">
      {criticalIssues > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--forge-error)]/10 border border-[var(--forge-error)]/30">
          <AlertTriangle className="w-4 h-4 text-[var(--forge-error)]" />
          <span className="text-sm text-[var(--forge-error)]">
            {criticalIssues} concept{criticalIssues > 1 ? 's' : ''} need immediate review
          </span>
        </div>
      )}
      {strugglingCount > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--ember)]/10 border border-[var(--ember)]/30">
          <TrendingDown className="w-4 h-4 text-[var(--ember)]" />
          <span className="text-sm text-[var(--ember)]">
            {strugglingCount} concept{strugglingCount > 1 ? 's' : ''} need practice
          </span>
        </div>
      )}
    </div>
  )
}

function Recommendations({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="space-y-2">
      {recommendations.slice(0, 2).map((rec, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-muted)]">
          <Lightbulb className="w-4 h-4 text-[var(--forge-warning)] mt-0.5 flex-shrink-0" />
          <span>{rec}</span>
        </div>
      ))}
    </div>
  )
}

function DetailsToggle({ showDetails, onToggle }: { showDetails: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 mt-4 text-sm text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
      data-testid="graph-health-toggle-details"
    >
      {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      {showDetails ? 'Hide' : 'Show'} struggling concepts
    </button>
  )
}

interface StrugglingConceptsListProps {
  showDetails: boolean
  concepts: Array<{ concept: { id: string; title: string }; entanglement: { state: string; comprehensionScore: number } }>
  onConceptClick?: (conceptId: string) => void
}

function StrugglingConceptsList({ showDetails, concepts, onConceptClick }: StrugglingConceptsListProps) {
  return (
    <AnimatePresence>
      {showDetails && concepts.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 space-y-2 overflow-hidden"
        >
          {concepts.map(({ concept, entanglement }) => (
            <button
              key={concept.id}
              onClick={() => onConceptClick?.(concept.id)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-[var(--forge-bg-elevated)]/30 hover:bg-[var(--forge-bg-elevated)]/50 transition-colors text-left"
              data-testid={`struggling-concept-${concept.id}`}
            >
              <div className="flex items-center gap-2">
                <span>{STATE_STYLES[entanglement.state as keyof typeof STATE_STYLES]?.emoji}</span>
                <span className="text-sm text-[var(--forge-text-secondary)]">{concept.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${STATE_STYLES[entanglement.state as keyof typeof STATE_STYLES]?.text}`}>
                  {entanglement.comprehensionScore}%
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--forge-text-muted)]" />
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GraphHealthOverview
