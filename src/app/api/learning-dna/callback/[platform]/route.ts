/**
 * Platform OAuth Callback Route
 *
 * Handles OAuth callbacks from external platforms after user authorization.
 * Exchanges authorization code for tokens and redirects back to the app.
 */

import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_CONFIGS } from "@/app/features/learning-dna/lib/platformConfig";
import type { ExternalPlatform } from "@/app/features/learning-dna/lib/types";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    try {
        const { platform } = await params;
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        const config = PLATFORM_CONFIGS[platform as ExternalPlatform];

        if (!config) {
            return redirectWithError("Unsupported platform", request);
        }

        // Handle OAuth error
        if (error) {
            return redirectWithError(`OAuth error: ${error}`, request);
        }

        // Validate state to prevent CSRF
        // In production, verify state matches what was stored in session
        if (!state) {
            return redirectWithError("Missing state parameter", request);
        }

        if (!code) {
            return redirectWithError("Missing authorization code", request);
        }

        // In production, exchange code for access token here
        // For demo, we'll pass the code to the frontend to handle

        // Redirect back to the app with success parameters
        const redirectUrl = new URL("/forge/profile", request.url);
        redirectUrl.searchParams.set("platform_connected", platform);
        redirectUrl.searchParams.set("auth_code", code);

        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error("[learning-dna/callback] Error:", error);
        return redirectWithError("Callback processing failed", request);
    }
}

/**
 * Redirect to app with error message
 */
function redirectWithError(message: string, request: NextRequest): NextResponse {
    const redirectUrl = new URL("/forge/profile", request.url);
    redirectUrl.searchParams.set("auth_error", message);
    return NextResponse.redirect(redirectUrl);
}
