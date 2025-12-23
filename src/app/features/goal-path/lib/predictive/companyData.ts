/**
 * Company Insights Data
 *
 * Mock data for company hiring trends and insights.
 */

import type { CompanyInsight } from "../predictiveTypes";

export const companyInsights: CompanyInsight[] = [
    {
        name: "Anthropic",
        industry: "ai_ml",
        openPositions: 45,
        hiringTrend: "rising",
        soughtSkills: ["Python", "PyTorch", "LLM Research", "Alignment"],
        avgTimeToHire: 42,
        interviewDifficulty: 5,
        employeeRating: 4.6,
    },
    {
        name: "Vercel",
        industry: "tech_startups",
        openPositions: 28,
        hiringTrend: "stable",
        soughtSkills: ["TypeScript", "Next.js", "React", "Edge Computing"],
        avgTimeToHire: 28,
        interviewDifficulty: 4,
        employeeRating: 4.4,
    },
    {
        name: "Stripe",
        industry: "fintech",
        openPositions: 120,
        hiringTrend: "stable",
        soughtSkills: ["Go", "Ruby", "Distributed Systems", "API Design"],
        avgTimeToHire: 35,
        interviewDifficulty: 5,
        employeeRating: 4.3,
    },
    {
        name: "OpenAI",
        industry: "ai_ml",
        openPositions: 65,
        hiringTrend: "rising",
        soughtSkills: ["Python", "ML/AI", "Full Stack", "Research"],
        avgTimeToHire: 45,
        interviewDifficulty: 5,
        employeeRating: 4.5,
    },
    {
        name: "Cloudflare",
        industry: "cloud_infrastructure",
        openPositions: 85,
        hiringTrend: "rising",
        soughtSkills: ["Rust", "Go", "Systems Programming", "Edge Computing"],
        avgTimeToHire: 32,
        interviewDifficulty: 4,
        employeeRating: 4.2,
    },
];
