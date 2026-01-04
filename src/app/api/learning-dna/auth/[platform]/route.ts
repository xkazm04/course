/**
 * Platform OAuth API Route
 *
 * Handles OAuth authentication flow for platforms that support it.
 * Redirects to platform's OAuth page and handles callbacks.
 */

import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_CONFIGS } from "@/app/features/learning-dna/lib/platformConfig";
import type { ExternalPlatform } from "@/app/features/learning-dna/lib/types";

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET - Initiates OAuth flow for a platform
 * Redirects to the platform's authorization page
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    try {
        const { platform } = await params;
        const config = PLATFORM_CONFIGS[platform as ExternalPlatform];

        if (!config) {
            return NextResponse.json(
                { error: `Unsupported platform: ${platform}` },
                { status: 400 }
            );
        }

        if (!config.supportsOAuth) {
            return NextResponse.json(
                { error: `Platform ${platform} does not support OAuth. Use username-based sync.` },
                { status: 400 }
            );
        }

        // In production, construct the OAuth authorization URL
        // For demo purposes, we'll redirect back with a mock success

        const callbackUrl = new URL(request.url);
        callbackUrl.pathname = `/api/learning-dna/callback/${platform}`;

        // Mock: In production, this would redirect to the actual OAuth URL
        // const authUrl = new URL(config.oauth!.authUrl);
        // authUrl.searchParams.set('client_id', process.env[config.oauth!.clientIdEnvVar]!);
        // authUrl.searchParams.set('redirect_uri', callbackUrl.toString());
        // authUrl.searchParams.set('scope', config.oauth!.scopes.join(' '));
        // authUrl.searchParams.set('state', generateState());

        // For demo, simulate OAuth by redirecting to callback with mock code
        callbackUrl.searchParams.set("code", "mock_auth_code");
        callbackUrl.searchParams.set("state", "mock_state");

        return NextResponse.redirect(callbackUrl);
    } catch (error) {
        console.error("[learning-dna/auth] Error:", error);
        return NextResponse.json(
            { error: "Failed to initiate OAuth flow" },
            { status: 500 }
        );
    }
}

/**
 * POST - Exchange authorization code for access token
 * This is typically called by the frontend after OAuth callback
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    try {
        const { platform } = await params;
        const body = await request.json();
        const { code, state } = body;

        const config = PLATFORM_CONFIGS[platform as ExternalPlatform];

        if (!config) {
            return NextResponse.json(
                { error: `Unsupported platform: ${platform}` },
                { status: 400 }
            );
        }

        if (!code) {
            return NextResponse.json(
                { error: "Authorization code is required" },
                { status: 400 }
            );
        }

        // In production, exchange code for access token
        // const tokenResponse = await fetch(config.oauth!.tokenUrl, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //     body: new URLSearchParams({
        //         client_id: process.env[config.oauth!.clientIdEnvVar]!,
        //         client_secret: process.env[`${config.oauth!.clientIdEnvVar.replace('_ID', '_SECRET')}`]!,
        //         code,
        //         grant_type: 'authorization_code',
        //     }),
        // });

        // Mock response for demo
        const mockTokenResponse = {
            access_token: `mock_access_token_${platform}_${Date.now()}`,
            refresh_token: `mock_refresh_token_${platform}_${Date.now()}`,
            expires_in: 3600,
            token_type: "Bearer",
        };

        // Simulate API latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        return NextResponse.json({
            success: true,
            platform,
            username: `${platform}_user`, // In production, fetch from platform API
            ...mockTokenResponse,
        });
    } catch (error) {
        console.error("[learning-dna/auth] Token exchange error:", error);
        return NextResponse.json(
            { error: "Failed to exchange authorization code" },
            { status: 500 }
        );
    }
}
