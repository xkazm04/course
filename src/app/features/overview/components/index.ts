// VariantShell - composition pattern for unified variant state management
export {
    VariantShell,
    AnimatedPanel,
    AnimatedItem,
    useVariantShellContext,
    useItemHandlers,
} from "./VariantShell";
export type {
    VariantShellProps,
    VariantShellContext,
    SelectionState,
    FilterState,
    ZoomState,
    AnimationConfig,
    AnimatedPanelProps,
    AnimatedItemProps,
} from "./VariantShell";

// Knowledge Map components
export { KnowledgeMapCanvas } from "./KnowledgeMapCanvas";
export { KnowledgeMapNode } from "./KnowledgeMapNode";
export { KnowledgeMapControls } from "./KnowledgeMapControls";
export { KnowledgeMapDetails } from "./KnowledgeMapDetails";
export { CategoryNav } from "./CategoryNav";

// Navigation components (connections as first-class navigation)
export { NavigationBreadcrumbs } from "./NavigationBreadcrumbs";
export { ConnectionsPanel } from "./ConnectionsPanel";

// Lazy loading components for heavy variants
export { VariantPlaceholder } from "./VariantPlaceholder";
export {
    LazyVariant,
    LazyKnowledgeMap,
    withLazyLoading,
} from "./LazyVariant";

// Pedagogical analysis components
export { PedagogicalInsightsPanel } from "./PedagogicalInsightsPanel";

// Mode banners
export { SkillGapModeBanner } from "./SkillGapModeBanner";
export { FocusModeBanner } from "./FocusModeBanner";

// Legend
export { KnowledgeMapLegend } from "./KnowledgeMapLegend";
