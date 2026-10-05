import { createContext, useContext, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function requireSupabase() {
    if (!supabase) {
      throw new Error(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the repo-root .env file.",
      );
    }
  }

  async function signIn(email, password) {
    requireSupabase();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }

  async function signUp(email, password, username) {
    requireSupabase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: `${window.location.origin}/ideas`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signOut() {
    requireSupabase();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async function requestPasswordReset(email) {
    requireSupabase();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  }

  async function updatePassword(password) {
    requireSupabase();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw error;
    }
  }

  async function changeEmail(email) {
    requireSupabase();

    const { error } = await supabase.auth.updateUser({
      email: email.trim(),
    });

    if (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        changeEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
