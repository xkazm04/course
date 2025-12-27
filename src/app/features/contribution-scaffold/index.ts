// Components
export {
    ScaffoldPanel,
    CodebaseOrientation,
    ConceptPrimer,
    SetupGuide,
    HintSystem,
    RelevantDocs,
} from "./components";

// Types
export type {
    ScaffoldData,
    CodebaseOrientation as CodebaseOrientationType,
    DirectoryInfo,
    FileInfo,
    ConceptPrimer as ConceptPrimerType,
    Concept,
    SetupGuide as SetupGuideType,
    SetupStep,
    CommonIssue,
    ProgressiveHint,
    HintCategory,
    DocumentLink,
} from "./lib/types";

export { MOCK_SCAFFOLD, SCAFFOLD_STORAGE_KEY } from "./lib/types";
