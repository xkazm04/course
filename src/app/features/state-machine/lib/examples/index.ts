// Example machine definitions demonstrating how to use the state machine engine

export {
  comprehensionMachine,
  TRANSITION_MESSAGES,
  getTransitionMessage,
  getProgressToNextState,
} from "./comprehensionMachine";
export type {
  ComprehensionState,
  ComprehensionEvent,
  ComprehensionContext,
  TransitionMessage,
} from "./comprehensionMachine";

export {
  contributionMachine,
  STATUS_CONFIG,
  calculateTimeSpent,
  getWorkflowProgress,
} from "./contributionMachine";
export type {
  ContributionState,
  ContributionEvent,
  ContributionContext,
  TimelineEvent,
} from "./contributionMachine";

export {
  oracleStepperMachine,
  STEP_CONFIG,
  getStepLabel,
  getStepIndex,
  getTotalInputSteps,
  isInputStep,
  canNavigateBack,
} from "./oracleStepperMachine";
export type {
  OracleStepperState,
  OracleStepperEvent,
  OracleStepperContext,
  ExperienceLevel,
  OraclePath,
} from "./oracleStepperMachine";
