# Feature Module Analysis

## Complete Inventory

This document provides a comprehensive analysis of all 25 feature modules and their role in OpenForge.

---

## Feature Summary Table

| # | Feature | Purpose | Storage | Key Innovation |
|---|---------|---------|---------|----------------|
| 1 | **Adaptive Content** | Dynamic complexity adjustment | localStorage | Signal-based comprehension tracking |
| 2 | **Adaptive Learning** | Path recommendations | localStorage | Lazy-loaded prediction engine |
| 3 | **Client Simulation** | Soft skills practice | localStorage | Dynamic persona + complication system |
| 4 | **Code Playground** | Interactive coding | localStorage | Browser-based execution |
| 5 | **Competition** | Gamified challenges | localStorage | Tiered skill progression + peer review |
| 6 | **Contribution Scaffold** | OSS guidance | localStorage | Progressive hint system |
| 7 | **Contribution Tracker** | OSS tracking | localStorage | GitHub PR integration |
| 8 | **Curriculum Generator** | AI content | localStorage | Semantic fingerprinting + delta regen |
| 9 | **Generative Content** | User-seeded content | localStorage | Community rating/forking |
| 10 | **Goal Path** | Career-focused paths | localStorage | Friction detection + market timing |
| 11 | **Knowledge Map** | 5-level hierarchy nav | runtime | Drill-down with Oracle |
| 12 | **Knowledge Universe** | Cosmic visualization | runtime | 60fps canvas rendering |
| 13 | **Live Projects** | Real contributions | localStorage + API | Scaffolded GitHub workflow |
| 14 | **Open Source Discovery** | Repository browser | localStorage | Skill-based matching |
| 15 | **Path Comparison** | Multi-path comparison | runtime | Side-by-side visualization |
| 16 | **Remix Projects** | Code inheritance | localStorage | Diff analysis + quality gates |
| 17 | **Shareable Links** | Social sharing | URL | OG meta tag generation |
| 18 | **Skill Assessment** | Onboarding quiz | localStorage | Conditional branching logic |
| 19 | **Social Proof** | Journey visualization | mock data | Animated SVG paths |
| 20 | **User Learning Graph** | Learning decisions | localStorage | Personal curriculum evolution |
| 21 | **User Velocity** | Adaptive UI density | runtime | Behavioral intent detection |
| 22 | **Streaks** | Daily habits | localStorage | Freeze token economy |
| 23 | **Certificates** | Achievement recognition | localStorage | Verification + sharing |
| 24 | **Bookmarks** | Content saving | localStorage | Hierarchical organization |
| 25 | **Progress** | Learning tracking | localStorage | Video position + completion |

---

## Detailed Feature Analysis

### 1. Adaptive Content
**Location:** `src/app/features/adaptive-content/`

**Purpose:** Intelligent content system that dynamically adjusts chapter complexity based on learner behavior signals.

**Key Types:**
- `ComprehensionLevel`, `ComprehensionScore`, `ComprehensionModel`
- `BehaviorSignal` (QuizSignal, PlaygroundSignal, SectionTimeSignal, ErrorPatternSignal, VideoSignal, NavigationSignal)
- `AdaptiveSlot`, `AdaptiveSlotContent`, `SectionAdaptiveContent`
- Learning events system with `LearningEvent`, `SessionId`, `EventCategory`
- Concept Entanglement Graph (PreStruggleIndicator, StrugglePrediction, InterventionRecommendation)

**Key Components:**
- ComprehensionIndicator, ComprehensionBadge, StateMachineIndicator
- AdaptiveContentCard, AdaptiveSectionWrapper, AdaptiveSlotInjector
- PredictiveInterventionPanel, FloatingInterventionContainer

**OpenForge Role:** Content generation when students struggle with concepts during contribution work.

---

### 2. Adaptive Learning
**Location:** `src/app/features/adaptive-learning/`

**Purpose:** Generates personalized learning path recommendations based on learner profiles, learning velocity, skill gaps, and job market data.

**Key Types:**
- `LearnerProfile`, `LearningSession`, `SkillAssessment`, `CareerObjective`
- `CompletionPrediction`, `PredictionFactor`
- `PathRecommendation`, `AdaptationSuggestion`
- `JobMarketData`, `SkillGapAnalysis`, `LearningVelocity`

**Key Components:**
- AdaptiveLearningMap, NodePredictionOverlay, PathVisualizer, RecommendedPathIndicator

**OpenForge Role:** Challenge recommendation engine based on skill profile.

---

### 3. Client Simulation
**Location:** `src/app/features/client-simulation/`

**Purpose:** Generative simulation for practicing client communication with AI-powered personas.

**Key Types:**
- `ClientPersona` (demographics, personality, communication style, archetype)
- `ProjectType`, `Requirement`, `BonusObjective`
- `Scenario`, `ScenarioPhase`, `Complication`, `TriggeredComplication`
- `ChatMessage`, `Simulation`, `SimulationEvaluation`

**Key Components:**
- ClientProfile, ChatInterface, RequirementsPanel, TimelineView
- SimulationWorkspace, FeedbackReview

**OpenForge Role:** Optional module for practicing requirement gathering with simulated stakeholders.

---

### 4. Code Playground
**Location:** `src/app/features/code-playground/`

**Purpose:** Interactive code editor with preview and console output.

**Key Types:**
- `CodeFile`, `PlaygroundConfig`, `PlaygroundState`
- `ConsoleMessage`, `SupportedLanguage`

**Key Components:**
- CodePlayground, CodeEditor, PreviewPane, CodePlaygroundSkeleton

**OpenForge Role:** Embedded code editor for quick experiments before contributing.

---

### 5. Competition
**Location:** `src/app/features/competition/`

**Purpose:** Competitive ecosystem with tiered skill progression, challenges, peer review, and leaderboards.

**Key Types:**
- `SkillTier` (bronze to master), `ChallengeDifficulty`, `ChallengeStatus`
- `Challenge`, `ChallengeSpec`, `RequiredFeature`, `BonusObjective`
- `Submission`, `SubmissionScores`, `CodeQualityScore`, `PeerReview`
- `LeaderboardEntry`, `Leaderboard`, `TierProgression`

**Key Components:**
- TierBadge, TierDisplay, ChallengeCard, ChallengeDetail
- Leaderboard, SubmissionEditor, PeerReviewPanel, ChallengeDashboard

**OpenForge Role:** Gamification layer - leaderboards, tiers, competitive challenges.

---

### 6. Contribution Scaffold
**Location:** `src/app/features/contribution-scaffold/`

**Purpose:** Guides open-source contributors with codebase orientation, concept primers, setup guides.

**Key Types:**
- `ScaffoldData`, `CodebaseOrientation`, `DirectoryInfo`, `FileInfo`
- `ConceptPrimer`, `Concept`, `SetupGuide`, `SetupStep`, `CommonIssue`
- `ProgressiveHint`, `HintCategory`, `DocumentLink`

**Key Components:**
- ScaffoldPanel, CodebaseOrientation, ConceptPrimer, SetupGuide
- HintSystem, RelevantDocs

**OpenForge Role:** Core - onboarding panel for each project/challenge.

---

### 7. Contribution Tracker
**Location:** `src/app/features/contribution-tracker/`

**Purpose:** Tracks open-source contributions across lifecycle from claim to merge.

**Key Types:**
- `ContributionStatus` (claimed to merged/closed)
- `ActiveContribution`, `CompletedContribution`
- `ContributionEvent`, `ContributionEventType`
- `ReviewFeedback`, `ContributionStats`

**Key Components:**
- ContributionDashboard, ActiveContributionCard, PRStatusTimeline
- ContributionHistory

**OpenForge Role:** Core - contribution dashboard and timeline.

---

### 8. Curriculum Generator
**Location:** `src/app/features/curriculum-generator/`

**Purpose:** AI-powered curriculum generation with semantic fingerprinting and mastery signals.

**Key Types:**
- `LessonOutline`, `LessonSection`, `CodeSnippet`, `Concept`
- `CodeExercise`, `TestCase`, `Quiz`, `QuizQuestion`
- `ProjectSpecification`, `ProjectMilestone`
- `GeneratedCurriculum`, `GenerationMetadata`
- `SemanticFingerprint`, `SemanticCacheMatch`, `DeltaGenerationRequest`
- `MasterySignal`, `CompletionMetrics`, `SkillProficiency`

**Key Components:**
- LessonViewer, CurriculumOverview, FeedbackModal

**OpenForge Role:** Generate learning prerequisites for challenges.

---

### 9. Generative Content
**Location:** `src/app/features/generative-content/`

**Purpose:** AI-generated chapter content seeded by user learning path decisions.

**Key Types:**
- `LearningPathSeed`, `ContentGenerationParams`
- `VideoScriptSegment`, `GeneratedVideoScript`
- `ProgressiveCodeExample`, `GeneratedQuizQuestion`, `GeneratedKeyPoints`
- `GeneratedChapter`, `GeneratedChapterSection`
- `ContentRating`, `ContentAnnotation`, `ContentVersion`, `ContentFork`

**Key Components:**
- PathExplorer, GeneratedChapterViewer
- ContentRatingModal, ForkContentModal

**OpenForge Role:** Generate explanatory content for complex concepts.

---

### 10. Goal Path (Career Oracle)
**Location:** `src/app/features/goal-path/`

**Purpose:** Career-focused learning path calculation with market timing and skill demand prediction.

**Key Types:**
- `LearnerProfile`, `LearnerSkill`, `LearningStyle`, `RiskTolerance`
- `PathMetrics`, `FrictionAdjustment`
- `SkillDemandPrediction`, `IndustryTrend`, `EmergingTechTrend`
- `PredictiveLearningPath`, `PredictiveModule`, `PathMilestone`
- `DecisionTree`, `DecisionNode`, `ConversationStep`

**Key Components:**
- SemanticSlider, VariantE (Career Oracle)
- PredictiveInsights (SkillDemandCard, IndustryTrendCard)
- JobMarketCard, LearningPathTimeline, ChatTreeRenderer

**OpenForge Role:** Path finder - recommend which projects/skills to focus on.

---

### 11. Knowledge Map
**Location:** `src/app/features/knowledge-map/`

**Purpose:** 5-level hierarchical drill-down navigation (Domain → Course → Chapter → Section → Concept).

**Key Types:**
- `NodeLevel`, `NodeStatus`, `MapNode`
- `DomainNode`, `CourseNode`, `ChapterNode`, `SectionNode`, `ConceptNode`
- `MapConnection`, `ConnectionType`, `NavigationState`, `BreadcrumbItem`
- `ViewportState`, `Point`

**Key Components:**
- MapNode, MapCanvas, MapConnections, MapBreadcrumb
- MapControls, MapLegend, NodeDetailsPanel
- HypotheticalNode, OracleBottomPanel

**OpenForge Role:** Main navigation - project/challenge discovery.

---

### 12. Knowledge Universe
**Location:** `src/app/features/knowledge-universe/`

**Purpose:** Zoomable cosmic visualization of curriculum (domains as planets, chapters as constellations).

**Key Types:**
- `ZoomLevel`, `ZoomLevelConfig`, `UniverseNodeBase`
- `PlanetNode`, `MoonNode`, `StarNode`
- `UniverseConnection`, `CameraState`, `ViewportState`

**Key Components:**
- KnowledgeUniverse, KnowledgeUniversePreview, UniverseCanvas
- NodeTooltip, UniverseControls, ZoomLevelIndicator

**OpenForge Role:** Optional - inspirational landing visualization.

---

### 13. Live Projects
**Location:** `src/app/features/live-projects/`

**Purpose:** Real open-source contribution with scaffolded learning paths and AI mentorship.

**Key Types:**
- `GitHubRepository`, `GitHubIssue`, `IssueLabel`, `GitHubUser`
- `AnalyzedIssue`, `IssueAnalysis`, `ScaffoldedLearningPath`
- `LearningPhase`, `PhaseTask`, `AIAssistanceType`, `LearningCheckpoint`
- `Contribution`, `ContributionStatus`, `PhaseProgress`, `PullRequestInfo`
- `MentorSession`, `AIAssistanceLog`, `ContributionOutcome`
- `ContributionBadge`, `ContributionCertificate`, `JobReferral`

**Key Components:**
- ProjectDiscovery, ContributionTracker, ContributionStats

**OpenForge Role:** Core - merge with remix-projects for contribution workflow.

---

### 14. Open Source Discovery
**Location:** `src/app/features/open-source-discovery/`

**Purpose:** Partner repository browsing with issue discovery and skill matching.

**Key Types:**
- `PartnerRepository`, `DiscoverableIssue`, `TaskAnalysis`
- `TaskComplexity`, `SkillRequirement`, `MatchResult`
- `MatchingPreferences`, `MatchDifficulty`, `SkillGap`

**Key Components:**
- DiscoveryDashboard, IssueCard, RepositoryBrowser
- SkillMatcher, TaskComplexityBadge, ComplexityIndicator

**OpenForge Role:** Core - project catalog and challenge discovery.

---

### 15. Path Comparison
**Location:** `src/app/features/path-comparison/`

**Purpose:** Side-by-side comparison of multiple learning paths.

**OpenForge Role:** Compare different project learning paths.

---

### 16. Remix Projects
**Location:** `src/app/features/remix-projects/`

**Purpose:** Inheriting and improving existing codebases with diff analysis and quality gates.

**Key Types:**
- `ProjectDomain`, `ProjectDifficulty`, `TechStack`, `DeveloperPersona`
- `ProjectFile`, `DirectoryNode`, `ProjectRepository`, `SeedProject`
- `Objective`, `Hint`, `Assignment`, `ModifiedFile`, `UserFork`
- `DiffChange`, `DiffHunk`, `FileDiff`, `ProjectDiff`
- `SubmissionAnalysis`, `SubmissionScores`, `Submission`
- `QualityGateResult`, `EvolutionEligibility`

**Key Components:**
- ProjectCard, PreviousDevContext, CodeExplorer
- ProjectBrowser, ProjectDetail, AssignmentPanel
- DiffViewer, QualityReport, RemixWorkspace, ScannedProjects

**OpenForge Role:** Core - contribution workspace with diff/quality tools.

---

### 17. Shareable Links
**Location:** `src/app/features/shareable-links/`

**Purpose:** Social sharing of learning paths with OG meta tags.

**Key Types:**
- `ShareableLinkData`, `SharePreviewData`, `OGImageParams`

**OpenForge Role:** Share contribution achievements.

---

### 18. Skill Assessment
**Location:** `src/app/features/skill-assessment/`

**Purpose:** Interactive landing assessment for personalizing onboarding.

**Key Types:**
- `SkillLevel`, `LearningPath`, `LearningIntensity`, `PrimaryGoal`
- `AssessmentOption`, `AssessmentQuestion`, `AssessmentAnswer`
- `AssessmentState`, `AssessmentResult`

**Key Components:**
- (Assessment UI components)

**OpenForge Role:** Initial skill profiling for challenge matching.

---

### 19. Social Proof
**Location:** `src/app/features/social-proof/`

**Purpose:** Animated visualizations of learner journeys showing career transformations.

**Key Types:**
- `LearnerStartingPoint`, `CareerOutcome`, `JourneyNode`, `LearnerJourney`

**Key Components:**
- SocialProofVisualization, LearnerPath, JourneyCard, PathFilter

**OpenForge Role:** Landing page - show contributor success stories.

---

### 20. User Learning Graph
**Location:** `src/app/features/user-learning-graph/`

**Purpose:** Transforms user decisions into mutations on personal learning graph.

**OpenForge Role:** Track personal skill growth from contributions.

---

### 21. User Velocity
**Location:** `src/app/features/user-velocity/`

**Purpose:** Adaptive UI based on user behavior (exploration vs focused mode).

**Key Types:**
- `VelocityLevel`, `VelocitySignals`, `VelocityAdaptations`

**Key Components:**
- UserVelocityProviderWrapper, VelocityIndicator

**OpenForge Role:** Adapt UI density based on user behavior.

---

### 22. Streaks
**Location:** `src/app/features/streaks/`

**Purpose:** Daily learning streak tracking with milestones and freeze tokens.

**Key Components:**
- DailyGoalSelector, DailyProgressRing, StreakDisplay
- MilestoneCelebration, StreakWidget, Confetti

**OpenForge Role:** Keep - daily contribution habits.

---

### 23. Certificates
**Location:** `src/app/features/certificates/`

**Purpose:** Certificate issuance, verification, and sharing.

**Key Components:**
- CertificateDisplay, CertificateModal, CertificateGallery
- CertificateIssueModal, CertificateVerification

**OpenForge Role:** Keep - contribution certificates.

---

### 24. Bookmarks
**Location:** `src/app/features/bookmarks/`

**Purpose:** Save and organize course content bookmarks.

**Key Types:**
- `Bookmark`, `BookmarkFilters`

**Key Components:**
- BookmarkButton, BookmarkIndicator, BookmarkCard, MyNotesPage

**OpenForge Role:** Keep - bookmark challenges and code.

---

### 25. Progress
**Location:** `src/app/features/progress/`

**Purpose:** Track course completion, video time, quiz scores.

**Key Components:**
- ProgressBar, CourseProgressCard, ContinueLearningButton
- ContinueLearningSection, ProgressExportModal

**OpenForge Role:** Keep - track learning progress.

---

## Consolidation Recommendations

### Keep As-Is (Universal Infrastructure)
1. Progress
2. Streaks
3. Bookmarks
4. Certificates
5. Code Playground
6. User Velocity

### Merge into Unified Skill System
- Skill Assessment + Adaptive Learning → **Skill Profile**
- Goal Path career features → **Career Goals**

### Merge into Unified Content Engine
- Adaptive Content + Generative Content + Curriculum Generator → **Content Engine**

### Merge into Core Contribution System
- Remix Projects + Live Projects → **Projects**
- Competition challenges + Contribution Scaffold → **Challenges**
- Contribution Tracker → **Contributions**
- Open Source Discovery → **Discovery**

### Keep for Navigation
- Knowledge Map → Main navigation
- Path Comparison → Compare projects

### Optional/Landing Page
- Knowledge Universe (impressive but not core)
- Social Proof (landing page)
- Client Simulation (optional soft skills)
- Shareable Links

---

## Data Flow in OpenForge

```
User Onboarding
      ↓
Skill Assessment → Skill Profile
      ↓
Project Discovery (Knowledge Map + Discovery)
      ↓
Challenge Selection (matched to skills)
      ↓
Contribution Workspace (Remix + Scaffold)
      ↓
AI Review → Skill Evidence
      ↓
Merge → XP + Certificates + Streaks
      ↓
Updated Skill Profile → Better Recommendations
```

---

*This analysis informs the Implementation Plan. Last updated: December 2024*
