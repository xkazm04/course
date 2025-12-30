import type { ConceptId, EntanglementState } from '../../lib/conceptEntanglementGraph'

export interface StateStyle {
  bg: string
  border: string
  text: string
  icon: string
  label: string
  emoji: string
}

export interface GraphHealthOverviewProps {
  className?: string
  onConceptClick?: (conceptId: ConceptId) => void
}

export interface ConceptNodeCardProps {
  conceptId: ConceptId
  showAnalysis?: boolean
  onStartRepair?: () => void
  className?: string
}

export interface RepairPathWizardProps {
  targetConceptId: ConceptId
  onComplete?: () => void
  onDismiss?: () => void
  className?: string
}

export interface CascadeVisualizationProps {
  conceptId: ConceptId
  className?: string
}

export interface StatBadgeProps {
  label: string
  count: number
  color: string
  emoji: string
}

export type { ConceptId, EntanglementState }
