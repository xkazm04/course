/**
 * Predictive Data Module Exports
 *
 * Barrel file for all predictive data and helper functions.
 */

// Skill demand data
export { skillDemandPredictions } from "./skillDemandData";

// Industry trends
export { industryTrends } from "./industryData";

// Emerging technology trends
export { emergingTechTrends } from "./emergingTechData";

// Job postings
export { predictiveJobPostings } from "./jobPostingsData";

// Company insights
export { companyInsights } from "./companyData";

// Helper functions
export {
    getTopGrowingSkills,
    getLowSaturationSkills,
    getSkillsForSector,
    getMatchingJobs,
    analyzeSkillGaps,
    getMarketTimingAdvice,
} from "./helpers";
