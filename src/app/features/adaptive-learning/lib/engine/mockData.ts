/**
 * Mock Job Market Data
 *
 * Mock data for job market trends and requirements.
 */

import type { JobMarketData } from "../types";

export const mockJobMarketData: Record<string, JobMarketData> = {
    "frontend-developer": {
        role: "Frontend Developer",
        demandScore: 85,
        trend: "growing",
        salaryRange: { min: 70000, max: 150000, median: 105000 },
        topSkills: [
            { skill: "React", frequency: 0.85 },
            { skill: "TypeScript", frequency: 0.75 },
            { skill: "CSS", frequency: 0.70 },
            { skill: "JavaScript", frequency: 0.95 },
            { skill: "Next.js", frequency: 0.45 },
        ],
        topCompanies: ["Google", "Meta", "Amazon", "Microsoft", "Apple"],
        remotePercentage: 65,
        experienceDistribution: { entry: 25, mid: 45, senior: 25, lead: 5 },
        lastUpdated: new Date(),
    },
    "senior-frontend": {
        role: "Senior Frontend Engineer",
        demandScore: 75,
        trend: "growing",
        salaryRange: { min: 120000, max: 200000, median: 155000 },
        topSkills: [
            { skill: "React", frequency: 0.90 },
            { skill: "TypeScript", frequency: 0.85 },
            { skill: "System Design", frequency: 0.60 },
            { skill: "Performance", frequency: 0.55 },
            { skill: "Testing", frequency: 0.70 },
        ],
        topCompanies: ["Google", "Meta", "Stripe", "Netflix", "Airbnb"],
        remotePercentage: 70,
        experienceDistribution: { entry: 0, mid: 30, senior: 55, lead: 15 },
        lastUpdated: new Date(),
    },
    "fullstack-developer": {
        role: "Full Stack Developer",
        demandScore: 90,
        trend: "growing",
        salaryRange: { min: 80000, max: 170000, median: 120000 },
        topSkills: [
            { skill: "Node.js", frequency: 0.80 },
            { skill: "React", frequency: 0.75 },
            { skill: "TypeScript", frequency: 0.65 },
            { skill: "SQL", frequency: 0.70 },
            { skill: "APIs", frequency: 0.85 },
        ],
        topCompanies: ["Amazon", "Microsoft", "Salesforce", "Oracle", "IBM"],
        remotePercentage: 60,
        experienceDistribution: { entry: 30, mid: 40, senior: 25, lead: 5 },
        lastUpdated: new Date(),
    },
};
