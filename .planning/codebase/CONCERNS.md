# Codebase Concerns

**Analysis Date:** 2026-01-26

## Tech Debt

### Missing Database Schema Migrations

**Area: Recommendations System**
- **Issue:** Recommendation feedback and dismissal tracking are stubbed with TODOs instead of persisted to database
- **Files:** `src/app/api/recommendations/route.ts` (lines 211, 223)
- **Impact:** User feedback on recommendations is only logged to console and never persisted, preventing ML-driven recommendation quality improvements. Data needed for analysis is permanently lost.
- **Fix approach:** Create `recommendation_dismissals` and `recommendation_feedback` tables in Supabase migrations, then implement database persistence in POST handler instead of console logging.

### Admin Role Check Missing

**Area: Challenge Review API**
- **Issue:** Endpoint has comment noting missing role-based access control
- **Files:** `src/app/api/remix/challenges/[id]/review/route.ts` (line 34)
- **Impact:** Any authenticated user can review challenges meant for admins only. Escalated privilege vulnerability.
- **Fix approach:** Add role/permission check in endpoint to verify user has admin status before allowing review operations.

### Incomplete OAuth Implementation

**Area: GitHub Authentication**
- **Issue:** Onboarding page has placeholder GitHub OAuth flow
- **Files:** `src/app/forge/onboarding/page.tsx` (line 31)
- **Impact:** Homework assignments requiring GitHub integration cannot complete the authentication handshake with real GitHub APIs. Feature is broken in production.
- **Fix approach:** Implement proper OAuth2 code exchange flow using GitHub API, store tokens securely in Supabase, validate authorization scopes.

## Type Safety Issues

### Excessive TypeScript Escapes (96+ occurrences)

**Area: API Routes and Admin Operations**
- **Issue:** Widespread use of `as any` type casts, particularly in Supabase operations. 41 files have `@ts-nocheck` or `@ts-ignore` directives.
- **Files with heavy usage:**
  - `src/app/api/oracle/accept-path/route.ts` (9 `as any` casts, lines 202, 279, 318, 326, 334, 390, 423, 459, 477)
  - `src/app/api/agent/sessions/[id]/route.ts` (9 `as any` casts)
  - `src/app/api/db/courses/[id]/route.ts` (9 `as any` casts)
  - `src/app/api/agent/sessions/route.ts` (7 casts)
  - `src/lib/agent/router.ts` (lines 93-116: explicit comment about bypassing types for non-existent tables)
- **Files with full `@ts-nocheck`:**
  - `src/app/features/adaptive-content/lib/learningEvents.ts`
  - `src/app/features/adaptive-content/lib/eventStore.ts`
  - `src/app/features/adaptive-content/lib/temporalPatternAnalyzer.ts`
  - `src/app/api/stats/route.ts`
  - And 37 more files
- **Impact:** Type system provides no safety for these code paths. Breaking changes in database schema won't be caught at build time. Refactoring tools (rename, extract) fail silently. IDE autocomplete is disabled.
- **Fix approach:**
  1. Regenerate Supabase types: `supabase gen types typescript --local`
  2. Create missing table migrations for `agent_usage_analytics`, missing progress tables, etc.
  3. Incrementally replace `as any` casts with proper type assertions or proper types
  4. Remove `@ts-nocheck` from files one at a time, fixing errors properly

### Missing Progress/User Table Migrations

**Area: User Progress Tracking**
- **Issue:** Multiple API routes query `user_progress` table that may not exist in migrations (uses `as unknown` in type assertions)
- **Files:**
  - `src/app/api/recommendations/route.ts` (line 112: type casting for user_progress table)
  - `src/app/api/bandit/stats/route.ts` (assumes tables exist)
  - `src/app/api/progress/summary/route.ts`
- **Impact:** Runtime errors when queries execute on deployments lacking the table. Queries fail silently or throw unhandled errors.
- **Fix approach:** Audit all table references, create migrations for missing tables, regenerate types.

## Known Bugs

### Timezone Handling Bug in Mock Data

**Bug: Timezone-aware date shifting**
- **Symptoms:** Users in non-UTC timezones see incorrect dates when creating/viewing due dates
- **Files:** `src/app/forge/lib/mockData.ts` (line 247 - marked as "BUG: This doesn't account for timezone offset")
- **Trigger:** Any date operation using `toISOString().split('T')[0]` converts to UTC before formatting
- **Workaround:** None implemented
- **Example:** A user in Australia selecting "Jan 25" will see it stored as "Jan 24" due to UTC conversion
- **Fix approach:** Use date-fns or dayjs `format(date, 'yyyy-MM-dd')` to preserve local timezone instead of converting to UTC

### Incomplete Focus Node Centering

**Area: Knowledge Map**
- **Issue:** Code to center selected nodes in viewport is stubbed out
- **Files:** `src/app/features/knowledge-map/lib/useSceneGraph.ts` (lines 754-761)
- **Symptoms:** Clicking nodes to focus them doesn't center them on screen, offsetting calculations incomplete
- **Trigger:** User clicks "focus" on a node
- **Workaround:** Manual pan/zoom to center
- **Fix approach:** Implement viewport dimension calculation and proper offset math to center focused node

### Debounce Logic Not Implemented

**Area: Chapter Content Rendering**
- **Issue:** useDebounce hook intended for search inputs is left as skeleton code
- **Files:** `src/app/features/chapter/lib/chapterData.ts` (line 411 - marked "TODO: Implement debouncing logic")
- **Symptoms:** Search inputs may make excessive API calls without debouncing
- **Trigger:** Rapid user input in search fields
- **Workaround:** Manual pauses between inputs
- **Fix approach:** Implement useDebounce using useState/useEffect with timer cleanup

## Error Handling Issues

### Lenient Error Handling (Silent Failures)

**Area: Learning Paths API**
- **Issue:** Multiple APIs silently return empty arrays/objects on error instead of propagating errors
- **Files:**
  - `src/app/api/user/learning-paths/route.ts` (lines 49-51, 86-88: catches all errors, returns empty array)
  - `src/app/api/bandit/stats/route.ts` (lines 76-77: only logs to console)
  - `src/app/api/knowledge-map/route.ts`
- **Impact:** UI shows no content without indication of why, making debugging user issues difficult. Production errors are silently logged and buried in server logs.
- **Fix approach:** Implement proper error response codes, client-side error boundaries, user-facing error messages. Log with context (user_id, timestamp, request data).

### Missing Error Handlers in Long-Running Operations

**Area: Content Generation**
- **Issue:** Chapter generation chains multiple API calls with minimal error handling
- **Files:** `src/app/api/content/generate-chapter/route.ts` (791 lines, catch blocks at end only)
- **Impact:** Mid-pipeline failures don't rollback earlier operations. Partial state created in database.
- **Fix approach:** Implement transaction-style operations or cleanup handlers for partial failures.

### Console-Only Error Logging

**Area: Agent Router**
- **Issue:** Failed usage analytics logging just logs to console, doesn't fail request
- **Files:** `src/lib/agent/router.ts` (lines 117-120)
- **Impact:** Analytics data is lost, errors accumulate unnoticed, observability gaps
- **Fix approach:** Implement structured logging, send to observability platform, alert on repeated failures

## Performance Bottlenecks

### Canvas Rendering Scale Limits

**Area: Knowledge Universe**
- **Issue:** Canvas 2D renderer documented to work well <1000 nodes, WebGL required for 10k+ nodes
- **Files:**
  - `src/app/features/knowledge-universe/components/UniverseCanvas.tsx` (lines 1-19)
  - `src/app/features/knowledge-universe/lib/webglRenderer.ts` (897 lines)
- **Problem:** No automatic fallback or warning when canvas would render too many nodes. Performance degrades sharply beyond ~1000 nodes.
- **Improvement path:**
  1. Implement node count threshold detection
  2. Auto-select renderer based on node count (canvas2d <1000, webgl >5000)
  3. Add clustering/LOD strategies for mid-range (1000-5000)
  4. Profile actual frame rates, implement frame budgeting

### Large Component Files Creating Bundle Overhead

**Area: Feature Module Sizes**
- **Issue:** Multiple components exceed 1000+ lines, making lazy loading ineffective
- **Files with >800 lines:**
  - `src/app/features/adaptive-content/lib/conceptEntanglementGraph.ts` (1212 lines)
  - `src/app/features/chapter/variants/ElegantVariant.tsx` (1156 lines)
  - `src/app/features/lesson-content/components/CustomBlockRenderer.tsx` (1153 lines)
  - `src/app/features/knowledge-universe/components/UniverseCanvas.tsx` (944 lines)
  - `src/app/features/theme/lib/colorPaletteGenerator.ts` (948 lines)
  - `src/app/features/knowledge-universe/lib/webglRenderer.ts` (897 lines)
  - `src/app/features/knowledge-map/lib/useSceneGraph.ts` (889 lines)
- **Impact:** Slow time-to-interactive for initial page load, bundle size penalty
- **Improvement path:** Extract reusable logic into utility modules, split component variants, implement code splitting at route boundaries

### Excessive Console Logging in Production

**Area: API Routes and Features**
- **Issue:** 196 console log calls across 67 API route files
- **Files:** Nearly every API route has 1-20 console.log/debug/error statements
- **Impact:** Development/debug logs persisting to production logs, increased log volume, privacy concerns with detailed logging
- **Fix approach:** Implement conditional logging based on environment, use proper logger with log levels, configure to be silent in production

## Fragile Areas

### Oracle Path Acceptance (Complex State Management)

**Area: Learning Path Integration**
- **Files:** `src/app/api/oracle/accept-path/route.ts` (477 lines)
- **Why fragile:**
  - Complex multi-step process (sort nodes, create parents, create nodes, create courses, queue generation)
  - Uses Maps for state tracking (`mapNodeBySlug`, `mapNodeById`, `mapNodeByName`) - prone to key collision bugs
  - Multiple type assertions with `as any` (lines 169, 176, 177, 178, 202, 279, 318, 326, 334, 390, 423, 459, 477)
  - No transaction boundaries - partial failures leave orphaned records
  - Slug generation deterministic but no collision handling (line 88-94)
- **Safe modification:**
  1. Add comprehensive logging at each step with node IDs
  2. Write tests covering happy path and all error scenarios
  3. Add idempotency checks (detect if path already accepted)
  4. Implement rollback logic or transaction-style wrapper
  5. Replace `as any` casts with proper types

### Adaptive Content Event System

**Area: Learning Analytics and Adaptation**
- **Files:**
  - `src/app/features/adaptive-content/lib/learningEvents.ts` (entire file `@ts-nocheck`)
  - `src/app/features/adaptive-content/lib/eventStore.ts` (entire file `@ts-nocheck`)
  - `src/app/features/adaptive-content/lib/temporalPatternAnalyzer.ts` (entire file `@ts-nocheck`)
- **Why fragile:**
  - Full TypeScript compiler disabled, no type checking
  - localStorage-based persistence (string conversions, serialization bugs likely)
  - Complex temporal analysis with potential off-by-one errors in time window calculations
  - No test coverage visible in event handling
- **Safe modification:**
  1. Enable TypeScript checking incrementally
  2. Add event validation/schema validation
  3. Write property-based tests for temporal calculations
  4. Test event store corruption scenarios
  5. Document event schema versions for migrations

### Knowledge Universe Semantic Zoom

**Area: Visualization**
- **Files:**
  - `src/app/features/knowledge-universe/components/UniverseCanvas.tsx` (944 lines, complex rendering pipeline)
  - `src/app/features/knowledge-universe/lib/zoomLevelManager.ts`
- **Why fragile:**
  - Multiple coordinate systems (world, screen, semantic levels)
  - Opacity transitions with opacity override maps
  - Label visibility threshold calculations
  - WebGL/Canvas 2D rendering path divergence
- **Safe modification:**
  1. Add visual regression tests (screenshot comparisons at different zoom levels)
  2. Isolate coordinate system conversions into pure functions with unit tests
  3. Document opacity calculation logic with examples
  4. Create zoom level test fixtures covering all semantic levels

## Security Considerations

### Missing Admin Role Checks

**Area: Content Management APIs**
- **Risk:** Unauthenticated or low-privileged users can trigger expensive operations
- **Files:**
  - `src/app/api/remix/challenges/[id]/review/route.ts` (line 34 TODO)
  - `src/app/api/content/generate-chapter/route.ts` (uses admin client with note about bypassing RLS in dev)
- **Current mitigation:** Some endpoints check user existence, but no role-based access control
- **Recommendations:**
  1. Add role/permission checks to all admin endpoints
  2. Create middleware for role-based route protection
  3. Audit all "reset", "seed", "generate" endpoints for privilege escalation
  4. Implement permission matrix in documentation

### GitHub OAuth Incomplete

**Area: Third-party Integration**
- **Risk:** Broken OAuth flow means secrets may not be properly stored or validated
- **Files:** `src/app/forge/onboarding/page.tsx` (line 31)
- **Current mitigation:** None - flow is placeholder
- **Recommendations:**
  1. Store OAuth tokens in encrypted Supabase column, not localStorage
  2. Validate token expiry before use
  3. Implement token refresh logic
  4. Use authorization code flow (never pass tokens in URLs)
  5. Implement PKCE for client-side auth

### localStorage Usage for Sensitive Data

**Area: Client-Side Persistence**
- **Risk:** User learning state, progress, preferences stored in localStorage - accessible to XSS attacks
- **Files:** 47+ files use localStorage (bookmarks, theme, learning DNA, comprehension state, etc.)
- **Examples:**
  - `src/app/features/bookmarks/lib/useBookmarks.ts`
  - `src/app/features/theme/lib/ThemeContext.tsx`
  - `src/app/features/adaptive-content/lib/comprehensionStorage.ts`
  - `src/app/features/learning-dna/lib/dnaStorage.ts`
- **Current mitigation:** None evident - localStorage is unencrypted
- **Recommendations:**
  1. Store only non-sensitive preference data in localStorage (theme, layout)
  2. Move user progress/achievements/learning state to Supabase with proper RLS
  3. For critical data in localStorage, implement client-side encryption (TweetNaCl.js)
  4. Add CSP headers to prevent XSS injection
  5. Implement subresource integrity for external scripts

### Type System Bypasses Hide Vulnerabilities

**Area: Type Safety**
- **Risk:** `@ts-nocheck` and `as any` casts prevent catch of security-relevant type errors
- **Files:** 41 files with compiler disabled
- **Specific risk:** Schema changes in Supabase (adding required fields, changing types) won't trigger TypeScript errors
- **Recommendations:**
  1. Prioritize enabling TypeScript on auth, payment, and data mutation code paths
  2. Use stricter tsconfig settings (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`)

## Missing Critical Features

### Recommendation Feedback Loop

**Area: ML/Personalization**
- **Problem:** System generates recommendations but has no mechanism to collect or act on feedback
- **Blocks:** Continuous improvement of recommendation quality, A/B testing
- **Files:** `src/app/api/recommendations/route.ts` (lines 211, 223 - stubs)
- **Fix:** Implement feedback table, aggregate feedback signals, update recommendation weights

### Transaction/Rollback Handling

**Area: Data Integrity**
- **Problem:** Multi-step operations (accepting paths, generating courses) have no rollback mechanism
- **Blocks:** Reliable course creation, path acceptance in production
- **Files:** `src/app/api/oracle/accept-path/route.ts`, `src/app/api/content/generate-chapter/route.ts`
- **Fix:** Implement Saga pattern or use Supabase transactions, add idempotency keys

## Test Coverage Gaps

### Adaptive Content System Untested

**Area: Temporal Pattern Analysis**
- **What's not tested:**
  - Event ingestion and serialization to localStorage
  - Temporal pattern analysis algorithms (window calculations, trend detection)
  - Concept entanglement graph traversal and repair path generation
- **Files:**
  - `src/app/features/adaptive-content/lib/temporalPatternAnalyzer.ts` (803 lines, no tests found)
  - `src/app/features/adaptive-content/lib/conceptEntanglementGraph.ts` (1212 lines, no tests found)
  - `src/app/features/adaptive-content/lib/comprehensionStateMachine.ts` (891 lines, no visible tests)
- **Risk:** Algorithms can silently produce incorrect learning paths/interventions affecting user experience
- **Priority:** HIGH - this is core to platform value proposition

### Oracle Path Generation Untested

**Area: Learning Path Generation**
- **What's not tested:** Path acceptance, node creation, course creation pipeline
- **Files:** `src/app/api/oracle/accept-path/route.ts` (477 lines)
- **Risk:** Partial failures, orphaned records, incorrect path structures
- **Priority:** HIGH - critical user-facing feature

### Knowledge Universe Rendering Untested

**Area: Complex Visualization**
- **What's not tested:**
  - Canvas 2D rendering with culling logic
  - WebGL fallback behavior
  - Semantic zoom transitions
  - Coordinate system conversions
- **Files:**
  - `src/app/features/knowledge-universe/components/UniverseCanvas.tsx` (944 lines)
  - `src/app/features/knowledge-universe/lib/webglRenderer.ts` (897 lines)
- **Risk:** Visual glitches, performance issues not caught until user testing
- **Priority:** MEDIUM - affects UX but not core functionality

### API Error Scenarios

**Area: API Routes**
- **What's not tested:**
  - Network failures, timeouts
  - Database constraint violations
  - Missing/malformed input validation
  - Concurrent request handling
- **Files:** Most API routes have minimal error paths tested
- **Risk:** Unexpected server crashes, data corruption on concurrent writes
- **Priority:** HIGH - affects reliability

## Scaling Limits

### Database Connection Pooling

**Area: Supabase Client Management**
- **Current capacity:** No explicit pooling configuration detected
- **Limit:** Supabase free tier allows limited concurrent connections; paying tiers scale but have per-plan limits
- **Scaling path:**
  1. Implement connection pooling with PgBouncer (managed by Supabase)
  2. Add query batching for bulk operations
  3. Implement caching layer (Redis) for frequently queried data
  4. Monitor connection usage in production

### Canvas Rendering Scale

**Area: Knowledge Universe Visualization**
- **Current capacity:** Canvas 2D works well <1000 nodes, degrades sharply beyond
- **Limit:** User perceives lag >100ms frame time (drops below 60fps)
- **Scaling path:**
  1. Implement automatic WebGL fallback
  2. Add node culling (off-screen nodes not rendered)
  3. Implement clustering for far-zoom levels
  4. Use OffscreenCanvas for parallel rendering
  5. Profile and optimize hot paths with DevTools

### Concurrent Content Generation

**Area: LLM-based Content**
- **Current capacity:** Content generation API routes create individual jobs
- **Limit:** Anthropic API rate limits, token budget, queue time
- **Scaling path:**
  1. Implement job queue (Bull, RabbitMQ) instead of inline generation
  2. Batch content requests where possible
  3. Add caching for similar content
  4. Implement exponential backoff for rate limit hits
  5. Monitor token usage per user and per day

## Dependencies at Risk

### Google Gemini Fallback Chain

**Area: AI Content Generation**
- **Risk:** Cloud service `content-generator` API in Python (not in this repo, but imported) could go down
- **Impact:** Content generation fails, feature broken
- **Current mitigation:** Anthropic SDK as fallback (in this repo), but fallback logic may not be complete
- **Files:**
  - `src/app/api/content/generate-chapter/route.ts` (line 5: note about local fallback)
  - Python service in `cloud/content-generator/`
- **Migration plan:** Ensure Anthropic fallback is complete, add retry logic with exponential backoff, document fallback behavior

### Three.js WebGL Rendering

**Area: Knowledge Universe**
- **Risk:** Three.js is large dependency (100KB+), WebGL fallback may not be accessible on older devices
- **Impact:** Visualization fails on older browsers/devices
- **Current mitigation:** Canvas 2D fallback exists
- **Migration plan:** Keep Canvas 2D as default for broad compatibility, use feature detection for WebGL

## Observability Gaps

### Missing Structured Logging

**Area: Production Debugging**
- **Issue:** 196+ console.log calls across codebase, not structured for aggregation
- **Impact:** Logs are hard to parse, correlate across requests, and search in production
- **Fix approach:** Implement structured logging library (Pino, Winston), add request ID correlation, log to centralized service (DataDog, Sentry)

### No Error Tracking

**Area: Production Issues**
- **Issue:** Failed operations are logged but not aggregated for alerting
- **Impact:** Silent failures accumulate, users affected before team notices
- **Fix approach:** Integrate Sentry or DataDog for error tracking, set up alerts for repeated errors

### Missing Performance Monitoring

**Area: Production Performance**
- **Issue:** No evidence of APM (Application Performance Monitoring)
- **Impact:** Slow endpoints not detected, users experience poor performance
- **Fix approach:** Add APM middleware, track p99 latencies, set up SLOs

---

*Concerns audit: 2026-01-26*
