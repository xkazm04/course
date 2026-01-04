// ============================================================================
// AI Course Generation API
// POST /api/ai/generate-course - Generate course content using Claude AI
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Insertable } from '@/lib/supabase/types'

// ============================================================================
// Types
// ============================================================================

export interface GenerateCourseRequest {
  title: string
  topic_id?: string
  skill_ids?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_hours: number
  learning_style?: 'visual' | 'hands-on' | 'conceptual' | 'mixed'
  target_audience?: string
  prerequisites?: string[]
}

export interface GeneratedChapter {
  title: string
  description: string
  estimated_minutes: number
  xp_reward: number
  sections: GeneratedSection[]
}

export interface GeneratedSection {
  title: string
  description: string
  content_type: 'video' | 'lesson' | 'interactive' | 'exercise' | 'quiz'
  estimated_minutes: number
  xp_reward: number
  is_preview: boolean
}

export interface GenerateCourseResponse {
  course: {
    id: string
    slug: string
    title: string
    description: string
  }
  chapters: Array<{
    id: string
    title: string
    section_count: number
  }>
  confidence: number
  generation_time_ms: number
}

// ============================================================================
// Slug Generation
// ============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ============================================================================
// AI Generation
// ============================================================================

const COURSE_GENERATION_PROMPT = `You are an expert curriculum designer. Generate a complete course structure based on the following requirements.

REQUIREMENTS:
- Title: {title}
- Difficulty: {difficulty}
- Total Hours: {estimated_hours}
- Learning Style: {learning_style}
- Target Audience: {target_audience}

Generate a course with:
1. A compelling description (2-3 sentences)
2. A subtitle (short tagline)
3. 3-5 key learning outcomes ("what you will learn")
4. Prerequisites (if any)
5. 3-6 chapters, each with:
   - A descriptive title
   - A brief description
   - 3-6 sections per chapter

For sections, include a mix of:
- video: Video lectures (10-20 min)
- lesson: Text-based lessons with examples (15-25 min)
- interactive: Interactive coding exercises (20-30 min)
- exercise: Practice projects (30-45 min)
- quiz: Assessment quizzes (10-15 min)

Respond in this exact JSON format:
{
  "description": "Course description here",
  "subtitle": "Course subtitle here",
  "what_you_will_learn": ["Learning outcome 1", "Learning outcome 2", ...],
  "requirements": ["Prerequisite 1", ...],
  "chapters": [
    {
      "title": "Chapter Title",
      "description": "Chapter description",
      "estimated_minutes": 60,
      "xp_reward": 100,
      "sections": [
        {
          "title": "Section Title",
          "description": "Section description",
          "content_type": "video|lesson|interactive|exercise|quiz",
          "estimated_minutes": 15,
          "xp_reward": 20,
          "is_preview": true/false
        }
      ]
    }
  ]
}

Only the first section of the first chapter should have is_preview: true.
Ensure content types are balanced and appropriate for the topic.
Total section minutes should approximately match the requested hours.`

async function generateCourseWithAI(
  request: GenerateCourseRequest
): Promise<{
  description: string
  subtitle: string
  what_you_will_learn: string[]
  requirements: string[]
  chapters: GeneratedChapter[]
}> {
  const anthropic = new Anthropic()

  const prompt = COURSE_GENERATION_PROMPT
    .replace('{title}', request.title)
    .replace('{difficulty}', request.difficulty)
    .replace('{estimated_hours}', String(request.estimated_hours))
    .replace('{learning_style}', request.learning_style || 'mixed')
    .replace('{target_audience}', request.target_audience || 'Developers interested in learning this topic')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  // Extract text content
  const textContent = message.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI')
  }

  // Parse JSON from response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse AI response as JSON')
  }

  const parsed = JSON.parse(jsonMatch[0])
  return parsed
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

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

    const body: GenerateCourseRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.difficulty || !body.estimated_hours) {
      return NextResponse.json(
        { error: 'title, difficulty, and estimated_hours are required' },
        { status: 400 }
      )
    }

    // Generate course content with AI
    const generated = await generateCourseWithAI(body)

    // Create course in database
    const courseSlug = generateSlug(body.title) + '-' + Date.now().toString(36)

    const courseData: Insertable<'courses'> = {
      slug: courseSlug,
      title: body.title,
      subtitle: generated.subtitle,
      description: generated.description,
      long_description: generated.description,
      topic_id: body.topic_id,
      difficulty: body.difficulty,
      status: 'published', // Auto-publish as per plan
      estimated_hours: body.estimated_hours,
      is_free: true,
      xp_reward: generated.chapters.reduce(
        (sum, ch) => sum + ch.xp_reward + ch.sections.reduce((s, sec) => s + sec.xp_reward, 0),
        0
      ),
      what_you_will_learn: generated.what_you_will_learn,
      requirements: generated.requirements,
      target_audience: body.target_audience ? [body.target_audience] : [],
      is_user_created: true,
      is_ai_generated: true,
      created_by_user_id: user.id,
      ai_generation_prompt: JSON.stringify(body),
      ai_confidence_score: 0.85 // Default confidence score
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert(courseData as any)
      .select()
      .single() as { data: { id: string; slug: string; title: string; description: string | null } | null; error: any }

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Failed to create course', details: courseError?.message },
        { status: 500 }
      )
    }

    // Add skills if provided
    if (body.skill_ids?.length) {
      const skillInserts = body.skill_ids.map((skillId, index) => ({
        course_id: course.id,
        skill_id: skillId,
        is_primary: index === 0,
        proficiency_gained: body.difficulty === 'beginner' ? 'beginner' : 'intermediate'
      }))

      await supabase.from('course_skills').insert(skillInserts as any)
    }

    // Create chapters and sections
    const createdChapters: Array<{ id: string; title: string; section_count: number }> = []

    for (let chapterIndex = 0; chapterIndex < generated.chapters.length; chapterIndex++) {
      const chapter = generated.chapters[chapterIndex]
      const chapterSlug = generateSlug(chapter.title)

      const { data: createdChapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          course_id: course.id,
          slug: chapterSlug,
          title: chapter.title,
          description: chapter.description,
          sort_order: chapterIndex + 1,
          estimated_minutes: chapter.estimated_minutes,
          xp_reward: chapter.xp_reward,
          is_ai_generated: true
        } as any)
        .select()
        .single() as { data: { id: string; title: string } | null; error: any }

      if (chapterError || !createdChapter) {
        console.error('Failed to create chapter:', chapterError)
        continue
      }

      // Create sections for this chapter
      const sectionInserts = chapter.sections.map((section, sectionIndex) => ({
        chapter_id: createdChapter.id,
        slug: generateSlug(section.title),
        title: section.title,
        description: section.description,
        content_type: section.content_type,
        sort_order: sectionIndex + 1,
        estimated_minutes: section.estimated_minutes,
        xp_reward: section.xp_reward,
        is_preview: section.is_preview,
        is_ai_generated: true
      }))

      await supabase.from('sections').insert(sectionInserts as any)

      createdChapters.push({
        id: createdChapter.id,
        title: createdChapter.title,
        section_count: chapter.sections.length
      })
    }

    const response: GenerateCourseResponse = {
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description || ''
      },
      chapters: createdChapters,
      confidence: 0.85,
      generation_time_ms: Date.now() - startTime
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('AI Course Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate course', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
