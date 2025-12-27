# Current State → Vision Mapping

## Existing Modules and Their Role in OpenForge

This document maps our current experimental modules to the OpenForge vision.

---

## Module Inventory

### 1. Adaptive Content (`src/app/features/adaptive-content/`)

**Current**: Dynamically generates learning content based on user patterns

**Role in OpenForge**:
- **Content Generation Engine**: Creates personalized explanations when students struggle
- **Gap Detection**: Identifies when a student needs prerequisite content
- **Dynamic Tutorials**: Generates contextual help during challenge work

**Integration Points**:
```
Student struggles with PR review feedback
            ↓
Adaptive Content detects knowledge gap
            ↓
Generates targeted explanation
            ↓
Student understands and improves PR
```

**What Needs to Change**:
- [ ] Connect to real challenge data (not mock)
- [ ] Integrate with AI review feedback
- [ ] Generate project-specific content (use actual code examples)
- [ ] Track which generated content actually helps

---

### 2. Client Simulation (`src/app/features/client-simulation/`)

**Current**: Simulates realistic client interactions for practice

**Role in OpenForge**:
- **User Story Practice**: Helps students understand real user needs
- **Requirement Clarification**: Practice asking the right questions
- **Stakeholder Communication**: Learn to communicate technical concepts

**Integration Points**:
```
Feature Challenge: "Add export to PDF"
            ↓
Client Simulation: "Why do users need this?"
            ↓
Student learns to gather requirements
            ↓
Better feature implementation
```

**What Needs to Change**:
- [ ] Connect simulated clients to actual product users
- [ ] Base scenarios on real user feedback
- [ ] Track how requirement clarity affects PR quality

---

### 3. Dynamic Assessment (`src/app/features/dynamic-assessment/`)

**Current**: Adaptive testing that adjusts to student performance

**Role in OpenForge**:
- **Skill Profiling**: Assess incoming students' capabilities
- **Challenge Matching**: Determine appropriate difficulty
- **Progress Verification**: Confirm skills before advancing

**Integration Points**:
```
New student joins
            ↓
Dynamic Assessment profiles skills
            ↓
Matched to appropriate first challenges
            ↓
Ongoing assessment adjusts recommendations
```

**What Needs to Change**:
- [ ] Assess against project-specific skills
- [ ] Weight practical contribution over quiz performance
- [ ] Integrate PR performance into skill scores

---

### 4. Remix Projects (`src/app/features/remix-projects/`)

**Current**: Inheriting and improving existing codebases

**Role in OpenForge**:
- **THE CORE LOOP**: This IS the main student experience
- **Contribution Interface**: Where students do actual work
- **Code Understanding**: Learn by reading real code first

**Integration Points**:
```
This module IS the main interface:
- Project Catalog = Available OpenForge projects
- Challenges = Generated from scanners
- Workspace = Where PRs are crafted
- Reviews = AI + Human feedback
```

**What Needs to Change**:
- [x] Connect to database (challenges from scans)
- [ ] GitHub integration (real PRs, not simulated)
- [ ] Live project data (not mock seed projects)
- [ ] Submission → PR pipeline
- [ ] AI review integration

---

## New Modules Needed

### 5. Project Catalog (TO BUILD)

**Purpose**: Browse and discover OpenForge projects

**Features**:
- List of all active projects
- Tech stack filtering
- Skill requirement filtering
- Project health indicators (active contributors, recent activity)
- "Start here" recommendations for new students

**Schema**:
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  targetProduct: string;  // "Salesforce CRM"
  status: 'planning' | 'active' | 'mature' | 'maintenance';

  techStack: TechStack;
  repositoryUrl: string;

  metrics: {
    contributors: number;
    challengesCompleted: number;
    featureParity: number;  // % of target features
    codeQuality: string;  // Letter grade
  };

  skillsNeeded: Skill[];
  skillsTaught: Skill[];

  gettingStartedGuide: string;
}
```

---

### 6. GitHub Integration (TO BUILD)

**Purpose**: Bridge between platform and real repositories

**Features**:
- OAuth flow for GitHub connection
- Fork creation for students
- PR submission from platform
- Webhook for PR status updates
- Comment sync (AI reviews appear on GitHub)

**Flow**:
```
Student completes challenge locally
            ↓
Platform creates fork (if needed)
            ↓
Student pushes changes
            ↓
Platform creates PR
            ↓
AI review posted as comment
            ↓
Human maintainer reviews on GitHub
            ↓
Merge status synced back to platform
```

---

### 7. AI Review Service (TO BUILD)

**Purpose**: Provide educational code review

**Features**:
- PR diff analysis
- Pattern matching against codebase conventions
- Educational feedback generation
- Skill assessment from code
- Review caching and learning

**Integration**:
```typescript
interface ReviewRequest {
  prUrl: string;
  challengeId: string;
  studentId: string;
  studentLevel: string;

  context: {
    challenge: Challenge;
    studentHistory: PRHistory[];
    projectConventions: Convention[];
  };
}

interface ReviewResponse {
  summary: string;
  strengths: string[];
  improvements: Improvement[];
  skillAssessment: SkillAssessment[];
  readyToMerge: boolean;
  suggestedResources: Resource[];
}
```

---

### 8. Scanner Service (PARTIALLY BUILT)

**Current State**: MCP server + skill file for codebase scanning

**What's Built**:
- [x] Database schema for challenges
- [x] API endpoints for challenge CRUD
- [x] MCP server (course-connector)
- [x] Scanner skill (.claude/commands/remix-scanner.md)
- [x] Admin review dashboard

**What's Needed**:
- [ ] Competitor scanner (analyze external products)
- [ ] Scheduled scanning (run automatically)
- [ ] Scan result visualization
- [ ] Challenge generation from scan results
- [ ] Learning gap detection

---

### 9. Progress Dashboard (TO BUILD)

**Purpose**: Student's view of their journey

**Features**:
- Skill radar chart
- Contribution history
- Active challenges
- Achievements/badges
- Learning path visualization
- Peer comparison (optional)

---

### 10. Maintainer Dashboard (TO BUILD)

**Purpose**: Project maintainer tooling

**Features**:
- Pending PR queue
- Challenge management
- Contributor overview
- Quality metrics
- Content gap alerts
- Scan result review

---

## Architecture Reconciliation

### Current Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                     Current Schema                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Topics ─────┬───── Courses ─────┬───── Modules                 │
│              │                   │                               │
│              │                   └───── Skills                   │
│              │                                                   │
│  remix_projects ───── remix_challenges ───── remix_assignments  │
│                              │                                   │
│                       remix_scans                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Target Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                     Target Schema                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LEARNING DOMAIN                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Topics ── Skills ── LearningModules ── Assessments      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  PROJECT DOMAIN                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Projects ── Challenges ── PRs ── Reviews                │    │
│  │     │                                                    │    │
│  │     └── Scans ── ScanResults                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  USER DOMAIN                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Users ── SkillProfiles ── Contributions ── Progress     │    │
│  │   │                                                      │    │
│  │   └── GitHubAccounts ── Forks                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Priority Roadmap

### Phase 1: Foundation (Current → Working MVP)

**Goal**: One project with real contributions

1. **Connect Remix to GitHub**
   - OAuth integration
   - Fork management
   - PR creation

2. **AI Review Pipeline**
   - Review prompt engineering
   - GitHub comment integration
   - Feedback storage

3. **First Project Setup**
   - Pick target (OpenCRM?)
   - Create repository
   - Define initial challenges
   - Write getting started guide

### Phase 2: Learning Loop

**Goal**: Complete learn → contribute → learn cycle

4. **Skill Tracking**
   - Track skills from PRs
   - Match students to challenges
   - Show progress

5. **Content Generation**
   - Connect adaptive content to challenges
   - Generate help on demand
   - Track content effectiveness

6. **Scanner Automation**
   - Scheduled codebase scans
   - Auto-generate challenges
   - Challenge quality scoring

### Phase 3: Scale

**Goal**: Multiple projects, many contributors

7. **Project Catalog**
   - Project submission process
   - Community voting
   - Project health metrics

8. **Community Features**
   - Discussion boards
   - Mentorship matching
   - Recognition system

9. **Advanced AI**
   - Competitor scanning
   - Feature gap analysis
   - Learning path optimization

---

## Technical Decisions Needed

### 1. GitHub vs GitLab vs Both?
- **Recommendation**: GitHub first (most students familiar)
- **Migration path**: Abstract interface for future expansion

### 2. Monorepo vs Multi-repo for Projects?
- **Recommendation**: Multi-repo (each project independent)
- **Platform repo**: Separate from project repos

### 3. AI Provider?
- **Current**: Claude (via MCP)
- **Consideration**: Cost at scale, rate limits
- **Recommendation**: Abstract interface, start with Claude

### 4. Real-time Features?
- **Need**: Live PR status, notifications
- **Options**: Supabase Realtime, WebSockets, polling
- **Recommendation**: Supabase Realtime (already using Supabase)

### 5. Mobile Support?
- **Current**: Desktop-focused
- **Recommendation**: PWA for notifications, desktop for work

---

## Quick Wins

Things we can do immediately with existing modules:

1. **Rename and Brand**
   - Current: "course"
   - Target: "OpenForge"

2. **Connect Mock to Real**
   - Replace mock challenges with scan results
   - Already have the API!

3. **First Scan**
   - Use /remix-scanner on this codebase
   - Generate real challenges
   - Review and approve

4. **Landing Page**
   - Explain the vision
   - Call for early contributors
   - Link to Discord/community

5. **Documentation**
   - Contributing guide
   - First challenge walkthrough
   - Architecture overview

---

## Next Immediate Steps

1. Review and refine vision document with stakeholders
2. Decide on first pilot project (OpenCRM vs others)
3. Set up GitHub OAuth integration
4. Create AI review prompt and test
5. Design skill tracking schema
6. Plan first cohort recruitment

---

*This document will evolve as we build. Last updated: December 2024*
