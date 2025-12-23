/**
 * ComposableLayoutEngine Type System
 *
 * A generic three-phase compiler pattern for composable layouts:
 * 1. PARSE: Slot definitions (typed union of content types)
 * 2. TRANSFORM: Layout templates arrange slots by region
 * 3. RENDER: Renderer dispatches to typed renderers
 *
 * This pattern enables type-safe, reusable layout systems across features.
 */

// ============================================================================
// Base Slot Interface
// ============================================================================

/**
 * Base interface all slots must extend.
 * The `type` discriminant enables exhaustive type checking in renderers.
 */
export interface BaseSlot {
    id: string;
    type: string;
}

// ============================================================================
// Layout Region Types
// ============================================================================

/**
 * Standard layout regions. Can be extended for custom layouts.
 */
export type StandardLayoutRegion = "header" | "main" | "sidebar" | "footer";

/**
 * Slot placement within a layout template.
 */
export interface SlotPlacement<
    TSlot extends BaseSlot = BaseSlot,
    TRegion extends string = StandardLayoutRegion
> {
    slot: TSlot;
    region: TRegion;
    order?: number;
}

// ============================================================================
// Grid Configuration
// ============================================================================

/**
 * Grid layout configuration for CSS grid-based layouts.
 */
export interface GridConfig {
    columns?: number;
    mainSpan?: number;
    sidebarSpan?: number;
    gap?: string;
    rowGap?: string;
    columnGap?: string;
}

// ============================================================================
// Layout Template AST
// ============================================================================

/**
 * Layout Template - The AST node for layout definitions.
 * Represents a parsed layout that can be validated and rendered.
 */
export interface LayoutTemplate<
    TSlot extends BaseSlot = BaseSlot,
    TRegion extends string = StandardLayoutRegion
> {
    id: string;
    name: string;
    description?: string;
    slots: SlotPlacement<TSlot, TRegion>[];
    gridConfig?: GridConfig;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Renderer Types
// ============================================================================

/**
 * Props passed to individual slot renderers.
 */
export interface SlotRendererProps<TSlot extends BaseSlot, TContext = unknown> {
    slot: TSlot;
    context: TContext;
    className?: string;
}

/**
 * A typed renderer component for a specific slot type.
 */
export type SlotRendererComponent<TSlot extends BaseSlot, TContext = unknown> = React.FC<
    SlotRendererProps<TSlot, TContext>
>;

/**
 * Renderer map - maps slot types to their renderer components.
 * This is the dispatch table for the render phase.
 */
export type RendererMap<TSlot extends BaseSlot, TContext = unknown> = {
    [K in TSlot["type"]]: SlotRendererComponent<Extract<TSlot, { type: K }>, TContext>;
};

// ============================================================================
// Layout Engine Configuration
// ============================================================================

/**
 * Configuration for the ComposableLayoutEngine.
 */
export interface LayoutEngineConfig<
    TSlot extends BaseSlot,
    TContext = unknown,
    TRegion extends string = StandardLayoutRegion
> {
    /**
     * Map of slot types to renderer components.
     */
    renderers: RendererMap<TSlot, TContext>;

    /**
     * Available layout regions.
     */
    regions: readonly TRegion[];

    /**
     * Default grid configuration.
     */
    defaultGridConfig?: GridConfig;

    /**
     * Fallback renderer for unknown slot types.
     */
    fallbackRenderer?: React.FC<{ slot: TSlot; context: TContext }>;

    /**
     * Error handler for render errors.
     */
    onRenderError?: (error: Error, slot: TSlot) => void;
}

// ============================================================================
// Layout Validation
// ============================================================================

/**
 * Validation result for layout templates.
 */
export interface LayoutValidationResult {
    valid: boolean;
    errors: LayoutValidationError[];
    warnings: LayoutValidationWarning[];
}

export interface LayoutValidationError {
    code: string;
    message: string;
    slotId?: string;
    region?: string;
}

export interface LayoutValidationWarning {
    code: string;
    message: string;
    slotId?: string;
    region?: string;
}

// ============================================================================
// Slot Factory Types
// ============================================================================

/**
 * Factory function type for creating slots with proper typing.
 */
export type SlotFactory<TSlot extends BaseSlot> = {
    [K in TSlot["type"]]: (
        id: string,
        data: Extract<TSlot, { type: K }> extends { data: infer D } ? D : never
    ) => Extract<TSlot, { type: K }>;
};

// ============================================================================
// Layout Builder Types
// ============================================================================

/**
 * Builder configuration for creating layout templates.
 */
export interface LayoutBuilderConfig {
    id: string;
    name: string;
    description?: string;
    gridConfig?: GridConfig;
    metadata?: Record<string, unknown>;
}

/**
 * Fluent builder interface for constructing layout templates.
 */
export interface ILayoutBuilder<
    TSlot extends BaseSlot,
    TRegion extends string = StandardLayoutRegion
> {
    addSlot(slot: TSlot, region: TRegion, order?: number): this;
    setGridConfig(config: GridConfig): this;
    setMetadata(key: string, value: unknown): this;
    build(): LayoutTemplate<TSlot, TRegion>;
}

// ============================================================================
// Computed Slot Regions
// ============================================================================

/**
 * Pre-computed slots organized by region for efficient rendering.
 */
export type ComputedRegionSlots<
    TSlot extends BaseSlot,
    TRegion extends string
> = Record<TRegion, SlotPlacement<TSlot, TRegion>[]>;

// ============================================================================
// Engine Instance Type
// ============================================================================

/**
 * The ComposableLayoutEngine instance interface.
 */
export interface IComposableLayoutEngine<
    TSlot extends BaseSlot,
    TContext = unknown,
    TRegion extends string = StandardLayoutRegion
> {
    /**
     * Validate a layout template against the engine's configuration.
     */
    validate(template: LayoutTemplate<TSlot, TRegion>): LayoutValidationResult;

    /**
     * Get slots for a specific region, sorted by order.
     */
    getSlotsForRegion(
        template: LayoutTemplate<TSlot, TRegion>,
        region: TRegion
    ): SlotPlacement<TSlot, TRegion>[];

    /**
     * Compute all region slots in a single pass.
     */
    computeAllRegionSlots(
        template: LayoutTemplate<TSlot, TRegion>
    ): ComputedRegionSlots<TSlot, TRegion>;

    /**
     * Get a slot by ID from a template.
     */
    getSlotById(template: LayoutTemplate<TSlot, TRegion>, slotId: string): TSlot | undefined;

    /**
     * Render a single slot using the appropriate renderer.
     */
    renderSlot(slot: TSlot, context: TContext, className?: string): React.ReactNode;

    /**
     * Get the engine's configuration.
     */
    getConfig(): LayoutEngineConfig<TSlot, TContext, TRegion>;

    /**
     * Create a layout builder for this engine.
     */
    createBuilder(config: LayoutBuilderConfig): ILayoutBuilder<TSlot, TRegion>;
}
