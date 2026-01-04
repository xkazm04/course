// @ts-nocheck
// ============================================================================
// Courses API
// GET /api/db/courses - List courses with filters
// POST /api/db/courses - Create new course
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Course, Insertable } from '@/lib/supabase/types'

export interface CourseWithRelations extends Course {
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
    is_primary: boolean
  }>
  chapter_count?: number
  section_count?: number
}

export interface CoursesListResponse {
  courses: CourseWithRelations[]
  total: number
  page: number
  limit: number
}

// GET /api/db/courses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const topicId = searchParams.get('topic_id')
    const subcategoryId = searchParams.get('subcategory_id')
    const categoryId = searchParams.get('category_id')
    const difficulty = searchParams.get('difficulty')
    const status = searchParams.get('status') || 'published'
    const skillIds = searchParams.get('skills')?.split(',').filter(Boolean)
    const isAiGenerated = searchParams.get('ai_generated')
    const isUserCreated = searchParams.get('user_created')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
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
      `, { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (topicId) {
      query = query.eq('topic_id', topicId)
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    if (isAiGenerated === 'true') {
      query = query.eq('is_ai_generated', true)
    }
    if (isUserCreated === 'true') {
      query = query.eq('is_user_created', true)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Filter by subcategory (requires join through topics)
    if (subcategoryId) {
      const { data: topicIds } = await supabase
        .from('topics')
        .select('id')
        .eq('subcategory_id', subcategoryId) as unknown as { data: Array<{ id: string }> | null }
      if (topicIds?.length) {
        query = query.in('topic_id', topicIds.map(t => t.id))
      }
    }

    // Filter by category (requires join through subcategories > topics)
    if (categoryId && !subcategoryId) {
      const { data: subcatIds } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', categoryId) as unknown as { data: Array<{ id: string }> | null }
      if (subcatIds?.length) {
        const { data: topicIds } = await supabase
          .from('topics')
          .select('id')
          .in('subcategory_id', subcatIds.map(s => s.id)) as unknown as { data: Array<{ id: string }> | null }
        if (topicIds?.length) {
          query = query.in('topic_id', topicIds.map(t => t.id))
        }
      }
    }

    // Filter by skills
    if (skillIds?.length) {
      const { data: courseIds } = await supabase
        .from('course_skills')
        .select('course_id')
        .in('skill_id', skillIds) as unknown as { data: Array<{ course_id: string }> | null }
      if (courseIds?.length) {
        query = query.in('id', Array.from(new Set(courseIds.map(c => c.course_id))))
      } else {
        // No courses match the skills
        return NextResponse.json({
          courses: [],
          total: 0,
          page,
          limit
        } satisfies CoursesListResponse)
      }
    }

    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: courses, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch courses', details: error.message },
        { status: 500 }
      )
    }

    // Fetch skills for each course
    const courseIds = courses?.map(c => c.id) || []
    const { data: courseSkills } = await supabase
      .from('course_skills')
      .select(`
        course_id,
        is_primary,
        skill:skills!skill_id (id, name, slug)
      `)
      .in('course_id', courseIds)

    // Fetch chapter/section counts
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, course_id')
      .in('course_id', courseIds)

    const chapterIds = chapters?.map(c => c.id) || []
    const { data: sections } = chapterIds.length
      ? await supabase
          .from('sections')
          .select('id, chapter_id')
          .in('chapter_id', chapterIds)
      : { data: [] }

    // Map counts
    const chaptersPerCourse = chapters?.reduce((acc, ch) => {
      acc[ch.course_id] = (acc[ch.course_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const sectionsPerChapter = sections?.reduce((acc, sec) => {
      acc[sec.chapter_id] = (acc[sec.chapter_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const sectionsPerCourse = chapters?.reduce((acc, ch) => {
      acc[ch.course_id] = (acc[ch.course_id] || 0) + (sectionsPerChapter[ch.id] || 0)
      return acc
    }, {} as Record<string, number>) || {}

    // Combine data
    const coursesWithRelations: CourseWithRelations[] = (courses || []).map(course => ({
      ...course,
      topic: course.topic as CourseWithRelations['topic'],
      skills: courseSkills
        ?.filter(cs => cs.course_id === course.id)
        .map(cs => ({
          ...(cs.skill as { id: string; name: string; slug: string }),
          is_primary: cs.is_primary
        })) || [],
      chapter_count: chaptersPerCourse[course.id] || 0,
      section_count: sectionsPerCourse[course.id] || 0
    }))

    return NextResponse.json({
      courses: coursesWithRelations,
      total: count || 0,
      page,
      limit
    } satisfies CoursesListResponse)
  } catch (error) {
    console.error('Courses GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/db/courses
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Prepare course data
    const courseData: Insertable<'courses'> = {
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle,
      description: body.description,
      long_description: body.long_description,
      topic_id: body.topic_id,
      primary_skill_id: body.primary_skill_id,
      difficulty: body.difficulty || 'beginner',
      status: body.status || 'draft',
      estimated_hours: body.estimated_hours || 0,
      is_free: body.is_free ?? true,
      xp_reward: body.xp_reward || 0,
      what_you_will_learn: body.what_you_will_learn || [],
      requirements: body.requirements || [],
      target_audience: body.target_audience || [],
      instructor_name: body.instructor_name,
      instructor_bio: body.instructor_bio,
      // Mark as user-created
      is_user_created: true,
      created_by_user_id: user.id,
      // AI generation fields
      is_ai_generated: body.is_ai_generated || false,
      ai_generation_prompt: body.ai_generation_prompt,
      ai_confidence_score: body.ai_confidence_score
    }

    // Insert course
    const { data: course, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create course', details: error.message },
        { status: 500 }
      )
    }

    // Add skills if provided
    if (body.skills?.length) {
      const skillInserts = body.skills.map((skill: { skill_id: string; is_primary?: boolean }) => ({
        course_id: course.id,
        skill_id: skill.skill_id,
        is_primary: skill.is_primary || false,
        proficiency_gained: 'intermediate'
      }))

      await supabase.from('course_skills').insert(skillInserts)
    }

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Courses POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
