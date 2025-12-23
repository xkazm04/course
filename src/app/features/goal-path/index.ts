// Career Oracle (VariantE) export
export { VariantE } from "./VariantE";

// Re-export unified LearnerProfile types from shared lib
// This makes it convenient to import from goal-path feature
export type {
    LearnerProfile,
    LearnerSkill,
    LearningStyle,
    RiskTolerance,
    RemotePreference,
    SkillLevel,
    SkillProficiency,
    PathCalculationProfile,
    CareerOracleProfile,
    IndustrySector,
} from "@/app/shared/lib/learnerProfile";

export {
    toPathCalculationProfile,
    toCareerOracleProfile,
    createSkillsFromNames,
    normalizeLearningStyle,
    skillLevelToProficiency,
    proficiencyToSkillLevel,
    mergeProfiles,
    DEFAULT_LEARNER_PROFILE,
} from "@/app/shared/lib/learnerProfile";

// SemanticSlider component for sliders with color feedback
export {
    SemanticSlider,
    timeCommitmentRanges,
    deadlineRanges,
    getCurrentRange,
    type SemanticSliderProps,
    type SemanticRange,
    type SemanticZone,
} from "./components/SemanticSlider";

// Intent Resolver integration
export { GoalPathWithIntentResolver } from "./GoalPathWithIntentResolver";
export {
    useGoalPathResolver,
    planToLegacyResult,
    type GoalPathResolverState,
    type UseGoalPathResolverOptions,
    type UseGoalPathResolverReturn,
} from "./lib/useGoalPathResolver";

// Goal Path configuration
export {
    goalPathConfig,
    type GoalPathMode,
} from "./lib/goalPathConfig";

// Friction detection exports
export {
    useFrictionDetection,
    type FrictionSignals,
    type EscalationSuggestion,
    type SkillAssessment,
    type UseFrictionDetectionOptions,
    type UseFrictionDetectionReturn,
} from "./lib/useFrictionDetection";

// Friction skill assessment exports
export {
    computeCompetenceFromFriction,
    computeCurriculumAdjustment,
    createFrictionSession,
    aggregateFrictionSessions,
    identifyStruggleAreas,
    getStepReinforcementTopics,
    STEP_TO_TOPIC_MAP,
    type FrictionDerivedCompetence,
    type CurriculumAdjustment,
    type FrictionSession,
    type FrictionPatternProfile,
    type FrictionContext,
} from "./lib/frictionSkillAssessment";

// Friction tracking context exports
export {
    FrictionTrackingProvider,
    useFrictionTracking,
    type FrictionTrackingContextValue,
    type FrictionTrackingProviderProps,
} from "./lib/FrictionTrackingContext";

// Path calculator exports
export {
    usePathCalculator,
    calculatePathMetrics,
    // LearnerProfile-based versions (preferred)
    usePathCalculatorFromProfile,
    calculatePathMetricsFromProfile,
    type PathMetrics,
    type PathCalculatorOptions,
    type FrictionAdjustment,
} from "./lib/usePathCalculator";

// GoalFormState and conversion utilities (from shared lib)
export {
    goalFormStateToProfile,
    profileToGoalFormState,
} from "@/app/shared/lib/learnerProfile";
export type { GoalFormState } from "@/app/shared/lib/learnerProfile";


// AI Career Oracle (Predictive Intelligence) exports
export {
    useCareerOracle,
    careerGoalOptions,
    commonSkills,
    learningStyleOptions,
    riskToleranceOptions,
    type UseCareerOracleReturn,
} from "./lib/useCareerOracle";

// Predictive Intelligence types
// Note: IndustrySector is now exported from learnerProfile above
export type {
    SkillDemandPrediction,
    IndustryTrend,
    EmergingTechTrend,
    PredictiveJobPosting,
    PredictiveLearningPath,
    PredictiveModule,
    PathMilestone,
    MarketTimingAdvice,
    PathRiskAssessment,
    UserSkillProfile,
    CareerOracleState,
    OracleStep,
    DemandTrend,
    PredictionHorizon,
    ConfidenceLevel,
    LearningWindow,
    EstimatedOutcomes,
} from "./lib/predictiveTypes";

// Profile conversion utilities
export {
    userSkillProfileToLearnerProfile,
    learnerProfileToUserSkillProfile,
} from "./lib/predictiveTypes";

// Predictive data exports
export {
    skillDemandPredictions,
    industryTrends,
    emergingTechTrends,
    predictiveJobPostings,
    companyInsights,
    getTopGrowingSkills,
    getLowSaturationSkills,
    getSkillsForSector,
    getMatchingJobs,
    analyzeSkillGaps,
    getMarketTimingAdvice,
} from "./lib/predictiveData";

// Predictive UI components
export {
    SkillDemandCard,
    IndustryTrendCard,
    EmergingTechCard,
    HorizonSelector,
    MarketTimingBadge,
} from "./components/PredictiveInsights";

export {
    JobPostingCard,
    CompanyInsightCard,
    JobFilterPanel,
    SkillGapSummary,
} from "./components/JobMarketCard";

export {
    LearningPathTimeline,
    MilestoneProgressCard,
    MarketTimingCard,
    RiskAssessmentCard,
    AlternativePathsCard,
} from "./components/LearningPathTimeline";

export const goalPathVariants = [
    { name: "Career Oracle", key: "E" },
];

// Decision Tree Architecture exports (for AI Chat mode)
export {
    DecisionTreeEngine,
    createDecisionTreeEngine,
} from "./lib/DecisionTreeEngine";

export {
    useDecisionTree,
    type UseDecisionTreeOptions,
    type UseDecisionTreeReturn,
} from "./lib/useDecisionTree";

export {
    goalDefinitionTree,
    simpleGoalTree,
} from "./lib/goalDefinitionTree";

export type {
    DecisionTree,
    DecisionNode,
    DecisionOption,
    DecisionNodeId,
    DecisionContext,
    DecisionCondition,
    TreeTraversalState,
    ConversationStep,
    ChatMessage,
    DecisionTreeEvent,
    DecisionTreeEventListener,
} from "./lib/decisionTreeTypes";

export { ChatTreeRenderer } from "./components/ChatTreeRenderer";
