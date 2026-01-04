// ============================================================================
// Middleware
// Handles Supabase Auth session refresh for all routes
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return supabaseResponse;
    }

    // Log auth cookies for debugging
    const authCookies = request.cookies.getAll().filter(c => c.name.includes('auth-token'));
    if (request.nextUrl.pathname.startsWith('/forge')) {
        console.log("[Middleware]", request.nextUrl.pathname, "Auth cookies:", authCookies.map(c => c.name));
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    // Refresh session if expired
    const { data: { user }, error } = await supabase.auth.getUser();

    if (request.nextUrl.pathname.startsWith('/forge')) {
        console.log("[Middleware]", request.nextUrl.pathname, "User:", user?.id || "none", error?.message || "");
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        // Match all routes except static files and API routes that don't need auth
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
