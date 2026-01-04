import { NextRequest, NextResponse } from "next/server";

/**
 * Slot Generation Endpoint
 *
 * Called by the client to request slot generation from a registered provider.
 * This acts as a bridge between the client and webhook-based providers.
 */

// ============================================================================
// Types
// ============================================================================

interface GenerationContext {
    chapterId: string;
    sectionId?: string;
    userId?: string;
    existingSlotIds?: string[];
    customData?: Record<string, unknown>;
}

interface GeneratedSlot {
    id: string;
    type: string;
    data: Record<string, unknown>;
    target: {
        region: string;
        position?: "before" | "after";
        anchorSlotId?: string;
        order?: number;
    };
    priority?: "low" | "normal" | "high" | "critical";
    metadata?: {
        confidence?: number;
        reason?: string;
        tags?: string[];
    };
}

// ============================================================================
// POST - Generate slots from provider
// ============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ providerId: string }> }
) {
    const { providerId } = await params;

    try {
        const context: GenerationContext = await request.json();

        // Validate context
        if (!context.chapterId) {
            return NextResponse.json(
                { error: "Missing required field: chapterId" },
                { status: 400 }
            );
        }

        // In production, this would:
        // 1. Look up the provider's webhook URL from the database
        // 2. Call the webhook with the context
        // 3. Validate and return the response

        // Demo: Return mock slots based on provider ID
        const slots = generateMockSlots(providerId, context);

        return NextResponse.json({
            success: true,
            providerId,
            slots,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error generating slots from provider:", error);
        return NextResponse.json(
            { error: "Failed to generate slots" },
            { status: 500 }
        );
    }
}

// ============================================================================
// Mock Slot Generation
// ============================================================================

function generateMockSlots(
    providerId: string,
    context: GenerationContext
): GeneratedSlot[] {
    // Return different mock slots based on provider
    if (providerId.includes("ai") || providerId.includes("hint")) {
        return [
            {
                id: `ai-hint-${Date.now()}`,
                type: "text",
                data: {
                    title: "💡 AI Insight",
                    content: `Based on your progress in ${context.chapterId}, consider reviewing the fundamentals of this concept.`,
                    variant: "highlight",
                },
                target: {
                    region: "sidebar",
                    position: "after",
                },
                priority: "normal",
                metadata: {
                    confidence: 0.85,
                    reason: "Personalized based on learning history",
                    tags: ["ai-generated", "hint"],
                },
            },
        ];
    }

    if (providerId.includes("community") || providerId.includes("practice")) {
        return [
            {
                id: `practice-${Date.now()}`,
                type: "code",
                data: {
                    code: `// Practice Problem for ${context.chapterId}\n// Try implementing this yourself!\n\nfunction solution() {\n  // Your code here\n}`,
                    filename: "practice.ts",
                    language: "typescript",
                    showLineNumbers: true,
                },
                target: {
                    region: "main",
                    position: "after",
                },
                priority: "normal",
                metadata: {
                    tags: ["practice", "community-contributed"],
                    reason: "Community practice problem",
                },
            },
        ];
    }

    // Default: return empty
    return [];
}
