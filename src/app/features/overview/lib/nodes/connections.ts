/**
 * Curriculum Connections
 * Defines prerequisite relationships between curriculum nodes
 */

import { CurriculumConnection } from "../curriculumTypes";

/**
 * HTML/CSS internal and cross-domain connections
 */
const htmlCssConnections: CurriculumConnection[] = [
    // HTML/CSS internal flow
    { from: "html-basics", to: "semantic-html", type: "required" },
    { from: "semantic-html", to: "html-forms", type: "required" },
    { from: "css-basics", to: "flexbox", type: "required" },
    { from: "flexbox", to: "css-grid", type: "required" },
    { from: "css-grid", to: "responsive-design", type: "required" },
    { from: "responsive-design", to: "css-animations", type: "recommended" },
    { from: "css-basics", to: "css-variables", type: "recommended" },
    { from: "css-variables", to: "css-architecture", type: "recommended" },
    { from: "css-architecture", to: "sass-preprocessor", type: "optional" },
    { from: "css-architecture", to: "tailwind-css", type: "optional" },
    // Cross-domain: HTML/CSS to JavaScript
    { from: "html-basics", to: "js-fundamentals", type: "required" },
    { from: "css-basics", to: "js-fundamentals", type: "required" },
];

/**
 * JavaScript core and browser API connections
 */
const javascriptConnections: CurriculumConnection[] = [
    { from: "js-fundamentals", to: "js-functions", type: "required" },
    { from: "js-functions", to: "js-objects-arrays", type: "required" },
    { from: "js-fundamentals", to: "dom-manipulation", type: "required" },
    { from: "dom-manipulation", to: "js-events", type: "required" },
    { from: "js-objects-arrays", to: "es6-features", type: "required" },
    { from: "es6-features", to: "async-javascript", type: "required" },
    { from: "async-javascript", to: "fetch-api", type: "required" },
    { from: "es6-features", to: "js-modules", type: "required" },
    { from: "async-javascript", to: "error-handling", type: "recommended" },
    { from: "js-objects-arrays", to: "js-classes", type: "recommended" },
    { from: "fetch-api", to: "web-storage", type: "optional" },
    { from: "js-functions", to: "regex", type: "optional" },
    { from: "web-storage", to: "web-apis", type: "optional" },
    { from: "js-classes", to: "functional-js", type: "optional" },
];

/**
 * TypeScript connections
 */
const typescriptConnections: CurriculumConnection[] = [
    { from: "es6-features", to: "ts-basics", type: "required" },
    { from: "js-classes", to: "ts-basics", type: "recommended" },
    { from: "ts-basics", to: "ts-advanced-types", type: "required" },
    { from: "ts-advanced-types", to: "ts-generics", type: "required" },
    { from: "ts-generics", to: "ts-utility-types", type: "required" },
    { from: "ts-generics", to: "ts-decorators", type: "optional" },
    { from: "ts-basics", to: "ts-config", type: "recommended" },
    { from: "ts-config", to: "ts-declaration-files", type: "optional" },
    { from: "ts-utility-types", to: "ts-strict-mode", type: "recommended" },
];

/**
 * React ecosystem connections
 */
const reactConnections: CurriculumConnection[] = [
    { from: "es6-features", to: "react-fundamentals", type: "required" },
    { from: "js-modules", to: "react-fundamentals", type: "required" },
    { from: "react-fundamentals", to: "react-props-state", type: "required" },
    { from: "react-props-state", to: "react-hooks-basics", type: "required" },
    { from: "react-hooks-basics", to: "react-advanced-hooks", type: "required" },
    { from: "react-advanced-hooks", to: "react-custom-hooks", type: "required" },
    { from: "react-hooks-basics", to: "react-context", type: "required" },
    { from: "react-props-state", to: "react-router", type: "recommended" },
    { from: "react-hooks-basics", to: "react-forms", type: "recommended" },
    { from: "react-fundamentals", to: "react-styling", type: "optional" },
    { from: "react-advanced-hooks", to: "react-performance", type: "required" },
    { from: "react-performance", to: "react-suspense", type: "required" },
    { from: "react-suspense", to: "react-server-components", type: "optional" },
    { from: "react-custom-hooks", to: "react-patterns", type: "recommended" },
    { from: "react-patterns", to: "react-testing", type: "recommended" },
    { from: "react-context", to: "react-query", type: "optional" },
    { from: "react-router", to: "nextjs-basics", type: "required" },
    { from: "react-server-components", to: "nextjs-app-router", type: "required" },
    { from: "react-context", to: "react-state-libs", type: "optional" },
];

/**
 * Vue.js connections
 */
const vueConnections: CurriculumConnection[] = [
    { from: "es6-features", to: "vue-fundamentals", type: "required" },
    { from: "vue-fundamentals", to: "vue-composition-api", type: "required" },
    { from: "vue-composition-api", to: "vue-router", type: "required" },
    { from: "vue-router", to: "pinia", type: "required" },
    { from: "pinia", to: "vue-testing", type: "recommended" },
    { from: "vue-composition-api", to: "nuxt-basics", type: "optional" },
    { from: "ts-basics", to: "vue-typescript", type: "required" },
    { from: "vue-composition-api", to: "vue-typescript", type: "required" },
    { from: "vue-testing", to: "vue-performance", type: "optional" },
    { from: "vue-fundamentals", to: "vue-forms", type: "recommended" },
    { from: "pinia", to: "vue-plugins", type: "optional" },
];

/**
 * Angular connections
 */
const angularConnections: CurriculumConnection[] = [
    { from: "ts-basics", to: "angular-fundamentals", type: "required" },
    { from: "angular-fundamentals", to: "angular-services", type: "required" },
    { from: "angular-services", to: "rxjs-basics", type: "required" },
    { from: "angular-fundamentals", to: "angular-router", type: "required" },
    { from: "angular-router", to: "angular-forms", type: "required" },
    { from: "rxjs-basics", to: "ngrx", type: "optional" },
    { from: "angular-forms", to: "angular-testing", type: "recommended" },
    { from: "angular-fundamentals", to: "angular-cli", type: "recommended" },
    { from: "angular-testing", to: "angular-performance", type: "optional" },
    { from: "angular-performance", to: "angular-signals", type: "optional" },
];

/**
 * Testing connections
 */
const testingConnections: CurriculumConnection[] = [
    { from: "js-functions", to: "testing-fundamentals", type: "recommended" },
    { from: "testing-fundamentals", to: "jest", type: "required" },
    { from: "testing-fundamentals", to: "vitest", type: "optional" },
    { from: "jest", to: "react-testing-library", type: "recommended" },
    { from: "jest", to: "cypress", type: "optional" },
    { from: "vitest", to: "playwright", type: "optional" },
    { from: "react-testing-library", to: "tdd", type: "optional" },
    { from: "jest", to: "mocking-strategies", type: "recommended" },
    { from: "mocking-strategies", to: "test-coverage", type: "recommended" },
    { from: "cypress", to: "visual-testing", type: "optional" },
];

/**
 * Build tools connections
 */
const buildToolsConnections: CurriculumConnection[] = [
    { from: "js-modules", to: "npm-package-manager", type: "required" },
    { from: "npm-package-manager", to: "pnpm-yarn", type: "optional" },
    { from: "npm-package-manager", to: "vite", type: "required" },
    { from: "vite", to: "webpack", type: "optional" },
    { from: "vite", to: "esbuild-swc", type: "optional" },
    { from: "webpack", to: "monorepos", type: "optional" },
    { from: "monorepos", to: "ci-cd", type: "recommended" },
    { from: "npm-package-manager", to: "linting-formatting", type: "recommended" },
];

/**
 * Performance connections
 */
const performanceConnections: CurriculumConnection[] = [
    { from: "responsive-design", to: "web-vitals", type: "recommended" },
    { from: "web-vitals", to: "lighthouse", type: "required" },
    { from: "lighthouse", to: "lazy-loading", type: "required" },
    { from: "lazy-loading", to: "caching", type: "recommended" },
    { from: "lazy-loading", to: "image-optimization", type: "required" },
    { from: "webpack", to: "bundle-analysis", type: "recommended" },
    { from: "bundle-analysis", to: "runtime-performance", type: "optional" },
    { from: "runtime-performance", to: "performance-monitoring", type: "optional" },
];

/**
 * Accessibility connections
 */
const accessibilityConnections: CurriculumConnection[] = [
    { from: "semantic-html", to: "a11y-fundamentals", type: "required" },
    { from: "a11y-fundamentals", to: "aria", type: "required" },
    { from: "a11y-fundamentals", to: "keyboard-navigation", type: "required" },
    { from: "aria", to: "screen-readers", type: "recommended" },
    { from: "keyboard-navigation", to: "a11y-testing", type: "required" },
    { from: "screen-readers", to: "a11y-patterns", type: "recommended" },
];

/**
 * Design systems connections
 */
const designSystemsConnections: CurriculumConnection[] = [
    { from: "css-variables", to: "design-tokens", type: "recommended" },
    { from: "design-tokens", to: "component-library", type: "required" },
    { from: "component-library", to: "storybook", type: "required" },
    { from: "storybook", to: "design-documentation", type: "required" },
    { from: "design-tokens", to: "theming", type: "required" },
    { from: "theming", to: "design-patterns", type: "recommended" },
    { from: "design-patterns", to: "atomic-design", type: "optional" },
    { from: "component-library", to: "ui-frameworks", type: "optional" },
];

/**
 * State management connections
 */
const stateManagementConnections: CurriculumConnection[] = [
    { from: "react-context", to: "state-concepts", type: "recommended" },
    { from: "state-concepts", to: "context-api", type: "required" },
    { from: "state-concepts", to: "redux-basics", type: "optional" },
    { from: "redux-basics", to: "redux-toolkit", type: "required" },
    { from: "context-api", to: "zustand", type: "optional" },
    { from: "zustand", to: "jotai", type: "optional" },
    { from: "redux-basics", to: "recoil", type: "optional" },
    { from: "recoil", to: "mobx", type: "optional" },
    { from: "state-concepts", to: "xstate", type: "optional" },
    { from: "xstate", to: "state-patterns", type: "optional" },
];

/**
 * All curriculum connections combined
 */
export const curriculumConnections: CurriculumConnection[] = [
    ...htmlCssConnections,
    ...javascriptConnections,
    ...typescriptConnections,
    ...reactConnections,
    ...vueConnections,
    ...angularConnections,
    ...testingConnections,
    ...buildToolsConnections,
    ...performanceConnections,
    ...accessibilityConnections,
    ...designSystemsConnections,
    ...stateManagementConnections,
];

// Export individual connection arrays for targeted queries
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
};
