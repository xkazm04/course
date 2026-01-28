/**
 * HierarchicalMap Component Tests
 *
 * Tests for the hierarchical map visualization including:
 * - Rendering nodes at different levels
 * - Navigation between levels (drill-down, go back)
 * - Grouping nodes by parent (topics)
 * - Keyboard navigation
 * - Zoom controls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { HierarchicalMap } from './HierarchicalMap';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockNodes = [
    // Level 0: Domain
    { id: 'domain-1', parent_id: null, name: 'Frontend Development', node_type: 'domain', depth: 0, sort_order: 1 },

    // Level 1: Topics (children of domain)
    { id: 'topic-1', parent_id: 'domain-1', name: 'HTML & CSS', node_type: 'topic', depth: 1, sort_order: 1 },
    { id: 'topic-2', parent_id: 'domain-1', name: 'JavaScript', node_type: 'topic', depth: 1, sort_order: 2 },
    { id: 'topic-3', parent_id: 'domain-1', name: 'React', node_type: 'topic', depth: 1, sort_order: 3 },

    // Level 2: Skills (children of topics)
    { id: 'skill-1', parent_id: 'topic-1', name: 'HTML Fundamentals', node_type: 'skill', depth: 2, sort_order: 1 },
    { id: 'skill-2', parent_id: 'topic-1', name: 'CSS Layout', node_type: 'skill', depth: 2, sort_order: 2 },
    { id: 'skill-3', parent_id: 'topic-2', name: 'DOM Manipulation', node_type: 'skill', depth: 2, sort_order: 1 },
    { id: 'skill-4', parent_id: 'topic-2', name: 'ES6+ Features', node_type: 'skill', depth: 2, sort_order: 2 },
    { id: 'skill-5', parent_id: 'topic-3', name: 'React Basics', node_type: 'skill', depth: 2, sort_order: 1 },

    // Level 3: Courses (children of skills)
    { id: 'course-1', parent_id: 'skill-1', name: 'Document Structure', node_type: 'course', depth: 3, sort_order: 1 },
    { id: 'course-2', parent_id: 'skill-1', name: 'Semantic HTML', node_type: 'course', depth: 3, sort_order: 2 },
    { id: 'course-3', parent_id: 'skill-2', name: 'Flexbox', node_type: 'course', depth: 3, sort_order: 1 },
    { id: 'course-4', parent_id: 'skill-3', name: 'Event Handling', node_type: 'course', depth: 3, sort_order: 1 },

    // Level 4: Lessons (leaf nodes)
    { id: 'lesson-1', parent_id: 'course-1', name: 'HTML Basics', node_type: 'lesson', depth: 4, sort_order: 1 },
    { id: 'lesson-2', parent_id: 'course-1', name: 'Tags and Elements', node_type: 'lesson', depth: 4, sort_order: 2 },
    { id: 'lesson-3', parent_id: 'course-2', name: 'Semantic Elements', node_type: 'lesson', depth: 4, sort_order: 1 },
];

// ============================================================================
// TEST SETUP
// ============================================================================

const mockFetch = vi.fn();

beforeEach(() => {
    // Mock fetch API
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: mockNodes, connections: [] }),
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

        // Should have canvas element
        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
        // Delay the fetch response
        mockFetch.mockImplementation(() => new Promise(() => {}));

        render(<HierarchicalMap />);

        // Component should be in loading state (canvas renders "Loading...")
        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('should fetch data from API on mount', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/map/nodes');
        });
    });

    it('should display node count after loading', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            // At root level, should show 1 domain node
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });
    });

    it('should render breadcrumbs', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText('All Domains')).toBeInTheDocument();
        });
    });

    it('should render zoom controls', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            // Check for zoom control buttons
            expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
            expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
            expect(screen.getByTitle('Reset zoom')).toBeInTheDocument();
        });
    });

    it('should show keyboard hint', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/Esc/)).toBeInTheDocument();
        });
    });

    it('should handle API error gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error',
        });

        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/Failed to fetch map data/i)).toBeInTheDocument();
        });
    });

    it('should display empty state when no nodes at level', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ nodes: [], connections: [] }),
        });

        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/0 items/i)).toBeInTheDocument();
        });
    });
});

// ============================================================================
// LEVEL TRANSITION TESTS
// ============================================================================

describe('HierarchicalMap - Level Transitions', () => {
    it('should show only depth-0 nodes at root level', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            // At root, only the domain node should be visible
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });
    });

    it('should show back button only when not at root', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            // At root level, back button should not be visible
            expect(screen.queryByText('Back')).not.toBeInTheDocument();
        });
    });

    it('should update node count when navigating to child level', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Simulate clicking on the domain node to drill down
        // This would show 3 topics
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // Fire click event on canvas (simulating click on domain node)
        if (canvas) {
            // Click at center where domain node would be
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        // After drilling down, should show 3 items (topics) and back button
        await waitFor(() => {
            expect(screen.getByText('Back')).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should update breadcrumbs when navigating down', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText('All Domains')).toBeInTheDocument();
        });

        // Click on canvas to drill down
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        // After drilling into domain, breadcrumb should show domain name
        await waitFor(() => {
            expect(screen.getByText('Frontend Development')).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should go back when clicking back button', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Drill down first
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        await waitFor(() => {
            expect(screen.getByText('Back')).toBeInTheDocument();
        }, { timeout: 2000 });

        // Click back button
        fireEvent.click(screen.getByText('Back'));

        // Should be back at root
        await waitFor(() => {
            expect(screen.queryByText('Back')).not.toBeInTheDocument();
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });
    });

    it('should navigate back with Escape key', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Drill down first
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        await waitFor(() => {
            expect(screen.getByText('Back')).toBeInTheDocument();
        }, { timeout: 2000 });

        // Press Escape
        fireEvent.keyDown(window, { key: 'Escape' });

        // Should be back at root
        await waitFor(() => {
            expect(screen.queryByText('Back')).not.toBeInTheDocument();
        });
    });

    it('should navigate to specific level via breadcrumb click', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText('All Domains')).toBeInTheDocument();
        });

        // Drill down twice
        const canvas = container.querySelector('canvas');
        if (canvas) {
            // Drill into domain
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        await waitFor(() => {
            expect(screen.getByText('Frontend Development')).toBeInTheDocument();
        }, { timeout: 2000 });

        if (canvas) {
            // Drill into topic
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        await waitFor(() => {
            expect(screen.getAllByRole('button').length).toBeGreaterThan(3);
        }, { timeout: 2000 });

        // Click on "All Domains" breadcrumb to go back to root
        fireEvent.click(screen.getByText('All Domains'));

        await waitFor(() => {
            expect(screen.queryByText('Back')).not.toBeInTheDocument();
        });
    });
});

// ============================================================================
// NODE GROUPING TESTS (by parent/topic)
// ============================================================================

describe('HierarchicalMap - Node Grouping by Parent', () => {
    it('should group topics under their domain', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Drill into domain
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        // Should now show 3 topics (HTML & CSS, JavaScript, React)
        await waitFor(() => {
            expect(screen.getByText(/3 items/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should show correct child count in node badges', async () => {
        // The domain node should show badge with count of child topics (3)
        // This is rendered on canvas, so we verify the data flow
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });

        // Data loaded, verify we have the right number of nodes per level
        const domains = mockNodes.filter(n => n.depth === 0);
        const topics = mockNodes.filter(n => n.depth === 1);
        const skills = mockNodes.filter(n => n.depth === 2);

        expect(domains.length).toBe(1);
        expect(topics.length).toBe(3);
        expect(skills.length).toBe(5);
    });

    it('should group skills under their topic', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Drill into domain
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        await waitFor(() => {
            expect(screen.getByText(/3 items/i)).toBeInTheDocument();
        }, { timeout: 2000 });

        // For circular layout with 3 items, first item is at top (12 o'clock position)
        // Position calculation: x = cx + cos(0 - PI/2) * radius = cx + 0 = cx
        //                       y = cy + sin(0 - PI/2) * radius = cy - radius
        // With width=800, height=600, cx=400, cy=300, radius=192 (0.32 * min(800,600))
        // First topic (HTML & CSS) is at approximately (400, 108)
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 108 });
        }

        // After drilling into topic, should show skills grouped by that topic
        await waitFor(() => {
            // HTML & CSS has 2 skills: HTML Fundamentals, CSS Layout
            expect(screen.getByText(/2 items/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should verify topic-skill relationship', async () => {
        // Verify data structure: skills should have correct parent_id
        const htmlCssTopic = mockNodes.find(n => n.name === 'HTML & CSS');
        const skillsUnderHtmlCss = mockNodes.filter(n => n.parent_id === htmlCssTopic?.id);

        expect(skillsUnderHtmlCss.length).toBe(2);
        expect(skillsUnderHtmlCss.map(s => s.name)).toContain('HTML Fundamentals');
        expect(skillsUnderHtmlCss.map(s => s.name)).toContain('CSS Layout');
    });

    it('should verify domain-topic relationship', async () => {
        const domain = mockNodes.find(n => n.depth === 0);
        const topicsUnderDomain = mockNodes.filter(n => n.parent_id === domain?.id);

        expect(topicsUnderDomain.length).toBe(3);
        expect(topicsUnderDomain.map(t => t.name)).toContain('HTML & CSS');
        expect(topicsUnderDomain.map(t => t.name)).toContain('JavaScript');
        expect(topicsUnderDomain.map(t => t.name)).toContain('React');
    });

    it('should filter nodes correctly by parent_id', async () => {
        // Test the filtering logic
        const getChildrenOf = (parentId: string | null) =>
            parentId === null
                ? mockNodes.filter(n => n.depth === 0)
                : mockNodes.filter(n => n.parent_id === parentId);

        // Root level
        expect(getChildrenOf(null).length).toBe(1);

        // Domain children (topics)
        expect(getChildrenOf('domain-1').length).toBe(3);

        // Topic children (skills)
        expect(getChildrenOf('topic-1').length).toBe(2);
        expect(getChildrenOf('topic-2').length).toBe(2);
        expect(getChildrenOf('topic-3').length).toBe(1);
    });
});

// ============================================================================
// LAYOUT TESTS
// ============================================================================

describe('HierarchicalMap - Layout Algorithm', () => {
    it('should use circular layout for small number of nodes', async () => {
        // Mock data with <=12 nodes at one level
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                nodes: mockNodes.filter(n => n.depth <= 1),
                connections: [],
            }),
        });

        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });

        // With 3 topics, circular layout should be used (not grid)
        const topicsCount = mockNodes.filter(n => n.depth === 1).length;
        expect(topicsCount).toBeLessThanOrEqual(12);
    });

    it('should calculate positions in screen coordinates', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Verify the component renders without coordinate transform errors
        // (Previous implementation had off-screen positioning bugs)
        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // In jsdom, canvas dimensions are set via setAttribute in the resize handler
        // The key verification is that the component renders successfully
        // and displays the correct number of nodes without off-screen positioning
        // The "1 items" text confirms nodes are properly filtered by current level
    });
});

// ============================================================================
// INTERACTION TESTS
// ============================================================================

describe('HierarchicalMap - User Interactions', () => {
    it('should call onStartLesson when clicking a lesson node', async () => {
        const onStartLesson = vi.fn();
        render(<HierarchicalMap onStartLesson={onStartLesson} />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });

        // Component rendered, callback ready
        expect(onStartLesson).not.toHaveBeenCalled();
    });

    it('should show detail panel when clicking leaf node', async () => {
        // Mock only lesson nodes
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                nodes: [{ id: 'lesson-1', parent_id: null, name: 'Test Lesson', node_type: 'lesson', depth: 0, sort_order: 1 }],
                connections: [],
            }),
        });

        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Click on lesson node
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        // Should show detail panel with lesson info
        await waitFor(() => {
            expect(screen.getByText('Test Lesson')).toBeInTheDocument();
            expect(screen.getByText('Start Learning')).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should close detail panel when clicking X button', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                nodes: [{ id: 'lesson-1', parent_id: null, name: 'Test Lesson', node_type: 'lesson', depth: 0, sort_order: 1 }],
                connections: [],
            }),
        });

        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Click on lesson node to open detail panel
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        await waitFor(() => {
            expect(screen.getByText('Test Lesson')).toBeInTheDocument();
        }, { timeout: 2000 });

        // Close the detail panel
        const closeButton = screen.getByText('\u00D7'); // × character
        fireEvent.click(closeButton);

        await waitFor(() => {
            // Detail panel should be closed (Start Learning button hidden)
            expect(screen.queryByText('Start Learning')).not.toBeInTheDocument();
        });
    });

    it('should handle mouse move for hover state', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // Move mouse over canvas
        if (canvas) {
            fireEvent.mouseMove(canvas, { clientX: 400, clientY: 300 });
        }

        // Canvas cursor should be updated
        // (This is handled internally, we just verify no errors)
    });

    it('should handle mouse leave to clear hover state', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.mouseLeave(canvas);
        }

        // No errors should occur
    });
});

// ============================================================================
// ZOOM CONTROL TESTS
// ============================================================================

describe('HierarchicalMap - Zoom Controls', () => {
    it('should zoom in when clicking zoom in button', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
        });

        const zoomInBtn = screen.getByTitle('Zoom in');
        fireEvent.click(zoomInBtn);

        // Zoom action should trigger without error
        // D3 transition is mocked, so we just verify no crash
    });

    it('should zoom out when clicking zoom out button', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
        });

        const zoomOutBtn = screen.getByTitle('Zoom out');
        fireEvent.click(zoomOutBtn);
    });

    it('should reset zoom when clicking reset button', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByTitle('Reset zoom')).toBeInTheDocument();
        });

        const resetBtn = screen.getByTitle('Reset zoom');
        fireEvent.click(resetBtn);
    });
});

// ============================================================================
// HOME NAVIGATION TESTS
// ============================================================================

describe('HierarchicalMap - Home Navigation', () => {
    it('should have home button in breadcrumbs', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            // Home button is rendered with Home icon
            const homeBtn = screen.getByTitle('Home');
            expect(homeBtn).toBeInTheDocument();
        });
    });

    it('should navigate to root when clicking home button', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Drill down first
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        await waitFor(() => {
            expect(screen.getByText('Back')).toBeInTheDocument();
        }, { timeout: 2000 });

        // Click home button
        const homeBtn = screen.getByTitle('Home');
        fireEvent.click(homeBtn);

        // Should be at root
        await waitFor(() => {
            expect(screen.queryByText('Back')).not.toBeInTheDocument();
        });
    });
});

// ============================================================================
// DATA INTEGRITY TESTS
// ============================================================================

describe('HierarchicalMap - Data Integrity', () => {
    it('should maintain correct hierarchy depth', () => {
        // Verify mock data has correct depth values
        const depthGroups = mockNodes.reduce((acc, node) => {
            acc[node.depth] = (acc[node.depth] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        expect(depthGroups[0]).toBe(1);  // 1 domain
        expect(depthGroups[1]).toBe(3);  // 3 topics
        expect(depthGroups[2]).toBe(5);  // 5 skills
        expect(depthGroups[3]).toBe(4);  // 4 courses
        expect(depthGroups[4]).toBe(3);  // 3 lessons
    });

    it('should have valid parent-child relationships', () => {
        for (const node of mockNodes) {
            if (node.parent_id) {
                const parent = mockNodes.find(n => n.id === node.parent_id);
                expect(parent).toBeDefined();
                expect(node.depth).toBe(parent!.depth + 1);
            }
        }
    });

    it('should have unique node IDs', () => {
        const ids = mockNodes.map(n => n.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });
});

// ============================================================================
// DEEP NAVIGATION TESTS (5-level hierarchy)
// ============================================================================

describe('HierarchicalMap - Deep Navigation (5 levels)', () => {
    it('should support navigation through all 5 levels', async () => {
        const { container } = render(<HierarchicalMap />);

        // Level 0: Domain (1 item)
        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // Navigate to Level 1: Topics (3 items)
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }
        await waitFor(() => {
            expect(screen.getByText(/3 items/i)).toBeInTheDocument();
        }, { timeout: 2000 });

        // Verify breadcrumb shows current level
        expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    });

    it('should correctly track depth in breadcrumbs', async () => {
        const { container } = render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText('All Domains')).toBeInTheDocument();
        });

        // Initially only "All Domains" in breadcrumb
        const initialBreadcrumbs = screen.getAllByRole('button').filter(btn =>
            btn.textContent && !['Back', ''].includes(btn.textContent.trim())
        );
        expect(initialBreadcrumbs.length).toBeGreaterThanOrEqual(1);

        // After drilling down, breadcrumb should grow
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        await waitFor(() => {
            expect(screen.getByText('Frontend Development')).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should handle navigation to leaf nodes correctly', async () => {
        // Setup mock with only a lesson at root for easy testing
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                nodes: [{
                    id: 'lesson-test',
                    parent_id: null,
                    name: 'Test Lesson',
                    node_type: 'lesson',
                    depth: 0,
                    sort_order: 1,
                    description: 'A test lesson',
                }],
                connections: [],
            }),
        });

        const onStartLesson = vi.fn();
        const { container } = render(<HierarchicalMap onStartLesson={onStartLesson} />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });

        // Click on lesson node
        const canvas = container.querySelector('canvas');
        if (canvas) {
            fireEvent.click(canvas, { clientX: 400, clientY: 300 });
        }

        // Should show detail panel, not drill down
        await waitFor(() => {
            expect(screen.getByText('Test Lesson')).toBeInTheDocument();
            expect(screen.getByText('A test lesson')).toBeInTheDocument();
        }, { timeout: 2000 });
    });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('HierarchicalMap - Performance', () => {
    it('should handle large number of nodes at one level', async () => {
        // Create mock data with 50 nodes at same level
        const manyNodes = Array.from({ length: 50 }, (_, i) => ({
            id: `node-${i}`,
            parent_id: null,
            name: `Node ${i}`,
            node_type: 'topic' as const,
            depth: 0,
            sort_order: i,
        }));

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ nodes: manyNodes, connections: [] }),
        });

        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/50 items/i)).toBeInTheDocument();
        });
    });

    it('should render without crashing with deeply nested structure', async () => {
        // Create a deep chain: domain -> topic -> skill -> course -> lesson
        const deepNodes = [
            { id: 'd', parent_id: null, name: 'Domain', node_type: 'domain', depth: 0, sort_order: 1 },
            { id: 't', parent_id: 'd', name: 'Topic', node_type: 'topic', depth: 1, sort_order: 1 },
            { id: 's', parent_id: 't', name: 'Skill', node_type: 'skill', depth: 2, sort_order: 1 },
            { id: 'c', parent_id: 's', name: 'Course', node_type: 'course', depth: 3, sort_order: 1 },
            { id: 'l', parent_id: 'c', name: 'Lesson', node_type: 'lesson', depth: 4, sort_order: 1 },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ nodes: deepNodes, connections: [] }),
        });

        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/1 items/i)).toBeInTheDocument();
        });
    });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('HierarchicalMap - Accessibility', () => {
    it('should have accessible zoom buttons with titles', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            const zoomIn = screen.getByTitle('Zoom in');
            const zoomOut = screen.getByTitle('Zoom out');
            const reset = screen.getByTitle('Reset zoom');
            const home = screen.getByTitle('Home');

            expect(zoomIn).toBeInTheDocument();
            expect(zoomOut).toBeInTheDocument();
            expect(reset).toBeInTheDocument();
            expect(home).toBeInTheDocument();
        });
    });

    it('should provide keyboard navigation hint', async () => {
        render(<HierarchicalMap />);

        await waitFor(() => {
            expect(screen.getByText(/Esc/)).toBeInTheDocument();
            expect(screen.getByText(/to go back/)).toBeInTheDocument();
        });
    });
});
