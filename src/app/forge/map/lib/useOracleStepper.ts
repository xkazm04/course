/**
 * useOracleStepper Hook
 * Manages state for the multi-step Oracle questionnaire with branching logic
 * Persists in-progress state to localStorage to survive page navigation
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DomainId,
  ExperienceLevel,
  OracleAnswers,
  getBranchQuestions,
  buildOraclePayload,
  COMMITMENT_QUESTION,
  FREE_INPUT_QUESTION,
} from './oracleQuestions';
import { oracleApi, OraclePath } from './oracleApi';

// ============================================================================
// LOCAL STORAGE PERSISTENCE
// ============================================================================

const STORAGE_KEY_PREFIX = 'oracle-stepper-';

interface PersistedState {
  currentStep: StepId;
  experience: ExperienceLevel | null;
  branchAnswers: Record<string, string | string[]>;
  commitment: string | null;
  freeInput: string;
  timestamp: number;
}

function getStorageKey(domain: DomainId): string {
  return `${STORAGE_KEY_PREFIX}${domain}`;
}

function loadPersistedState(domain: DomainId): PersistedState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(getStorageKey(domain));
    if (!stored) return null;

    const parsed = JSON.parse(stored) as PersistedState;

    // Check if data is older than 24 hours
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(getStorageKey(domain));
      return null;
    }

    // Don't restore if was in generating or results state
    if (parsed.currentStep === 'generating' || parsed.currentStep === 'results') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function savePersistedState(domain: DomainId, state: StepperState): void {
  if (typeof window === 'undefined') return;

  // Don't persist generating or results states
  if (state.currentStep === 'generating' || state.currentStep === 'results') {
    return;
  }

  const toStore: PersistedState = {
    currentStep: state.currentStep,
    experience: state.experience,
    branchAnswers: state.branchAnswers,
    commitment: state.commitment,
    freeInput: state.freeInput,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(getStorageKey(domain), JSON.stringify(toStore));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

function clearPersistedState(domain: DomainId): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(getStorageKey(domain));
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// TYPES
// ============================================================================

export type StepId =
  | 'experience'
  | 'branch_1'
  | 'branch_2'
  | 'branch_3'
  | 'commitment'
  | 'free_input'
  | 'generating'
  | 'results';

export interface StepperState {
  currentStep: StepId;
  stepIndex: number;
  totalSteps: number;

  // Answers
  domain: DomainId | null;
  experience: ExperienceLevel | null;
  branchAnswers: Record<string, string | string[]>;
  commitment: string | null;
  freeInput: string;

  // Results
  paths: OraclePath[];
  selectedPathId: string | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  canGoNext: boolean;
  canGoBack: boolean;
}

export interface StepperActions {
  setDomain: (domain: DomainId) => void;
  setExperience: (experience: ExperienceLevel) => void;
  setBranchAnswer: (questionId: string, answer: string | string[]) => void;
  setCommitment: (commitment: string) => void;
  setFreeInput: (text: string) => void;

  next: () => void;
  back: () => void;
  goToStep: (step: StepId) => void;

  generate: () => Promise<void>;
  selectPath: (pathId: string) => void;
  reset: () => void;
}

// ============================================================================
// STEP FLOW LOGIC
// ============================================================================

const BASE_STEPS: StepId[] = [
  'experience',
  'branch_1',
  'branch_2',
  'branch_3',
  'commitment',
  'free_input',
  'generating',
  'results'
];

function getStepIndex(step: StepId): number {
  return BASE_STEPS.indexOf(step);
}

function getNextStep(currentStep: StepId): StepId {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex < BASE_STEPS.length - 1) {
    return BASE_STEPS[currentIndex + 1];
  }
  return currentStep;
}

function getPrevStep(currentStep: StepId): StepId {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return BASE_STEPS[currentIndex - 1];
  }
  return currentStep;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (domain: DomainId | null, persisted?: PersistedState | null): StepperState => {
  // If we have persisted state, restore it
  if (persisted && domain) {
    return {
      currentStep: persisted.currentStep,
      stepIndex: 0,
      totalSteps: 6,

      domain,
      experience: persisted.experience,
      branchAnswers: persisted.branchAnswers,
      commitment: persisted.commitment,
      freeInput: persisted.freeInput,

      paths: [],
      selectedPathId: null,

      isLoading: false,
      error: null,
      canGoNext: false,
      canGoBack: false,
    };
  }

  // Default fresh state
  return {
    currentStep: 'experience',
    stepIndex: 0,
    totalSteps: 6, // experience, 3 branch questions, commitment, free_input

    domain,
    experience: null,
    branchAnswers: {},
    commitment: null,
    freeInput: '',

    paths: [],
    selectedPathId: null,

    isLoading: false,
    error: null,
    canGoNext: false,
    canGoBack: false,
  };
};

// ============================================================================
// HOOK
// ============================================================================

export interface UseOracleStepperOptions {
  domain: DomainId;
}

export function useOracleStepper(options: UseOracleStepperOptions): [StepperState, StepperActions] {
  // Load persisted state on mount
  const [state, setState] = useState<StepperState>(() => {
    const persisted = loadPersistedState(options.domain);
    return createInitialState(options.domain, persisted);
  });

  // Persist state changes to localStorage
  useEffect(() => {
    savePersistedState(options.domain, state);
  }, [options.domain, state]);

  // Compute canGoNext based on current step and answers
  const canGoNext = useMemo(() => {
    switch (state.currentStep) {
      case 'experience':
        return state.experience !== null;
      case 'branch_1':
        if (!state.experience) return false;
        const q1 = getBranchQuestions(state.experience)[0];
        return q1 && state.branchAnswers[q1.id] !== undefined;
      case 'branch_2':
        if (!state.experience) return false;
        const q2 = getBranchQuestions(state.experience)[1];
        return q2 && state.branchAnswers[q2.id] !== undefined;
      case 'branch_3':
        if (!state.experience) return false;
        const q3 = getBranchQuestions(state.experience)[2];
        return q3 && state.branchAnswers[q3.id] !== undefined;
      case 'commitment':
        return state.commitment !== null;
      case 'free_input':
        return true; // Optional step
      default:
        return false;
    }
  }, [state.currentStep, state.experience, state.branchAnswers, state.commitment]);

  const canGoBack = useMemo(() => {
    return state.currentStep !== 'experience' &&
           state.currentStep !== 'generating' &&
           state.currentStep !== 'results';
  }, [state.currentStep]);

  // Update state with computed values
  const stateWithComputed = useMemo(() => ({
    ...state,
    stepIndex: getStepIndex(state.currentStep),
    canGoNext,
    canGoBack,
  }), [state, canGoNext, canGoBack]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setDomain = useCallback((domain: DomainId) => {
    setState(prev => ({
      ...prev,
      domain,
      // Reset downstream answers when domain changes
      experience: null,
      branchAnswers: {},
    }));
  }, []);

  const setExperience = useCallback((experience: ExperienceLevel) => {
    setState(prev => ({
      ...prev,
      experience,
      // Reset branch answers when experience changes
      branchAnswers: {},
    }));
  }, []);

  const setBranchAnswer = useCallback((questionId: string, answer: string | string[]) => {
    setState(prev => ({
      ...prev,
      branchAnswers: {
        ...prev.branchAnswers,
        [questionId]: answer,
      },
    }));
  }, []);

  const setCommitment = useCallback((commitment: string) => {
    setState(prev => ({ ...prev, commitment }));
  }, []);

  const setFreeInput = useCallback((freeInput: string) => {
    setState(prev => ({ ...prev, freeInput }));
  }, []);

  const next = useCallback(() => {
    setState(prev => {
      const nextStep = getNextStep(prev.currentStep);
      // If moving to generating, trigger API call
      if (nextStep === 'generating') {
        return { ...prev, currentStep: nextStep };
      }
      return { ...prev, currentStep: nextStep };
    });
  }, []);

  const back = useCallback(() => {
    setState(prev => {
      const prevStep = getPrevStep(prev.currentStep);
      return { ...prev, currentStep: prevStep, error: null };
    });
  }, []);

  const goToStep = useCallback((step: StepId) => {
    const targetIndex = getStepIndex(step);
    const currentIndex = getStepIndex(state.currentStep);

    // Only allow going back, not forward (except via next)
    if (targetIndex < currentIndex) {
      setState(prev => ({ ...prev, currentStep: step, error: null }));
    }
  }, [state.currentStep]);

  const generate = useCallback(async () => {
    if (!state.domain || !state.experience || !state.commitment) {
      setState(prev => ({ ...prev, error: 'Please complete all required steps' }));
      return;
    }

    setState(prev => ({
      ...prev,
      currentStep: 'generating',
      isLoading: true,
      error: null
    }));

    try {
      const answers: OracleAnswers = {
        domain: state.domain,
        experience: state.experience,
        branchAnswers: state.branchAnswers,
        commitment: state.commitment,
        freeInput: state.freeInput || undefined,
      };

      const payload = buildOraclePayload(answers);

      // Call the new Oracle API endpoint
      const response = await oracleApi.generatePaths(payload);

      // Clear persisted state on successful generation
      clearPersistedState(state.domain!);

      setState(prev => ({
        ...prev,
        currentStep: 'results',
        paths: response.paths || [],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Oracle generation error:', error);
      setState(prev => ({
        ...prev,
        currentStep: 'free_input', // Go back to last input step
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate paths',
      }));
    }
  }, [state.domain, state.experience, state.branchAnswers, state.commitment, state.freeInput]);

  const selectPath = useCallback((pathId: string) => {
    setState(prev => ({ ...prev, selectedPathId: pathId }));
  }, []);

  const reset = useCallback(() => {
    clearPersistedState(options.domain);
    setState(createInitialState(options.domain));
  }, [options.domain]);

  return [
    stateWithComputed,
    {
      setDomain,
      setExperience,
      setBranchAnswer,
      setCommitment,
      setFreeInput,
      next,
      back,
      goToStep,
      generate,
      selectPath,
      reset,
    },
  ];
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

export function useCurrentQuestion(state: StepperState) {
  return useMemo(() => {
    switch (state.currentStep) {
      case 'experience':
        // Will be fetched based on domain in component
        return null;
      case 'branch_1':
        return state.experience ? getBranchQuestions(state.experience)[0] : null;
      case 'branch_2':
        return state.experience ? getBranchQuestions(state.experience)[1] : null;
      case 'branch_3':
        return state.experience ? getBranchQuestions(state.experience)[2] : null;
      case 'commitment':
        return COMMITMENT_QUESTION;
      case 'free_input':
        return FREE_INPUT_QUESTION;
      default:
        return null;
    }
  }, [state.currentStep, state.experience]);
}

export function getStepLabel(step: StepId, experience?: ExperienceLevel): string {
  switch (step) {
    case 'experience':
      return 'Your Experience';
    case 'branch_1':
    case 'branch_2':
    case 'branch_3':
      if (experience === 'beginner') return 'Your Journey';
      if (experience === 'intermediate') return 'Breaking Through';
      if (experience === 'advanced') return 'Your Expertise';
      return 'Tell Us More';
    case 'commitment':
      return 'Your Commitment';
    case 'free_input':
      return 'Final Thoughts';
    case 'generating':
      return 'Crafting Your Path';
    case 'results':
      return 'Your Learning Paths';
    default:
      return '';
  }
}
