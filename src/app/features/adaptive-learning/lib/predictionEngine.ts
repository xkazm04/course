/**
 * Prediction Engine - AI-Powered Learning Path Predictions
 *
 * Generates personalized recommendations, completion predictions,
 * and learning analytics based on user behavior and curriculum data.
 *
 * This is a re-export module. Implementation is split into:
 * - engine/mockData.ts - Job market mock data
 * - engine/learningVelocity.ts - Learning velocity calculations
 * - engine/skillGapAnalysis.ts - Skill gap analysis
 * - engine/completionPrediction.ts - Node completion predictions
 * - engine/pathRecommendation.ts - Path recommendations
 * - engine/learningAnalytics.ts - Comprehensive analytics
 */

// Mock data
export { mockJobMarketData } from "./engine";

// Learning velocity
export { calculateLearningVelocity } from "./engine";

// Skill gap analysis
export { analyzeSkillGaps } from "./engine";

// Completion predictions
export { predictNodeCompletion, generatePredictions } from "./engine";

// Path recommendations
export {
    generateRecommendations,
    findNodesForSkills,
    createPathRecommendation,
} from "./engine";

// Learning analytics
export { analyzeLearningData } from "./engine";
