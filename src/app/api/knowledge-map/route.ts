// @ts-nocheck
// ============================================================================
// Knowledge Map API
// GET /api/knowledge-map - Returns complete knowledge map data
// Transforms database data into KnowledgeMapData format
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LearningDomainId, DomainColorKey } from '@/app/shared/lib/learningDomains'
import type {
  MapNode,
  DomainNode,
  CourseNode,
  ChapterNode,
  SectionNode,
  MapConnection,
  NodeStatus,
  DifficultyLevel,
  SectionType
} from '@/app/features/knowledge-map/lib/types'

// ============================================================================
// Response Types
// ============================================================================

export interface KnowledgeMapAPIResponse {
  nodes: Record<string, MapNode>
  connections: MapConnection[]
  rootNodeIds: string[]
}

// ============================================================================
// Domain Mapping
// ============================================================================

const CATEGORY_TO_DOMAIN: Record<string, LearningDomainId> = {
  'development': 'frontend',
  'data-science': 'data',
  'cloud-devops': 'devops',
  'design': 'design',
  'business': 'professional'
}

const CATEGORY_COLORS: Record<string, DomainColorKey> = {
  'development': 'blue',
  'data-science': 'purple',
  'cloud-devops': 'cyan',
  'design': 'pink',
  'business': 'amber'
}

// ============================================================================
// Transformer Functions
// ============================================================================

function categoryToDomainNode(
  category: {
    id: string
    slug: string
    name: string
    description: string | null
    color: string | null
  },
  courseCount: number,
  totalHours: number,
  childIds: string[]
): DomainNode {
  const domainId = CATEGORY_TO_DOMAIN[category.slug] || 'frontend'
  const colorKey = CATEGORY_COLORS[category.slug] || 'blue'

  return {
    id: `domain-${category.slug}`,
    level: 'domain',
    name: category.name,
    description: category.description || '',
    status: 'available' as NodeStatus,
    progress: 0,
    parentId: null,
    childIds,
    color: colorKey,
    domainId,
    courseCount,
    totalHours,
    estimatedHours: totalHours
  }
}

function courseToCourseNode(
  course: {
    id: string
    slug: string
    title: string
    description: string | null
    difficulty: string
    estimated_hours: number
  },
  categorySlug: string,
  chapterCount: number,
  childIds: string[],
  skills: string[]
): CourseNode {
  const domainId = CATEGORY_TO_DOMAIN[categorySlug] || 'frontend'
  const colorKey = CATEGORY_COLORS[categorySlug] || 'blue'

  return {
    id: `course-${domainId}-${course.slug}`,
    level: 'course',
    name: course.title,
    description: course.description || '',
    status: 'available' as NodeStatus,
    progress: 0,
    parentId: `domain-${categorySlug}`,
    childIds,
    color: colorKey,
    domainId,
    difficulty: course.difficulty as DifficultyLevel,
    chapterCount,
    skills,
    estimatedHours: course.estimated_hours
  }
}

function chapterToChapterNode(
  chapter: {
    id: string
    slug: string
    title: string
    description: string | null
    estimated_minutes: number
    xp_reward: number
  },
  courseSlug: string,
  categorySlug: string,
  sectionCount: number,
  childIds: string[]
): ChapterNode {
  const domainId = CATEGORY_TO_DOMAIN[categorySlug] || 'frontend'
  const colorKey = CATEGORY_COLORS[categorySlug] || 'blue'
  const courseNodeId = `course-${domainId}-${courseSlug}`

  return {
    id: `chapter-${domainId}-${courseSlug}-${chapter.slug}`,
    level: 'chapter',
    name: chapter.title,
    description: chapter.description || '',
    status: 'available' as NodeStatus,
    progress: 0,
    parentId: courseNodeId,
    childIds,
    color: colorKey,
    domainId,
    courseId: courseNodeId,
    sectionCount,
    xpReward: chapter.xp_reward,
    durationMinutes: chapter.estimated_minutes,
    estimatedHours: Math.round(chapter.estimated_minutes / 60 * 10) / 10
  }
}

function sectionToSectionNode(
  section: {
    id: string
    slug: string
    title: string
    description: string | null
    content_type: string
    estimated_minutes: number
  },
  chapterSlug: string,
  courseSlug: string,
  categorySlug: string
): SectionNode {
  const domainId = CATEGORY_TO_DOMAIN[categorySlug] || 'frontend'
  const colorKey = CATEGORY_COLORS[categorySlug] || 'blue'
  const courseNodeId = `course-${domainId}-${courseSlug}`
  const chapterNodeId = `chapter-${domainId}-${courseSlug}-${chapterSlug}`

  return {
    id: `section-${domainId}-${courseSlug}-${chapterSlug}-${section.slug}`,
    level: 'section',
    name: section.title,
    description: section.description || '',
    status: 'available' as NodeStatus,
    progress: 0,
    parentId: chapterNodeId,
    childIds: [],
    color: colorKey,
    domainId,
    courseId: courseNodeId,
    chapterId: chapterNodeId,
    sectionType: section.content_type as SectionType,
    duration: `${section.estimated_minutes} min`,
    estimatedHours: Math.round(section.estimated_minutes / 60 * 10) / 10
  }
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const categorySlug = searchParams.get('category')
    const includeConnections = searchParams.get('connections') !== 'false'

    // Fetch all data in parallel
    const [
      categoriesResult,
      coursesResult,
      chaptersResult,
      sectionsResult,
      courseSkillsResult,
      connectionsResult
    ] = await Promise.all([
      // Categories
      supabase
        .from('categories')
        .select('*')
        .order('sort_order'),

      // Courses with topic -> subcategory -> category path
      supabase
        .from('courses')
        .select(`
          *,
          topic:topics!topic_id (
            id, slug,
            subcategory:subcategories!subcategory_id (
              id, slug,
              category:categories!category_id (
                id, slug
              )
            )
          )
        `)
        .eq('status', 'published'),

      // Chapters
      supabase
        .from('chapters')
        .select('*')
        .order('sort_order'),

      // Sections
      supabase
        .from('sections')
        .select('*')
        .order('sort_order'),

      // Course skills
      supabase
        .from('course_skills')
        .select(`
          course_id,
          skill:skills!skill_id (name)
        `),

      // Course connections
      includeConnections
        ? supabase
            .from('course_connections')
            .select('*')
        : Promise.resolve({ data: [] })
    ])

    const categories = categoriesResult.data || []
    const courses = coursesResult.data || []
    const chapters = chaptersResult.data || []
    const sections = sectionsResult.data || []
    const courseSkills = courseSkillsResult.data || []
    const dbConnections = connectionsResult.data || []

    // Build skill map per course
    const skillsPerCourse: Record<string, string[]> = {}
    for (const cs of courseSkills) {
      if (!skillsPerCourse[cs.course_id]) {
        skillsPerCourse[cs.course_id] = []
      }
      if (cs.skill && typeof cs.skill === 'object' && 'name' in cs.skill) {
        skillsPerCourse[cs.course_id].push((cs.skill as { name: string }).name)
      }
    }

    // Build sections per chapter
    const sectionsPerChapter: Record<string, typeof sections> = {}
    for (const section of sections) {
      if (!sectionsPerChapter[section.chapter_id]) {
        sectionsPerChapter[section.chapter_id] = []
      }
      sectionsPerChapter[section.chapter_id].push(section)
    }

    // Build chapters per course
    const chaptersPerCourse: Record<string, typeof chapters> = {}
    for (const chapter of chapters) {
      if (!chaptersPerCourse[chapter.course_id]) {
        chaptersPerCourse[chapter.course_id] = []
      }
      chaptersPerCourse[chapter.course_id].push(chapter)
    }

    // Build courses per category
    const coursesPerCategory: Record<string, typeof courses> = {}
    for (const course of courses) {
      const categorySlugValue = (
        course.topic as {
          subcategory?: { category?: { slug?: string } }
        } | null
      )?.subcategory?.category?.slug

      if (categorySlugValue) {
        if (!coursesPerCategory[categorySlugValue]) {
          coursesPerCategory[categorySlugValue] = []
        }
        coursesPerCategory[categorySlugValue].push(course)
      }
    }

    // Build nodes
    const nodes: Record<string, MapNode> = {}
    const rootNodeIds: string[] = []
    const connections: MapConnection[] = []

    // Filter categories if specific one requested
    const filteredCategories = categorySlug
      ? categories.filter(c => c.slug === categorySlug)
      : categories

    // Process categories -> courses -> chapters -> sections
    for (const category of filteredCategories) {
      const categoryCourses = coursesPerCategory[category.slug] || []

      // Calculate totals
      const totalHours = categoryCourses.reduce((sum, c) => sum + (c.estimated_hours || 0), 0)
      const courseChildIds: string[] = []

      for (const course of categoryCourses) {
        const courseChapters = chaptersPerCourse[course.id] || []
        const chapterChildIds: string[] = []
        const domainId = CATEGORY_TO_DOMAIN[category.slug] || 'frontend'

        for (const chapter of courseChapters) {
          const chapterSections = sectionsPerChapter[chapter.id] || []
          const sectionChildIds: string[] = []

          for (const section of chapterSections) {
            const sectionNode = sectionToSectionNode(
              section,
              chapter.slug,
              course.slug,
              category.slug
            )
            nodes[sectionNode.id] = sectionNode
            sectionChildIds.push(sectionNode.id)
          }

          const chapterNode = chapterToChapterNode(
            chapter,
            course.slug,
            category.slug,
            chapterSections.length,
            sectionChildIds
          )
          nodes[chapterNode.id] = chapterNode
          chapterChildIds.push(chapterNode.id)

          // Add contains connections for sections
          for (const sectionId of sectionChildIds) {
            connections.push({
              id: `${chapterNode.id}-contains-${sectionId}`,
              fromId: chapterNode.id,
              toId: sectionId,
              type: 'contains'
            })
          }
        }

        const courseNode = courseToCourseNode(
          course,
          category.slug,
          courseChapters.length,
          chapterChildIds,
          skillsPerCourse[course.id] || []
        )
        nodes[courseNode.id] = courseNode
        courseChildIds.push(courseNode.id)

        // Add contains connections for chapters
        for (const chapterId of chapterChildIds) {
          connections.push({
            id: `${courseNode.id}-contains-${chapterId}`,
            fromId: courseNode.id,
            toId: chapterId,
            type: 'contains'
          })
        }
      }

      const domainNode = categoryToDomainNode(
        category,
        categoryCourses.length,
        totalHours,
        courseChildIds
      )
      nodes[domainNode.id] = domainNode
      rootNodeIds.push(domainNode.id)

      // Add contains connections for courses
      for (const courseId of courseChildIds) {
        connections.push({
          id: `${domainNode.id}-contains-${courseId}`,
          fromId: domainNode.id,
          toId: courseId,
          type: 'contains'
        })
      }
    }

    // Add course connections (prerequisite, related, next)
    if (includeConnections) {
      for (const conn of dbConnections) {
        // Find the course nodes
        const fromCourse = courses.find(c => c.id === conn.from_course_id)
        const toCourse = courses.find(c => c.id === conn.to_course_id)

        if (fromCourse && toCourse) {
          const fromCategorySlug = (
            fromCourse.topic as {
              subcategory?: { category?: { slug?: string } }
            } | null
          )?.subcategory?.category?.slug

          const toCategorySlug = (
            toCourse.topic as {
              subcategory?: { category?: { slug?: string } }
            } | null
          )?.subcategory?.category?.slug

          if (fromCategorySlug && toCategorySlug) {
            const fromDomain = CATEGORY_TO_DOMAIN[fromCategorySlug] || 'frontend'
            const toDomain = CATEGORY_TO_DOMAIN[toCategorySlug] || 'frontend'

            connections.push({
              id: conn.id,
              fromId: `course-${fromDomain}-${fromCourse.slug}`,
              toId: `course-${toDomain}-${toCourse.slug}`,
              type: conn.connection_type as 'prerequisite' | 'related' | 'next',
              label: conn.label || undefined
            })
          }
        }
      }
    }

    return NextResponse.json({
      nodes,
      connections,
      rootNodeIds
    } satisfies KnowledgeMapAPIResponse)
  } catch (error) {
    console.error('Knowledge Map API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
