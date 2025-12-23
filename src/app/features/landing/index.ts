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

// Re-export ThemeCompiler utilities for convenient access
export {
    themeCompiler,
    ThemeCompiler,
    type ThemeIntent,
    type ThemePreset,
    getPreset,
    listPresets,
    getPresetsByCategory,
    useCompiledTheme,
    useThemePresets,
    useStaticTheme,
    useAccessibleTheme,
} from "@/app/shared/lib/variantMachine";
