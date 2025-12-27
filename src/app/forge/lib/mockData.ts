// OpenForge Mock Data

import type {
    UserProfile,
    ForgeProject,
    Challenge,
    Contribution,
    Review,
    LeaderboardEntry,
    OnboardingState,
} from "./types";

// ============================================================================
// CURRENT USER
// ============================================================================

export const mockCurrentUser: UserProfile = {
    id: "user-1",
    username: "alex_dev",
    displayName: "Alex Chen",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    githubUsername: "alexchen",
    githubConnected: true,

    level: 7,
    xp: 2450,
    xpToNextLevel: 550,
    contributionCount: 23,
    mergedPRCount: 18,
    currentStreak: 5,

    skills: [
        { id: "s1", name: "React", level: "intermediate", proficiency: 75, evidenceCount: 12 },
        { id: "s2", name: "TypeScript", level: "intermediate", proficiency: 60, evidenceCount: 8 },
        { id: "s3", name: "Node.js", level: "beginner", proficiency: 80, evidenceCount: 5 },
        { id: "s4", name: "PostgreSQL", level: "beginner", proficiency: 40, evidenceCount: 3 },
        { id: "s5", name: "Testing", level: "beginner", proficiency: 30, evidenceCount: 2 },
    ],

    onboardingComplete: true,
    joinedAt: "2024-09-15T10:00:00Z",
};

export const mockNewUser: UserProfile = {
    id: "user-new",
    username: "",
    displayName: "",
    avatarUrl: "",
    githubConnected: false,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    contributionCount: 0,
    mergedPRCount: 0,
    currentStreak: 0,
    skills: [],
    onboardingComplete: false,
    joinedAt: new Date().toISOString(),
};

// ============================================================================
// PROJECTS
// ============================================================================

export const mockProjects: ForgeProject[] = [
    {
        id: "proj-1",
        slug: "open-crm",
        name: "OpenCRM",
        tagline: "Free, open-source alternative to Salesforce",
        description: `OpenCRM is a full-featured customer relationship management system designed for small to medium businesses. Built with modern technologies, it provides contact management, deal pipelines, email integration, and reporting - all without the enterprise price tag.

We're building this as a community to prove that powerful business software can be free and open source.`,
        targetProduct: "Salesforce",
        targetProductUrl: "https://salesforce.com",
        category: "crm",
        language: "TypeScript",
        framework: "Next.js",
        techStack: ["React", "TypeScript", "Next.js", "PostgreSQL", "Prisma", "Tailwind CSS"],
        githubUrl: "https://github.com/openforge/open-crm",
        status: "active",
        featureParityPercent: 35,
        contributorCount: 47,
        openChallenges: 24,
        completedChallenges: 89,
        starCount: 1240,
        skillsTaught: ["React", "TypeScript", "API Design", "Database Modeling", "Testing"],
        difficultyRange: "beginner-advanced",
        screenshotUrls: [],
        demoUrl: "https://demo.opencrm.dev",
        leadMaintainers: [
            { id: "m1", username: "sarah_leads", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah", role: "lead" },
            { id: "m2", username: "mike_reviews", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike", role: "maintainer" },
        ],
    },
    {
        id: "proj-2",
        slug: "open-tasks",
        name: "OpenTasks",
        tagline: "Project management without the complexity",
        description: `OpenTasks brings the power of Jira and Asana to everyone - for free. Kanban boards, sprint planning, time tracking, and team collaboration in one simple package.

Perfect for learning about real-time collaboration, drag-and-drop interfaces, and complex state management.`,
        targetProduct: "Jira",
        targetProductUrl: "https://atlassian.com/jira",
        category: "project_management",
        language: "TypeScript",
        framework: "Next.js",
        techStack: ["React", "TypeScript", "Next.js", "Supabase", "DnD Kit", "Tailwind CSS"],
        githubUrl: "https://github.com/openforge/open-tasks",
        status: "active",
        featureParityPercent: 28,
        contributorCount: 31,
        openChallenges: 18,
        completedChallenges: 52,
        starCount: 890,
        skillsTaught: ["React", "Real-time", "Drag & Drop", "State Management"],
        difficultyRange: "intermediate-advanced",
        screenshotUrls: [],
        leadMaintainers: [
            { id: "m3", username: "jenny_pm", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jenny", role: "lead" },
        ],
    },
    {
        id: "proj-3",
        slug: "open-forms",
        name: "OpenForms",
        tagline: "Beautiful forms without the price tag",
        description: `OpenForms is a Typeform alternative that lets anyone create beautiful, interactive forms and surveys. Drag-and-drop builder, conditional logic, integrations, and analytics.

Great project for learning form design, validation, conditional rendering, and data visualization.`,
        targetProduct: "Typeform",
        targetProductUrl: "https://typeform.com",
        category: "marketing",
        language: "TypeScript",
        framework: "Next.js",
        techStack: ["React", "TypeScript", "Next.js", "MongoDB", "Framer Motion"],
        githubUrl: "https://github.com/openforge/open-forms",
        status: "active",
        featureParityPercent: 45,
        contributorCount: 22,
        openChallenges: 12,
        completedChallenges: 38,
        starCount: 567,
        skillsTaught: ["React", "Form Handling", "Animation", "Data Visualization"],
        difficultyRange: "beginner-intermediate",
        screenshotUrls: [],
        leadMaintainers: [
            { id: "m4", username: "design_dan", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=dan", role: "lead" },
        ],
    },
    {
        id: "proj-4",
        slug: "open-analytics",
        name: "OpenAnalytics",
        tagline: "Privacy-first website analytics",
        description: `OpenAnalytics provides website traffic insights without compromising visitor privacy. No cookies, GDPR compliant, and fully self-hostable.

Learn about data pipelines, real-time dashboards, and building performant data aggregation systems.`,
        targetProduct: "Mixpanel",
        targetProductUrl: "https://mixpanel.com",
        category: "analytics",
        language: "TypeScript",
        framework: "Next.js",
        techStack: ["React", "TypeScript", "Next.js", "ClickHouse", "Redis"],
        githubUrl: "https://github.com/openforge/open-analytics",
        status: "planning",
        featureParityPercent: 12,
        contributorCount: 8,
        openChallenges: 32,
        completedChallenges: 11,
        starCount: 234,
        skillsTaught: ["Data Engineering", "Real-time Processing", "Data Visualization"],
        difficultyRange: "intermediate-advanced",
        screenshotUrls: [],
        leadMaintainers: [
            { id: "m5", username: "data_diana", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana", role: "lead" },
        ],
    },
];

// ============================================================================
// CHALLENGES
// ============================================================================

export const mockChallenges: Challenge[] = [
    {
        id: "ch-1",
        projectId: "proj-1",
        projectName: "OpenCRM",
        type: "feature",
        difficulty: "beginner",
        title: "Add contact search functionality",
        description: "The contact list currently doesn't have search. Users need to be able to quickly find contacts by name, email, or company.",
        context: "This is a foundational feature that many other parts of the app will depend on. The search should be fast and intuitive.",
        location: {
            file: "src/components/contacts/ContactList.tsx",
            startLine: 45,
            endLine: 78,
        },
        codeSnippet: `export function ContactList({ contacts }: ContactListProps) {
  // TODO: Add search functionality here
  return (
    <div className="contact-list">
      {contacts.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}`,
        instructions: `1. Add a search input component above the contact list
2. Implement filtering logic to search by name, email, and company
3. Add debouncing to prevent excessive re-renders (300ms delay)
4. Show a "No results" message when search returns empty
5. Highlight matching text in results (bonus)`,
        expectedOutcome: "Users can type in a search box and see contacts filtered in real-time. The search should feel snappy and the UI should clearly indicate when no results are found.",
        hints: [
            { level: 1, content: "Look into useMemo for the filtered list and useState for the search query", xpPenalty: 10, revealed: false },
            { level: 2, content: "Use a custom hook like useDebounce to handle the debouncing logic", xpPenalty: 25, revealed: false },
            { level: 3, content: "Filter using: contacts.filter(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query))", xpPenalty: 50, revealed: false },
        ],
        skillsRequired: ["React basics", "JavaScript"],
        skillsTaught: ["React hooks", "Debouncing", "Search UX"],
        tags: ["react", "search", "ux", "good-first-issue"],
        estimatedMinutes: 45,
        xpReward: 150,
        status: "open",
        timesCompleted: 12,
        avgCompletionMinutes: 52,
        successRate: 0.85,
    },
    {
        id: "ch-2",
        projectId: "proj-1",
        projectName: "OpenCRM",
        type: "bug",
        difficulty: "beginner",
        title: "Fix date picker timezone issue",
        description: "When users in different timezones create a task with a due date, the date sometimes shows as the day before. This is causing confusion.",
        context: "This bug was reported by users in Australia and affects anyone not in UTC. It's a common timezone handling issue.",
        location: {
            file: "src/utils/dateUtils.ts",
            startLine: 12,
            endLine: 28,
        },
        codeSnippet: `export function formatDueDate(date: Date): string {
  // BUG: This doesn't account for timezone offset
  return date.toISOString().split('T')[0];
}`,
        instructions: `1. Identify why the date is being shifted
2. Fix the formatDueDate function to handle timezones correctly
3. Add unit tests for different timezone scenarios
4. Verify the fix works for creating, displaying, and editing dates`,
        expectedOutcome: "Users should see the exact date they selected, regardless of their timezone. The fix should not break any existing date functionality.",
        hints: [
            { level: 1, content: "The issue is that toISOString() converts to UTC first", xpPenalty: 10, revealed: false },
            { level: 2, content: "Consider using date-fns or dayjs for more reliable date handling", xpPenalty: 25, revealed: false },
            { level: 3, content: "Use format(date, 'yyyy-MM-dd') from date-fns to preserve local date", xpPenalty: 50, revealed: false },
        ],
        skillsRequired: ["JavaScript", "Date handling basics"],
        skillsTaught: ["Timezone handling", "Testing", "Debugging"],
        tags: ["bug", "dates", "timezone", "good-first-issue"],
        estimatedMinutes: 30,
        xpReward: 100,
        status: "open",
        timesCompleted: 8,
        avgCompletionMinutes: 35,
        successRate: 0.90,
    },
    {
        id: "ch-3",
        projectId: "proj-1",
        projectName: "OpenCRM",
        type: "feature",
        difficulty: "intermediate",
        title: "Implement deal pipeline drag-and-drop",
        description: "Users should be able to drag deals between pipeline stages (Lead → Qualified → Proposal → Won/Lost). This is a core CRM feature.",
        context: "The pipeline view already shows deals in columns by stage. We need to add the ability to move deals between stages by dragging.",
        instructions: `1. Install and configure @dnd-kit/core and @dnd-kit/sortable
2. Make each deal card draggable
3. Make each stage column a drop target
4. Update the deal's stage when dropped
5. Add visual feedback during drag (shadow, placeholder)
6. Persist the change to the backend
7. Handle error cases gracefully`,
        expectedOutcome: "Users can drag deals between pipeline stages with smooth animations. Changes persist immediately. The UX should feel as good as Trello.",
        hints: [
            { level: 1, content: "Start with @dnd-kit's basic example and adapt it to your column layout", xpPenalty: 15, revealed: false },
            { level: 2, content: "Use useSensors with PointerSensor and set an activation constraint to prevent accidental drags", xpPenalty: 35, revealed: false },
            { level: 3, content: "Track the active item in state and use DragOverlay for the visual feedback", xpPenalty: 60, revealed: false },
        ],
        skillsRequired: ["React", "TypeScript", "State management"],
        skillsTaught: ["Drag and drop", "Complex UI interactions", "Optimistic updates"],
        tags: ["react", "dnd", "intermediate", "ux"],
        estimatedMinutes: 120,
        xpReward: 350,
        status: "open",
        timesCompleted: 4,
        avgCompletionMinutes: 145,
        successRate: 0.65,
    },
    {
        id: "ch-4",
        projectId: "proj-1",
        projectName: "OpenCRM",
        type: "refactor",
        difficulty: "intermediate",
        title: "Extract reusable DataTable component",
        description: "We have similar table implementations in Contacts, Deals, and Activities. Extract a shared DataTable component to reduce duplication.",
        context: "Code duplication is causing bugs to be fixed in one place but not others. A unified component will improve consistency and maintainability.",
        instructions: `1. Analyze the three existing table implementations
2. Identify common features (sorting, pagination, selection)
3. Design a flexible DataTable component API
4. Implement the component with proper TypeScript generics
5. Migrate all three usages to the new component
6. Add documentation for the component`,
        expectedOutcome: "A single DataTable component that handles all table use cases. Existing functionality preserved. Clear API with TypeScript types.",
        hints: [
            { level: 1, content: "Use generics like DataTable<T> to handle different data types", xpPenalty: 20, revealed: false },
            { level: 2, content: "Accept column definitions as props with render functions for custom cells", xpPenalty: 40, revealed: false },
            { level: 3, content: "Look at @tanstack/react-table for inspiration on the API design", xpPenalty: 70, revealed: false },
        ],
        skillsRequired: ["React", "TypeScript", "Component design"],
        skillsTaught: ["Generics", "Component abstraction", "API design"],
        tags: ["refactor", "typescript", "components", "intermediate"],
        estimatedMinutes: 180,
        xpReward: 400,
        status: "open",
        timesCompleted: 2,
        avgCompletionMinutes: 210,
        successRate: 0.55,
    },
    {
        id: "ch-5",
        projectId: "proj-2",
        projectName: "OpenTasks",
        type: "feature",
        difficulty: "beginner",
        title: "Add task priority badges",
        description: "Tasks should display their priority level (Low, Medium, High, Urgent) with colored badges. This helps users quickly identify important tasks.",
        context: "The task model already has a priority field, it just needs to be displayed in the UI.",
        instructions: `1. Create a PriorityBadge component with appropriate colors
2. Display the badge on TaskCard component
3. Add the badge to the task detail view
4. Make sure colors are accessible (sufficient contrast)`,
        expectedOutcome: "Each task shows a colored badge indicating its priority. Colors are consistent across the app and accessible.",
        hints: [
            { level: 1, content: "Use a switch statement or object map for priority → color mapping", xpPenalty: 10, revealed: false },
            { level: 2, content: "Consider using CSS variables or Tailwind classes for the colors", xpPenalty: 20, revealed: false },
            { level: 3, content: "Low=blue, Medium=yellow, High=orange, Urgent=red is a common pattern", xpPenalty: 40, revealed: false },
        ],
        skillsRequired: ["React basics", "CSS"],
        skillsTaught: ["Component design", "Accessibility", "Color systems"],
        tags: ["react", "ui", "beginner", "good-first-issue"],
        estimatedMinutes: 25,
        xpReward: 75,
        status: "open",
        timesCompleted: 18,
        avgCompletionMinutes: 22,
        successRate: 0.95,
    },
    {
        id: "ch-6",
        projectId: "proj-3",
        projectName: "OpenForms",
        type: "feature",
        difficulty: "advanced",
        title: "Implement conditional form logic",
        description: "Form builders should be able to show/hide fields based on previous answers. For example: 'If country = USA, show state dropdown.'",
        context: "This is a highly requested feature. Typeform and Google Forms both have this. It requires a rule engine and dynamic field rendering.",
        instructions: `1. Design a data structure for conditional rules
2. Create a rule builder UI in the form editor
3. Implement the rule evaluation engine
4. Apply rules during form rendering
5. Handle complex cases (multiple conditions, nested rules)
6. Add rule validation (prevent circular dependencies)`,
        expectedOutcome: "Form creators can add conditional logic through an intuitive UI. Form takers see fields appear/disappear smoothly based on their answers.",
        hints: [
            { level: 1, content: "Start with simple show/hide rules before adding complex conditions", xpPenalty: 25, revealed: false },
            { level: 2, content: "Store rules as { fieldId, operator, value, action, targetFieldId }", xpPenalty: 50, revealed: false },
            { level: 3, content: "Use a topological sort to evaluate rules in the correct order", xpPenalty: 100, revealed: false },
        ],
        skillsRequired: ["React", "TypeScript", "State management", "Algorithms"],
        skillsTaught: ["Rule engines", "Complex state", "UX for power features"],
        tags: ["advanced", "feature", "architecture"],
        estimatedMinutes: 480,
        xpReward: 800,
        status: "open",
        timesCompleted: 1,
        avgCompletionMinutes: 520,
        successRate: 0.40,
    },
];

// ============================================================================
// CONTRIBUTIONS
// ============================================================================

export const mockContributions: Contribution[] = [
    {
        id: "contrib-1",
        userId: "user-1",
        challengeId: "ch-1",
        challenge: mockChallenges[0],
        projectId: "proj-1",
        projectName: "OpenCRM",
        forkUrl: "https://github.com/alexchen/open-crm",
        branchName: "feature/contact-search",
        prUrl: "https://github.com/openforge/open-crm/pull/234",
        prNumber: 234,
        status: "merged",
        claimedAt: "2024-12-20T10:00:00Z",
        startedAt: "2024-12-20T10:15:00Z",
        submittedAt: "2024-12-20T11:05:00Z",
        mergedAt: "2024-12-21T09:30:00Z",
        timeSpentMinutes: 50,
        hintsUsed: 1,
        score: 92,
        xpEarned: 140,
        reviews: [],
    },
    {
        id: "contrib-2",
        userId: "user-1",
        challengeId: "ch-3",
        challenge: mockChallenges[2],
        projectId: "proj-1",
        projectName: "OpenCRM",
        forkUrl: "https://github.com/alexchen/open-crm",
        branchName: "feature/pipeline-dnd",
        prUrl: "https://github.com/openforge/open-crm/pull/267",
        prNumber: 267,
        status: "changes_requested",
        claimedAt: "2024-12-24T14:00:00Z",
        startedAt: "2024-12-24T14:30:00Z",
        submittedAt: "2024-12-26T16:00:00Z",
        timeSpentMinutes: 185,
        hintsUsed: 0,
        reviews: [],
    },
    {
        id: "contrib-3",
        userId: "user-1",
        challengeId: "ch-5",
        challenge: mockChallenges[4],
        projectId: "proj-2",
        projectName: "OpenTasks",
        status: "in_progress",
        claimedAt: "2024-12-27T09:00:00Z",
        startedAt: "2024-12-27T09:15:00Z",
        timeSpentMinutes: 45,
        hintsUsed: 0,
        reviews: [],
    },
];

// ============================================================================
// REVIEWS
// ============================================================================

export const mockReviews: Review[] = [
    {
        id: "review-1",
        contributionId: "contrib-1",
        type: "ai_tutor",
        reviewerName: "Claude (AI Tutor)",
        verdict: "approved",
        summary: "Excellent implementation! The search functionality is clean, performant, and handles edge cases well. Great use of debouncing.",
        feedbackItems: [
            {
                type: "praise",
                content: "Nice use of useMemo to prevent unnecessary filtering on every render.",
            },
            {
                type: "praise",
                file: "src/components/contacts/ContactList.tsx",
                line: 52,
                content: "The debounce hook is well implemented and properly handles cleanup.",
            },
            {
                type: "suggestion",
                file: "src/components/contacts/ContactList.tsx",
                line: 67,
                content: "Consider adding a minimum character requirement before searching to avoid showing results for very short queries.",
                codeSnippet: "if (query.length >= 2) { /* filter */ }",
            },
        ],
        learningPoints: [
            "Debouncing is crucial for performance when handling user input that triggers expensive operations",
            "useMemo helps prevent unnecessary recalculations, but only use it when the computation is expensive",
            "Always consider empty states - what does the user see when there are no results?",
        ],
        suggestedResources: [
            {
                type: "article",
                title: "A Complete Guide to useEffect",
                url: "https://overreacted.io/a-complete-guide-to-useeffect/",
                reason: "Deepens understanding of hooks and cleanup patterns",
            },
        ],
        scores: {
            codeQuality: 90,
            completeness: 95,
            testCoverage: 80,
            documentation: 85,
            overall: 92,
        },
        createdAt: "2024-12-20T11:30:00Z",
    },
    {
        id: "review-2",
        contributionId: "contrib-2",
        type: "ai_tutor",
        reviewerName: "Claude (AI Tutor)",
        verdict: "changes_requested",
        summary: "Good progress on the drag and drop implementation! A few issues to address before this can be merged.",
        feedbackItems: [
            {
                type: "praise",
                content: "The basic drag functionality works well and the animations are smooth.",
            },
            {
                type: "issue",
                file: "src/components/pipeline/DealPipeline.tsx",
                line: 89,
                content: "The drop handler isn't updating the backend - deals revert after refresh.",
                codeSnippet: "// TODO: Call API to persist stage change",
            },
            {
                type: "issue",
                file: "src/components/pipeline/DealPipeline.tsx",
                line: 45,
                content: "Missing error handling - if the API call fails, the user sees no feedback.",
            },
            {
                type: "suggestion",
                content: "Consider adding optimistic updates for a snappier feel, then rollback if the API fails.",
            },
        ],
        learningPoints: [
            "Always persist user actions to the backend - the UI should reflect the true state",
            "Optimistic updates improve perceived performance but require proper error handling",
            "User feedback is crucial - show loading states and error messages",
        ],
        suggestedResources: [
            {
                type: "docs",
                title: "DnD Kit Documentation",
                url: "https://dndkit.com/docs/",
                reason: "Reference for advanced drag and drop patterns",
            },
            {
                type: "article",
                title: "Optimistic Updates in React",
                url: "https://blog.example.com/optimistic-updates",
                reason: "Learn patterns for responsive UIs with backend sync",
            },
        ],
        scores: {
            codeQuality: 75,
            completeness: 60,
            testCoverage: 50,
            documentation: 65,
            overall: 65,
        },
        createdAt: "2024-12-26T18:00:00Z",
    },
];

// ============================================================================
// LEADERBOARD
// ============================================================================

export const mockLeaderboard: LeaderboardEntry[] = [
    {
        rank: 1,
        userId: "user-top-1",
        username: "code_master",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=codemaster",
        contributionCount: 89,
        mergedPRs: 76,
        xp: 12450,
        level: 24,
        badges: ["founding_contributor", "100_prs", "mentor"],
        lastActiveAt: "2024-12-27T08:00:00Z",
    },
    {
        rank: 2,
        userId: "user-top-2",
        username: "react_wizard",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=wizard",
        contributionCount: 72,
        mergedPRs: 65,
        xp: 10200,
        level: 21,
        badges: ["bug_hunter", "react_expert"],
        lastActiveAt: "2024-12-26T22:00:00Z",
    },
    {
        rank: 3,
        userId: "user-top-3",
        username: "typescript_pro",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=tspro",
        contributionCount: 58,
        mergedPRs: 51,
        xp: 8750,
        level: 18,
        badges: ["typescript_expert", "code_reviewer"],
        lastActiveAt: "2024-12-27T06:00:00Z",
    },
    {
        rank: 4,
        userId: "user-top-4",
        username: "fullstack_dev",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=fullstack",
        contributionCount: 45,
        mergedPRs: 38,
        xp: 6200,
        level: 15,
        badges: ["first_feature", "week_streak_10"],
        lastActiveAt: "2024-12-25T15:00:00Z",
    },
    {
        rank: 5,
        userId: "user-1",
        username: "alex_dev",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
        contributionCount: 23,
        mergedPRs: 18,
        xp: 2450,
        level: 7,
        badges: ["first_pr", "week_streak_5"],
        lastActiveAt: "2024-12-27T09:00:00Z",
    },
];

// ============================================================================
// ONBOARDING
// ============================================================================

export const mockOnboardingState: OnboardingState = {
    currentStep: 0,
    totalSteps: 5,
    githubConnected: false,
    completed: false,
};

// ============================================================================
// RECOMMENDED CHALLENGES
// ============================================================================

export function getRecommendedChallenges(user: UserProfile): Challenge[] {
    // Simple matching logic based on skill levels
    return mockChallenges
        .filter(c => c.status === "open")
        .filter(c => {
            // Match difficulty to user level
            if (user.level < 5 && c.difficulty === "advanced") return false;
            if (user.level < 3 && c.difficulty === "intermediate") return false;
            return true;
        })
        .slice(0, 5);
}

// ============================================================================
// PROJECT FEATURES
// ============================================================================

export const mockProjectFeatures: Record<string, { title: string; description: string; status: string; challengeCount: number }[]> = {
    "proj-1": [
        { title: "Contact Management", description: "CRUD operations for contacts", status: "completed", challengeCount: 8 },
        { title: "Deal Pipeline", description: "Kanban-style deal tracking", status: "in_progress", challengeCount: 12 },
        { title: "Email Integration", description: "Send/receive emails from CRM", status: "planned", challengeCount: 6 },
        { title: "Reporting Dashboard", description: "Charts and analytics", status: "planned", challengeCount: 15 },
        { title: "API & Integrations", description: "REST API and third-party integrations", status: "planned", challengeCount: 10 },
    ],
};
