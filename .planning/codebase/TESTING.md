# Testing Patterns

**Analysis Date:** 2026-01-26

## Test Framework

**Runner:**
- Vitest 4.0.16
- Config: `vitest.config.ts`
- Environment: jsdom (browser environment simulation)
- Globals enabled (no need to import `describe`, `it`, `expect`, etc.)

**Assertion Library:**
- Vitest built-in assertions
- Testing Library DOM matchers via `@testing-library/jest-dom`

**Run Commands:**
```bash
npm run test              # Run Vitest in watch mode
npm run test:run         # Run tests once (single execution)
```

## Test File Organization

**Location:**
- Co-located with source files or in `src/tests/` directory
- `src/app/features/knowledge-universe/components/HierarchicalMap.test.tsx` - unit/component tests
- `src/app/features/knowledge-universe/components/HierarchicalMap.integration.test.tsx` - integration tests
- `src/tests/*.test.ts` - standalone utility and functional tests

**Naming:**
- Unit/component tests: `{ComponentName}.test.tsx` or `{FunctionName}.test.ts`
- Integration tests: `{ComponentName}.integration.test.tsx`
- Test files are NOT committed/built (excluded in tsconfig)

**Structure:**
```
src/
├── app/features/
│   └── feature-name/
│       ├── components/
│       │   ├── Component.tsx
│       │   ├── Component.test.tsx          # Unit test
│       │   └── Component.integration.test.tsx  # Integration test
│       └── lib/
│           ├── hook.ts
│           └── hook.test.ts
├── tests/
│   ├── fixtures/                # Test data
│   │   └── map-nodes.json
│   ├── setup.ts                 # Global test setup
│   ├── oracle.test.ts           # Standalone tests
│   └── state-machine.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
/**
 * HierarchicalMap Component Tests
 *
 * Tests for the hierarchical map visualization including:
 * - Rendering nodes at different levels
 * - Navigation between levels (drill-down, go back)
 * - Grouping nodes by parent (topics)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HierarchicalMap } from './HierarchicalMap';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockNodes = [
    // Mock data for testing
];

// ============================================================================
// TEST SETUP
// ============================================================================

const mockFetch = vi.fn();

beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: mockNodes }),
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ============================================================================
// RENDERING TESTS
// ============================================================================

describe('HierarchicalMap - Node Rendering', () => {
    it('should render the component without crashing', async () => {
        render(<HierarchicalMap />);
        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
        // Implementation
    });
});

// ============================================================================
// LEVEL TRANSITIONS
// ============================================================================

describe('HierarchicalMap - Level Transitions', () => {
    it('should transition from domain to topics on drill-down', async () => {
        // Implementation
    });
});
```

**Patterns:**
- Use section headers with `// ============` dividers for organization
- Group related tests in `describe()` blocks
- Setup mocks and fixtures before test suites
- Use `beforeEach()` and `afterEach()` for per-test cleanup
- Async tests use `async`/`await` with `waitFor()`

## Mocking

**Framework:** Vitest's built-in `vi` mock utilities

**Patterns:**

```typescript
// Mock functions
const mockFetch = vi.fn();
mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
mockFetch.mockRejectedValue(new Error("Network error"));

// Mock modules/globals
global.fetch = mockFetch;
global.ResizeObserver = MockResizeObserver;
HTMLCanvasElement.prototype.getContext = vi.fn();

// Restore after tests
afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});
```

**Setup File (`src/test/setup.ts`):**

Global mocks initialized in setupFiles:
- `ResizeObserver` - mocked with callback execution and immediate invocation
- `requestAnimationFrame` / `cancelAnimationFrame` - mapped to setTimeout
- Canvas context (`getContext('2d')`) - mocked with all 2D canvas methods
- Browser APIs - `window.devicePixelRatio`, `getBoundingClientRect`, `clientWidth`/`clientHeight`

**What to Mock:**
- External API calls (fetch, axios)
- Browser APIs (ResizeObserver, requestAnimationFrame, canvas)
- DOM measurements (getBoundingClientRect, clientWidth)
- Global state or context (when not testing integration)

**What NOT to Mock:**
- React components being tested
- React hooks (use real implementation)
- DOM manipulation (use Testing Library)
- Internal utility functions (test with real implementation)

## Fixtures and Test Data

**Test Data:**
```typescript
// src/test/fixtures/map-nodes.json
{
    "nodes": [
        { "id": "domain-1", "parent_id": null, "name": "Frontend Development", "node_type": "domain", "depth": 0 },
        { "id": "topic-1", "parent_id": "domain-1", "name": "HTML & CSS", "node_type": "topic", "depth": 1 }
    ],
    "connections": []
}

// Usage in tests
import realData from '@/test/fixtures/map-nodes.json';

const realNodes = realData.nodes;
const getNodesByDepth = (depth: number) => realNodes.filter(n => n.depth === depth);
```

**Location:**
- `src/test/fixtures/` - shared test data files
- Can be JSON, TypeScript, or JS files
- Import directly and use in test helpers

## Coverage

**Requirements:** Not enforced (no coverage thresholds configured)

**View Coverage:**
```bash
# Add to vitest.config.ts if needed:
coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
}
```

## Test Types

**Unit Tests:**
- Scope: Single function or hook in isolation
- Approach: Mock external dependencies, test input/output
- Location: `*.test.ts` files in same directory as source
- Example: Testing `getBranchQuestions()` with mock data

```typescript
describe('Oracle Questions Configuration', () => {
    it('should return beginner questions for beginner experience', () => {
        const questions = getBranchQuestions('beginner');
        expect(questions).toEqual(BEGINNER_QUESTIONS);
        expect(questions.length).toBe(3);
    });
});
```

**Component/Integration Tests:**
- Scope: Component rendering, user interactions, data flow
- Approach: Render component, simulate user actions, assert DOM state
- Location: `*.test.tsx` files alongside components
- Example: Testing HierarchicalMap drill-down navigation

```typescript
describe('HierarchicalMap - Level Transitions', () => {
    it('should transition from domain (1) to topics (7) on drill-down', async () => {
        const { container } = render(<HierarchicalMap />);

        // Wait for root level
        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Click to drill into domain
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        // Assert new level
        await waitFor(() => {
            expect(screen.getByText(/7 items/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });
});
```

**Integration Tests (Real Data):**
- Scope: Component behavior with actual database-like data
- Approach: Use real fixtures, verify complete workflows
- Location: `*.integration.test.tsx`
- Example: HierarchicalMap with 360-node real dataset

```typescript
/**
 * HierarchicalMap Integration Tests
 *
 * Tests against REAL DATA from the database.
 * Uses fixture from src/test/fixtures/map-nodes.json
 *
 * Real data structure (360 nodes total):
 * - Depth 0: 1 domain (Frontend Development)
 * - Depth 1: 7 topics
 * - Depth 2: 23 skills
 * - Depth 3: 64 courses
 * - Depth 4: 265 lessons
 */

describe('Real Data Structure Verification', () => {
    it('should have correct total node count', () => {
        expect(realNodes.length).toBe(360);
    });

    it('should have 7 topics at depth 1', () => {
        const topics = getNodesByDepth(1);
        expect(topics.length).toBe(7);
        topics.forEach(t => expect(t.node_type).toBe('topic'));
    });

    it('should have valid parent-child relationships', () => {
        for (const node of realNodes) {
            if (node.parent_id) {
                const parent = getNodeById(node.parent_id);
                expect(parent).toBeDefined();
                expect(node.depth).toBe(parent!.depth + 1);
            }
        }
    });
});

describe('HierarchicalMap - Rendering with Real Data', () => {
    it('should render with real data without crashing', async () => {
        render(<HierarchicalMap />);
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/map/nodes');
        });
    });
});
```

**E2E Tests:**
- Framework: Not used currently
- Could be implemented with Playwright or Cypress if needed

## Common Patterns

**Async Testing:**
```typescript
// Using waitFor for async operations
it('should fetch data on mount', async () => {
    render(<Component />);

    await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/endpoint');
    });
});

// Using async/await with fireEvent
it('should handle async state updates', async () => {
    render(<Component />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
});
```

**Error Testing:**
```typescript
// Testing error states
it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
    });

    render(<Component />);

    await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
});

// Testing error boundaries
it('should display error message on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<Component />);

    await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
});
```

**Data-Driven Testing:**
```typescript
// Using arrays for parameterized tests
const experiences = ['beginner', 'intermediate', 'advanced'];

experiences.forEach(exp => {
    it(`should get correct questions for ${exp} experience`, () => {
        const questions = getBranchQuestions(exp);
        expect(questions).toBeDefined();
        expect(questions.length).toBeGreaterThan(0);
    });
});
```

**User Interaction Testing:**
```typescript
// Simulate user actions
it('should update state on user input', async () => {
    render(<Component />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(input).toHaveValue('new value');
});

// Test keyboard events
it('should handle keyboard shortcuts', () => {
    render(<Component />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

## Test Configuration Details

**Vitest Config (`vitest.config.ts`):**
- Environment: `jsdom` (browser simulation)
- Globals: `true` (no need to import test functions)
- Include pattern: `**/*.test.ts` and `**/*.test.tsx`
- Exclude: `node_modules`, `.next`
- Setup file: `src/test/setup.ts` (global mocks and utilities)
- Path aliases: `@/` resolves to `./src`

**Available Testing Library Functions:**
- `render()` - render React component
- `screen` - query component output
- `fireEvent` - simulate user interactions
- `waitFor()` - wait for async assertions
- `act()` - wrap state updates
- Queries: `getByRole()`, `getByText()`, `getByTestId()`, `queryBy*`, `findBy*`

---

*Testing analysis: 2026-01-26*
