// ============================================================================
// Auth Callback Route for Popup OAuth
// Handles OAuth callback and closes the popup window
// ============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    console.log("[Auth Callback Popup] Starting with code:", code ? "present" : "missing");

    // HTML that closes the popup and notifies the parent window
    const closePopupHtml = (success: boolean, error?: string) => `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication ${success ? "Successful" : "Failed"}</title>
            <style>
                body {
                    font-family: system-ui, -apple-system, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: #0a0a0a;
                    color: #fafafa;
                }
                .container {
                    text-align: center;
                    padding: 2rem;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #333;
                    border-top-color: #f97316;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .error {
                    color: #ef4444;
                }
            </style>
        </head>
        <body>
            <div class="container">
                ${success ? `
                    <div class="spinner"></div>
                    <p>Signed in successfully!</p>
                    <p style="color: #888; font-size: 0.875rem;">Closing this window...</p>
                ` : `
                    <p class="error">Authentication failed</p>
                    <p style="color: #888; font-size: 0.875rem;">${error || "Please try again"}</p>
                `}
            </div>
            <script>
                // Close popup after a brief delay to allow the session to sync
                setTimeout(() => {
                    window.close();
                }, ${success ? 1000 : 3000});
            </script>
        </body>
        </html>
    `;

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Create response that we'll modify with cookies
        const response = new NextResponse(closePopupHtml(true), {
            headers: { "Content-Type": "text/html" },
        });

        const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    console.log("[Auth Callback Popup] Setting cookies:", cookiesToSet.map(c => c.name));
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        });

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        console.log("[Auth Callback Popup] Exchange result:", {
            hasSession: !!data?.session,
            hasUser: !!data?.user,
            error: error?.message || null
        });

        if (error) {
            console.error("[Auth Callback Popup] Exchange error:", error);
            return new NextResponse(closePopupHtml(false, error.message), {
                headers: { "Content-Type": "text/html" },
            });
        }

        if (data?.session) {
            // Check if user profile exists, create if not
            const {
                data: { user },
            } = await supabase.auth.getUser();

            console.log("[Auth Callback Popup] User:", user?.id, user?.email);

            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from("user_profiles")
                    .select("id")
                    .eq("id", user.id)
                    .single();

                console.log("[Auth Callback Popup] Profile exists:", !!profile, "error:", profileError?.message);

                if (!profile) {
                    // Create new profile
                    const { error: insertError } = await supabase.from("user_profiles").insert({
                        id: user.id,
                        email: user.email,
                        display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
                        avatar_url: user.user_metadata?.avatar_url || null,
                        total_xp: 0,
                        current_level: 1,
                        current_streak: 0,
                        longest_streak: 0,
                    } as any);
                    console.log("[Auth Callback Popup] Created profile:", insertError ? "failed" : "success", insertError?.message);
                }
            }

            console.log("[Auth Callback Popup] Success, returning close page");
            return response;
        }
    }

    console.log("[Auth Callback Popup] No code or session, returning error page");
    return new NextResponse(closePopupHtml(false, "No authorization code received"), {
        headers: { "Content-Type": "text/html" },
    });
}
