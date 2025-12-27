# Feature Requirement: Generative Simulation Model

## Overview

Implement "The Generative Simulation Model" - a narrative-driven learning experience where users build software for procedurally generated AI "clients" with unique personalities, constraints, and evolving requirements.

---

## Business Context

### Philosophy
Transform learning into narrative experience. Instead of abstract coding exercises, users build software for procedurally generated "clients" with personalities, constraints, and evolving requirements. Learning becomes role-play.

### Target Users
- Beginners through intermediate developers
- Those who learn better through story and context
- Users who want to practice soft skills alongside technical skills
- Anyone who finds traditional exercises demotivating

### Implementation Priority
**High** - Excellent entry point for the platform. Engages beginners while remaining interesting for intermediates.

---

## Technical Requirements

### 1. Persona Generation Engine

**Purpose:** Create detailed, consistent client profiles

**New Feature Module:** `src/app/features/client-simulation/`

```
client-simulation/
├── index.ts
├── lib/
│   ├── types.ts                    # ClientPersona, Scenario, Message types
│   ├── useSimulation.ts            # Main simulation hook
│   ├── personaGenerator.ts         # LLM-based persona creation
│   ├── scenarioOrchestrator.ts     # Manage scenario lifecycle
│   ├── dialogueEngine.ts           # Client conversation logic
│   ├── simulationStorage.ts        # Persist simulation state
│   └── evaluationEngine.ts         # Assess user submissions
└── components/
    ├── SimulationWorkspace.tsx     # Main simulation interface
    ├── ClientProfile.tsx           # Display client details
    ├── ChatInterface.tsx           # Client communication
    ├── RequirementsPanel.tsx       # Current requirements list
    ├── TimelineView.tsx            # Project timeline with events
    ├── ComplicationAlert.tsx       # Scope change notifications
    └── FeedbackReview.tsx          # End-user simulation feedback
```

**Core Data Types:**
```typescript
// src/app/features/client-simulation/lib/types.ts

interface ClientPersona {
  id: string;
  name: string;
  avatar: string; // Generated or template

  // Demographics
  age: number;
  industry: Industry;
  role: string;
  companySize: 'solo' | 'small' | 'medium' | 'enterprise';
  location: string;

  // Personality traits (affect communication style)
  technicalLiteracy: 1 | 2 | 3 | 4 | 5;
  decisionMaking: 'quick' | 'deliberate' | 'indecisive';
  communication: 'terse' | 'normal' | 'verbose';
  patience: 'low' | 'medium' | 'high';
  budgetSensitivity: 'flexible' | 'moderate' | 'strict';

  // Backstory
  businessContext: string;
  painPoints: string[];
  previousExperience: string;

  // Communication patterns
  messageStyle: MessageStyle;
  typicalResponseDelay: number; // simulated delay in hours
  preferredContactMethod: 'chat' | 'email' | 'call';
}

interface Industry {
  name: string;
  domain: LearningDomain; // Maps to existing domain system
  commonNeeds: string[];
  terminology: Record<string, string>;
}

interface MessageStyle {
  greetingStyle: string[];
  signoffStyle: string[];
  emojiUsage: 'none' | 'minimal' | 'frequent';
  formalityLevel: 'casual' | 'professional' | 'formal';
  typicalLength: 'short' | 'medium' | 'long';
}
```

### 2. Scenario Orchestration System

**Purpose:** Create and manage evolving project narratives

```typescript
interface Scenario {
  id: string;
  clientId: string;

  // Project basics
  projectType: ProjectType;
  initialBrief: string;

  // Requirements evolution
  phases: ScenarioPhase[];
  currentPhase: number;

  // Complications queue
  plannedComplications: Complication[];
  triggeredComplications: TriggeredComplication[];

  // Timeline
  startDate: Date;
  deadline?: Date;
  budget?: BudgetConstraint;

  // Evaluation criteria
  requirements: Requirement[];
  bonusObjectives: BonusObjective[];
}

interface ScenarioPhase {
  id: string;
  name: string;
  description: string;
  triggerCondition: TriggerCondition;
  newRequirements: Requirement[];
  clientMessages: ScheduledMessage[];
}

interface Complication {
  id: string;
  type: 'scope_addition' | 'scope_reduction' | 'deadline_change' |
        'budget_change' | 'requirement_clarification' | 'stakeholder_input';
  triggerCondition: TriggerCondition;
  clientMessage: string;
  impact: ComplicationImpact;
  probability: number; // 0-1, for random complications
}

interface TriggerCondition {
  type: 'time_elapsed' | 'phase_complete' | 'user_question' |
        'submission_made' | 'random' | 'requirement_met';
  parameters: Record<string, unknown>;
}

type ProjectType =
  | 'crud_app'
  | 'landing_page'
  | 'api_service'
  | 'dashboard'
  | 'e_commerce'
  | 'portfolio'
  | 'blog'
  | 'mobile_app'
  | 'cli_tool'
  | 'data_pipeline';
```

### 3. Adaptive Difficulty System

**Integration with existing:** `src/app/features/adaptive-content/`

Extend existing adaptive content system:

```typescript
// Extend src/app/features/adaptive-content/lib/types.ts

interface SimulationAdaptation {
  // Client behavior adjustments
  clientPatience: number;        // Multiplier for response expectations
  requirementClarity: number;    // How clear initial briefs are
  complicationFrequency: number; // How often scope changes occur
  feedbackHelpfulness: number;   // How constructive feedback is

  // Challenge adjustments
  deadlinePressure: number;      // Timeline strictness
  technicalComplexity: number;   // Feature complexity
  ambiguityLevel: number;        // How much clarification needed
}

// Signal collection for simulation
interface SimulationSignals {
  clarificationQuestionsAsked: number;
  requirementsMisunderstood: number;
  deadlinesMet: boolean[];
  clientSatisfactionScores: number[];
  codeQualityTrend: number[];
}
```

### 4. Evaluation Through Simulation

**Purpose:** LLM role-plays end users testing the finished product

```typescript
interface SimulatedUserTest {
  userId: string;
  persona: EndUserPersona;
  taskFlow: UserTask[];
  feedback: UserFeedback[];
  usabilityScore: number;
  completionRate: number;
}

interface EndUserPersona {
  technicalLevel: 'novice' | 'intermediate' | 'expert';
  ageGroup: string;
  accessibility: AccessibilityNeeds;
  device: 'desktop' | 'mobile' | 'tablet';
  patience: 'low' | 'medium' | 'high';
}

interface UserTask {
  description: string;
  expectedSteps: number;
  actualSteps: number;
  completed: boolean;
  abandonmentPoint?: string;
  frustrationMarkers: string[];
}

interface UserFeedback {
  category: 'positive' | 'negative' | 'suggestion';
  area: 'usability' | 'design' | 'performance' | 'functionality';
  quote: string; // Simulated user quote
  severity?: 'minor' | 'moderate' | 'critical';
}
```

---

## API Endpoints

### Simulation API
```
src/app/api/simulation/
├── route.ts                        # Create new simulation
├── persona/route.ts                # Generate client persona
├── scenario/route.ts               # Generate/update scenario
├── chat/route.ts                   # Client conversation (streaming)
├── evaluate/route.ts               # Evaluate submission
└── test-users/route.ts             # Simulated user testing
```

**Chat Endpoint Pattern:**
Follow existing `src/app/api/goal-path/chat/route.ts` for streaming responses.

```typescript
// System prompt for client simulation
const clientSystemPrompt = (persona: ClientPersona, scenario: Scenario) => `
You are ${persona.name}, a ${persona.age}-year-old ${persona.role}
at a ${persona.companySize} ${persona.industry.name} company.

Your communication style:
- Technical literacy: ${persona.technicalLiteracy}/5
- You are ${persona.communication} in your messages
- Formality: ${persona.messageStyle.formalityLevel}
- Decision making: ${persona.decisionMaking}

Business context: ${persona.businessContext}

Current project: ${scenario.initialBrief}
Current phase: ${scenario.phases[scenario.currentPhase].name}

Stay in character. Respond as this client would - with their quirks,
concerns, and communication style. Never break character or reveal
you are an AI.
`;
```

---

## UI/UX Requirements

### New Module Page
Create `src/app/module/simulation/page.tsx`

**Variants:**
1. **Active Projects** - Current simulations
2. **Client Gallery** - Browse/select client types
3. **Completed Projects** - Past simulations with scores

### Main Simulation Workspace Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Client: Marcus Chen | Architecture Firm PM Tool            │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│  Client Chat    │          Requirements Panel               │
│  ───────────    │          ──────────────────               │
│                 │  [ ] User authentication                  │
│  Marcus: "We    │  [x] Project list view                    │
│  need something │  [ ] File attachments                     │
│  to track..."   │  [ ] Client portal (NEW!)                 │
│                 │                                           │
│  You: "I can    │  ─────────────────────────                │
│  help with..."  │  Budget: $500/month                       │
│                 │  Timeline: 4 weeks                        │
│  [Type message] │  Phase: 2 of 4                            │
│                 │                                           │
├─────────────────┴───────────────────────────────────────────┤
│  Project Timeline                                            │
│  Week 1 ━━━━━━● Week 2 ━━━━━━━○ Week 3 ─────── Week 4        │
│         Initial    Scope                                     │
│         Brief      Change                                    │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns
- Chat interface similar to AI chat patterns in existing features
- Use `framer-motion` for message animations
- Complication alerts should use attention-grabbing animations
- Timeline should show past events and upcoming deadlines

---

## Example Scenario Data

```typescript
const exampleScenario: Scenario = {
  id: 'arch-pm-001',
  clientId: 'marcus-chen',
  projectType: 'dashboard',
  initialBrief: "We need something to keep track of our projects. Nothing fancy, just... organized, you know?",

  phases: [
    {
      id: 'phase-1',
      name: 'Initial Requirements',
      description: 'Basic project tracking',
      triggerCondition: { type: 'time_elapsed', parameters: { hours: 0 } },
      newRequirements: [
        { id: 'req-1', description: 'Project list view', priority: 'must', status: 'pending' },
        { id: 'req-2', description: 'Project details page', priority: 'must', status: 'pending' },
        { id: 'req-3', description: 'Status tracking', priority: 'should', status: 'pending' }
      ],
      clientMessages: []
    },
    {
      id: 'phase-2',
      name: 'Feature Request',
      description: 'File attachments added',
      triggerCondition: { type: 'time_elapsed', parameters: { days: 3 } },
      newRequirements: [
        { id: 'req-4', description: 'File attachments', priority: 'should', status: 'pending' }
      ],
      clientMessages: [
        {
          delay: 0,
          content: "My junior architect says we should be able to attach files to projects. Is that hard?"
        }
      ]
    },
    {
      id: 'phase-3',
      name: 'Scope Expansion',
      description: 'Client portal requested',
      triggerCondition: { type: 'requirement_met', parameters: { requirementId: 'req-4' } },
      newRequirements: [
        { id: 'req-5', description: 'Client login portal', priority: 'could', status: 'pending' }
      ],
      clientMessages: [
        {
          delay: 0,
          content: "Actually, one of our clients wants to see their project status. Can they have a login too?"
        }
      ]
    }
  ],

  currentPhase: 0,
  plannedComplications: [],
  triggeredComplications: [],

  requirements: [],
  bonusObjectives: [
    { id: 'bonus-1', description: 'Mobile-responsive design', points: 50 },
    { id: 'bonus-2', description: 'Dark mode support', points: 30 }
  ]
};
```

---

## Integration with Existing Features

### Progress Tracking
Extend `src/app/features/progress/lib/types.ts`:
```typescript
interface SimulationProgress {
  simulationId: string;
  startedAt: Date;
  completedAt?: Date;
  clientSatisfaction: number; // 0-100
  requirementsFulfilled: number;
  totalRequirements: number;
  bonusPointsEarned: number;
  skillsApplied: string[];
  skillsDeveloped: string[];
}
```

### Skill Progress
Award XP based on simulation completion:
- Base XP for completing simulation
- Bonus XP for client satisfaction
- Skill-specific XP based on project type

### Certificates
Generate simulation completion certificates:
- Client name and project type
- Requirements fulfilled
- Client testimonial (AI-generated)

---

## Persona Templates Library

Create initial set of 10-15 diverse personas:

```typescript
const personaTemplates = {
  industries: [
    'architecture', 'restaurant', 'e-commerce', 'healthcare',
    'education', 'real-estate', 'consulting', 'non-profit',
    'manufacturing', 'creative-agency'
  ],

  archetypes: [
    'the_enthusiastic_founder',     // Excited but unclear
    'the_busy_executive',           // Terse, wants results fast
    'the_detail_oriented',          // Many questions, specific needs
    'the_budget_conscious',         // Always asking about cost
    'the_indecisive',              // Changes mind frequently
    'the_technical_client',         // Knows what they want technically
    'the_delegator',               // Actually, ask my colleague
    'the_perfectionist'            // Nothing is ever quite right
  ]
};
```

---

## Risk Mitigations

| Risk | Implementation |
|------|----------------|
| Scenarios feel artificial | Invest in persona depth; use real industry terminology |
| LLM inconsistency breaks immersion | Persist full conversation context; structured persona schemas |
| Users may game the system | Vary evaluation criteria; include unexpected test scenarios |
| Narrative overhead distracts from learning | Keep story lightweight; never block progress on plot |

---

## Implementation Order

1. **Phase 1:** Core data types + persona generator API
2. **Phase 2:** Basic chat interface with single client
3. **Phase 3:** Scenario orchestration with phases
4. **Phase 4:** Complications and adaptive difficulty
5. **Phase 5:** Simulated user testing and evaluation
6. **Phase 6:** Persona library expansion

---

## Files to Reference

- Chat pattern: `src/app/api/goal-path/chat/route.ts`
- Streaming responses: Check existing streaming implementations
- Storage pattern: `src/app/features/progress/lib/progressStorage.ts`
- Module layout: `src/app/shared/components/ModuleLayout.tsx`
- Adaptive content: `src/app/features/adaptive-content/`
- Skill domains: `src/app/shared/lib/learningDomains.ts`
