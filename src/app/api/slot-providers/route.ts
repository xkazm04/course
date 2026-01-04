import { NextRequest, NextResponse } from "next/server";

/**
 * Slot Providers API
 *
 * Provides registration and management endpoints for external slot providers.
 * Providers can register themselves via this API to inject content into chapters.
 */

// ============================================================================
// Types
// ============================================================================

interface SlotProviderRegistration {
    id: string;
    name: string;
    description: string;
    version: string;
    supportedSlotTypes: string[];
    supportedRegions: string[];
    webhookUrl?: string;
    apiKey?: string;
}

interface RegisteredProvider extends SlotProviderRegistration {
    registeredAt: string;
    lastActiveAt: string;
    enabled: boolean;
}

// In-memory store for demo - in production, use database
const registeredProviders: Map<string, RegisteredProvider> = new Map();

// ============================================================================
// GET - List registered providers
// ============================================================================

export async function GET() {
    const providers = Array.from(registeredProviders.values()).map(
        ({ apiKey, ...provider }) => provider // Omit apiKey from response
    );

    return NextResponse.json({
        providers,
        count: providers.length,
    });
}

// ============================================================================
// POST - Register a new provider
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ["id", "name", "description", "version"];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate provider ID format (reverse domain notation)
        const idPattern = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;
        if (!idPattern.test(body.id)) {
            return NextResponse.json(
                {
                    error:
                        "Provider ID must be in reverse domain notation (e.g., com.example.my-provider)",
                },
                { status: 400 }
            );
        }

        // Check for duplicate
        if (registeredProviders.has(body.id)) {
            return NextResponse.json(
                { error: `Provider ${body.id} is already registered` },
                { status: 409 }
            );
        }

        // Create registration
        const registration: RegisteredProvider = {
            id: body.id,
            name: body.name,
            description: body.description,
            version: body.version,
            supportedSlotTypes: body.supportedSlotTypes || [],
            supportedRegions: body.supportedRegions || [],
            webhookUrl: body.webhookUrl,
            apiKey: body.apiKey,
            registeredAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            enabled: true,
        };

        registeredProviders.set(body.id, registration);

        // Return without API key
        const { apiKey, ...safeRegistration } = registration;

        return NextResponse.json(
            {
                success: true,
                provider: safeRegistration,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error registering slot provider:", error);
        return NextResponse.json(
            { error: "Failed to register provider" },
            { status: 500 }
        );
    }
}
