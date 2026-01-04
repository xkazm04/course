// ============================================================================
// useAuth Hook
// Client-side authentication management with Supabase
// ============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/types";

type UserProfile = Tables<"user_profiles">;

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    isLoading: boolean;
    error: AuthError | null;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        profile: null,
        isLoading: true,
        error: null,
    });

    // Fetch user profile from database with timeout
    const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        console.log("[useAuth] Fetching profile for:", userId);
        const supabase = createClient();

        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise<null>((_, reject) => {
                setTimeout(() => reject(new Error("Profile fetch timeout")), 5000);
            });

            const fetchPromise = supabase
                .from("user_profiles")
                .select("*")
                .eq("id", userId)
                .single();

            const { data, error } = await Promise.race([
                fetchPromise,
                timeoutPromise.then(() => ({ data: null, error: { message: "Timeout" } }))
            ]) as any;

            if (error) {
                console.error("[useAuth] Error fetching profile:", error.message || error);
                return null;
            }

            console.log("[useAuth] Profile fetched successfully:", !!data);
            return data;
        } catch (err) {
            console.error("[useAuth] Profile fetch exception:", err);
            return null;
        }
    }, []);

    // Initialize auth state using onAuthStateChange which works reliably
    useEffect(() => {
        const supabase = createClient();
        let isMounted = true;

        console.log("[useAuth] Setting up auth listener...");

        // onAuthStateChange fires immediately with current session state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("[useAuth] Auth state changed:", event, { userId: session?.user?.id });

                if (!isMounted) {
                    console.log("[useAuth] Component unmounted, skipping state update");
                    return;
                }

                if (session?.user) {
                    console.log("[useAuth] User authenticated:", session.user.email);

                    // Set user immediately, then fetch profile
                    if (isMounted) {
                        setState(prev => ({
                            ...prev,
                            user: session.user,
                            session,
                            isLoading: false,
                            error: null,
                        }));
                    }

                    // Fetch profile in background
                    const profile = await fetchProfile(session.user.id);
                    console.log("[useAuth] Profile fetched:", !!profile);

                    if (isMounted && profile) {
                        setState(prev => ({
                            ...prev,
                            profile,
                        }));
                    }
                } else {
                    console.log("[useAuth] No user session");
                    if (isMounted) {
                        setState({
                            user: null,
                            session: null,
                            profile: null,
                            isLoading: false,
                            error: null,
                        });
                    }
                }
            }
        );

        // Set a timeout to stop loading if no auth event fires
        const timeout = setTimeout(() => {
            if (isMounted) {
                console.log("[useAuth] Auth timeout, setting isLoading to false");
                setState(prev => {
                    if (prev.isLoading) {
                        return { ...prev, isLoading: false };
                    }
                    return prev;
                });
            }
        }, 3000);

        return () => {
            console.log("[useAuth] Cleaning up auth listener");
            isMounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // Sign in with Google
    const signInWithGoogle = useCallback(async (redirectTo?: string) => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`,
            },
        });

        if (error) {
            setState(prev => ({ ...prev, error }));
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            setState(prev => ({ ...prev, error }));
        }
    }, []);

    // Update profile
    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        if (!state.user) return { error: new Error("Not authenticated") };

        const supabase = createClient();
        const { data, error } = await (supabase
            .from("user_profiles") as any)
            .update(updates)
            .eq("id", state.user.id)
            .select()
            .single();

        if (error) {
            return { error };
        }

        setState(prev => ({ ...prev, profile: data }));
        return { data };
    }, [state.user]);

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        if (!state.user) return;

        const profile = await fetchProfile(state.user.id);
        if (profile) {
            setState(prev => ({ ...prev, profile }));
        }
    }, [state.user, fetchProfile]);

    return {
        ...state,
        isAuthenticated: !!state.user,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile,
    };
}
