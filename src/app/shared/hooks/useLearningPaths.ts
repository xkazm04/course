// ============================================================================
// useLearningPaths Hook
// Fetches learning paths from Supabase API with mock data fallback
// ============================================================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { LearningPath } from '@/app/shared/lib/types'
import { learningPaths as mockLearningPaths } from '@/app/shared/lib/mockData'
import { LEARNING_DOMAINS, type LearningDomainId, type DomainColorKey } from '@/app/shared/lib/learningDomains'

// ============================================================================
// Types
// ============================================================================

export interface UseLearningPathsOptions {
  /** Filter by path type (curated, custom, ai_generated) */
  pathType?: string
  /** Filter by status */
  status?: string
  /** Force use of mock data (skip API) */
  useMockOnly?: boolean
  /** Enable debug logging */
  debug?: boolean
}

export interface UseLearningPathsResult {
  data: LearningPath[]
  isLoading: boolean
  error: string | null
  isUsingMock: boolean
  refetch: () => Promise<void>
}

// ============================================================================
// API Response Transform
// ============================================================================

interface APILearningPath {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  path_type: string
  status: string
  target_role: string | null
  estimated_weeks: number | null
  estimated_hours: number | null
  icon: string | null
  color: string | null
  courses?: Array<{
    id: string
    title: string
    slug: string
    difficulty: string
    estimated_hours: number
    sort_order: number
    is_required: boolean
  }>
  skills?: Array<{
    id: string
    name: string
    slug: string
  }>
  total_hours?: number
  course_count?: number
}

interface APIResponse {
  paths: APILearningPath[]
}

/**
 * Map API path slug to LearningDomainId
 * Falls back to 'frontend' if no match
 */
function slugToDomainId(slug: string): LearningDomainId {
  const domainMap: Record<string, LearningDomainId> = {
    'full-stack-developer': 'fullstack',
    'fullstack-developer': 'fullstack',
    'fullstack': 'fullstack',
    'frontend-developer': 'frontend',
    'frontend': 'frontend',
    'backend-developer': 'backend',
    'backend': 'backend',
    'python-data-scientist': 'databases',
    'data-science': 'databases',
    'databases': 'databases',
    'cloud-devops-engineer': 'backend',
    'devops': 'backend',
    'mobile-developer': 'mobile',
    'mobile': 'mobile',
    'game-developer': 'games',
    'games': 'games',
  }

  return domainMap[slug] || 'frontend'
}

/**
 * Get domain color from slug
 */
function slugToColor(slug: string, apiColor: string | null): DomainColorKey {
  const domainId = slugToDomainId(slug)
  const domain = LEARNING_DOMAINS[domainId]
  return (domain?.color || apiColor || 'indigo') as DomainColorKey
}

/**
 * Get domain icon from slug
 */
function slugToIcon(slug: string, apiIcon: string | null): string {
  const domainId = slugToDomainId(slug)
  const domain = LEARNING_DOMAINS[domainId]
  return domain?.iconName || apiIcon || 'Layers'
}

/**
 * Transform API learning path to client LearningPath format
 */
function transformAPIPath(apiPath: APILearningPath): LearningPath {
  const domainId = slugToDomainId(apiPath.slug)
  const domain = LEARNING_DOMAINS[domainId]

  return {
    id: domainId,
    name: apiPath.title,
    icon: slugToIcon(apiPath.slug, apiPath.icon),
    color: slugToColor(apiPath.slug, apiPath.color),
    description: apiPath.description || domain?.description || '',
    courses: apiPath.course_count || apiPath.courses?.length || 0,
    hours: apiPath.total_hours || apiPath.estimated_hours || 0,
    skills: apiPath.skills?.map(s => s.name) || [],
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for fetching learning paths from Supabase API
 * Falls back to mock data if API is unavailable
 *
 * @example
 * ```tsx
 * const { data, isLoading, isUsingMock } = useLearningPaths()
 *
 * // Use with graph data source
 * const dataSource = useMemo(() =>
 *   createLearningPathDataSource(data),
 *   [data]
 * )
 * ```
 */
export function useLearningPaths(options?: UseLearningPathsOptions): UseLearningPathsResult {
  const [data, setData] = useState<LearningPath[]>(mockLearningPaths)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingMock, setIsUsingMock] = useState(true)

  const fetchData = useCallback(async () => {
    // Use mock data directly if requested
    if (options?.useMockOnly) {
      if (options?.debug) {
        console.log('[useLearningPaths] Using mock data (useMockOnly=true)')
      }
      setData(mockLearningPaths)
      setIsUsingMock(true)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Build API URL
      const params = new URLSearchParams()
      if (options?.pathType) {
        params.set('type', options.pathType)
      }
      if (options?.status) {
        params.set('status', options.status)
      }

      const url = `/api/db/learning-paths?${params.toString()}`

      if (options?.debug) {
        console.log('[useLearningPaths] Fetching from:', url)
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const apiData: APIResponse = await response.json()

      if (options?.debug) {
        console.log('[useLearningPaths] API response:', {
          pathCount: apiData.paths?.length || 0,
        })
      }

      // Check if we got any data
      if (!apiData.paths || apiData.paths.length === 0) {
        if (options?.debug) {
          console.log('[useLearningPaths] No data from API, falling back to mock')
        }
        throw new Error('No learning paths available from API')
      }

      // Transform API data to LearningPath format
      const transformedPaths = apiData.paths.map(transformAPIPath)

      // Merge with domain data to ensure all domains are represented
      const mergedPaths = mergePaths(transformedPaths, mockLearningPaths)

      setData(mergedPaths)
      setIsUsingMock(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (options?.debug) {
        console.log('[useLearningPaths] Error fetching from API:', errorMessage)
        console.log('[useLearningPaths] Falling back to mock data')
      }

      setError(errorMessage)

      // Fall back to mock data
      setData(mockLearningPaths)
      setIsUsingMock(true)
    } finally {
      setIsLoading(false)
    }
  }, [options?.pathType, options?.status, options?.useMockOnly, options?.debug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    isUsingMock,
    refetch: fetchData
  }
}

/**
 * Merge API paths with mock paths to ensure all domains are represented
 */
function mergePaths(apiPaths: LearningPath[], mockPaths: LearningPath[]): LearningPath[] {
  const pathMap = new Map<string, LearningPath>()

  // Start with mock paths as base
  mockPaths.forEach(path => {
    pathMap.set(path.id, path)
  })

  // Override with API data where available
  apiPaths.forEach(path => {
    pathMap.set(path.id, path)
  })

  return Array.from(pathMap.values())
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook for getting a specific learning path by ID
 */
export function useLearningPath(
  paths: LearningPath[],
  pathId: LearningDomainId | null
): LearningPath | null {
  return useMemo(() => {
    if (!pathId) return null
    return paths.find(p => p.id === pathId) || null
  }, [paths, pathId])
}

/**
 * Hook for getting learning path statistics
 */
export function useLearningPathStats(paths: LearningPath[]) {
  return useMemo(() => {
    const totalCourses = paths.reduce((sum, p) => sum + p.courses, 0)
    const totalHours = paths.reduce((sum, p) => sum + p.hours, 0)
    const avgHoursPerPath = paths.length > 0 ? Math.round(totalHours / paths.length) : 0

    return {
      pathCount: paths.length,
      totalCourses,
      totalHours,
      avgHoursPerPath,
    }
  }, [paths])
}
