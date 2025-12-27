import { PartnerRepository, DiscoverableIssue } from "./types";

// Curated list of beginner-friendly open source repositories
export const MOCK_REPOSITORIES: PartnerRepository[] = [
    {
        id: "repo-1",
        name: "react-patterns",
        owner: "kentcdodds",
        url: "https://github.com/kentcdodds/react-patterns",
        description: "A collection of React patterns, techniques, tips and tricks",
        languages: ["TypeScript", "React", "JavaScript"],
        learnerFriendliness: "beginner",
        contributingGuidelinesUrl: "https://github.com/kentcdodds/react-patterns/blob/main/CONTRIBUTING.md",
        mentorshipAvailable: true,
        avgResponseTime: 24,
        activeContributors: 45,
        stars: 12400,
        topics: ["react", "patterns", "hooks", "components"],
        lastUpdated: "2024-12-20T10:00:00Z",
    },
    {
        id: "repo-2",
        name: "next-auth",
        owner: "nextauthjs",
        url: "https://github.com/nextauthjs/next-auth",
        description: "Authentication for Next.js applications",
        languages: ["TypeScript", "JavaScript"],
        learnerFriendliness: "intermediate",
        contributingGuidelinesUrl: "https://github.com/nextauthjs/next-auth/blob/main/CONTRIBUTING.md",
        mentorshipAvailable: true,
        avgResponseTime: 48,
        activeContributors: 320,
        stars: 21000,
        topics: ["authentication", "nextjs", "oauth", "security"],
        lastUpdated: "2024-12-22T14:30:00Z",
    },
    {
        id: "repo-3",
        name: "zustand",
        owner: "pmndrs",
        url: "https://github.com/pmndrs/zustand",
        description: "Bear necessities for state management in React",
        languages: ["TypeScript"],
        learnerFriendliness: "intermediate",
        mentorshipAvailable: false,
        avgResponseTime: 72,
        activeContributors: 180,
        stars: 42000,
        topics: ["state-management", "react", "hooks"],
        lastUpdated: "2024-12-21T09:15:00Z",
    },
    {
        id: "repo-4",
        name: "tailwindcss",
        owner: "tailwindlabs",
        url: "https://github.com/tailwindlabs/tailwindcss",
        description: "A utility-first CSS framework for rapid UI development",
        languages: ["JavaScript", "CSS"],
        learnerFriendliness: "intermediate",
        contributingGuidelinesUrl: "https://github.com/tailwindlabs/tailwindcss/blob/master/CONTRIBUTING.md",
        mentorshipAvailable: false,
        avgResponseTime: 96,
        activeContributors: 420,
        stars: 78000,
        topics: ["css", "design-system", "utility-classes"],
        lastUpdated: "2024-12-23T16:45:00Z",
    },
    {
        id: "repo-5",
        name: "deno",
        owner: "denoland",
        url: "https://github.com/denoland/deno",
        description: "A modern runtime for JavaScript and TypeScript",
        languages: ["Rust", "TypeScript", "JavaScript"],
        learnerFriendliness: "advanced",
        contributingGuidelinesUrl: "https://github.com/denoland/deno/blob/main/CONTRIBUTING.md",
        mentorshipAvailable: true,
        avgResponseTime: 36,
        activeContributors: 680,
        stars: 93000,
        topics: ["runtime", "typescript", "javascript", "rust"],
        lastUpdated: "2024-12-24T08:00:00Z",
    },
    {
        id: "repo-6",
        name: "excalidraw",
        owner: "excalidraw",
        url: "https://github.com/excalidraw/excalidraw",
        description: "Virtual whiteboard for sketching hand-drawn diagrams",
        languages: ["TypeScript", "React"],
        learnerFriendliness: "beginner",
        contributingGuidelinesUrl: "https://github.com/excalidraw/excalidraw/blob/master/CONTRIBUTING.md",
        mentorshipAvailable: true,
        avgResponseTime: 18,
        activeContributors: 290,
        stars: 72000,
        topics: ["canvas", "drawing", "collaboration", "react"],
        lastUpdated: "2024-12-24T12:30:00Z",
    },
];

// Mock discoverable issues with analysis
export const MOCK_ISSUES: DiscoverableIssue[] = [
    {
        id: "issue-1",
        repositoryId: "repo-1",
        repositoryName: "react-patterns",
        repositoryOwner: "kentcdodds",
        githubId: 1234,
        title: "Add compound components pattern example",
        body: "We need a comprehensive example showing how to build compound components with context. Should include Menu, Accordion, and Tabs examples.",
        url: "https://github.com/kentcdodds/react-patterns/issues/1234",
        labels: ["good first issue", "documentation", "enhancement"],
        createdAt: "2024-12-15T10:00:00Z",
        updatedAt: "2024-12-20T14:30:00Z",
        commentCount: 5,
        isPullRequest: false,
        analysis: {
            complexity: "moderate",
            estimatedHours: 4,
            requiredSkills: [
                { skillId: "react", skillName: "React", level: "intermediate", isStretch: false },
                { skillId: "typescript", skillName: "TypeScript", level: "beginner", isStretch: false },
                { skillId: "patterns", skillName: "Design Patterns", level: "intermediate", isStretch: true },
            ],
            learningOpportunities: [
                "Compound component pattern",
                "React Context API",
                "Component composition",
            ],
            prerequisiteKnowledge: [
                "Basic React hooks (useState, useContext)",
                "TypeScript generics",
            ],
            suggestedApproach: "Start by reviewing existing pattern examples. Create a Menu component first, then generalize the pattern.",
            potentialBlockers: ["May need maintainer input on API design"],
            confidence: 0.85,
        },
    },
    {
        id: "issue-2",
        repositoryId: "repo-6",
        repositoryName: "excalidraw",
        repositoryOwner: "excalidraw",
        githubId: 5678,
        title: "Fix keyboard shortcut conflict with browser",
        body: "Ctrl+S triggers browser save dialog instead of app save. Need to prevent default browser behavior.",
        url: "https://github.com/excalidraw/excalidraw/issues/5678",
        labels: ["good first issue", "bug", "keyboard"],
        createdAt: "2024-12-18T09:00:00Z",
        updatedAt: "2024-12-22T11:00:00Z",
        commentCount: 3,
        isPullRequest: false,
        analysis: {
            complexity: "simple",
            estimatedHours: 2,
            requiredSkills: [
                { skillId: "javascript", skillName: "JavaScript", level: "beginner", isStretch: false },
                { skillId: "events", skillName: "DOM Events", level: "intermediate", isStretch: true },
            ],
            learningOpportunities: [
                "Event handling in React",
                "Browser event delegation",
                "Keyboard accessibility",
            ],
            prerequisiteKnowledge: [
                "JavaScript event handling",
                "React event system",
            ],
            suggestedApproach: "Find existing keyboard handler, add preventDefault() for Ctrl+S combination.",
            potentialBlockers: [],
            confidence: 0.95,
        },
    },
    {
        id: "issue-3",
        repositoryId: "repo-2",
        repositoryName: "next-auth",
        repositoryOwner: "nextauthjs",
        githubId: 9012,
        title: "Add support for custom session serialization",
        body: "Allow users to define custom session serialization logic for edge runtime compatibility.",
        url: "https://github.com/nextauthjs/next-auth/issues/9012",
        labels: ["enhancement", "help wanted"],
        createdAt: "2024-12-10T15:00:00Z",
        updatedAt: "2024-12-21T16:45:00Z",
        commentCount: 12,
        isPullRequest: false,
        analysis: {
            complexity: "complex",
            estimatedHours: 16,
            requiredSkills: [
                { skillId: "typescript", skillName: "TypeScript", level: "advanced", isStretch: false },
                { skillId: "nextjs", skillName: "Next.js", level: "intermediate", isStretch: false },
                { skillId: "auth", skillName: "Authentication", level: "intermediate", isStretch: true },
            ],
            learningOpportunities: [
                "Edge runtime constraints",
                "Session management",
                "Serialization strategies",
            ],
            prerequisiteKnowledge: [
                "Next.js API routes",
                "JWT tokens",
                "Edge runtime limitations",
            ],
            suggestedApproach: "Study current session handling, design plugin architecture, implement default serializer first.",
            potentialBlockers: [
                "Breaking changes discussion needed",
                "Performance benchmarking required",
            ],
            confidence: 0.70,
        },
    },
    {
        id: "issue-4",
        repositoryId: "repo-3",
        repositoryName: "zustand",
        repositoryOwner: "pmndrs",
        githubId: 3456,
        title: "Improve TypeScript inference for nested selectors",
        body: "Current type inference breaks when using nested selectors. Need to improve generics.",
        url: "https://github.com/pmndrs/zustand/issues/3456",
        labels: ["typescript", "enhancement"],
        createdAt: "2024-12-19T11:00:00Z",
        updatedAt: "2024-12-23T09:00:00Z",
        commentCount: 8,
        isPullRequest: false,
        analysis: {
            complexity: "expert",
            estimatedHours: 24,
            requiredSkills: [
                { skillId: "typescript", skillName: "TypeScript", level: "expert", isStretch: false },
                { skillId: "generics", skillName: "Advanced Generics", level: "advanced", isStretch: true },
            ],
            learningOpportunities: [
                "TypeScript conditional types",
                "Mapped types",
                "Type inference mechanics",
            ],
            prerequisiteKnowledge: [
                "Advanced TypeScript generics",
                "Type inference",
                "State management internals",
            ],
            suggestedApproach: "Create minimal reproduction, analyze inference failure points, propose type-level solution.",
            potentialBlockers: [
                "May require TypeScript version constraints",
                "Performance impact on type checking",
            ],
            confidence: 0.60,
        },
    },
    {
        id: "issue-5",
        repositoryId: "repo-6",
        repositoryName: "excalidraw",
        repositoryOwner: "excalidraw",
        githubId: 7890,
        title: "Add dark mode toggle animation",
        body: "Smooth transition animation when switching between light and dark modes.",
        url: "https://github.com/excalidraw/excalidraw/issues/7890",
        labels: ["good first issue", "ui", "animation"],
        createdAt: "2024-12-20T14:00:00Z",
        updatedAt: "2024-12-24T10:00:00Z",
        commentCount: 2,
        isPullRequest: false,
        analysis: {
            complexity: "trivial",
            estimatedHours: 1,
            requiredSkills: [
                { skillId: "css", skillName: "CSS", level: "beginner", isStretch: false },
                { skillId: "react", skillName: "React", level: "beginner", isStretch: false },
            ],
            learningOpportunities: [
                "CSS transitions",
                "Theme switching patterns",
            ],
            prerequisiteKnowledge: [
                "CSS basics",
                "React state management",
            ],
            suggestedApproach: "Add CSS transition property to theme-dependent elements.",
            potentialBlockers: [],
            confidence: 0.98,
        },
    },
];

export function getPartnerRepositories(): PartnerRepository[] {
    return MOCK_REPOSITORIES;
}

export function getPartnerRepository(id: string): PartnerRepository | undefined {
    return MOCK_REPOSITORIES.find(r => r.id === id);
}

export function getMockIssues(): DiscoverableIssue[] {
    return MOCK_ISSUES;
}

export function getMockIssuesByRepository(repoId: string): DiscoverableIssue[] {
    return MOCK_ISSUES.filter(i => i.repositoryId === repoId);
}

export function getUniqueLanguages(): string[] {
    const languages = new Set<string>();
    MOCK_REPOSITORIES.forEach(r => r.languages.forEach(l => languages.add(l)));
    return Array.from(languages).sort();
}

export function getUniqueTopics(): string[] {
    const topics = new Set<string>();
    MOCK_REPOSITORIES.forEach(r => r.topics.forEach(t => topics.add(t)));
    return Array.from(topics).sort();
}
