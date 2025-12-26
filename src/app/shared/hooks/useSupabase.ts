// ============================================================================
// useSupabase Hook
// Base hook for Supabase client in React components
// ============================================================================

'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to get the Supabase browser client
 * Uses memoization to ensure the same client instance is reused
 *
 * @example
 * ```tsx
 * const supabase = useSupabase()
 * const { data } = await supabase.from('courses').select()
 * ```
 */
export function useSupabase() {
  const supabase = useMemo(() => createClient(), [])
  return supabase
}
