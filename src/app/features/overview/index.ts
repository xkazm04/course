export { VariantB } from "./VariantB";
export { VariantD } from "./VariantD";
export { VariantAdaptive } from "./VariantAdaptive";
export { SkillProgressOverview as VariantF } from "@/app/features/skill-progress";

// Lazy-loaded variants for improved initial page load performance
// Use these instead of direct imports when the component may not be immediately visible
export {
    LazyVariant,
    LazyKnowledgeMap,
    VariantPlaceholder,
    withLazyLoading,
} from "./components";

export const overviewVariants = [
    { name: "Split View", key: "B" },
    { name: "Knowledge Map", key: "D", lazyLoad: true },
    { name: "AI Adaptive Map", key: "A", description: "AI-powered personalized learning paths", lazyLoad: true },
    { name: "Skill Progress", key: "F" },
];
