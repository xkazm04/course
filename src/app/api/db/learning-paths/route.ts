// ============================================================================
// Learning Paths API
// GET /api/db/learning-paths - List learning paths
// POST /api/db/learning-paths - Create new learning path
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LearningPath, Insertable } from '@/lib/supabase/types'

export interface LearningPathWithRelations extends LearningPath {
  courses?: Array<{
    id: string
    title: string
    slug: string
    difficulty: string
    estimated_hours: number
    sort_order: number
    is_required: boolean
    milestone_title: string | null
    milestone_description: string | null
  }>
  skills?: Array<{
    id: string
    name: string
    slug: string
    proficiency_level: string
  }>
  total_hours?: number
  course_count?: number
}

// GET /api/db/learning-paths
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const pathType = searchParams.get('type')
    const status = searchParams.get('status') || 'published'
    const search = searchParams.get('search')

    // Build query
    let query = supabase.from('learning_paths').select('*')

    if (status) {
      query = query.eq('status', status)
    }
    if (pathType) {
      query = query.eq('path_type', pathType)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: paths, error } = await query.order('title')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch learning paths', details: error.message },
        { status: 500 }
      )
    }

    // Fetch courses and skills for all paths
    const pathIds = paths?.map(p => p.id) || []

    const [coursesResult, skillsResult] = await Promise.all([
      supabase
        .from('learning_path_courses')
        .select(`
          learning_path_id, sort_order, is_required, milestone_title, milestone_description,
          course:courses!course_id (id, title, slug, difficulty, estimated_hours)
        `)
        .in('learning_path_id', pathIds)
        .order('sort_order'),

      supabase
        .from('learning_path_skills')
        .select(`
          learning_path_id, proficiency_level,
          skill:skills!skill_id (id, name, slug)
        `)
        .in('learning_path_id', pathIds)
    ])

    // Build paths with relations
    const pathsWithRelations: LearningPathWithRelations[] = (paths || []).map(path => {
      const pathCourses = coursesResult.data
        ?.filter(pc => pc.learning_path_id === path.id)
        .map(pc => ({
          ...(pc.course as { id: string; title: string; slug: string; difficulty: string; estimated_hours: number }),
          sort_order: pc.sort_order,
          is_required: pc.is_required,
          milestone_title: pc.milestone_title,
          milestone_description: pc.milestone_description
        })) || []

      const totalHours = pathCourses.reduce((sum, c) => sum + (c.estimated_hours || 0), 0)

      return {
        ...path,
        courses: pathCourses,
        skills: skillsResult.data
          ?.filter(ps => ps.learning_path_id === path.id)
          .map(ps => ({
            ...(ps.skill as { id: string; name: string; slug: string }),
            proficiency_level: ps.proficiency_level
          })) || [],
        total_hours: totalHours,
        course_count: pathCourses.length
      }
    })

    return NextResponse.json({ paths: pathsWithRelations })
  } catch (error) {
    console.error('Learning Paths GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/db/learning-paths
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

    // Prepare learning path data
    const pathData: Insertable<'learning_paths'> = {
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle,
      description: body.description,
      path_type: body.path_type || 'custom',
      status: body.status || 'draft',
      target_role: body.target_role,
      estimated_weeks: body.estimated_weeks,
      estimated_hours: body.estimated_hours,
      icon: body.icon,
      color: body.color,
      created_by_user_id: user.id
    }

    // Insert learning path
    const { data: path, error } = await supabase
      .from('learning_paths')
      .insert(pathData)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create learning path', details: error.message },
        { status: 500 }
      )
    }

    // Add courses if provided
    if (body.courses?.length) {
      const courseInserts = body.courses.map((course: {
        course_id: string
        sort_order?: number
        is_required?: boolean
        milestone_title?: string
        milestone_description?: string
      }, index: number) => ({
        learning_path_id: path.id,
        course_id: course.course_id,
        sort_order: course.sort_order ?? index + 1,
        is_required: course.is_required ?? true,
        milestone_title: course.milestone_title,
        milestone_description: course.milestone_description
      }))

      await supabase.from('learning_path_courses').insert(courseInserts)
    }

    // Add skills if provided
    if (body.skills?.length) {
      const skillInserts = body.skills.map((skill: {
        skill_id: string
        proficiency_level: string
      }) => ({
        learning_path_id: path.id,
        skill_id: skill.skill_id,
        proficiency_level: skill.proficiency_level || 'intermediate'
      }))

      await supabase.from('learning_path_skills').insert(skillInserts)
    }

    return NextResponse.json({ path }, { status: 201 })
  } catch (error) {
    console.error('Learning Paths POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
