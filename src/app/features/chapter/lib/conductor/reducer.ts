/**
 * Learning Conductor Reducer
 *
 * State management for the learning orchestration system.
 */

import type { ConductorState } from "../conductorTypes";
import type { ConductorAction } from "./types";

export function conductorReducer(state: ConductorState, action: ConductorAction): ConductorState {
    switch (action.type) {
        case "SET_ACTIVE":
            return { ...state, isActive: action.payload };

        case "SET_CURRENT_SECTION":
            return { ...state, currentSectionId: action.payload, lastActivityAt: Date.now() };

        case "SET_PROFILE":
            return { ...state, learnerProfile: action.payload };

        case "UPDATE_PROFILE":
            return {
                ...state,
                learnerProfile: { ...state.learnerProfile, ...action.payload, lastUpdated: Date.now() },
            };

        case "SET_BEHAVIOR":
            return {
                ...state,
                sectionBehaviors: {
                    ...state.sectionBehaviors,
                    [action.payload.sectionId]: action.payload.behavior,
                },
                lastActivityAt: Date.now(),
            };

        case "ADD_DECISION":
            return {
                ...state,
                pendingDecisions: [action.payload, ...state.pendingDecisions].sort(
                    (a, b) => b.priority - a.priority
                ),
            };

        case "EXECUTE_DECISION": {
            const decision = state.pendingDecisions.find((d) => d.id === action.payload);
            if (!decision) return state;

            return {
                ...state,
                pendingDecisions: state.pendingDecisions.filter((d) => d.id !== action.payload),
                executedDecisions: [
                    { ...decision, executed: true, executedAt: Date.now() },
                    ...state.executedDecisions,
                ],
            };
        }

        case "DISMISS_DECISION":
            return {
                ...state,
                pendingDecisions: state.pendingDecisions.filter((d) => d.id !== action.payload),
            };

        case "SET_PEER_SOLUTIONS":
            return { ...state, suggestedPeerSolutions: action.payload };

        case "ADD_INJECTED_CONTENT":
            return {
                ...state,
                injectedContent: [...state.injectedContent, action.payload],
            };

        case "SET_COLLECTIVE_INSIGHTS":
            return { ...state, collectiveInsights: action.payload };

        case "UPDATE_ACTIVITY":
            return { ...state, lastActivityAt: action.payload };

        default:
            return state;
    }
}
