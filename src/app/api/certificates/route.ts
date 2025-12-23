import { NextRequest, NextResponse } from "next/server";

// Note: This is a client-side storage app, so API routes are mainly for
// future server-side integration and verification URL handling.
// Actual certificate data is stored in localStorage.

export async function GET(request: NextRequest) {
    // Return info about certificate API
    return NextResponse.json({
        message: "Certificate API",
        version: "1.0.0",
        endpoints: {
            verify: "/api/certificates/verify?code=<verification-code>",
        },
    });
}

export async function POST(request: NextRequest) {
    // Placeholder for server-side certificate issuance
    // In production, this would validate user, course completion, etc.
    try {
        const body = await request.json();

        return NextResponse.json({
            success: true,
            message: "Certificate issuance endpoint. Currently using client-side storage.",
            received: body,
        });
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }
}
