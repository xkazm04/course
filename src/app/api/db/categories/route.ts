// ============================================================================
// Categories API - Taxonomy Tree
// GET /api/db/categories - Returns full taxonomy tree (categories > subcategories > topics)
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface TaxonomyNode {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  color?: string | null
  sort_order: number
  is_featured?: boolean
  is_trending?: boolean
  subcategories?: TaxonomyNode[]
  topics?: TaxonomyNode[]
  course_count?: number
}

export interface TaxonomyTreeResponse {
  categories: TaxonomyNode[]
  total_courses: number
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch categories with subcategories and topics in parallel
    const [categoriesResult, subcategoriesResult, topicsResult, courseCountResult] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .order('sort_order'),
      supabase
        .from('subcategories')
        .select('*')
        .order('sort_order'),
      supabase
        .from('topics')
        .select('*')
        .order('sort_order'),
      supabase
        .from('courses')
        .select('id, topic_id', { count: 'exact', head: false })
        .eq('status', 'published')
    ])

    if (categoriesResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch categories', details: categoriesResult.error.message },
        { status: 500 }
      )
    }

    const categories = categoriesResult.data || []
    const subcategories = subcategoriesResult.data || []
    const topics = topicsResult.data || []
    const courses = courseCountResult.data || []

    // Count courses per topic
    const coursesPerTopic = courses.reduce((acc, course) => {
      if (course.topic_id) {
        acc[course.topic_id] = (acc[course.topic_id] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Build the taxonomy tree
    const taxonomyTree: TaxonomyNode[] = categories.map(category => {
      const categorySubcats = subcategories
        .filter(sub => sub.category_id === category.id)
        .map(subcategory => {
          const subcatTopics = topics
            .filter(topic => topic.subcategory_id === subcategory.id)
            .map(topic => ({
              id: topic.id,
              slug: topic.slug,
              name: topic.name,
              description: topic.description,
              icon: topic.icon,
              sort_order: topic.sort_order,
              is_trending: topic.is_trending,
              course_count: coursesPerTopic[topic.id] || 0
            }))

          return {
            id: subcategory.id,
            slug: subcategory.slug,
            name: subcategory.name,
            description: subcategory.description,
            icon: subcategory.icon,
            sort_order: subcategory.sort_order,
            topics: subcatTopics,
            course_count: subcatTopics.reduce((sum, t) => sum + (t.course_count || 0), 0)
          }
        })

      return {
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        sort_order: category.sort_order,
        is_featured: category.is_featured,
        subcategories: categorySubcats,
        course_count: categorySubcats.reduce((sum, s) => sum + (s.course_count || 0), 0)
      }
    })

    return NextResponse.json({
      categories: taxonomyTree,
      total_courses: courses.length
    } satisfies TaxonomyTreeResponse)
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
