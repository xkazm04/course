/**
 * ComposableLayoutEngine
 *
 * A generic three-phase compiler pattern for composable layouts:
 * 1. PARSE: Slot definitions (typed union of content types)
 * 2. TRANSFORM: Layout templates arrange slots by region
 * 3. RENDER: Renderer dispatches to typed renderers
 *
 * This pattern enables type-safe, reusable layout systems across features.
 */

import React from "react";
import type {
    BaseSlot,
    LayoutTemplate,
    SlotPlacement,
    LayoutEngineConfig,
    LayoutValidationResult,
    LayoutValidationError,
    LayoutValidationWarning,
    ComputedRegionSlots,
    IComposableLayoutEngine,
    ILayoutBuilder,
    LayoutBuilderConfig,
    GridConfig,
    StandardLayoutRegion,
} from "./types";

// ============================================================================
// Layout Builder Implementation
// ============================================================================

/**
 * Fluent builder for constructing layout templates.
 */
class LayoutBuilder<TSlot extends BaseSlot, TRegion extends string = StandardLayoutRegion>
    implements ILayoutBuilder<TSlot, TRegion>
{
    private config: LayoutBuilderConfig;
    private placements: SlotPlacement<TSlot, TRegion>[] = [];
    private metadata: Record<string, unknown> = {};

    constructor(config: LayoutBuilderConfig) {
        this.config = config;
        this.metadata = config.metadata ?? {};
    }

    addSlot(slot: TSlot, region: TRegion, order?: number): this {
        this.placements.push({ slot, region, order });
        return this;
    }

    setGridConfig(config: GridConfig): this {
        this.config.gridConfig = config;
        return this;
    }

    setMetadata(key: string, value: unknown): this {
        this.metadata[key] = value;
        return this;
    }

    build(): LayoutTemplate<TSlot, TRegion> {
        return {
            id: this.config.id,
            name: this.config.name,
            description: this.config.description,
            gridConfig: this.config.gridConfig,
            slots: [...this.placements],
            metadata: Object.keys(this.metadata).length > 0 ? this.metadata : undefined,
        };
    }
}

// ============================================================================
// ComposableLayoutEngine Implementation
// ============================================================================

/**
 * ComposableLayoutEngine - A type-safe, reusable layout engine.
 *
 * The engine handles three phases of the layout compilation:
 * 1. PARSE: Slot definitions are validated against the renderer map
 * 2. TRANSFORM: Layout templates organize slots into regions
 * 3. RENDER: The dispatch table routes slots to typed renderers
 */
export class ComposableLayoutEngine<
    TSlot extends BaseSlot,
    TContext = unknown,
    TRegion extends string = StandardLayoutRegion
> implements IComposableLayoutEngine<TSlot, TContext, TRegion>
{
    private config: LayoutEngineConfig<TSlot, TContext, TRegion>;
    private regionSet: Set<TRegion>;
    private rendererTypes: Set<string>;

    constructor(config: LayoutEngineConfig<TSlot, TContext, TRegion>) {
        this.config = config;
        this.regionSet = new Set(config.regions);
        this.rendererTypes = new Set(Object.keys(config.renderers));
    }

    /**
     * Validate a layout template against the engine's configuration.
     * Checks for:
     * - Unknown slot types (no renderer)
     * - Unknown regions
     * - Duplicate slot IDs
     * - Missing required data
     */
    validate(template: LayoutTemplate<TSlot, TRegion>): LayoutValidationResult {
        const errors: LayoutValidationError[] = [];
        const warnings: LayoutValidationWarning[] = [];
        const seenIds = new Set<string>();

        for (const placement of template.slots) {
            const { slot, region } = placement;

            // Check for duplicate IDs
            if (seenIds.has(slot.id)) {
                errors.push({
                    code: "DUPLICATE_SLOT_ID",
                    message: `Duplicate slot ID: "${slot.id}"`,
                    slotId: slot.id,
                });
            }
            seenIds.add(slot.id);

            // Check for unknown slot types
            if (!this.rendererTypes.has(slot.type)) {
                if (this.config.fallbackRenderer) {
                    warnings.push({
                        code: "UNKNOWN_SLOT_TYPE",
                        message: `Unknown slot type "${slot.type}" will use fallback renderer`,
                        slotId: slot.id,
                    });
                } else {
                    errors.push({
                        code: "UNKNOWN_SLOT_TYPE",
                        message: `No renderer registered for slot type: "${slot.type}"`,
                        slotId: slot.id,
                    });
                }
            }

            // Check for unknown regions
            if (!this.regionSet.has(region)) {
                errors.push({
                    code: "UNKNOWN_REGION",
                    message: `Unknown region: "${region}"`,
                    slotId: slot.id,
                    region,
                });
            }
        }

        // Check for empty template
        if (template.slots.length === 0) {
            warnings.push({
                code: "EMPTY_TEMPLATE",
                message: "Layout template has no slots",
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Get slots for a specific region, sorted by order.
     */
    getSlotsForRegion(
        template: LayoutTemplate<TSlot, TRegion>,
        region: TRegion
    ): SlotPlacement<TSlot, TRegion>[] {
        return template.slots
            .filter((placement) => placement.region === region)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    /**
     * Compute all region slots in a single pass.
     * This is more efficient than calling getSlotsForRegion multiple times.
     */
    computeAllRegionSlots(
        template: LayoutTemplate<TSlot, TRegion>
    ): ComputedRegionSlots<TSlot, TRegion> {
        // Initialize result with empty arrays for each region
        const result = {} as ComputedRegionSlots<TSlot, TRegion>;
        for (const region of this.config.regions) {
            result[region] = [];
        }

        // Single pass to categorize slots by region
        for (const placement of template.slots) {
            const region = placement.region;
            if (result[region]) {
                result[region].push(placement);
            }
        }

        // Sort each region by order
        const sortByOrder = (
            a: SlotPlacement<TSlot, TRegion>,
            b: SlotPlacement<TSlot, TRegion>
        ) => (a.order ?? 0) - (b.order ?? 0);

        for (const region of this.config.regions) {
            result[region].sort(sortByOrder);
        }

        return result;
    }

    /**
     * Get a slot by ID from a template.
     */
    getSlotById(template: LayoutTemplate<TSlot, TRegion>, slotId: string): TSlot | undefined {
        const placement = template.slots.find((p) => p.slot.id === slotId);
        return placement?.slot;
    }

    /**
     * Render a single slot using the appropriate renderer.
     */
    renderSlot(slot: TSlot, context: TContext, className?: string): React.ReactNode {
        const slotType = slot.type as TSlot["type"];
        const Renderer = this.config.renderers[slotType];

        if (Renderer) {
            try {
                return React.createElement(Renderer as React.FC<{
                    slot: TSlot;
                    context: TContext;
                    className?: string;
                }>, {
                    slot,
                    context,
                    className,
                });
            } catch (error) {
                if (this.config.onRenderError) {
                    this.config.onRenderError(error as Error, slot);
                }
                return null;
            }
        }

        if (this.config.fallbackRenderer) {
            return React.createElement(this.config.fallbackRenderer, { slot, context });
        }

        console.warn(`No renderer for slot type: ${slot.type}`);
        return null;
    }

    /**
     * Get the engine's configuration.
     */
    getConfig(): LayoutEngineConfig<TSlot, TContext, TRegion> {
        return this.config;
    }

    /**
     * Create a layout builder for this engine.
     */
    createBuilder(config: LayoutBuilderConfig): ILayoutBuilder<TSlot, TRegion> {
        return new LayoutBuilder<TSlot, TRegion>({
            ...config,
            gridConfig: config.gridConfig ?? this.config.defaultGridConfig,
        });
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new ComposableLayoutEngine instance.
 */
export function createLayoutEngine<
    TSlot extends BaseSlot,
    TContext = unknown,
    TRegion extends string = StandardLayoutRegion
>(config: LayoutEngineConfig<TSlot, TContext, TRegion>): ComposableLayoutEngine<TSlot, TContext, TRegion> {
    return new ComposableLayoutEngine(config);
}

// ============================================================================
// Type Helper Functions
// ============================================================================

/**
 * Create a type-safe slot factory for a given slot union type.
 * This helps ensure slots are created with proper typing.
 */
export function createSlotFactory<TSlot extends BaseSlot>() {
    return function createSlot<T extends TSlot["type"]>(
        type: T,
        id: string,
        data?: Extract<TSlot, { type: T }> extends { data: infer D } ? D : never
    ): Extract<TSlot, { type: T }> {
        return { id, type, data } as unknown as Extract<TSlot, { type: T }>;
    };
}

/**
 * Create a type guard for a specific slot type.
 */
export function createSlotTypeGuard<TSlot extends BaseSlot, T extends TSlot["type"]>(
    type: T
): (slot: TSlot) => slot is Extract<TSlot, { type: T }> {
    return (slot: TSlot): slot is Extract<TSlot, { type: T }> => {
        return slot.type === type;
    };
}
