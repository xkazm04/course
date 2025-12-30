'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useConceptEntanglement } from '../../lib/useConceptEntanglement'
import { fadeIn, scaleIn } from '@/app/shared/lib/animations'
import type { CascadeVisualizationProps } from './types'

export function CascadeVisualization({ conceptId, className = '' }: CascadeVisualizationProps) {
  const { graph, findRootCause, analyzeForwardImpact } = useConceptEntanglement()
  const concept = graph.nodes.get(conceptId)

  const rootCauses = useMemo(() => findRootCause(conceptId), [findRootCause, conceptId])
  const forwardImpact = useMemo(() => analyzeForwardImpact(conceptId), [analyzeForwardImpact, conceptId])

  if (!concept) return null

  return (
    <motion.div
      {...fadeIn}
      className={`rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-anvil)]/50 p-4 ${className}`}
      data-testid="cascade-visualization"
    >
      <Header />
      {rootCauses.rootCauses.length > 0 && (
        <RootCausesSection causes={rootCauses.rootCauses} graph={graph} />
      )}
      <CurrentConceptBadge title={concept.title} />
      {forwardImpact.affectedConcepts.length > 0 && (
        <ForwardImpactSection impacts={forwardImpact.affectedConcepts} graph={graph} />
      )}
      <Summary
        rootCauseCount={rootCauses.rootCauses.length}
        atRiskCount={forwardImpact.totalAtRisk}
      />
    </motion.div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Zap className="w-5 h-5 text-[var(--forge-warning)]" />
      <h3 className="font-semibold text-[var(--forge-text-primary)]">Cascade Effect Analysis</h3>
    </div>
  )
}

interface RootCausesSectionProps {
  causes: Array<{ conceptId: string; severity: string }>
  graph: { nodes: Map<string, { title: string }> }
}

function RootCausesSection({ causes, graph }: RootCausesSectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--forge-error)]/50 to-transparent" />
        <span className="text-xs text-[var(--forge-text-muted)]">← Root Causes</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {causes.map((cause) => {
          const node = graph.nodes.get(cause.conceptId)
          return <CauseBadge key={cause.conceptId} title={node?.title ?? cause.conceptId} severity={cause.severity} />
        })}
      </div>
    </div>
  )
}

function CauseBadge({ title, severity }: { title: string; severity: string }) {
  const classes =
    severity === 'critical' ? 'bg-[var(--forge-error)]/20 border-[var(--forge-error)]/50 text-[var(--forge-error)]'
    : severity === 'major' ? 'bg-[var(--ember)]/20 border-[var(--ember)]/50 text-[var(--ember)]'
    : 'bg-[var(--forge-warning)]/20 border-[var(--forge-warning)]/50 text-[var(--forge-warning)]'

  return (
    <motion.div {...scaleIn} className={`px-3 py-1.5 rounded-lg border ${classes}`}>
      <span className="text-sm">{title}</span>
    </motion.div>
  )
}

function CurrentConceptBadge({ title }: { title: string }) {
  return (
    <div className="flex justify-center my-4">
      <div className="px-4 py-2 rounded-xl bg-[var(--ember)]/20 border-2 border-[var(--ember)]/50">
        <span className="text-[var(--ember)] font-medium">{title}</span>
      </div>
    </div>
  )
}

interface ForwardImpactSectionProps {
  impacts: Array<{ conceptId: string; impactLevel: string; estimatedScoreReduction: number }>
  graph: { nodes: Map<string, { title: string }> }
}

function ForwardImpactSection({ impacts, graph }: ForwardImpactSectionProps) {
  const visibleImpacts = impacts.slice(0, 8)
  const remainingCount = impacts.length - 8

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-[var(--forge-text-muted)]">Future Impact →</span>
        <div className="flex-1 h-px bg-gradient-to-l from-[var(--forge-warning)]/50 to-transparent" />
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleImpacts.map((impact) => {
          const node = graph.nodes.get(impact.conceptId)
          return (
            <ImpactBadge
              key={impact.conceptId}
              title={node?.title ?? impact.conceptId}
              impactLevel={impact.impactLevel}
              reduction={impact.estimatedScoreReduction}
            />
          )
        })}
        {remainingCount > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-[var(--forge-bg-elevated)]/50 text-[var(--forge-text-muted)] text-sm">
            +{remainingCount} more
          </div>
        )}
      </div>
    </div>
  )
}

function ImpactBadge({
  title, impactLevel, reduction
}: {
  title: string; impactLevel: string; reduction: number
}) {
  const classes =
    impactLevel === 'high' ? 'bg-[var(--forge-error)]/10 border-[var(--forge-error)]/30 text-[var(--forge-error)]'
    : impactLevel === 'medium' ? 'bg-[var(--forge-warning)]/10 border-[var(--forge-warning)]/30 text-[var(--forge-warning)]'
    : 'bg-[var(--forge-bg-elevated)]/10 border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)]'

  return (
    <motion.div {...scaleIn} className={`px-3 py-1.5 rounded-lg border ${classes}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{title}</span>
        <span className="text-xs opacity-60">-{reduction}%</span>
      </div>
    </motion.div>
  )
}

function Summary({ rootCauseCount, atRiskCount }: { rootCauseCount: number; atRiskCount: number }) {
  return (
    <div className="mt-6 pt-4 border-t border-[var(--forge-border-subtle)] grid grid-cols-2 gap-4 text-center">
      <div>
        <div className="text-2xl font-bold text-[var(--forge-error)]">{rootCauseCount}</div>
        <div className="text-xs text-[var(--forge-text-muted)]">Root causes found</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-[var(--forge-warning)]">{atRiskCount}</div>
        <div className="text-xs text-[var(--forge-text-muted)]">Future concepts at risk</div>
      </div>
    </div>
  )
}
