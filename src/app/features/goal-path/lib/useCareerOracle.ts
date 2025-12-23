/**
 * Career Oracle Hook - Predictive Intelligence Engine
 *
 * This hook provides the core logic for the AI Career Oracle feature,
 * managing state, predictions, and path generation.
 *
 * Note: This hook now supports both the legacy UserSkillProfile and the
 * unified LearnerProfile types. New code should prefer using LearnerProfile
 * via the getLearnerProfile() method.
 */

import { useState, useCallback, useMemo } from "react";
import type {
    CareerOracleState,
    OracleStep,
    UserSkillProfile,
    PredictionHorizon,
    SkillDemandPrediction,
    IndustryTrend,
    PredictiveJobPosting,
    PredictiveLearningPath,
    PredictiveModule,
    PathMilestone,
    IndustrySector,
    JobSearchFilters,
    EstimatedOutcomes,
} from "./predictiveTypes";
import {
    userSkillProfileToLearnerProfile,
    learnerProfileToUserSkillProfile,
} from "./predictiveTypes";
import type { LearnerProfile } from "@/app/shared/lib/learnerProfile";
import {
    skillDemandPredictions,
    industryTrends,
    emergingTechTrends,
    predictiveJobPostings,
    getTopGrowingSkills,
    getLowSaturationSkills,
} from "./predictiveData";

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: CareerOracleState = {
    step: "welcome",
    userProfile: {},
    predictions: {
        skillDemand: [],
        industryTrends: [],
        emergingTech: [],
        matchingJobs: [],
        suggestedPath: null,
    },
    loading: {
        predictions: false,
        jobs: false,
        path: false,
    },
    horizon: "12m",
    jobFilters: {},
};

// ============================================================================
// AVAILABLE OPTIONS
// ============================================================================

export const careerGoalOptions = [
    { id: "frontend-senior", label: "Senior Frontend Engineer", sector: "tech_startups" as IndustrySector },
    { id: "fullstack", label: "Full Stack Developer", sector: "tech_startups" as IndustrySector },
    { id: "backend-senior", label: "Senior Backend Engineer", sector: "enterprise" as IndustrySector },
    { id: "ai-engineer", label: "AI/ML Engineer", sector: "ai_ml" as IndustrySector },
    { id: "platform-engineer", label: "Platform Engineer", sector: "cloud_infrastructure" as IndustrySector },
    { id: "devops", label: "DevOps Engineer", sector: "cloud_infrastructure" as IndustrySector },
    { id: "security", label: "Security Engineer", sector: "cybersecurity" as IndustrySector },
    { id: "data-engineer", label: "Data Engineer", sector: "ai_ml" as IndustrySector },
];

export const commonSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "Go",
    "Rust",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "Git",
    "GraphQL",
    "REST APIs",
    "CSS/Tailwind",
    "Next.js",
    "FastAPI",
    "Redis",
];

export const learningStyleOptions = [
    { id: "video", label: "Video Courses", icon: "📹" },
    { id: "text", label: "Documentation & Books", icon: "📖" },
    { id: "project", label: "Project-Based", icon: "🔨" },
    { id: "interactive", label: "Interactive Tutorials", icon: "🎮" },
];

export const riskToleranceOptions = [
    {
        id: "conservative",
        label: "Conservative",
        description: "Prefer stable, proven technologies",
    },
    {
        id: "moderate",
        label: "Moderate",
        description: "Balance between stability and opportunity",
    },
    {
        id: "aggressive",
        label: "Aggressive",
        description: "Willing to bet on emerging tech for higher upside",
    },
];

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export interface UseCareerOracleReturn {
    state: CareerOracleState;
    // Navigation
    goToStep: (step: OracleStep) => void;
    nextStep: () => void;
    prevStep: () => void;
    // Profile updates
    updateSkills: (skills: string[]) => void;
    updateGoal: (goal: string, sector: IndustrySector) => void;
    updatePreferences: (prefs: Partial<UserSkillProfile>) => void;
    updateFocusAreas: (focusAreas: string[]) => void;
    /** Update profile using the unified LearnerProfile type */
    updateFromLearnerProfile: (profile: Partial<LearnerProfile>) => void;
    setHorizon: (horizon: PredictionHorizon) => void;
    setJobFilters: (filters: JobSearchFilters) => void;
    // Actions
    generatePredictions: () => Promise<void>;
    generatePath: () => Promise<void>;
    refreshJobs: () => Promise<void>;
    // Computed values
    topGrowingSkills: SkillDemandPrediction[];
    lowSaturationSkills: SkillDemandPrediction[];
    recommendedSkills: string[];
    skillGaps: string[];
    estimatedOutcomes: EstimatedOutcomes;
    /** Get the current user profile as a unified LearnerProfile */
    getLearnerProfile: () => Partial<LearnerProfile>;
}

const stepOrder: OracleStep[] = [
    "welcome",
    "skills",
    "goal",
    "preferences",
    "analyzing",
    "insights",
    "path",
    "jobs",
];

export function useCareerOracle(): UseCareerOracleReturn {
    const [state, setState] = useState<CareerOracleState>(initialState);

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    const goToStep = useCallback((step: OracleStep) => {
        setState((prev) => ({ ...prev, step }));
    }, []);

    const nextStep = useCallback(() => {
        setState((prev) => {
            const currentIndex = stepOrder.indexOf(prev.step);
            const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);
            return { ...prev, step: stepOrder[nextIndex] };
        });
    }, []);

    const prevStep = useCallback(() => {
        setState((prev) => {
            const currentIndex = stepOrder.indexOf(prev.step);
            const prevIndex = Math.max(currentIndex - 1, 0);
            return { ...prev, step: stepOrder[prevIndex] };
        });
    }, []);

    // ========================================================================
    // PROFILE UPDATES
    // ========================================================================

    const updateSkills = useCallback((skills: string[]) => {
        setState((prev) => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                currentSkills: skills.map((name) => ({
                    name,
                    proficiency: 3 as const,
                    yearsOfExperience: 1,
                })),
            },
        }));
    }, []);

    const updateGoal = useCallback((goal: string, sector: IndustrySector) => {
        setState((prev) => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                targetRole: goal,
                targetSector: sector,
            },
        }));
    }, []);

    const updatePreferences = useCallback((prefs: Partial<UserSkillProfile>) => {
        setState((prev) => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                ...prefs,
            },
        }));
    }, []);

    const updateFocusAreas = useCallback((focusAreas: string[]) => {
        setState((prev) => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                focusAreas,
            },
        }));
    }, []);

    /**
     * Update user profile from a unified LearnerProfile
     * This is the preferred method for updating from external systems using LearnerProfile
     */
    const updateFromLearnerProfile = useCallback((profile: Partial<LearnerProfile>) => {
        const converted = learnerProfileToUserSkillProfile(profile);
        setState((prev) => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                ...converted,
            },
        }));
    }, []);

    /**
     * Get the current user profile as a unified LearnerProfile
     * This enables seamless integration with other parts of the system using LearnerProfile
     */
    const getLearnerProfile = useCallback((): Partial<LearnerProfile> => {
        return userSkillProfileToLearnerProfile(state.userProfile);
    }, [state.userProfile]);

    const setHorizon = useCallback((horizon: PredictionHorizon) => {
        setState((prev) => ({ ...prev, horizon }));
    }, []);

    const setJobFilters = useCallback((filters: JobSearchFilters) => {
        setState((prev) => ({ ...prev, jobFilters: filters }));
    }, []);

    // ========================================================================
    // PREDICTION GENERATION
    // ========================================================================

    const generatePredictions = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            loading: { ...prev.loading, predictions: true },
        }));

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const userSkillNames = state.userProfile.currentSkills?.map((s) => s.name) ?? [];
        const targetSector = state.userProfile.targetSector;

        // Filter relevant skills based on user's goal and sector
        const relevantSkills = skillDemandPredictions.filter((skill) => {
            if (targetSector) {
                return skill.drivingIndustries.some((ind) =>
                    ind.toLowerCase().includes(targetSector.replace("_", " "))
                );
            }
            return true;
        });

        // Filter relevant industries
        const relevantIndustries = targetSector
            ? industryTrends.filter((t) => t.sector === targetSector)
            : industryTrends;

        // Filter matching jobs
        const matchingJobs = predictiveJobPostings.filter((job) => {
            const matchesRole = state.userProfile.targetRole
                ? job.title.toLowerCase().includes(state.userProfile.targetRole.toLowerCase().split(" ")[0])
                : true;
            return matchesRole || job.matchScore > 50;
        });

        setState((prev) => ({
            ...prev,
            loading: { ...prev.loading, predictions: false },
            predictions: {
                ...prev.predictions,
                skillDemand: relevantSkills,
                industryTrends: relevantIndustries.length > 0 ? relevantIndustries : industryTrends.slice(0, 4),
                emergingTech: emergingTechTrends,
                matchingJobs: matchingJobs.sort((a, b) => b.matchScore - a.matchScore),
            },
        }));
    }, [state.userProfile]);

    const generatePath = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            loading: { ...prev.loading, path: true },
        }));

        // Simulate AI path generation
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const userSkills = state.userProfile.currentSkills?.map((s) => s.name) ?? [];
        const targetRole = state.userProfile.targetRole ?? "Full Stack Developer";
        const targetSector = state.userProfile.targetSector ?? "tech_startups";
        const weeklyHours = state.userProfile.weeklyHours ?? 10;

        // Generate modules based on skill gaps
        const relevantJobs = predictiveJobPostings.filter(
            (job) =>
                job.title.toLowerCase().includes(targetRole.toLowerCase().split(" ")[0]) ||
                job.matchScore > 60
        );

        const requiredSkillsSet = new Set<string>();
        relevantJobs.forEach((job) => {
            job.requiredSkills.forEach((s) => requiredSkillsSet.add(s.skill));
            job.preferredSkills.forEach((s) => requiredSkillsSet.add(s));
        });

        const missingSkills = Array.from(requiredSkillsSet).filter(
            (skill) => !userSkills.some((us) => us.toLowerCase() === skill.toLowerCase())
        );

        // Create learning modules for missing skills
        const modules: PredictiveModule[] = missingSkills.slice(0, 6).map((skill, index) => {
            const skillPrediction = skillDemandPredictions.find(
                (s) => s.skillName.toLowerCase() === skill.toLowerCase()
            );

            return {
                id: `module-${index + 1}`,
                title: `Master ${skill}`,
                skills: [skill],
                estimatedHours: 20 + Math.floor(Math.random() * 20),
                sequence: index + 1,
                reasoning: skillPrediction
                    ? `${skill} is ${skillPrediction.trend} with ${skillPrediction.changePercent > 0 ? "+" : ""}${skillPrediction.changePercent}% demand change predicted.`
                    : `${skill} is commonly required for ${targetRole} positions.`,
                skillDemand: skillPrediction?.trend ?? "stable",
                prerequisites: index > 0 ? [missingSkills[index - 1]] : [],
                optimalWindow: skillPrediction?.optimalLearningWindow,
            };
        });

        // Calculate total weeks based on hours
        const totalHours = modules.reduce((sum, m) => sum + m.estimatedHours, 0);
        const estimatedWeeks = Math.ceil(totalHours / weeklyHours);

        // Generate milestones
        const milestones: PathMilestone[] = [
            {
                id: "milestone-1",
                title: "Foundation Complete",
                targetWeek: Math.floor(estimatedWeeks * 0.25),
                skillsAcquired: modules.slice(0, 2).flatMap((m) => m.skills),
                jobMatchIncrease: 15,
                jobsUnlocked: 12,
                salaryIncreasePotential: 8,
            },
            {
                id: "milestone-2",
                title: "Core Skills Acquired",
                targetWeek: Math.floor(estimatedWeeks * 0.5),
                skillsAcquired: modules.slice(0, 4).flatMap((m) => m.skills),
                jobMatchIncrease: 30,
                jobsUnlocked: 28,
                salaryIncreasePotential: 18,
            },
            {
                id: "milestone-3",
                title: "Market Ready",
                targetWeek: estimatedWeeks,
                skillsAcquired: modules.flatMap((m) => m.skills),
                jobMatchIncrease: 45,
                jobsUnlocked: 45,
                salaryIncreasePotential: 30,
            },
        ];

        const path: PredictiveLearningPath = {
            id: `path-${Date.now()}`,
            targetRole,
            targetSector,
            confidence: "high",
            estimatedWeeks,
            modules,
            milestones,
            marketTiming: {
                recommendation: "start_now",
                reasoning:
                    "Current market conditions are favorable. Skills in demand are experiencing growth with moderate saturation levels.",
                keyFactors: [
                    "AI/ML integration is driving demand for technical skills",
                    "Remote work has expanded job opportunities globally",
                    "Tech hiring remains strong despite market corrections",
                ],
                warningSignals: [
                    "Increasing competition for entry-level positions",
                    "Some traditional roles seeing automation pressure",
                ],
                opportunitySignals: [
                    "AI tooling creating new specialization opportunities",
                    "Full-stack skills commanding premium salaries",
                    "Cloud-native development in high demand",
                ],
                nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
            alternativePaths: [
                {
                    name: "Specialized AI Focus",
                    description: "Double down on AI/ML skills for emerging opportunities",
                    differentiator: "Higher risk, higher potential reward",
                    riskComparison: "higher",
                    timeComparison: "similar",
                    salaryComparison: "higher",
                },
                {
                    name: "Platform Engineering Track",
                    description: "Focus on infrastructure and DevOps",
                    differentiator: "More stable demand, remote-friendly",
                    riskComparison: "lower",
                    timeComparison: "similar",
                    salaryComparison: "similar",
                },
            ],
            matchingJobs: relevantJobs.slice(0, 5),
            riskAssessment: {
                overallRisk: "moderate",
                techObsolescenceRisk: "low",
                marketSaturationRisk: "moderate",
                automationRisk: "low",
                mitigationStrategies: [
                    "Focus on problem-solving skills alongside technology",
                    "Build projects that demonstrate practical application",
                    "Maintain awareness of emerging trends",
                ],
                hedgeSkills: ["AI/ML fundamentals", "System design", "Communication"],
            },
        };

        setState((prev) => ({
            ...prev,
            loading: { ...prev.loading, path: false },
            predictions: {
                ...prev.predictions,
                suggestedPath: path,
            },
        }));
    }, [state.userProfile]);

    const refreshJobs = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            loading: { ...prev.loading, jobs: true },
        }));

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const filteredJobs = predictiveJobPostings.filter((job) => {
            const { remote, seniorityLevel, minSalary } = state.jobFilters;

            if (remote && remote !== "any" && job.location.remote !== remote) {
                return false;
            }
            if (seniorityLevel?.length && !seniorityLevel.includes(job.seniorityLevel)) {
                return false;
            }
            if (minSalary && job.salary.min && job.salary.min < minSalary) {
                return false;
            }
            return true;
        });

        setState((prev) => ({
            ...prev,
            loading: { ...prev.loading, jobs: false },
            predictions: {
                ...prev.predictions,
                matchingJobs: filteredJobs,
            },
        }));
    }, [state.jobFilters]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const topGrowingSkills = useMemo(() => getTopGrowingSkills(5), []);
    const lowSaturationSkills = useMemo(() => getLowSaturationSkills(5), []);

    const recommendedSkills = useMemo(() => {
        const userSkillNames = state.userProfile.currentSkills?.map((s) => s.name.toLowerCase()) ?? [];

        // Get skills with good growth and low saturation that user doesn't have
        return skillDemandPredictions
            .filter(
                (s) =>
                    s.trend !== "declining" &&
                    s.saturationLevel < 60 &&
                    !userSkillNames.includes(s.skillName.toLowerCase())
            )
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, 5)
            .map((s) => s.skillName);
    }, [state.userProfile.currentSkills]);

    const skillGaps = useMemo(() => {
        const userSkillNames = state.userProfile.currentSkills?.map((s) => s.name.toLowerCase()) ?? [];
        const targetRole = state.userProfile.targetRole?.toLowerCase() ?? "";

        // Find jobs matching target role and identify missing skills
        const relevantJobs = predictiveJobPostings.filter((job) =>
            job.title.toLowerCase().includes(targetRole.split(" ")[0])
        );

        const requiredSkills = new Set<string>();
        relevantJobs.forEach((job) => {
            job.requiredSkills.forEach((s) => requiredSkills.add(s.skill));
        });

        return Array.from(requiredSkills).filter(
            (skill) => !userSkillNames.includes(skill.toLowerCase())
        );
    }, [state.userProfile.currentSkills, state.userProfile.targetRole]);

    /**
     * Calculate estimated learning outcomes based on current profile
     */
    const estimatedOutcomes = useMemo((): EstimatedOutcomes => {
        const weeklyHours = state.userProfile.weeklyHours ?? 10;
        const focusAreas = state.userProfile.focusAreas ?? [];
        const currentSkillCount = state.userProfile.currentSkills?.length ?? 0;

        // Calculate based on focus areas and skill gaps
        const focusCount = Math.max(focusAreas.length, 1);
        const gapCount = skillGaps.length;

        // Base hours per focus area
        const hoursPerArea = 40 + (gapCount * 5);
        const totalHours = focusCount * hoursPerArea;

        // Modules and topics based on focus areas
        const moduleCount = focusCount * 3 + Math.floor(gapCount / 2);
        const topicCount = moduleCount * 8;

        // Weeks to complete
        const weeksToComplete = Math.ceil(totalHours / weeklyHours);

        // Job readiness based on skills and time
        const isJobReady = weeksToComplete <= 24 && focusCount >= 2;

        // Skill level based on current skills and learning commitment
        let skillLevel: EstimatedOutcomes["skillLevel"] = "Junior";
        if (currentSkillCount >= 8 && weeklyHours >= 15) {
            skillLevel = "Senior";
        } else if (currentSkillCount >= 5 && weeklyHours >= 10) {
            skillLevel = "Mid-Level";
        } else if (currentSkillCount >= 3 || weeklyHours >= 20) {
            skillLevel = "Mid-Level";
        }

        return {
            totalHours,
            moduleCount,
            topicCount,
            isJobReady,
            skillLevel,
            weeksToJobReady: weeksToComplete,
            salaryRange: skillLevel === "Senior"
                ? { min: 120000, max: 180000 }
                : skillLevel === "Mid-Level"
                    ? { min: 80000, max: 130000 }
                    : { min: 60000, max: 90000 },
        };
    }, [state.userProfile.weeklyHours, state.userProfile.focusAreas, state.userProfile.currentSkills, skillGaps]);

    return {
        state,
        goToStep,
        nextStep,
        prevStep,
        updateSkills,
        updateGoal,
        updatePreferences,
        updateFocusAreas,
        updateFromLearnerProfile,
        setHorizon,
        setJobFilters,
        generatePredictions,
        generatePath,
        refreshJobs,
        topGrowingSkills,
        lowSaturationSkills,
        recommendedSkills,
        skillGaps,
        estimatedOutcomes,
        getLearnerProfile,
    };
}
