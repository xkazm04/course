// ============================================================================
// useMapData Hook
// Fetches knowledge map data from API with mock data fallback
// ============================================================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { KnowledgeMapData, MapNode, MapConnection } from './types'
import { generateKnowledgeMapData, getNodeChildren, getNodeById, getNodeAncestors } from './mapData'
import type { LearningDomainId } from '@/app/shared/lib/learningDomains'

// ============================================================================
// Types
// ============================================================================

export interface UseMapDataOptions {
  /** Filter by category/domain */
  domainId?: LearningDomainId
  /** Include course connections */
  includeConnections?: boolean
  /** Force use of mock data (skip API) */
  useMockOnly?: boolean
  /** Enable debug logging */
  debug?: boolean
}

export interface UseMapDataResult {
  data: KnowledgeMapData | null
  isLoading: boolean
  error: string | null
  isUsingMock: boolean
  refetch: () => Promise<void>
}

// ============================================================================
// API Response Transform
// ============================================================================

interface APINode {
  id: string
  level: string
  name: string
  description: string
  status: string
  progress: number
  parentId: string | null
  childIds: string[]
  color: string
  domainId: string
  estimatedHours?: number
  courseCount?: number
  totalHours?: number
  difficulty?: string
  chapterCount?: number
  skills?: string[]
  courseId?: string
  sectionCount?: number
  xpReward?: number
  durationMinutes?: number
  chapterId?: string
  sectionType?: string
  duration?: string
  sectionId?: string
  conceptType?: string
  content?: string
}

interface APIResponse {
  nodes: Record<string, APINode>
  connections: MapConnection[]
  rootNodeIds: string[]
}

function transformAPIResponse(response: APIResponse): KnowledgeMapData {
  const nodes = new Map<string, MapNode>()

  for (const [id, node] of Object.entries(response.nodes)) {
    nodes.set(id, node as unknown as MapNode)
  }

  return {
    nodes,
    connections: response.connections,
    rootNodeIds: response.rootNodeIds
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for fetching knowledge map data
 * Automatically fetches from API and falls back to mock data on error
 *
 * @example
 * ```tsx
 * const { data, isLoading, isUsingMock } = useMapData({ domainId: 'frontend' })
 *
 * if (data) {
 *   const domains = getNodeChildren(data, null)
 * }
 * ```
 */
export function useMapData(options?: UseMapDataOptions): UseMapDataResult {
  const [data, setData] = useState<KnowledgeMapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingMock, setIsUsingMock] = useState(false)

  const fetchData = useCallback(async () => {
    // Use mock data directly if requested
    if (options?.useMockOnly) {
      if (options?.debug) {
        console.log('[useMapData] Using mock data (useMockOnly=true)')
      }
      setData(generateKnowledgeMapData())
      setIsUsingMock(true)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Build API URL
      const params = new URLSearchParams()
      if (options?.domainId) {
        // Map domainId to category slug
        const categoryMap: Record<LearningDomainId, string> = {
          frontend: 'development',
          backend: 'development',
          fullstack: 'development',
          databases: 'data-science',
          mobile: 'development',
          games: 'development'
        }
        params.set('category', categoryMap[options.domainId] || 'development')
      }
      if (options?.includeConnections === false) {
        params.set('connections', 'false')
      }

      const url = `/api/knowledge-map?${params.toString()}`

      if (options?.debug) {
        console.log('[useMapData] Fetching from:', url)
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const apiData: APIResponse = await response.json()

      if (options?.debug) {
        console.log('[useMapData] API response:', {
          nodeCount: Object.keys(apiData.nodes).length,
          connectionCount: apiData.connections.length,
          rootNodeIds: apiData.rootNodeIds
        })
      }

      // Check if we got any data
      if (Object.keys(apiData.nodes).length === 0) {
        if (options?.debug) {
          console.log('[useMapData] No data from API, falling back to mock')
        }
        throw new Error('No data available from API')
      }

      const transformedData = transformAPIResponse(apiData)
      setData(transformedData)
      setIsUsingMock(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (options?.debug) {
        console.log('[useMapData] Error fetching from API:', errorMessage)
        console.log('[useMapData] Falling back to mock data')
      }

      setError(errorMessage)

      // Fall back to mock data
      setData(generateKnowledgeMapData())
      setIsUsingMock(true)
    } finally {
      setIsLoading(false)
    }
  }, [options?.domainId, options?.includeConnections, options?.useMockOnly, options?.debug])

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

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook for getting nodes at a specific level
 */
export function useMapNodes(
  data: KnowledgeMapData | null,
  parentId: string | null
): MapNode[] {
  return useMemo(() => {
    if (!data) return []
    return getNodeChildren(data, parentId)
  }, [data, parentId])
}

/**
 * Hook for getting a specific node by ID
 */
export function useMapNode(
  data: KnowledgeMapData | null,
  nodeId: string | null
): MapNode | null {
  return useMemo(() => {
    if (!data || !nodeId) return null
    return getNodeById(data, nodeId) || null
  }, [data, nodeId])
}

/**
 * Hook for getting the ancestor path to a node
 */
export function useNodePath(
  data: KnowledgeMapData | null,
  nodeId: string | null
): MapNode[] {
  return useMemo(() => {
    if (!data || !nodeId) return []
    return getNodeAncestors(data, nodeId)
  }, [data, nodeId])
}

/**
 * Hook for getting connections for visible nodes
 */
export function useVisibleConnections(
  data: KnowledgeMapData | null,
  visibleNodeIds: string[]
): MapConnection[] {
  return useMemo(() => {
    if (!data) return []

    const visibleSet = new Set(visibleNodeIds)
    return data.connections.filter(
      conn => visibleSet.has(conn.fromId) && visibleSet.has(conn.toId)
    )
  }, [data, visibleNodeIds])
}

/**
 * Hook for getting domain statistics
 */
export function useDomainStats(data: KnowledgeMapData | null) {
  return useMemo(() => {
    if (!data) return null

    let totalCourses = 0
    let totalChapters = 0
    let totalSections = 0
    let totalHours = 0
    let completedCount = 0
    let inProgressCount = 0

    data.nodes.forEach(node => {
      if (node.level === 'course') {
        totalCourses++
        if (node.status === 'completed') completedCount++
        if (node.status === 'in_progress') inProgressCount++
        totalHours += node.estimatedHours || 0
      }
      if (node.level === 'chapter') totalChapters++
      if (node.level === 'section') totalSections++
    })

    return {
      totalCourses,
      totalChapters,
      totalSections,
      totalHours,
      completedCount,
      inProgressCount,
      completionPercent: totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0
    }
  }, [data])
}
