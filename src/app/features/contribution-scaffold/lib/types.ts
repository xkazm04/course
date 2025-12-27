// Scaffold types for guiding contributors

export interface ScaffoldData {
    issueId: string;
    generatedAt: string;
    codebaseOrientation: CodebaseOrientation;
    conceptPrimer: ConceptPrimer;
    setupGuide: SetupGuide;
    hints: ProgressiveHint[];
    relevantDocs: DocumentLink[];
}

export interface CodebaseOrientation {
    overview: string;
    keyDirectories: DirectoryInfo[];
    relevantFiles: FileInfo[];
    architectureNotes: string;
    styleGuide: string;
}

export interface DirectoryInfo {
    path: string;
    purpose: string;
    importance: "critical" | "relevant" | "contextual";
}

export interface FileInfo {
    path: string;
    description: string;
    modifyLikelihood: "high" | "medium" | "low";
    lineRanges?: { start: number; end: number; purpose: string }[];
}

export interface ConceptPrimer {
    mainConcepts: Concept[];
    prerequisites: string[];
    recommendedReading: string[];
}

export interface Concept {
    name: string;
    explanation: string;
    codeExample?: string;
    relatedConcepts: string[];
    difficultyLevel: "basic" | "intermediate" | "advanced";
}

export interface SetupGuide {
    steps: SetupStep[];
    estimatedTimeMinutes: number;
    commonIssues: CommonIssue[];
}

export interface SetupStep {
    order: number;
    title: string;
    command?: string;
    description: string;
    verificationCommand?: string;
    expectedOutput?: string;
}

export interface CommonIssue {
    symptom: string;
    cause: string;
    solution: string;
}

export interface ProgressiveHint {
    id: string;
    level: number; // 1 = subtle, 2 = moderate, 3 = detailed
    category: HintCategory;
    content: string;
    unlocked: boolean;
    unlockedAt?: string;
}

export type HintCategory =
    | "approach"
    | "location"
    | "implementation"
    | "testing"
    | "debugging";

export interface DocumentLink {
    title: string;
    url: string;
    type: "official" | "blog" | "video" | "stackoverflow";
    relevance: string;
}

// Mock scaffold for demo
export const MOCK_SCAFFOLD: ScaffoldData = {
    issueId: "issue-1",
    generatedAt: new Date().toISOString(),
    codebaseOrientation: {
        overview: "This is a React patterns library with TypeScript. Components follow a composition pattern with context-based state management.",
        keyDirectories: [
            { path: "src/patterns", purpose: "Core pattern implementations", importance: "critical" },
            { path: "src/examples", purpose: "Usage examples for each pattern", importance: "relevant" },
            { path: "docs", purpose: "Pattern documentation", importance: "contextual" },
        ],
        relevantFiles: [
            {
                path: "src/patterns/Compound/index.tsx",
                description: "Base compound component utilities",
                modifyLikelihood: "high",
            },
            {
                path: "src/types/patterns.ts",
                description: "Shared type definitions",
                modifyLikelihood: "medium",
            },
        ],
        architectureNotes: "Each pattern is self-contained with its own context provider.",
        styleGuide: "Use function components with TypeScript generics for flexibility.",
    },
    conceptPrimer: {
        mainConcepts: [
            {
                name: "Compound Components",
                explanation: "A pattern where multiple components share implicit state through React Context, allowing flexible composition.",
                codeExample: `<Menu>
  <Menu.Button>Open</Menu.Button>
  <Menu.List>
    <Menu.Item>Option 1</Menu.Item>
  </Menu.List>
</Menu>`,
                relatedConcepts: ["Context API", "Component Composition"],
                difficultyLevel: "intermediate",
            },
        ],
        prerequisites: ["React Hooks", "TypeScript Generics", "Context API"],
        recommendedReading: [
            "React Documentation - Context",
            "Kent C. Dodds - Compound Components",
        ],
    },
    setupGuide: {
        steps: [
            { order: 1, title: "Clone the repository", command: "git clone https://github.com/example/repo.git", description: "Get the codebase locally" },
            { order: 2, title: "Install dependencies", command: "npm install", description: "Install all project dependencies" },
            { order: 3, title: "Run tests", command: "npm test", description: "Verify everything works", verificationCommand: "npm test", expectedOutput: "All tests passing" },
        ],
        estimatedTimeMinutes: 10,
        commonIssues: [
            { symptom: "npm install fails", cause: "Node version mismatch", solution: "Use Node 18+ with nvm" },
        ],
    },
    hints: [
        { id: "h1", level: 1, category: "approach", content: "Start by examining existing pattern implementations for structure.", unlocked: true },
        { id: "h2", level: 1, category: "location", content: "Look in src/patterns for similar implementations.", unlocked: true },
        { id: "h3", level: 2, category: "implementation", content: "Create a context provider that manages open/close state.", unlocked: false },
        { id: "h4", level: 3, category: "implementation", content: "Use React.Children.map to inject context into child components.", unlocked: false },
    ],
    relevantDocs: [
        { title: "React Context API", url: "https://react.dev/reference/react/useContext", type: "official", relevance: "Core pattern mechanism" },
        { title: "Compound Components Pattern", url: "https://kentcdodds.com/blog/compound-components-with-react-hooks", type: "blog", relevance: "Pattern explanation" },
    ],
};

export const SCAFFOLD_STORAGE_KEY = "contribution-scaffolds";
