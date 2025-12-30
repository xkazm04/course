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

    const supabase = createClient();

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
            return null;
        }

        return data;
    }, [supabase]);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    setState(prev => ({ ...prev, error, isLoading: false }));
                    return;
                }

                if (session?.user) {
                    const profile = await fetchProfile(session.user.id);
                    setState({
                        user: session.user,
                        session,
                        profile,
                        isLoading: false,
                        error: null,
                    });
                } else {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error("Auth init error:", error);
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const profile = await fetchProfile(session.user.id);
                    setState({
                        user: session.user,
                        session,
                        profile,
                        isLoading: false,
                        error: null,
                    });
                } else {
                    setState({
                        user: null,
                        session: null,
                        profile: null,
                        isLoading: false,
                        error: null,
                    });
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    // Sign in with Google
    const signInWithGoogle = useCallback(async (redirectTo?: string) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`,
            },
        });

        if (error) {
            setState(prev => ({ ...prev, error }));
        }
    }, [supabase]);

    // Sign out
    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            setState(prev => ({ ...prev, error }));
        }
    }, [supabase]);

    // Update profile
    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        if (!state.user) return { error: new Error("Not authenticated") };

        const { data, error } = await supabase
            .from("user_profiles")
            .update(updates)
            .eq("id", state.user.id)
            .select()
            .single();

        if (error) {
            return { error };
        }

        setState(prev => ({ ...prev, profile: data }));
        return { data };
    }, [supabase, state.user]);

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
