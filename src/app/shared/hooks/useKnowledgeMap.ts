// ============================================================================
// useKnowledgeMap Hook
// Hook for fetching knowledge map data from the API
// ============================================================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { KnowledgeMapData, MapNode, MapConnection } from '@/app/features/knowledge-map/lib/types'
import type { KnowledgeMapAPIResponse } from '@/app/api/knowledge-map/route'

export interface UseKnowledgeMapOptions {
  /** Filter by category slug */
  category?: string
  /** Include course connections */
  includeConnections?: boolean
  /** Use mock data as fallback if API fails */
  useMockFallback?: boolean
}

export interface UseKnowledgeMapResult {
  data: KnowledgeMapData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Transform API response to KnowledgeMapData with Map
 */
function transformToMapData(response: KnowledgeMapAPIResponse): KnowledgeMapData {
  const nodesMap = new Map<string, MapNode>()

  for (const [id, node] of Object.entries(response.nodes)) {
    nodesMap.set(id, node)
  }

  return {
    nodes: nodesMap,
    connections: response.connections,
    rootNodeIds: response.rootNodeIds
  }
}

/**
 * Hook for fetching knowledge map data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useKnowledgeMap({ category: 'development' })
 *
 * if (data) {
 *   // data.nodes is a Map<string, MapNode>
 *   // data.connections is MapConnection[]
 *   // data.rootNodeIds is string[]
 * }
 * ```
 */
export function useKnowledgeMap(options?: UseKnowledgeMapOptions): UseKnowledgeMapResult {
  const [data, setData] = useState<KnowledgeMapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options?.category) params.set('category', options.category)
      if (options?.includeConnections === false) params.set('connections', 'false')

      const response = await fetch(`/api/knowledge-map?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch knowledge map')
      }

      const apiResponse: KnowledgeMapAPIResponse = await response.json()
      const mapData = transformToMapData(apiResponse)
      setData(mapData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)

      // Fallback to mock data if enabled
      if (options?.useMockFallback) {
        try {
          // Dynamic import of mock data
          const { generateKnowledgeMapData } = await import('@/app/features/knowledge-map/lib/mapData')
          setData(generateKnowledgeMapData())
          setError(null) // Clear error if fallback succeeds
        } catch {
          // Keep the original error
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [options?.category, options?.includeConnections, options?.useMockFallback])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  }
}

/**
 * Hook for getting nodes at a specific level
 */
export function useKnowledgeMapNodes(
  data: KnowledgeMapData | null,
  parentId: string | null
) {
  return useMemo(() => {
    if (!data) return []

    const nodes: MapNode[] = []
    data.nodes.forEach(node => {
      if (parentId === null) {
        // Root level - get domain nodes
        if (node.level === 'domain') {
          nodes.push(node)
        }
      } else if (node.parentId === parentId) {
        nodes.push(node)
      }
    })

    return nodes
  }, [data, parentId])
}

/**
 * Hook for getting a specific node by ID
 */
export function useKnowledgeMapNode(
  data: KnowledgeMapData | null,
  nodeId: string | null
): MapNode | null {
  return useMemo(() => {
    if (!data || !nodeId) return null
    return data.nodes.get(nodeId) || null
  }, [data, nodeId])
}

/**
 * Hook for getting connections for a specific node
 */
export function useNodeConnections(
  data: KnowledgeMapData | null,
  nodeId: string | null
) {
  return useMemo(() => {
    if (!data || !nodeId) return { incoming: [], outgoing: [] }

    const incoming: MapConnection[] = []
    const outgoing: MapConnection[] = []

    for (const conn of data.connections) {
      if (conn.fromId === nodeId) {
        outgoing.push(conn)
      }
      if (conn.toId === nodeId) {
        incoming.push(conn)
      }
    }

    return { incoming, outgoing }
  }, [data, nodeId])
}

/**
 * Hook for getting the path from root to a specific node
 */
export function useNodePath(
  data: KnowledgeMapData | null,
  nodeId: string | null
): MapNode[] {
  return useMemo(() => {
    if (!data || !nodeId) return []

    const path: MapNode[] = []
    let currentId: string | null = nodeId

    while (currentId) {
      const node = data.nodes.get(currentId)
      if (!node) break

      path.unshift(node)
      currentId = node.parentId
    }

    return path
  }, [data, nodeId])
}
