// ============================================================================
// AI Learning Path Generation API
// POST /api/ai/generate-path - Generate personalized learning path using Claude AI
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Insertable } from '@/lib/supabase/types'

// ============================================================================
// Types
// ============================================================================

export interface GeneratePathRequest {
  goal: string
  current_skills?: Array<{
    skill_id: string
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }>
  target_role?: string
  weekly_hours: number
  deadline_months?: number
  focus_areas?: string[]
}

export interface PathCourse {
  course_id: string
  course_title: string
  course_slug: string
  sort_order: number
  is_required: boolean
  milestone_title?: string
  milestone_description?: string
  estimated_hours: number
}

export interface SkillGap {
  skill_name: string
  current_level: string | null
  required_level: string
  courses_available: number
}

export interface GeneratePathResponse {
  path: {
    id: string
    slug: string
    title: string
    description: string
  }
  courses: PathCourse[]
  skill_gaps: SkillGap[]
  new_courses_needed: boolean
  missing_skills: string[]
  estimated_weeks: number
  ai_reasoning: string
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

const PATH_GENERATION_PROMPT = `You are an expert career advisor and curriculum designer. Create a personalized learning path based on:

GOAL: {goal}
TARGET ROLE: {target_role}
WEEKLY HOURS AVAILABLE: {weekly_hours}
DEADLINE: {deadline_months} months
FOCUS AREAS: {focus_areas}

CURRENT SKILLS:
{current_skills}

AVAILABLE COURSES:
{available_courses}

AVAILABLE SKILLS:
{available_skills}

Create a learning path that:
1. Identifies skill gaps between current skills and goal requirements
2. Recommends courses in optimal order (respecting prerequisites)
3. Includes milestones to mark key achievements
4. Estimates total time based on weekly hours

Respond in this exact JSON format:
{
  "title": "Path title",
  "description": "Path description (2-3 sentences)",
  "recommended_course_ids": ["course-id-1", "course-id-2"],
  "milestones": [
    {
      "after_course_index": 0,
      "title": "Milestone title",
      "description": "What you can do after this point"
    }
  ],
  "skill_gaps": [
    {
      "skill_name": "Skill name",
      "required_level": "intermediate",
      "has_courses": true
    }
  ],
  "missing_skills": ["Skills needed but no courses available"],
  "reasoning": "Explanation of the path structure and recommendations"
}

If a required skill has no courses, include it in missing_skills.
Order courses by prerequisites and logical progression.
Place milestones at meaningful points (after foundational courses, specializations, etc.)`

async function generatePathWithAI(
  request: GeneratePathRequest,
  courses: Array<{ id: string; slug: string; title: string; description: string; difficulty: string; estimated_hours: number }>,
  skills: Array<{ id: string; name: string; category: string }>
): Promise<{
  title: string
  description: string
  recommended_course_ids: string[]
  milestones: Array<{
    after_course_index: number
    title: string
    description: string
  }>
  skill_gaps: Array<{
    skill_name: string
    required_level: string
    has_courses: boolean
  }>
  missing_skills: string[]
  reasoning: string
}> {
  const anthropic = new Anthropic()

  // Format current skills
  const currentSkillsText = request.current_skills?.length
    ? request.current_skills.map(s => {
        const skill = skills.find(sk => sk.id === s.skill_id)
        return `- ${skill?.name || s.skill_id}: ${s.proficiency}`
      }).join('\n')
    : 'None specified'

  // Format available courses
  const coursesText = courses.map(c =>
    `- ID: ${c.id} | "${c.title}" | ${c.difficulty} | ${c.estimated_hours}h`
  ).join('\n')

  // Format available skills
  const skillsText = skills.map(s =>
    `- ${s.name} (${s.category})`
  ).join('\n')

  const prompt = PATH_GENERATION_PROMPT
    .replace('{goal}', request.goal)
    .replace('{target_role}', request.target_role || 'Not specified')
    .replace('{weekly_hours}', String(request.weekly_hours))
    .replace('{deadline_months}', String(request.deadline_months || 'Not specified'))
    .replace('{focus_areas}', request.focus_areas?.join(', ') || 'None specified')
    .replace('{current_skills}', currentSkillsText)
    .replace('{available_courses}', coursesText)
    .replace('{available_skills}', skillsText)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
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

  return JSON.parse(jsonMatch[0])
}

// ============================================================================
// API Handler
// ============================================================================

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

    const body: GeneratePathRequest = await request.json()

    // Validate required fields
    if (!body.goal || !body.weekly_hours) {
      return NextResponse.json(
        { error: 'goal and weekly_hours are required' },
        { status: 400 }
      )
    }

    // Fetch available courses and skills
    const [coursesResult, skillsResult] = await Promise.all([
      supabase
        .from('courses')
        .select('id, slug, title, description, difficulty, estimated_hours')
        .eq('status', 'published'),
      supabase
        .from('skills')
        .select('id, name, category')
    ])

    const courses = coursesResult.data || []
    const skills = skillsResult.data || []

    if (courses.length === 0) {
      return NextResponse.json(
        { error: 'No courses available to build a learning path' },
        { status: 400 }
      )
    }

    // Generate path with AI
    const generated = await generatePathWithAI(body, courses, skills)

    // Create learning path in database
    const pathSlug = generateSlug(generated.title) + '-' + Date.now().toString(36)

    // Calculate estimated weeks
    const recommendedCourses = courses.filter(c =>
      generated.recommended_course_ids.includes(c.id)
    )
    const totalHours = recommendedCourses.reduce((sum, c) => sum + c.estimated_hours, 0)
    const estimatedWeeks = Math.ceil(totalHours / body.weekly_hours)

    const pathData: Insertable<'learning_paths'> = {
      slug: pathSlug,
      title: generated.title,
      description: generated.description,
      path_type: 'ai_generated',
      status: 'published',
      target_role: body.target_role,
      estimated_weeks: estimatedWeeks,
      estimated_hours: totalHours,
      created_by_user_id: user.id
    }

    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .insert(pathData)
      .select()
      .single()

    if (pathError || !path) {
      return NextResponse.json(
        { error: 'Failed to create learning path', details: pathError?.message },
        { status: 500 }
      )
    }

    // Add courses to the path
    const pathCourses: PathCourse[] = []

    for (let i = 0; i < generated.recommended_course_ids.length; i++) {
      const courseId = generated.recommended_course_ids[i]
      const course = courses.find(c => c.id === courseId)

      if (!course) continue

      // Find milestone for this course
      const milestone = generated.milestones.find(m => m.after_course_index === i)

      const courseInsert = {
        learning_path_id: path.id,
        course_id: courseId,
        sort_order: i + 1,
        is_required: true,
        milestone_title: milestone?.title || null,
        milestone_description: milestone?.description || null
      }

      await supabase.from('learning_path_courses').insert(courseInsert)

      pathCourses.push({
        course_id: courseId,
        course_title: course.title,
        course_slug: course.slug,
        sort_order: i + 1,
        is_required: true,
        milestone_title: milestone?.title,
        milestone_description: milestone?.description,
        estimated_hours: course.estimated_hours
      })
    }

    // Store the AI-generated path details
    await supabase
      .from('user_generated_paths')
      .insert({
        user_id: user.id,
        goal_description: body.goal,
        weekly_hours: body.weekly_hours,
        target_months: body.deadline_months,
        focus_areas: body.focus_areas || [],
        generated_path: { path_id: path.id, courses: pathCourses },
        ai_reasoning: generated.reasoning
      })

    // Build skill gaps response
    const skillGaps: SkillGap[] = generated.skill_gaps.map(gap => ({
      skill_name: gap.skill_name,
      current_level: null,
      required_level: gap.required_level,
      courses_available: gap.has_courses ? 1 : 0
    }))

    const response: GeneratePathResponse = {
      path: {
        id: path.id,
        slug: path.slug,
        title: path.title,
        description: path.description || ''
      },
      courses: pathCourses,
      skill_gaps: skillGaps,
      new_courses_needed: generated.missing_skills.length > 0,
      missing_skills: generated.missing_skills,
      estimated_weeks: estimatedWeeks,
      ai_reasoning: generated.reasoning
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('AI Path Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate learning path', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
