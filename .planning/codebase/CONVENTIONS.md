# Coding Conventions

**Analysis Date:** 2026-01-26

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `HierarchicalMap.tsx`, `ChapterView.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useChapterState.ts`, `usePlaybackSpeed.ts`)
- Utilities/libraries: camelCase (e.g., `conductorStorage.ts`, `chapterGraph.ts`)
- Storage modules: `*Storage.ts` suffix (e.g., `conductorStorage.ts`, `bookmarkStorage.ts`)
- Test files: source name + `.test.ts` or `.integration.test.tsx` suffix (e.g., `HierarchicalMap.test.tsx`, `HierarchicalMap.integration.test.tsx`)
- Type definition files: `*Types.ts` or `types.ts` (e.g., `conductorTypes.ts`, `types.ts`)

**Functions:**
- Hooks: camelCase with `use` prefix (e.g., `useChapterState()`, `usePlaybackSpeed()`)
- Utility functions: camelCase (e.g., `getBranchQuestions()`, `getNodesByDepth()`)
- Storage accessors: camelCase with `get/save/update` verbs (e.g., `getProfile()`, `saveProfile()`, `updateProfile()`)
- React components: PascalCase (e.g., `ChapterView()`, `HierarchicalMap()`)

**Variables:**
- Local variables: camelCase (e.g., `currentSection`, `expandedSection`, `showSpeedToast`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `PRESET_SPEEDS`, `MIN_SPEED`, `MAX_SPEED`, `STORAGE_KEYS`)
- Object properties: camelCase (e.g., `isPlaying`, `isMuted`, `courseInfo`)
- Boolean flags: prefix with `is`, `has`, `can`, `show`, `enable` (e.g., `isPlaying`, `hasActiveHomework`, `showQuiz`, `enableVideoControls`)

**Types:**
- Interface names: PascalCase (e.g., `ChapterState`, `ChapterStateConfig`, `LearnerProfile`)
- Type aliases: PascalCase (e.g., `MessageRole`, `ConversationStage`, `DifficultyLevel`)
- Enum-like unions: lowercase with pipes (e.g., `"bug" | "smell" | "missing_feature"`)

## Code Style

**Formatting:**
- Prettier is implicitly used (configured via eslint-config-next)
- 4-space indentation
- Single quotes for strings (JavaScript/TypeScript)
- Semicolons required at end of statements
- Max line length: enforced by ESLint

**Linting:**
- ESLint config: `eslint.config.mjs` using modern ESLint 9 flat config
- Base configs: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Enforces Next.js and React/TypeScript best practices
- Disables linting for generated files (`.next/`, `.next/types/`)

## Import Organization

**Order:**
1. React and Next.js imports (`import React`, `import { NextResponse }`)
2. Third-party library imports (`framer-motion`, `zustand`, `@supabase/*`, etc.)
3. Local absolute imports using `@/` path alias (e.g., `@/app/features`, `@/lib/supabase`)
4. Local relative imports (rare, prefer absolute)

**Path Aliases:**
- `@/` maps to `./src/` - use for all imports from the src directory
- Example: `import { Progress } from "@/app/features"` instead of `import { Progress } from "../../features"`

**Barrel Files:**
Each feature exports a public API via `index.ts`:
- `src/app/features/chapter/index.ts` - exports all public components, hooks, and types
- Components sub-path: `src/app/features/chapter/components/index.ts` - exports only components
- Library sub-path: `src/app/features/chapter/lib/index.ts` - exports hooks, utilities, types
- Imports: use namespace import pattern `import { Component } from "@/app/features/chapter"`

## Error Handling

**Patterns:**
- Try-catch blocks in async functions (API routes, effects)
- Explicit error type checking: `err instanceof Error ? err.message : "An error occurred"`
- Console logging for errors in server-side code: `console.error("Operation name error:", error)`
- Error boundary approach for React components (use Suspense/error.tsx in Next.js 15)
- API routes return `NextResponse.json()` with status codes for errors

**Examples:**
```typescript
// API Route error handling
try {
    const result = await operation();
    return NextResponse.json(result);
} catch (error) {
    console.error("Operation name error:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
}

// Component error handling
try {
    if (!condition) {
        throw new Error("Validation failed");
    }
} catch (err) {
    setError(err instanceof Error ? err.message : "An error occurred");
}
```

## Logging

**Framework:** Console API (`console.error()`, `console.log()`)

**Patterns:**
- Server-side: `console.error("operation-name error:", error)` with specific operation context
- Client-side: minimal logging, avoid console logs in production code
- Log errors with context: operation name or component name as prefix
- No custom logger abstraction - use native console

**Examples:**
```typescript
console.error("GET /api/chapters/[id]/homeworks error:", error);
console.error("get_chapter_homeworks error:", error);
console.log("Component mounted with", props);
```

## Comments

**When to Comment:**
- Complex algorithm logic requiring explanation
- Non-obvious conditional branches
- Business logic rationale
- Integration points between layers
- Workarounds or technical debt items

**JSDoc/TSDoc:**
- Use JSDoc for functions with complex signatures or side effects
- Use single-line JSDoc for simple functions
- Include `@param`, `@returns` for public APIs
- Include `@deprecated` for legacy code

**Examples:**
```typescript
/**
 * Unified chapter state hook
 * Consolidates shared state logic from VariantA, VariantC, and VariantD
 */
export function useChapterState(config: ChapterStateConfig): ChapterState {
    // Implementation
}

/**
 * HierarchicalMap Component Tests
 *
 * Tests for the hierarchical map visualization including:
 * - Rendering nodes at different levels
 * - Navigation between levels (drill-down, go back)
 * - Grouping nodes by parent (topics)
 */
```

## Function Design

**Size:**
- Prefer functions under 100 lines
- Extract complex logic into separate utility functions
- Use composition over large parameter lists

**Parameters:**
- Prefer configuration objects over many positional parameters
- Name configuration interfaces: `{ComponentName}Config` (e.g., `ChapterStateConfig`)
- Example: `useChapterState(config: ChapterStateConfig)` instead of `useChapterState(courseInfo, sections, initialSection, enableVideoControls)`

**Return Values:**
- Functions return typed values: use TypeScript for strict return types
- Hooks return objects with methods/state (not arrays)
- Example: `{ speed, setSpeed, increase, decrease }` pattern instead of `[speed, setSpeed, increase, decrease]`

## Module Design

**Exports:**
- Feature modules export via `index.ts` barrel files
- Organize exports into sections: components, hooks, types, utilities
- Use namespace imports when possible: `import { Component } from "@/app/features/feature"`

**Barrel Files Example:**
```typescript
// src/app/features/chapter/index.ts
export { ChapterView } from "./ChapterView";
export type { ChapterViewProps } from "./ChapterView";

export { useChapterState } from "./lib/useChapterState";
export type { ChapterState, ChapterStateConfig } from "./lib/useChapterState";

export { ChapterSection } from "./lib/chapterData";
export type { CourseInfo, SectionMetadata } from "./lib/chapterData";
```

**Storage Pattern:**
- Storage utilities in `lib/*Storage.ts` files
- Consistent interface: `{ get(), set(), update(), remove() }`
- localStorage-backed with JSON serialization
- Example: `conductorStorage.getProfile()`, `learnerProfileStorage.saveProfile()`

## TypeScript

**Strict Mode:**
- `strict: true` in tsconfig.json
- All variables require explicit types
- No implicit `any`
- No null/undefined without explicit handling

**Type Organization:**
- Store all types in `types.ts` or `*Types.ts` files
- Import types with `type` keyword: `import type { MyType } from "@/..."`
- Define interfaces for objects, type aliases for unions/functions

## Component Patterns

**React Components:**
- Use functional components only (no class components)
- Use hooks for state management
- "use client" directive at top of client components
- Props interface named `{ComponentName}Props`

**Feature Module Structure:**
```
feature-name/
├── index.ts                 # Public API exports
├── components/
│   ├── Component1.tsx
│   ├── Component2.tsx
│   └── index.ts            # Component exports
├── lib/
│   ├── useHook.ts
│   ├── utility.ts
│   ├── *Storage.ts
│   ├── types.ts
│   └── index.ts            # Library exports
```

## Testing Considerations

- Organize test files alongside source files
- Use `.test.ts` suffix for unit tests
- Use `.integration.test.tsx` suffix for component/integration tests
- Follow test structure: SETUP → TEST SUITES → CLEANUP

---

*Convention analysis: 2026-01-26*
