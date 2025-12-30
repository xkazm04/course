'use client'

/**
 * ChapterClassicVariants - Chapter View Component
 *
 * Consolidated view combining the best of all design variants:
 * - Studio's header with tabs (Lesson, Playground, Homework)
 * - Elegant's clean layout and typography
 * - Discovery's compact sidebar sections (Resources, Branches, Videos)
 */

import { ElegantVariant } from './ElegantVariant'
import { useChapterState } from '../lib/useChapterState'
import { COURSE_INFO, CHAPTER_SECTIONS } from '../lib/chapterData'

export interface ChapterClassicVariantsProps {
  /**
   * Custom class name for the container
   */
  className?: string
}

export function ChapterClassicVariants({ className }: ChapterClassicVariantsProps) {
  const chapterState = useChapterState({
    courseInfo: COURSE_INFO,
    sections: CHAPTER_SECTIONS,
    initialSection: 0,
    enableVideoControls: true,
  })

  return <ElegantVariant state={chapterState} className={className} />
}

/**
 * Standalone chapter component for direct use
 */
export function ChapterElegant(props: { className?: string }) {
  const chapterState = useChapterState({
    courseInfo: COURSE_INFO,
    sections: CHAPTER_SECTIONS,
    initialSection: 0,
    enableVideoControls: true,
  })

  return <ElegantVariant state={chapterState} className={props.className} />
}

export default ChapterClassicVariants
