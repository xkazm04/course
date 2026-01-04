// @ts-nocheck
// ============================================================================
// Single Course API
// GET /api/db/courses/[id] - Get course with full details
// PUT /api/db/courses/[id] - Update course
// DELETE /api/db/courses/[id] - Delete course
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Course, Chapter, Section, Updatable } from '@/lib/supabase/types'

export interface CourseFullDetails extends Course {
  topic?: {
    id: string
    name: string
    slug: string
    subcategory?: {
      id: string
      name: string
      slug: string
      category?: {
        id: string
        name: string
        slug: string
        color: string | null
      }
    }
  }
  skills?: Array<{
    id: string
    name: string
    slug: string
    category: string
    is_primary: boolean
    proficiency_gained: string
  }>
  chapters?: Array<Chapter & {
    sections?: Section[]
  }>
  prerequisites?: Array<{
    id: string
    title: string
    slug: string
    is_required: boolean
  }>
  connections?: Array<{
    to_course_id: string
    to_course_title: string
    to_course_slug: string
    connection_type: string
    weight: number
  }>
}

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/db/courses/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch course with topic hierarchy
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        topic:topics!topic_id (
          id, name, slug,
          subcategory:subcategories!subcategory_id (
            id, name, slug,
            category:categories!category_id (
              id, name, slug, color
            )
          )
        )
      `)
      .eq('id', id)
      .single() as unknown as { data: Record<string, unknown> | null; error: unknown }

    if (error || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Define response types for parallel queries
    type SkillsQueryResult = { data: Array<{ is_primary: boolean; proficiency_gained: string; skill: { id: string; name: string; slug: string; category: string } }> | null }
    type ChaptersQueryResult = { data: Array<{ id: string; [key: string]: unknown }> | null }
    type PrerequisitesQueryResult = { data: Array<{ is_required: boolean; prerequisite: { id: string; title: string; slug: string } }> | null }
    type ConnectionsQueryResult = { data: Array<{ connection_type: string; weight: number; to_course: { id: string; title: string; slug: string } }> | null }

    // Fetch related data in parallel
    const [skillsResult, chaptersResult, prerequisitesResult, connectionsResult] = await Promise.all([
      // Skills
      supabase
        .from('course_skills')
        .select(`
          is_primary, proficiency_gained,
          skill:skills!skill_id (id, name, slug, category)
        `)
        .eq('course_id', id) as unknown as Promise<SkillsQueryResult>,

      // Chapters with sections
      supabase
        .from('chapters')
        .select('*')
        .eq('course_id', id)
        .order('sort_order') as unknown as Promise<ChaptersQueryResult>,

      // Prerequisites
      supabase
        .from('course_prerequisites')
        .select(`
          is_required,
          prerequisite:courses!prerequisite_course_id (id, title, slug)
        `)
        .eq('course_id', id) as unknown as Promise<PrerequisitesQueryResult>,

      // Connections (outgoing)
      supabase
        .from('course_connections')
        .select(`
          connection_type, weight,
          to_course:courses!to_course_id (id, title, slug)
        `)
        .eq('from_course_id', id) as unknown as Promise<ConnectionsQueryResult>
    ])

    // Fetch sections for chapters
    const chapters = (chaptersResult.data || []) as Array<{ id: string; [key: string]: unknown }>
    const chapterIds = chapters.map(ch => ch.id)
    const { data: sections } = chapterIds.length
      ? await supabase
          .from('sections')
          .select('*')
          .in('chapter_id', chapterIds)
          .order('sort_order')
      : { data: [] }

    // Build full course response
    const courseDetails = {
      ...course,
      topic: course.topic,
      skills: skillsResult.data?.map(cs => ({
        ...(cs.skill as { id: string; name: string; slug: string; category: string }),
        is_primary: cs.is_primary,
        proficiency_gained: cs.proficiency_gained
      })) || [],
      chapters: chapters.map(chapter => ({
        ...chapter,
        sections: ((sections || []) as Array<{ chapter_id: string }>).filter(s => s.chapter_id === chapter.id)
      })),
      prerequisites: prerequisitesResult.data?.map(p => ({
        ...(p.prerequisite as { id: string; title: string; slug: string }),
        is_required: p.is_required
      })) || [],
      connections: connectionsResult.data?.map(c => ({
        to_course_id: (c.to_course as { id: string }).id,
        to_course_title: (c.to_course as { title: string }).title,
        to_course_slug: (c.to_course as { slug: string }).slug,
        connection_type: c.connection_type,
        weight: c.weight
      })) || []
    } as CourseFullDetails

    return NextResponse.json({ course: courseDetails })
  } catch (error) {
    console.error('Course GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/db/courses/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check ownership
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('created_by_user_id')
      .eq('id', id)
      .single() as unknown as { data: { created_by_user_id: string | null } | null }

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Only owner can update
    if (existingCourse.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this course' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Prepare update data
    const updateData: Updatable<'courses'> = {}

    // Only include fields that are provided
    const allowedFields = [
      'title', 'subtitle', 'description', 'long_description',
      'topic_id', 'primary_skill_id', 'difficulty', 'status',
      'estimated_hours', 'is_free', 'xp_reward',
      'what_you_will_learn', 'requirements', 'target_audience',
      'instructor_name', 'instructor_bio', 'instructor_avatar_url',
      'thumbnail_url', 'preview_video_url'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field]
      }
    }

    // Update course
    const { data: course, error } = await (supabase
      .from('courses') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update course', details: error.message },
        { status: 500 }
      )
    }

    // Update skills if provided
    if (body.skills !== undefined) {
      // Delete existing skills
      await supabase
        .from('course_skills')
        .delete()
        .eq('course_id', id)

      // Insert new skills
      if (body.skills.length) {
        const skillInserts = body.skills.map((skill: { skill_id: string; is_primary?: boolean }) => ({
          course_id: id,
          skill_id: skill.skill_id,
          is_primary: skill.is_primary || false,
          proficiency_gained: 'intermediate'
        }))

        await supabase.from('course_skills').insert(skillInserts)
      }
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Course PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/db/courses/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check ownership
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('created_by_user_id')
      .eq('id', id)
      .single() as unknown as { data: { created_by_user_id: string | null } | null }

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Only owner can delete
    if (existingCourse.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this course' },
        { status: 403 }
      )
    }

    // Delete course (cascades to chapters, sections, etc.)
    const { error } = await (supabase
      .from('courses') as any)
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete course', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Course DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
