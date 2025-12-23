/**
 * Comprehensive Frontend Curriculum Data
 *
 * 123 nodes covering the complete frontend development ecosystem
 * organized by category with prerequisite connections.
 *
 * This file serves as the main entry point, re-exporting from modular sources.
 * Individual node categories are split into separate files for maintainability.
 */

// Re-export curriculum data and utilities from centralized location
export { curriculumData } from "./curriculumUtils";

// Re-export individual node arrays for category-specific views
export {
    htmlCssNodes,
    javascriptNodes,
    typescriptNodes,
    reactNodes,
    vueNodes,
    angularNodes,
    testingNodes,
    buildToolsNodes,
    performanceNodes,
    accessibilityNodes,
    designSystemsNodes,
    stateManagementNodes,
    curriculumConnections,
} from "./nodes";

// Re-export utility functions
export {
    getNodesByCategory,
    getNodeById,
    getConnectionsForNode,
    getIncomingConnections,
    getOutgoingConnections,
    getPrerequisites,
    hasNode,
    getAllCategories,
    TOTAL_NODES,
    TOTAL_CONNECTIONS,
    NODE_COUNTS_BY_STATUS,
    NODE_COUNTS_BY_CATEGORY,
    TOTAL_ESTIMATED_HOURS,
} from "./curriculumUtils";
