// ============================================================================
// useCategories Hook
// Hook for fetching taxonomy tree (categories, subcategories, topics)
// ============================================================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { TaxonomyTreeResponse, TaxonomyNode } from '@/app/api/db/categories/route'

export interface UseCategoriesResult {
  categories: TaxonomyNode[]
  totalCourses: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook for fetching the full taxonomy tree
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<TaxonomyNode[]>([])
  const [totalCourses, setTotalCourses] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/db/categories')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch categories')
      }

      const data: TaxonomyTreeResponse = await response.json()

      setCategories(data.categories)
      setTotalCourses(data.total_courses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    totalCourses,
    isLoading,
    error,
    refetch: fetchCategories
  }
}

/**
 * Hook for getting a flattened list of all topics
 */
export function useTopics(): TaxonomyNode[] {
  const { categories } = useCategories()

  return useMemo(() => {
    const topics: TaxonomyNode[] = []

    for (const category of categories) {
      for (const subcategory of category.subcategories || []) {
        for (const topic of subcategory.topics || []) {
          topics.push(topic)
        }
      }
    }

    return topics
  }, [categories])
}

/**
 * Hook for finding a category by slug
 */
export function useCategoryBySlug(slug: string | null): TaxonomyNode | null {
  const { categories } = useCategories()

  return useMemo(() => {
    if (!slug) return null
    return categories.find(c => c.slug === slug) || null
  }, [categories, slug])
}

/**
 * Hook for finding a subcategory by slug
 */
export function useSubcategoryBySlug(slug: string | null): TaxonomyNode | null {
  const { categories } = useCategories()

  return useMemo(() => {
    if (!slug) return null

    for (const category of categories) {
      const subcategory = category.subcategories?.find(s => s.slug === slug)
      if (subcategory) return subcategory
    }

    return null
  }, [categories, slug])
}

/**
 * Hook for finding a topic by slug
 */
export function useTopicBySlug(slug: string | null): TaxonomyNode | null {
  const { categories } = useCategories()

  return useMemo(() => {
    if (!slug) return null

    for (const category of categories) {
      for (const subcategory of category.subcategories || []) {
        const topic = subcategory.topics?.find(t => t.slug === slug)
        if (topic) return topic
      }
    }

    return null
  }, [categories, slug])
}
