# Architecture

**Analysis Date:** 2026-01-26

## Pattern Overview

**Overall:** Layered Server-Client Architecture with Feature Module Pattern

**Key Characteristics:**
- Next.js 15 App Router for frontend and API layer
- Feature-based module organization with clear boundaries
- Supabase for database, auth, and real-time synchronization
- Context-based state management for cross-component shared state
- Client and server separation with explicit Supabase client routing
- API routes act as data transformation and business logic layer

## Layers

**Presentation Layer (UI/Components):**
- Purpose: React components for user interface
- Location: `src/app/forge/`, `src/app/features/*/components/`
- Contains: Client components (.tsx), React hooks, UI state management
- Depends on: Feature hooks, shared utilities, context providers
- Used by: Pages and other components

**Feature Modules:**
- Purpose: Self-contained, reusable feature implementations
- Location: `src/app/features/*`
- Contains: Components, hooks, types, storage utilities, business logic
- Depends on: Shared utilities, context providers, Supabase clients
- Used by: Pages, other features, API routes
- Pattern: Each feature exports public API via `index.ts`, hides internal structure

**Business Logic / Service Layer:**
- Purpose: Data transformation, calculations, business rules
- Location: `src/app/api/*/lib/`, `src/app/features/*/lib/`
- Contains: Utility functions, calculators, storage adapters, type definitions
- Depends on: Supabase, external APIs
- Used by: API routes, components, hooks

**API/Data Layer:**
- Purpose: HTTP endpoints for frontend consumption and external integrations
- Location: `src/app/api/`
- Contains: Route handlers (GET, POST, PUT, DELETE), request validation, response transformation
- Depends on: Supabase clients, business logic libraries, cloud services
- Used by: Client components via fetch, external systems

**Database/Persistence Layer:**
- Purpose: Data storage and retrieval
- Location: `supabase/migrations/`, `src/lib/supabase/`
- Contains: Supabase configuration, type definitions, client setup
- Depends on: Supabase infrastructure
- Used by: API routes, server components, client components

**Shared Utilities:**
- Purpose: Cross-cutting concerns and reusable helpers
- Location: `src/app/shared/`
- Contains: UI utilities, hooks, helper functions, constants
- Depends on: Nothing (no upward dependencies)
- Used by: All layers

## Data Flow

**User Interaction → UI Update (Client-side):**

1. User interacts with React component (click, input, etc.)
2. Event handler calls custom hook or context action
3. Hook may call API endpoint or access localStorage
4. State updates trigger component re-renders
5. Framer Motion animations enhance visual feedback

**Server-initiated Data Load (Server Components + Hydration):**

1. Page component (Server Component) renders at request time
2. Server fetches data via `createClient()` from Supabase
3. Data passed to client components as props
4. Client components hydrate with server-rendered HTML
5. Client can refetch with stale data handlers

**API Route Data Fetching:**

1. Client component calls API route via fetch()
2. API route receives NextRequest
3. Route creates Supabase client via `createClient()` (server context)
4. Route queries database, transforms data, applies business logic
5. Route returns NextResponse with JSON
6. Client component updates state with response

**State Management:**

- **Session/Auth State:** Supabase auth session stored in cookies, synced across routes
- **User Context:** `ForgeProvider` maintains logged-in user, learning paths, streaks
- **Progress Context:** `ProgressProvider` tracks course completion, video progress, quiz scores
- **Velocity Context:** `UserVelocityProviderWrapper` tracks learning speed metrics
- **Learning Graph Context:** `UserLearningGraphProviderWrapper` manages knowledge relationships
- **Feature-specific State:** Zustand (path sync store), localStorage (progress storage), React hooks (local state)

## Key Abstractions

**Feature Modules:**
- Purpose: Encapsulated, reusable chunks of functionality with clear public API
- Examples: `src/app/features/progress/`, `src/app/features/chapter/`, `src/app/features/knowledge-map/`
- Pattern:
  - `index.ts` exports public interface only
  - `lib/` contains implementation details (types, hooks, storage, business logic)
  - `components/` contains UI components
  - `index.ts` composition re-exports: types, storage functions, hooks, context, components

**Context Providers:**
- Purpose: Share state across component tree without prop drilling
- Examples: `ProgressContext`, `ForgeProvider`, `ThemeProviderWrapper`
- Pattern: Context + custom hook for consumption
- Usage: Wrap RootLayout with providers to enable features

**Storage Adapters:**
- Purpose: Isolate data persistence (localStorage, Supabase, etc.)
- Examples: `src/app/features/progress/lib/progressStorage.ts`
- Pattern: Pure functions that read/write localStorage or query database
- Usage: Called from hooks and context to manage state persistence

**API Route Patterns:**
- Purpose: Data fetching, validation, transformation, business logic
- Location: `src/app/api/[domain]/route.ts` or `src/app/api/[domain]/[id]/route.ts`
- Pattern:
  - Async handler functions: `GET()`, `POST()`, `PUT()`, `DELETE()`
  - Supabase client created server-side
  - Request validation before processing
  - Errors caught and returned as NextResponse
  - Consistent response structure

**Type System:**
- Supabase types auto-generated from schema: `src/lib/supabase/types.ts`
- Domain-specific types in `src/app/features/*/lib/types.ts`
- API route DTOs defined in route files or `src/app/api/*/lib/types.ts`

## Entry Points

**Web Application:**
- Location: `src/app/page.tsx`
- Triggers: Direct navigation to `/`
- Responsibilities: Home page with hero, features overview, sections (KnowledgeUniverse, learning paths, CTA)

**Forge Platform (Authenticated):**
- Location: `src/app/forge/layout.tsx`, `src/app/forge/page.tsx`
- Triggers: Navigation to `/forge*`
- Responsibilities: Main learning platform shell with navigation, auth guard, context setup

**Map Visualization:**
- Location: `src/app/forge/map/page.tsx`
- Triggers: Navigation to `/forge/map`
- Responsibilities: Interactive hex grid visualization of learning map using Three.js/Three.js Canvas

**Chapter View:**
- Location: `src/app/features/chapter/`
- Triggers: User selects chapter in map or knowledge map
- Responsibilities: Chapter content display, prerequisites, homeworks, completions

**Progress Tracking:**
- Location: `src/app/forge/progress/page.tsx`
- Triggers: Navigation to `/forge/progress`
- Responsibilities: User learning progress visualization, stats, milestones

**API Entry Points:**
- `/api/map-nodes` - Fetch learning map nodes (GET, POST for batch)
- `/api/nodes/status` - Check content generation status
- `/api/chapters/[id]/homeworks` - Get homeworks for chapter
- `/api/progress/*` - Progress tracking and XP calculations
- `/api/user/learning-paths` - User's active learning paths
- `/api/agent/chat` - AI assistant conversation
- `/api/ai/generate-path` - Generate learning path with Claude
- `/api/bandit/*` - Multi-armed bandit for recommendations

## Error Handling

**Strategy:** Try-catch blocks in API routes and async operations, error logging, graceful fallbacks

**Patterns:**

```typescript
// API route pattern
try {
    const data = await supabase.from('table').select();
    if (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
} catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

**Fallback Patterns:**
- API routes fallback to direct queries if RPC functions unavailable
- Components use mock data if API fails
- localStorage persists state when server unreachable
- Suspense boundaries with skeleton loaders for lazy sections

## Cross-Cutting Concerns

**Logging:**
- Pattern: `console.error()`, `console.log()` throughout codebase
- Scope: Error logging in API routes, Supabase query failures, client-side issues

**Validation:**
- API route level: Manual validation of request params/body before processing
- Example: `src/app/api/map-nodes/route.ts` validates nodeIds array
- Supabase level: RLS (Row Level Security) policies, database constraints

**Authentication:**
- Pattern: Supabase Auth with cookies managed by SSR library
- Client: `createClient()` from `@supabase/ssr` (browser client, syncs cookies)
- Server: `createClient()` from server context (handles cookie setup)
- Admin: `createAdminClient()` for RLS bypass (seeding, background jobs)
- Enforcement: ForgeProvider checks auth, redirects unauthenticated users

**Theming:**
- Pattern: localStorage-persisted preference (light/dark/system)
- Provider: `ThemeProviderWrapper` sets CSS variables
- Usage: Tailwind dark mode with custom CSS properties

**Performance Optimization:**
- Lazy loading: React `lazy()` for below-fold sections (KnowledgeUniverse in home)
- Suspense: Boundaries with skeleton loaders
- Virtualization: `@tanstack/react-virtual` for large lists
- Caching: Supabase query caching, API response caching headers

---

*Architecture analysis: 2026-01-26*
