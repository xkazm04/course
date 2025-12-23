/**
 * Mock Predictive Data for AI Career Oracle
 *
 * This module provides simulated market data, skill demand predictions,
 * and job market information for the predictive career intelligence feature.
 * In a production environment, this would be replaced with real API integrations.
 *
 * This is a re-export module. Implementation is split into:
 * - predictive/skillDemandData.ts - Skill demand predictions
 * - predictive/industryData.ts - Industry sector trends
 * - predictive/emergingTechData.ts - Emerging technology trends
 * - predictive/jobPostingsData.ts - Job posting data
 * - predictive/companyData.ts - Company insights
 * - predictive/helpers.ts - Query and analysis helpers
 */

// Skill demand predictions
export { skillDemandPredictions } from "./predictive";

// Industry trends
export { industryTrends } from "./predictive";

// Emerging technology trends
export { emergingTechTrends } from "./predictive";

// Job postings (simulated real-time data)
export { predictiveJobPostings } from "./predictive";

// Company insights
export { companyInsights } from "./predictive";

// Helper functions
export {
    getTopGrowingSkills,
    getLowSaturationSkills,
    getSkillsForSector,
    getMatchingJobs,
    analyzeSkillGaps,
    getMarketTimingAdvice,
} from "./predictive";
