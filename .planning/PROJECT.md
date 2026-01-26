# Knowledge Map v2 — Treemap Navigator

## What This Is

A hierarchical course browser for OpenForge that lets users navigate 5 levels of categorization (Domain → Topic → Skill → Course → Lesson) using a treemap interface. Users click territories to zoom in, see child categories appear, and eventually reach courses where a preview panel lets them start learning. Replaces the failed galaxy/universe visualization approaches.

## Core Value

Users can find courses in a massive catalog by visually drilling down through familiar category hierarchies — no hunting for off-screen nodes, no unpredictable scrolling.

## Requirements

### Validated

- ✓ User authentication via Supabase Auth — existing
- ✓ Course/chapter content storage and retrieval — existing
- ✓ Learning progress tracking system — existing
- ✓ API routes for map nodes (`/api/map-nodes`) — existing
- ✓ 5-level hierarchy in database (domain/topic/skill/course/lesson) — existing
- ✓ Framer Motion for animations — existing
- ✓ Dark theme infrastructure — existing

### Active

- [ ] Treemap layout algorithm that nests rectangles by hierarchy level
- [ ] Smooth zoom transition when clicking a territory
- [ ] Children render inside parent territory after zoom
- [ ] Each rectangle displays: name + child count
- [ ] Breadcrumb trail showing current path (Domain > Topic > Skill)
- [ ] Back button for single-level retreat
- [ ] Preview panel slides out when clicking leaf node (course/lesson)
- [ ] On-demand data fetching (load children when drilling down)
- [ ] Dark/gaming visual style with glowing accents
- [ ] Performant with 1000s of nodes (only render current level + children)

### Out of Scope

- Progress indicators on territories — adds complexity, defer to v2
- Visual previews/thumbnails — keep it minimal for v1
- Organic/irregular territory shapes — treemap rectangles chosen for predictability
- Preserving old knowledge-map or knowledge-universe code — full replacement

## Context

**Previous attempts that failed:**
- `src/app/features/knowledge-map/` — hex grid approach, nodes drifted off-screen
- `src/app/features/knowledge-universe/` — galactic metaphor, zoom didn't transition levels, unpredictable scrolling

**What we learned:**
- Infinite space metaphors create visibility and navigation problems
- Users need clear boundaries and predictable "you are here" context
- Zoom must actually transition to the next level, not just magnify

**Existing infrastructure to leverage:**
- `map_nodes` table with parent_id, node_type, depth columns
- `/api/map-nodes` endpoint for fetching nodes
- Framer Motion for zoom animations
- Zustand for map state management
- Dark theme CSS variables in forge

## Constraints

- **Tech stack**: Must use existing Next.js 16 + React 19 + Supabase stack
- **Feature module pattern**: New code goes in `src/app/features/treemap-navigator/`
- **Performance**: Must handle 1000+ courses without rendering all at once
- **Accessibility**: Keyboard navigation and screen reader support for territory selection

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treemap over galaxy | Bounded space solves visibility/navigation issues | — Pending |
| Click-to-zoom over scroll-zoom | More predictable, clearer level transitions | — Pending |
| Preview panel over inline expand | Keeps map context visible while showing details | — Pending |
| Rectangles over organic shapes | Algorithmic simplicity, space efficiency | — Pending |
| Name + count only | Minimal UI, defer progress/thumbnails to v2 | — Pending |

---
*Last updated: 2026-01-26 after initialization*
