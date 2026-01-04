import { NextRequest, NextResponse } from "next/server";

/**
 * Individual Slot Provider API
 *
 * Provides management endpoints for individual slot providers.
 */

// Share the store with the main route (in production, use a database)
// For now, we'll recreate it - in production this would be a database query

// ============================================================================
// GET - Get provider details
// ============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ providerId: string }> }
) {
    const { providerId } = await params;

    // In production, fetch from database
    return NextResponse.json(
        {
            error: `Provider ${providerId} not found`,
            hint: "This is a demo endpoint. In production, providers would be persisted.",
        },
        { status: 404 }
    );
}

// ============================================================================
// PATCH - Update provider settings
// ============================================================================

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ providerId: string }> }
) {
    const { providerId } = await params;

    try {
        const body = await request.json();

        // Validate updates
        const allowedUpdates = [
            "name",
            "description",
            "version",
            "webhookUrl",
            "enabled",
        ];
        const updates = Object.keys(body).filter((key) =>
            allowedUpdates.includes(key)
        );

        if (updates.length === 0) {
            return NextResponse.json(
                {
                    error: "No valid updates provided",
                    allowedFields: allowedUpdates,
                },
                { status: 400 }
            );
        }

        // In production, update in database
        return NextResponse.json({
            success: true,
            providerId,
            updated: updates,
            message:
                "Provider updated (demo mode - changes not persisted)",
        });
    } catch (error) {
        console.error("Error updating slot provider:", error);
        return NextResponse.json(
            { error: "Failed to update provider" },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE - Unregister provider
// ============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ providerId: string }> }
) {
    const { providerId } = await params;

    // In production, delete from database
    return NextResponse.json({
        success: true,
        providerId,
        message: "Provider unregistered (demo mode)",
    });
}
