'use client'

import { motion } from 'framer-motion'
import { RefreshCw, Target, Zap } from 'lucide-react'
import { useConceptEntanglement, useConceptState } from '../../lib/useConceptEntanglement'
import { scaleIn } from '@/app/shared/lib/animations'
import { STATE_STYLES, getProgressBarColor } from './config'
import type { ConceptNodeCardProps } from './types'

export function ConceptNodeCard({
  conceptId,
  showAnalysis = false,
  onStartRepair,
  className = '',
}: ConceptNodeCardProps) {
  const { graph } = useConceptEntanglement()
  const { entanglement, state, score, rootCauses, forwardImpact } = useConceptState(conceptId)

  const concept = graph.nodes.get(conceptId)
  if (!concept) return null

  const style = STATE_STYLES[state]
  const hasIssues = state === 'struggling' || state === 'collapsed'

  return (
    <motion.div
      {...scaleIn}
      className={`rounded-xl border ${style.border} ${style.bg} backdrop-blur-sm p-4 ${className}`}
      data-testid={`concept-node-card-${conceptId}`}
    >
      <CardHeader concept={concept} style={style} score={score} />
      <p className="text-sm text-[var(--forge-text-muted)] mb-3">{concept.description}</p>
      <ProgressBar score={score} state={state} />
      {showAnalysis && hasIssues && (
        <AnalysisSection
          rootCauses={rootCauses}
          forwardImpact={forwardImpact}
          graph={graph}
          onStartRepair={onStartRepair}
        />
      )}
      <CardStats attempts={entanglement?.attempts ?? 0} timeSpent={entanglement?.timeSpent ?? 0} />
    </motion.div>
  )
}

function CardHeader({
  concept,
  style,
  score,
}: {
  concept: { title: string }
  style: typeof STATE_STYLES[keyof typeof STATE_STYLES]
  score: number
}) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{style.emoji}</span>
        <div>
          <h4 className="font-medium text-[var(--forge-text-primary)]">{concept.title}</h4>
          <p className="text-xs text-[var(--forge-text-muted)]">{style.label}</p>
        </div>
      </div>
      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {score}%
      </div>
    </div>
  )
}

function ProgressBar({ score, state }: { score: number; state: string }) {
  return (
    <div className="h-1.5 bg-[var(--forge-bg-elevated)]/50 rounded-full overflow-hidden mb-3">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={`h-full rounded-full ${getProgressBarColor(state as keyof typeof STATE_STYLES)}`}
      />
    </div>
  )
}

interface AnalysisSectionProps {
  rootCauses: { rootCauses: Array<{ conceptId: string; severity: string }> } | null
  forwardImpact: { affectedConcepts: Array<{ conceptId: string }>; totalAtRisk: number } | null
  graph: { nodes: Map<string, { title: string }> }
  onStartRepair?: () => void
}

function AnalysisSection({ rootCauses, forwardImpact, graph, onStartRepair }: AnalysisSectionProps) {
  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-[var(--forge-border-subtle)]">
      {rootCauses && rootCauses.rootCauses.length > 0 && (
        <RootCausesSection causes={rootCauses.rootCauses} graph={graph} />
      )}
      {forwardImpact && forwardImpact.affectedConcepts.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-[var(--forge-warning)]" />
          <span className="text-xs font-medium text-[var(--forge-text-secondary)]">
            Future Impact: {forwardImpact.totalAtRisk} concepts at risk
          </span>
        </div>
      )}
      {onStartRepair && <RepairButton onClick={onStartRepair} />}
    </div>
  )
}

function RootCausesSection({
  causes,
  graph,
}: {
  causes: Array<{ conceptId: string; severity: string }>
  graph: { nodes: Map<string, { title: string }> }
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-[var(--forge-error)]" />
        <span className="text-xs font-medium text-[var(--forge-text-secondary)]">Root Causes Identified</span>
      </div>
      <div className="space-y-1">
        {causes.slice(0, 3).map((cause) => {
          const causeNode = graph.nodes.get(cause.conceptId)
          return (
            <div
              key={cause.conceptId}
              className="flex items-center justify-between p-2 rounded-lg bg-[var(--forge-error)]/10"
            >
              <span className="text-xs text-[var(--forge-text-secondary)]">{causeNode?.title ?? cause.conceptId}</span>
              <SeverityBadge severity={cause.severity} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const classes =
    severity === 'critical'
      ? 'bg-[var(--forge-error)]/30 text-[var(--forge-error)]'
      : severity === 'major'
      ? 'bg-[var(--ember)]/30 text-[var(--ember)]'
      : 'bg-[var(--forge-warning)]/30 text-[var(--forge-warning)]'

  return <span className={`text-xs px-1.5 py-0.5 rounded ${classes}`}>{severity}</span>
}

function RepairButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[var(--ember)]/20 hover:bg-[var(--ember)]/30 border border-[var(--ember)]/50 text-[var(--ember)] transition-colors"
      data-testid="start-repair-btn"
    >
      <RefreshCw className="w-4 h-4" />
      <span className="text-sm font-medium">Start Repair Path</span>
    </button>
  )
}

function CardStats({ attempts, timeSpent }: { attempts: number; timeSpent: number }) {
  return (
    <div className="flex items-center justify-between text-xs text-[var(--forge-text-muted)] mt-3">
      <span>{attempts} attempt{attempts !== 1 ? 's' : ''}</span>
      <span>{Math.round(timeSpent / 60000)} min spent</span>
    </div>
  )
}
