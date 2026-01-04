// ============================================================================
// Chapters API
// GET /api/db/chapters?course_id={id} - List chapters for a course
// POST /api/db/chapters - Create new chapter
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Chapter, Section, Insertable } from '@/lib/supabase/types'

export interface ChapterWithSections extends Chapter {
  sections?: Section[]
  section_count?: number
}

// GET /api/db/chapters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const courseId = searchParams.get('course_id')

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id is required' },
        { status: 400 }
      )
    }

    // Fetch chapters
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order') as unknown as { data: Array<{ id: string; course_id: string; slug: string; title: string; description: string | null; sort_order: number; estimated_minutes: number; xp_reward: number }> | null; error: any }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch chapters', details: error.message },
        { status: 500 }
      )
    }

    // Fetch sections for all chapters
    const chapterIds = chapters?.map(ch => ch.id) || []
    const { data: sections } = chapterIds.length
      ? await supabase
          .from('sections')
          .select('*')
          .in('chapter_id', chapterIds)
          .order('sort_order')
      : { data: [] }

    // Combine chapters with sections
    const chaptersWithSections = (chapters || []).map(chapter => ({
      ...chapter,
      sections: (sections as any[])?.filter(s => s.chapter_id === chapter.id) || [],
      section_count: (sections as any[])?.filter(s => s.chapter_id === chapter.id).length || 0
    }))

    return NextResponse.json({ chapters: chaptersWithSections })
  } catch (error) {
    console.error('Chapters GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/db/chapters
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
    if (!body.course_id || !body.title || !body.slug) {
      return NextResponse.json(
        { error: 'course_id, title, and slug are required' },
        { status: 400 }
      )
    }

    // Verify user owns the course
    const { data: course } = await supabase
      .from('courses')
      .select('created_by_user_id')
      .eq('id', body.course_id)
      .single() as unknown as { data: { created_by_user_id: string | null } | null }

    if (!course || course.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to add chapters to this course' },
        { status: 403 }
      )
    }

    // Get the next sort order
    const { data: lastChapter } = await supabase
      .from('chapters')
      .select('sort_order')
      .eq('course_id', body.course_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single() as unknown as { data: { sort_order: number } | null }

    const nextSortOrder = (lastChapter?.sort_order || 0) + 1

    // Prepare chapter data
    const chapterData: Insertable<'chapters'> = {
      course_id: body.course_id,
      slug: body.slug,
      title: body.title,
      description: body.description,
      sort_order: body.sort_order ?? nextSortOrder,
      estimated_minutes: body.estimated_minutes || 0,
      xp_reward: body.xp_reward || 0,
      is_ai_generated: body.is_ai_generated || false
    }

    // Insert chapter
    const { data: chapter, error } = await supabase
      .from('chapters')
      .insert(chapterData as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create chapter', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ chapter }, { status: 201 })
  } catch (error) {
    console.error('Chapters POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
