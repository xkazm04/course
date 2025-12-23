/**
 * ComposableLayoutEngine Module
 *
 * A generic three-phase compiler pattern for composable layouts:
 * 1. PARSE: Slot definitions (typed union of content types)
 * 2. TRANSFORM: Layout templates arrange slots by region
 * 3. RENDER: Renderer dispatches to typed renderers
 *
 * This pattern enables type-safe, reusable layout systems across features
 * such as Overview, Roadmap, Chapter, and other multi-layout features.
 *
 * @example
 * ```typescript
 * // 1. Define your slot types
 * type MySlot = VideoSlot | CodeSlot | TextSlot;
 *
 * // 2. Create renderer components for each slot type
 * const renderers: RendererMap<MySlot, MyContext> = {
 *   video: VideoRenderer,
 *   code: CodeRenderer,
 *   text: TextRenderer,
 * };
 *
 * // 3. Create the layout engine
 * const engine = createLayoutEngine<MySlot, MyContext>({
 *   renderers,
 *   regions: ["header", "main", "sidebar", "footer"],
 * });
 *
 * // 4. Build a layout template
 * const template = engine.createBuilder({ id: "my-layout", name: "My Layout" })
 *   .addSlot({ id: "video-1", type: "video", data: {...} }, "main", 1)
 *   .addSlot({ id: "code-1", type: "code", data: {...} }, "main", 2)
 *   .build();
 *
 * // 5. Render the layout
 * <StandardGridLayout engine={engine} template={template} context={myContext} />
 * ```
 */

// Core types
export type {
    // Base types
    BaseSlot,
    StandardLayoutRegion,
    SlotPlacement,
    GridConfig,
    LayoutTemplate,

    // Renderer types
    SlotRendererProps,
    SlotRendererComponent,
    RendererMap,

    // Engine types
    LayoutEngineConfig,
    IComposableLayoutEngine,
    ILayoutBuilder,
    LayoutBuilderConfig,
    ComputedRegionSlots,

    // Validation types
    LayoutValidationResult,
    LayoutValidationError,
    LayoutValidationWarning,

    // Factory types
    SlotFactory,
} from "./types";

// Engine implementation
export {
    ComposableLayoutEngine,
    createLayoutEngine,
    createSlotFactory,
    createSlotTypeGuard,
} from "./ComposableLayoutEngine";

// React components and hooks
export {
    StandardGridLayout,
    GenericLayoutRenderer,
    useLayoutEngine,
} from "./LayoutRenderer";

export type {
    LayoutRendererProps,
    GenericLayoutRendererProps,
} from "./LayoutRenderer";
