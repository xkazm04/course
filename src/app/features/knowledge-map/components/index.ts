/**
 * Knowledge Map Components Exports
 */

// Core map components
export { MapNode } from "./MapNode";
export { MapCanvas } from "./MapCanvas";
export { MapConnections } from "./MapConnections";
export { MapBreadcrumb } from "./MapBreadcrumb";
export { MapControls } from "./MapControls";
export { MapLegend } from "./MapLegend";
export { NodeDetailsPanel } from "./NodeDetailsPanel";

// Oracle integration components
export { HypotheticalNode } from "./HypotheticalNode";
export { RecommendedNodeGlow } from "./RecommendedNodeGlow";
export { EmptyStateIllustration } from "./EmptyStateIllustration";

// Oracle Bottom Panel
export {
    OracleBottomPanel,
    OracleCollapsedBar,
    OracleExpandedWizard,
    OracleStepIndicator,
} from "./OracleBottomPanel";

// Path Preview Sidebar
export {
    PathPreviewSidebar,
    PathModuleCard,
    PathMilestoneMarker,
    PathEffectivenessScore,
} from "./PathPreviewSidebar";

// Recommendation Components
export { RecommendationPanel } from "./RecommendationPanel";
export {
    PrerequisiteAlert,
    PrerequisiteAlertBanner,
} from "./PrerequisiteAlert";
export {
    UpNextCard,
    UpNextMinimal,
    UpNextFloating,
} from "./UpNextCard";

// Breadcrumb Navigation
export {
    BreadcrumbTrail,
} from "./BreadcrumbTrail";
export {
    BreadcrumbItem,
    type BreadcrumbItemData,
    type BreadcrumbItemProps,
} from "./BreadcrumbItem";
export {
    TruncatedBreadcrumbs,
    MobileBreadcrumbs,
} from "./TruncatedBreadcrumbs";
export {
    TransitionAnimator,
    TransitionOverlay,
    DepthIndicator,
    useTransitionAnimation,
} from "./TransitionAnimator";


