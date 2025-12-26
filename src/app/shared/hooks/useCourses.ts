// ============================================================================
// useCourses Hook
// Hook for fetching and managing courses
// ============================================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CoursesListResponse, CourseWithRelations } from '@/app/api/db/courses/route'
import type { CourseFullDetails } from '@/app/api/db/courses/[id]/route'

export interface CourseFilters {
  topicId?: string
  subcategoryId?: string
  categoryId?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  status?: 'draft' | 'published' | 'archived'
  skills?: string[]
  aiGenerated?: boolean
  userCreated?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface UseCourseResult {
  courses: CourseWithRelations[]
  total: number
  page: number
  limit: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseCourseDetailsResult {
  course: CourseFullDetails | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook for fetching a list of courses with filters
 */
export function useCourses(filters?: CourseFilters): UseCourseResult {
  const [courses, setCourses] = useState<CourseWithRelations[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(filters?.page || 1)
  const [limit, setLimit] = useState(filters?.limit || 20)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (filters?.topicId) params.set('topic_id', filters.topicId)
      if (filters?.subcategoryId) params.set('subcategory_id', filters.subcategoryId)
      if (filters?.categoryId) params.set('category_id', filters.categoryId)
      if (filters?.difficulty) params.set('difficulty', filters.difficulty)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.skills?.length) params.set('skills', filters.skills.join(','))
      if (filters?.aiGenerated !== undefined) params.set('ai_generated', String(filters.aiGenerated))
      if (filters?.userCreated !== undefined) params.set('user_created', String(filters.userCreated))
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))

      const response = await fetch(`/api/db/courses?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch courses')
      }

      const data: CoursesListResponse = await response.json()

      setCourses(data.courses)
      setTotal(data.total)
      setPage(data.page)
      setLimit(data.limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return {
    courses,
    total,
    page,
    limit,
    isLoading,
    error,
    refetch: fetchCourses
  }
}

/**
 * Hook for fetching a single course with full details
 */
export function useCourseDetails(courseId: string | null): UseCourseDetailsResult {
  const [course, setCourse] = useState<CourseFullDetails | null>(null)
  const [isLoading, setIsLoading] = useState(!!courseId)
  const [error, setError] = useState<string | null>(null)

  const fetchCourse = useCallback(async () => {
    if (!courseId) {
      setCourse(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/db/courses/${courseId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch course')
      }

      const data = await response.json()
      setCourse(data.course)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  return {
    course,
    isLoading,
    error,
    refetch: fetchCourse
  }
}

/**
 * Hook for course mutations (create, update, delete)
 */
export function useCourseMutations() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCourse = useCallback(async (courseData: {
    slug: string
    title: string
    subtitle?: string
    description?: string
    topic_id?: string
    difficulty?: string
    estimated_hours?: number
    skills?: Array<{ skill_id: string; is_primary?: boolean }>
    is_ai_generated?: boolean
    ai_generation_prompt?: string
    ai_confidence_score?: number
  }) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/db/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create course')
      }

      const data = await response.json()
      return data.course
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateCourse = useCallback(async (courseId: string, updateData: Record<string, unknown>) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/db/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update course')
      }

      const data = await response.json()
      return data.course
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteCourse = useCallback(async (courseId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/db/courses/${courseId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete course')
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    createCourse,
    updateCourse,
    deleteCourse,
    isLoading,
    error
  }
}
