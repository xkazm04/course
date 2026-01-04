// @ts-nocheck
// ============================================================================
// Skills API
// GET /api/db/skills - List skills with optional filters
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Skill } from '@/lib/supabase/types'

export interface SkillWithRelations extends Skill {
  course_count?: number
  prerequisites?: Array<{
    id: string
    name: string
    slug: string
    is_required: boolean
  }>
  related_skills?: Array<{
    id: string
    name: string
    slug: string
    relation_type: string
  }>
}

// GET /api/db/skills
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const includeRelations = searchParams.get('include_relations') === 'true'

    // Build query
    let query = supabase.from('skills').select('*')

    if (category) {
      query = query.eq('category', category)
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: skills, error } = await query.order('name')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch skills', details: error.message },
        { status: 500 }
      )
    }

    if (!includeRelations) {
      return NextResponse.json({ skills })
    }

    // Fetch additional relations if requested
    const skillIds = skills?.map(s => s.id) || []

    const [courseSkillsResult, prerequisitesResult, relationsResult] = await Promise.all([
      // Course counts
      supabase
        .from('course_skills')
        .select('skill_id')
        .in('skill_id', skillIds),

      // Prerequisites
      supabase
        .from('skill_prerequisites')
        .select(`
          skill_id, is_required,
          prerequisite:skills!prerequisite_skill_id (id, name, slug)
        `)
        .in('skill_id', skillIds),

      // Related skills
      supabase
        .from('skill_relations')
        .select(`
          skill_id, relation_type,
          related:skills!related_skill_id (id, name, slug)
        `)
        .in('skill_id', skillIds)
    ])

    // Count courses per skill
    const coursesPerSkill = courseSkillsResult.data?.reduce((acc, cs) => {
      acc[cs.skill_id] = (acc[cs.skill_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Build skills with relations
    const skillsWithRelations: SkillWithRelations[] = (skills || []).map(skill => ({
      ...skill,
      course_count: coursesPerSkill[skill.id] || 0,
      prerequisites: prerequisitesResult.data
        ?.filter(p => p.skill_id === skill.id)
        .map(p => ({
          ...(p.prerequisite as { id: string; name: string; slug: string }),
          is_required: p.is_required
        })) || [],
      related_skills: relationsResult.data
        ?.filter(r => r.skill_id === skill.id)
        .map(r => ({
          ...(r.related as { id: string; name: string; slug: string }),
          relation_type: r.relation_type
        })) || []
    }))

    return NextResponse.json({ skills: skillsWithRelations })
  } catch (error) {
    console.error('Skills GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
