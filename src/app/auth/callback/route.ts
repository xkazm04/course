// ============================================================================
// Auth Callback Route
// Handles OAuth callback from Supabase Auth (Google/GitHub)
// ============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/forge";

    console.log("[Auth Callback] Starting with code:", code ? "present" : "missing", "next:", next);

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Create response that we'll modify with cookies
        const response = NextResponse.redirect(new URL(next, requestUrl.origin));

        const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    console.log("[Auth Callback] Setting cookies:", cookiesToSet.map(c => c.name));
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        });

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        console.log("[Auth Callback] Exchange result:", {
            hasSession: !!data?.session,
            hasUser: !!data?.user,
            error: error?.message || null
        });

        if (error) {
            console.error("[Auth Callback] Exchange error:", error);
            return NextResponse.redirect(new URL(`/forge?error=auth&message=${encodeURIComponent(error.message)}`, requestUrl.origin));
        }

        if (data?.session) {
            // Check if user profile exists, create if not
            const {
                data: { user },
            } = await supabase.auth.getUser();

            console.log("[Auth Callback] User:", user?.id, user?.email);

            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from("user_profiles")
                    .select("id")
                    .eq("id", user.id)
                    .single();

                console.log("[Auth Callback] Profile exists:", !!profile, "error:", profileError?.message);

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
                    console.log("[Auth Callback] Created profile:", insertError ? "failed" : "success", insertError?.message);
                }
            }

            console.log("[Auth Callback] Redirecting to:", next, "with cookies:", response.cookies.getAll().map(c => c.name));
            return response;
        }
    }

    console.log("[Auth Callback] No code or session, redirecting to error");
    // Return to login page on error
    return NextResponse.redirect(new URL("/forge?error=auth", requestUrl.origin));
}
