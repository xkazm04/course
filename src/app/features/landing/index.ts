// Polymorphic pattern exports
export {
    LandingPolymorphic,
    LandingSpatial,
    LandingDark,
    landingConfig,
    type LandingMode,
    type ExtendedLandingMode,
    type LandingPolymorphicProps,
} from "./LandingPolymorphic";

// Universe variant - Knowledge graph as explorable cosmos
export {
    LandingUniverse,
    type LandingUniverseProps,
} from "./LandingUniverse";

// Social Proof variant - Real learner paths visualization
export {
    LandingSocialProof,
    type LandingSocialProofProps,
} from "./LandingSocialProof";

// Progressive Disclosure - Unified landing experience
// Combines all variants into scroll-based progressive revelation:
// Layer 1 (Hero): Minimal entry point
// Layer 2 (Social Proof): Social validation on scroll
// Layer 3 (Universe): Content preview on deeper engagement
export {
    LandingProgressive,
    type LandingProgressiveProps,
} from "./LandingProgressive";
