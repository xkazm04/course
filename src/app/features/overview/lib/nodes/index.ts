/**
 * Curriculum Nodes Index
 * Central export for all curriculum domain nodes
 */

// Node category exports
export { htmlCssNodes } from "./htmlCssNodes";
export { javascriptNodes } from "./javascriptNodes";
export { typescriptNodes } from "./typescriptNodes";
export { reactNodes } from "./reactNodes";
export { vueNodes } from "./vueNodes";
export { angularNodes } from "./angularNodes";
export { testingNodes } from "./testingNodes";
export { buildToolsNodes } from "./buildToolsNodes";
export { performanceNodes } from "./performanceNodes";
export { accessibilityNodes } from "./accessibilityNodes";
export { designSystemsNodes } from "./designSystemsNodes";
export { stateManagementNodes } from "./stateManagementNodes";

// Connection exports
export { curriculumConnections } from "./connections";
export {
    htmlCssConnections,
    javascriptConnections,
    typescriptConnections,
    reactConnections,
    vueConnections,
    angularConnections,
    testingConnections,
    buildToolsConnections,
    performanceConnections,
    accessibilityConnections,
    designSystemsConnections,
    stateManagementConnections,
} from "./connections";

// Re-export types for convenience
export type { CurriculumNode, CurriculumConnection } from "../curriculumTypes";
