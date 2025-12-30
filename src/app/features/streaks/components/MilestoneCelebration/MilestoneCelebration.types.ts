export interface MilestoneCelebrationProps {
  milestone: number | null
  onClose: () => void
  className?: string
}

export interface MilestoneConfig {
  title: string
  description: string
  reward: string
  color: string
}

export interface CelebrationModalProps {
  milestone: number
  config: MilestoneConfig
  onClose: () => void
  className?: string
}
