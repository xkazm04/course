/**
 * Shared Types for Chapter Variants
 *
 * Common type definitions used across all design variants.
 */

import type { ChapterState } from '../../lib/useChapterState'

export interface ChapterVariantProps {
  state: ChapterState
  className?: string
}

export interface SectionCardProps {
  title: string
  content: string
  isActive: boolean
  isCompleted: boolean
  duration: string
  onClick: () => void
}

export interface VideoPlayerProps {
  currentTime: string
  totalTime: string
  progress: number
  isPlaying?: boolean
  onPlayPause?: () => void
  onSeek?: (progress: number) => void
}

export interface ProgressIndicatorProps {
  current: number
  total: number
  showLabels?: boolean
}

export interface NavigationProps {
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
  previousLabel?: string
  nextLabel?: string
}
