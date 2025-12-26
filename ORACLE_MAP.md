# Oracle Map - Knowledge Map + Career Oracle Integration

## Overview

The Oracle Map is a composite feature that integrates the **Knowledge Map** visualization with the **Career Oracle** AI-powered path generation. It provides an interactive experience where users can:

1. Explore the knowledge domain hierarchy
2. Generate personalized learning paths via a wizard
3. See recommended and hypothetical nodes highlighted on the map
4. Preview the generated path in a sidebar
5. Confirm and "forge" new nodes with particle animations

**Access URL:** `/module/overview/variant/oracle-map`

---

## Current State

| Feature | Status | Notes |
|---------|--------|-------|
| Bottom Panel Oracle | ✅ Complete | Expandable 48px → 220px |
| 3-Step Wizard | ✅ Complete | Skills → Goal → Preferences |
| Path Generation | ✅ Complete | Uses mock predictive data |
| Path Preview Sidebar | ✅ Complete | 320px right panel |
| Recommended Node Glow | ✅ Complete | Indigo pulse animation |
| Hypothetical Nodes | ✅ Complete | Dashed, translucent styling |
| Particle Forge Animation | ✅ Complete | 4-phase canvas animation |
| Demo Mode | ✅ Complete | Auto-populates mock data |
| Supabase Integration | ⏳ Pending | Currently uses mock data |

---

## Architecture

### Component Hierarchy

```
KnowledgeMapWithOracle (composite page)
├── KnowledgeMap (existing)
│   ├── MapCanvas
│   ├── MapNode
│   ├── MapConnections
│   └── NodeDetailsPanel
├── OracleBottomPanel
│   ├── OracleCollapsedBar (48px thin CTA)
│   └── OracleExpandedWizard (220px)
│       ├── CompactSkillsStep
│       ├── CompactGoalStep
│       ├── CompactPreferencesStep
│       └── OracleStepIndicator
├── PathPreviewSidebar (320px right panel)
│   ├── PathModuleCard
│   └── PathMilestoneMarker
├── ParticleForgeLayer (canvas overlay)
├── HypotheticalNode (dashed nodes)
└── RecommendedNodeGlow (glow overlay)
```

### File Structure

```
src/app/features/knowledge-map/
├── KnowledgeMapWithOracle.tsx          # Main composite component
├── components/
│   ├── OracleBottomPanel/
│   │   ├── OracleBottomPanel.tsx       # Expandable bottom panel
│   │   ├── OracleCollapsedBar.tsx      # Thin CTA bar
│   │   ├── OracleExpandedWizard.tsx    # Horizontal 3-step wizard
│   │   ├── CompactSkillsStep.tsx       # Skill picker step
│   │   ├── CompactGoalStep.tsx         # Goal selector step
│   │   ├── CompactPreferencesStep.tsx  # Preferences step
│   │   ├── OracleStepIndicator.tsx     # Progress dots
│   │   └── index.ts
│   ├── PathPreviewSidebar/
│   │   ├── PathPreviewSidebar.tsx      # Right sidebar
│   │   ├── PathModuleCard.tsx          # Module card in list
│   │   ├── PathMilestoneMarker.tsx     # Milestone marker
│   │   └── index.ts
│   ├── ParticleForge/
│   │   ├── ParticleForgeLayer.tsx      # Canvas particle system
│   │   ├── useParticleSystem.ts        # Particle physics hook
│   │   └── index.ts
│   ├── HypotheticalNode.tsx            # Dashed, translucent node
│   └── RecommendedNodeGlow.tsx         # Glow overlay
└── lib/
    ├── useOracleMapIntegration.ts      # Integration state hook
    ├── oracleNodeMapping.ts            # Path → node mapping utilities
    └── types.ts                        # Extended types
```

---

## UI Components

### 1. Bottom Panel Oracle

**Collapsed State (48px):**
- Thin gradient bar with "Plan Your Career Path" CTA
- Sparkle icon and chevron indicator
- Click to expand

**Expanded State (220px):**
- Horizontal 3-step wizard
- Progress dots indicator
- Step navigation (back/next buttons)
- "Generate Path" button on final step

**Animation:**
```typescript
transition: { type: "spring", damping: 25, stiffness: 300 }
```

### 2. Wizard Steps

| Step | Description | Validation |
|------|-------------|------------|
| Skills | Multi-select skill chips | Min 1 skill required |
| Goal | Career goal + sector selector | Goal required |
| Preferences | Weekly hours, risk tolerance, focus areas | Optional |

### 3. Path Preview Sidebar

**Header:**
- Path title and target role
- Close button
- Stats grid (modules, hours, new nodes)

**Body:**
- Scrollable module list
- Module cards with:
  - Sequence number
  - Title and duration
  - Skill tags
  - Demand indicator (Growing/Stable/Emerging)
  - "New" badge for hypothetical nodes
- Milestone markers between modules

**Footer:**
- "Confirm & Add to Map" button
- Triggers forge animation sequence

### 4. Node Visual States

| State | Visual Treatment |
|-------|------------------|
| Normal | Default styling |
| Recommended | Indigo glow ring, pulse animation |
| Hypothetical | Dashed 2px border, 60% opacity, "+" icon |
| Forging | Hidden until particle animation completes |

### 5. Particle Forge Animation

**4-Phase Sequence:**

| Phase | Duration | Effect |
|-------|----------|--------|
| Spawn | 0-500ms | Particles appear from viewport edges |
| Converge | 500-1500ms | Magnetic attraction toward target |
| Form | 1500-2000ms | Particles spiral inward with trails |
| Solidify | 2000-2500ms | Burst flash, node materializes |

**Technical Details:**
- Canvas-based rendering for performance
- 50 particles per node
- Magnetic attraction physics
- Trail effect with fading opacity
- Reduced motion fallback (simple fade-in)

---

## State Management

### useOracleMapIntegration Hook

Wraps `useCareerOracle` and adds map integration state:

```typescript
interface OracleMapIntegrationState {
  // Node highlighting
  recommendedNodeIds: Set<string>;
  hypotheticalNodes: HypotheticalMapNode[];
  forgingNodeId: string | null;
  pathConnections: RecommendedPathConnection[];

  // UI state
  bottomPanelExpanded: boolean;
  pathPreviewVisible: boolean;
  activeStep: 'skills' | 'goal' | 'preferences' | 'generating' | 'complete';
  forgeQueue: string[];
}
```

### Key Methods

```typescript
// Panel controls
expandBottomPanel()
collapseBottomPanel()
toggleBottomPanel()

// Path preview
showPathPreview()
hidePathPreview()
togglePathPreview()

// Wizard navigation
setActiveWizardStep(step)
nextWizardStep()
prevWizardStep()

// Node management
highlightRecommendedNodes(nodeIds)
addHypotheticalNodes(nodes)
clearHypotheticalNodes()

// Forge animation
startForgeAnimation(nodeId)
confirmPath()  // Forges all hypothetical nodes in sequence
```

---

## Demo Mode

Enable demo mode to auto-populate mock data:

```tsx
<KnowledgeMapWithOracle
  height="calc(100vh - 180px)"
  demo={true}
  debug={true}
/>
```

**Demo Data:**
- Skills: JavaScript, React, TypeScript, Node.js
- Goal: Senior Frontend Engineer (tech_startups)
- Preferences: 15 hrs/week, project-based learning
- Focus Areas: React Advanced Patterns, System Design, AI Integration

**Demo Flow:**
1. Component mounts
2. After 500ms: Skills, goal, preferences populated
3. Predictions generated (2s simulated delay)
4. Path generated (2.5s simulated delay)
5. Bottom panel expands
6. Path preview sidebar slides in

---

## Data Flow

```
User Input (Wizard Steps)
         ↓
useCareerOracle.updateSkills/Goal/Preferences()
         ↓
useCareerOracle.generatePath()
         ↓
PredictiveLearningPath generated (mock data)
         ↓
useOracleMapIntegration syncs path to map:
  - findMatchingNodes() → recommendedNodeIds
  - mapModuleToHypotheticalNode() → hypotheticalNodes
  - mapPathToConnections() → pathConnections
         ↓
UI updates:
  - Recommended nodes get glow overlay
  - Hypothetical nodes rendered with dashed borders
  - Path preview sidebar populates
         ↓
User clicks "Confirm & Add to Map"
         ↓
confirmPath() triggers forge sequence:
  - For each hypothetical node:
    - startForgeAnimation(nodeId)
    - Particle animation plays (2.5s)
    - Node "materializes"
         ↓
clearHypotheticalNodes() - nodes now "real"
```

---

## Mock Data Sources

Path generation uses data from:
- `src/app/features/goal-path/lib/predictiveData.ts`
  - `skillDemandPredictions` - Skill growth/saturation data
  - `industryTrends` - Sector trends
  - `predictiveJobPostings` - Matching jobs

Generated path includes:
- 6 modules based on skill gaps
- 3 milestones (Foundation, Core Skills, Market Ready)
- Market timing recommendation
- Alternative paths
- Risk assessment

---

## Responsive Behavior

| Breakpoint | Bottom Panel | Sidebar | Details Panel |
|------------|--------------|---------|---------------|
| Mobile (<768px) | Full-width sheet | Full-screen modal | Hidden when sidebar active |
| Tablet (768-1024px) | 280px expanded | 300px | Popover |
| Desktop (>1024px) | 220px expanded | 320px | Popover |

---

## Future Enhancements

1. **Supabase Integration**
   - Persist generated paths to `user_generated_paths` table
   - Load user's saved paths on mount
   - Sync hypothetical nodes to real courses

2. **Real Node Highlighting**
   - Match path modules to actual course nodes in map
   - Animate connections between recommended nodes

3. **Collaborative Features**
   - Share generated paths with others
   - Community-voted path variations

4. **AI Improvements**
   - Real AI-powered path generation (Claude API)
   - Dynamic skill demand predictions
   - Personalized market timing

---

## Testing

### Manual Testing Checklist

- [ ] Bottom panel expands/collapses smoothly
- [ ] Wizard steps navigate correctly
- [ ] Skills can be selected/deselected
- [ ] Goal selection updates sector
- [ ] Preferences save correctly
- [ ] Path generates after wizard completion
- [ ] Sidebar shows correct module count
- [ ] Module cards display all data
- [ ] Milestones appear between correct modules
- [ ] "Confirm" button triggers forge animation
- [ ] Particles animate toward target position
- [ ] Nodes "materialize" after forge completes
- [ ] Reduced motion preference disables particles

### Debug Mode

Enable `debug={true}` to see console logs:
```
[OracleMapIntegration] Expanding bottom panel
[OracleMapIntegration] Setting wizard step: goal
[OracleMapIntegration] Path generated, mapping modules
[OracleMapIntegration] Starting forge for: node-xyz
[KnowledgeMapWithOracle] Forge complete: node-xyz
```

---

## Related Files

- **Module Definition:** `src/app/shared/lib/modules.ts` (oracle-map variant)
- **Variant Page:** `src/app/module/[moduleId]/variant/[variantId]/page.tsx`
- **Career Oracle Hook:** `src/app/features/goal-path/lib/useCareerOracle.ts`
- **Predictive Types:** `src/app/features/goal-path/lib/predictiveTypes.ts`
- **Predictive Data:** `src/app/features/goal-path/lib/predictiveData.ts`
