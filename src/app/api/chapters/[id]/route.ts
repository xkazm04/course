// ============================================================================
// Single Chapter API
// GET /api/chapters/[id] - Get chapter with sections and course info
// DELETE /api/chapters/[id] - Reset chapter content for regeneration
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Chapter, Section, Course } from '@/lib/supabase/types'

export interface ChapterWithDetails extends Chapter {
  course: Pick<Course, 'id' | 'title' | 'slug'>
  sections: Section[]
  // New unified content store fields
  content_metadata?: {
    key_takeaways?: string[]
    video_variants?: Array<{
      id: string
      title: string
      searchQuery: string
      style: string
      instructorName: string
    }>
    estimated_time_minutes?: number
    difficulty?: string
    introduction?: string
  } | null
  generated_at?: string | null
}

export interface SectionContentData {
  code?: string
  keyPoints?: string[]
  description?: string
  previousCode?: string
  hasVisuals?: boolean
}

// GET /api/chapters/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Use admin client to bypass RLS for read operations (preview mode support)
    const supabase = await createAdminClient()

    // Fetch chapter
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', id)
      .single() as unknown as { data: Chapter | null; error: Error | null }

    if (chapterError || !chapterData) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Fetch course info
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('id', chapterData.course_id)
      .single() as unknown as { data: Pick<Course, 'id' | 'title' | 'slug'> | null; error: Error | null }

    if (courseError || !courseData) {
      return NextResponse.json(
        { error: 'Course not found for chapter' },
        { status: 404 }
      )
    }

    // Fetch sections for this chapter
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('chapter_id', id)
      .order('sort_order') as unknown as { data: Section[] | null; error: Error | null }

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError)
    }

    const chapterWithDetails: ChapterWithDetails = {
      ...chapterData,
      course: courseData,
      sections: sectionsData || []
    }

    return NextResponse.json({ chapter: chapterWithDetails })
  } catch (error) {
    console.error('Chapter GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/chapters/[id] - Reset chapter content for regeneration
// This clears generated_content and content_status to allow re-generation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Use admin client for dev/testing
    const supabase = await createAdminClient()

    // Check if chapter exists
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, course_id, title')
      .eq('id', id)
      .single() as unknown as { data: { id: string; course_id: string; title: string } | null; error: Error | null }

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Clear chapter content (reset for regeneration)
    const { error: updateError } = await (supabase
      .from('chapters') as any)
      .update({
        generated_content: null,
        content_status: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error resetting chapter content:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset chapter content' },
        { status: 500 }
      )
    }

    // Also delete any existing sections (they will be regenerated)
    await (supabase
      .from('sections') as any)
      .delete()
      .eq('chapter_id', id)

    // Cancel any pending generation jobs for this chapter
    await (supabase
      .from('chapter_content_jobs') as any)
      .update({ status: 'cancelled' })
      .eq('chapter_id', id)
      .in('status', ['pending', 'processing'])

    return NextResponse.json({
      success: true,
      message: 'Chapter content reset for regeneration',
      chapter_id: id,
      chapter_title: chapter.title
    })
  } catch (error) {
    console.error('Chapter DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
