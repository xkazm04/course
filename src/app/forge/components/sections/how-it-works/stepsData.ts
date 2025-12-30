import { Target, Sparkles, BookOpen, Zap, Trophy, LucideIcon } from "lucide-react";

export interface Step {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    bullets: string[];
    placeholder: string;
}

export const STEPS: Step[] = [
    {
        id: "goal",
        icon: Target,
        title: "Set Your Goal",
        description: "Tell us what you want to achieve. Whether it's landing a job, building a startup, or mastering a new technology - we'll create a path tailored to your ambitions.",
        bullets: [
            "Choose from career paths or custom goals",
            "AI analyzes your current skill level",
            "Personalized timeline based on your availability",
        ],
        placeholder: "goal-setting-interface.gif",
    },
    {
        id: "generate",
        icon: Sparkles,
        title: "AI Generates Course",
        description: "Our AI crafts a unique curriculum combining curated content with dynamically generated lessons, ensuring you learn exactly what you need.",
        bullets: [
            "Combines existing high-quality content",
            "Generates custom lessons for gaps",
            "Adapts difficulty to your level",
        ],
        placeholder: "course-generation.gif",
    },
    {
        id: "learn",
        icon: BookOpen,
        title: "Learn & Practice",
        description: "Work through interactive lessons with real coding challenges. Every concept is reinforced with hands-on projects you'll actually use.",
        bullets: [
            "Interactive code editor with live preview",
            "Real-world project challenges",
            "Progress tracking and checkpoints",
        ],
        placeholder: "learning-interface.gif",
    },
    {
        id: "feedback",
        icon: Zap,
        title: "Get AI Feedback",
        description: "Submit your code and receive instant, detailed reviews. Our AI tutor explains what's good, what could improve, and teaches best practices.",
        bullets: [
            "Line-by-line code analysis",
            "Best practice suggestions",
            "Security and performance tips",
        ],
        placeholder: "ai-feedback.gif",
    },
    {
        id: "portfolio",
        icon: Trophy,
        title: "Build Portfolio",
        description: "Complete real projects that showcase your skills. Contribute to open-source SaaS alternatives and build a GitHub profile employers notice.",
        bullets: [
            "Merged PRs in real repositories",
            "Shareable project portfolio",
            "Verified skill certifications",
        ],
        placeholder: "portfolio-showcase.gif",
    },
];
