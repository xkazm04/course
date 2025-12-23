/**
 * Prediction Engine Module Exports
 *
 * Barrel file for prediction engine functions.
 */

// Mock data
export { mockJobMarketData } from "./mockData";

// Learning velocity
export { calculateLearningVelocity } from "./learningVelocity";

// Skill gap analysis
export { analyzeSkillGaps } from "./skillGapAnalysis";

// Completion prediction
export { predictNodeCompletion, generatePredictions } from "./completionPrediction";

// Path recommendation
export {
    generateRecommendations,
    findNodesForSkills,
    createPathRecommendation,
} from "./pathRecommendation";

// Learning analytics
export { analyzeLearningData } from "./learningAnalytics";
