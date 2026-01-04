// ============================================================================
// Supabase Module Exports
// ============================================================================

// Client utilities
export { createClient, resetClient } from './client'
export { createClient as createServerClient, createAdminClient } from './server'

// Realtime hooks (client-side only)
export {
    useRealtimeChapterStatus,
    useChapterStatusWithRealtime,
    type ChapterRealtimeStatus,
    type UseRealtimeChapterResult,
} from './useRealtimeChapter'

export {
    useRealtimeJobProgress,
    useRealtimeJobProgressByChapter,
    type JobProgress,
    type UseRealtimeJobProgressResult,
} from './useRealtimeJobProgress'

// Types
export * from './types'
