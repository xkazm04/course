// ============================================================================
// Auth Callback Route
// Handles OAuth callback from Supabase Auth (Google)
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/forge";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if user profile exists, create if not
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from("user_profiles")
                    .select("id")
                    .eq("id", user.id)
                    .single();

                if (!profile) {
                    // Create new profile
                    await supabase.from("user_profiles").insert({
                        id: user.id,
                        email: user.email,
                        display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
                        avatar_url: user.user_metadata?.avatar_url || null,
                        total_xp: 0,
                        current_level: 1,
                        current_streak: 0,
                        longest_streak: 0,
                    });
                }
            }

            return NextResponse.redirect(new URL(next, requestUrl.origin));
        }
    }

    // Return to login page on error
    return NextResponse.redirect(new URL("/forge?error=auth", requestUrl.origin));
}
