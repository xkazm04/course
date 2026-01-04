// @ts-nocheck
// ============================================================================
// Sections API
// GET /api/db/sections?chapter_id={id} - List sections for a chapter
// POST /api/db/sections - Create new section
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Section, Concept, Insertable } from '@/lib/supabase/types'

export interface SectionWithConcepts extends Section {
  concepts?: Concept[]
}

// GET /api/db/sections
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const chapterId = searchParams.get('chapter_id')

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapter_id is required' },
        { status: 400 }
      )
    }

    // Fetch sections
    const { data: sections, error } = await supabase
      .from('sections')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('sort_order')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sections', details: error.message },
        { status: 500 }
      )
    }

    // Fetch concepts for all sections
    const sectionIds = sections?.map(s => s.id) || []
    const { data: concepts } = sectionIds.length
      ? await supabase
          .from('concepts')
          .select('*')
          .in('section_id', sectionIds)
          .order('sort_order')
      : { data: [] }

    // Combine sections with concepts
    const sectionsWithConcepts: SectionWithConcepts[] = (sections || []).map(section => ({
      ...section,
      concepts: concepts?.filter(c => c.section_id === section.id) || []
    }))

    return NextResponse.json({ sections: sectionsWithConcepts })
  } catch (error) {
    console.error('Sections GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/db/sections
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
    if (!body.chapter_id || !body.title || !body.slug) {
      return NextResponse.json(
        { error: 'chapter_id, title, and slug are required' },
        { status: 400 }
      )
    }

    // Verify user owns the course (through chapter)
    const { data: chapter } = await supabase
      .from('chapters')
      .select(`
        course:courses!course_id (
          created_by_user_id
        )
      `)
      .eq('id', body.chapter_id)
      .single()

    const courseOwner = (chapter?.course as { created_by_user_id: string | null } | null)?.created_by_user_id
    if (!courseOwner || courseOwner !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to add sections to this chapter' },
        { status: 403 }
      )
    }

    // Get the next sort order
    const { data: lastSection } = await supabase
      .from('sections')
      .select('sort_order')
      .eq('chapter_id', body.chapter_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (lastSection?.sort_order || 0) + 1

    // Prepare section data
    const sectionData: Insertable<'sections'> = {
      chapter_id: body.chapter_id,
      slug: body.slug,
      title: body.title,
      description: body.description,
      content_type: body.content_type || 'lesson',
      content_url: body.content_url,
      content_data: body.content_data,
      sort_order: body.sort_order ?? nextSortOrder,
      estimated_minutes: body.estimated_minutes || 0,
      xp_reward: body.xp_reward || 0,
      is_preview: body.is_preview || false,
      is_ai_generated: body.is_ai_generated || false
    }

    // Insert section
    const { data: section, error } = await supabase
      .from('sections')
      .insert(sectionData)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create section', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ section }, { status: 201 })
  } catch (error) {
    console.error('Sections POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
