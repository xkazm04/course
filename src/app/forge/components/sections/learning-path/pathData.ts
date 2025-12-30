import { Code2, Layout, Smartphone, Brain, LucideIcon } from "lucide-react";

export interface PathNode {
    id: string;
    label: string;
    x: number;
    y: number;
    type: "existing" | "ai";
    completed: boolean;
}

export interface LearningPath {
    id: string;
    name: string;
    icon: LucideIcon;
    color: string;
    nodes: PathNode[];
    connections: [string, string][];
}

export const LEARNING_PATHS: LearningPath[] = [
    {
        id: "fullstack",
        name: "Full-Stack Developer",
        icon: Code2,
        color: "var(--ember)",
        nodes: [
            { id: "html", label: "HTML/CSS", x: 80, y: 50, type: "existing", completed: true },
            { id: "js", label: "JavaScript", x: 200, y: 80, type: "existing", completed: true },
            { id: "react", label: "React", x: 340, y: 50, type: "existing", completed: false },
            { id: "node", label: "Node.js", x: 340, y: 130, type: "existing", completed: false },
            { id: "db", label: "Databases", x: 480, y: 90, type: "ai", completed: false },
            { id: "api", label: "REST APIs", x: 600, y: 50, type: "ai", completed: false },
            { id: "deploy", label: "Deployment", x: 600, y: 130, type: "ai", completed: false },
            { id: "project", label: "SaaS Project", x: 740, y: 90, type: "ai", completed: false },
        ],
        connections: [
            ["html", "js"], ["js", "react"], ["js", "node"],
            ["react", "db"], ["node", "db"], ["db", "api"], ["db", "deploy"],
            ["api", "project"], ["deploy", "project"],
        ],
    },
    {
        id: "frontend",
        name: "Frontend Master",
        icon: Layout,
        color: "var(--forge-info)",
        nodes: [
            { id: "css", label: "Advanced CSS", x: 80, y: 70, type: "existing", completed: true },
            { id: "ts", label: "TypeScript", x: 200, y: 50, type: "existing", completed: true },
            { id: "react", label: "React Patterns", x: 200, y: 120, type: "existing", completed: false },
            { id: "state", label: "State Mgmt", x: 360, y: 50, type: "ai", completed: false },
            { id: "testing", label: "Testing", x: 360, y: 120, type: "existing", completed: false },
            { id: "perf", label: "Performance", x: 520, y: 70, type: "ai", completed: false },
            { id: "a11y", label: "Accessibility", x: 520, y: 140, type: "ai", completed: false },
            { id: "design", label: "Design Systems", x: 680, y: 90, type: "ai", completed: false },
        ],
        connections: [
            ["css", "ts"], ["css", "react"], ["ts", "state"], ["react", "testing"],
            ["state", "perf"], ["testing", "perf"], ["perf", "a11y"], ["perf", "design"], ["a11y", "design"],
        ],
    },
    {
        id: "mobile",
        name: "Mobile Developer",
        icon: Smartphone,
        color: "var(--forge-success)",
        nodes: [
            { id: "js", label: "JavaScript", x: 80, y: 80, type: "existing", completed: true },
            { id: "rn", label: "React Native", x: 220, y: 50, type: "existing", completed: false },
            { id: "native", label: "Native APIs", x: 220, y: 120, type: "ai", completed: false },
            { id: "nav", label: "Navigation", x: 380, y: 50, type: "existing", completed: false },
            { id: "storage", label: "Local Storage", x: 380, y: 120, type: "ai", completed: false },
            { id: "push", label: "Push Notifs", x: 540, y: 80, type: "ai", completed: false },
            { id: "publish", label: "App Store", x: 680, y: 80, type: "ai", completed: false },
        ],
        connections: [
            ["js", "rn"], ["js", "native"], ["rn", "nav"], ["native", "storage"],
            ["nav", "push"], ["storage", "push"], ["push", "publish"],
        ],
    },
    {
        id: "ai",
        name: "AI/ML Engineer",
        icon: Brain,
        color: "var(--gold)",
        nodes: [
            { id: "python", label: "Python", x: 80, y: 80, type: "existing", completed: true },
            { id: "math", label: "Linear Algebra", x: 200, y: 40, type: "existing", completed: false },
            { id: "data", label: "Data Science", x: 200, y: 120, type: "existing", completed: false },
            { id: "ml", label: "ML Basics", x: 360, y: 60, type: "ai", completed: false },
            { id: "dl", label: "Deep Learning", x: 360, y: 130, type: "ai", completed: false },
            { id: "nlp", label: "NLP", x: 520, y: 50, type: "ai", completed: false },
            { id: "llm", label: "LLM Apps", x: 520, y: 120, type: "ai", completed: false },
            { id: "deploy", label: "ML Deploy", x: 680, y: 85, type: "ai", completed: false },
        ],
        connections: [
            ["python", "math"], ["python", "data"], ["math", "ml"], ["data", "ml"],
            ["ml", "dl"], ["dl", "nlp"], ["dl", "llm"], ["nlp", "deploy"], ["llm", "deploy"],
        ],
    },
];
