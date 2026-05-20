import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const SESSION_ACTIVE_KEY = 'session_active_marker';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, birthYear?: number) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // First, do the initial session check with "remember me" logic
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Don't apply remember-me sign-out on the password recovery route —
      // doing so would destroy the recovery session from the email link.
      const isRecoveryRoute = window.location.pathname === '/reset-password'
        || window.location.hash.includes('type=recovery');

      if (session) {
        const sessionMarker = sessionStorage.getItem(SESSION_ACTIVE_KEY);
        const rememberMe = localStorage.getItem('remember_me');

        if (!isRecoveryRoute && !sessionMarker && rememberMe === 'false') {
          // Browser was closed and user didn't want to be remembered - sign out
          await supabase.auth.signOut();
          localStorage.removeItem('remember_me');
          setSession(null);
          setUser(null);
        } else {
          // Either remember me is true, or this is a continuing session
          sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } else {
        setSession(null);
        setUser(null);
      }
      
      setLoading(false);
      setInitialCheckDone(true);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    // Only set up the auth state listener AFTER the initial check is done
    if (!initialCheckDone) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Keep prior object identities when nothing meaningful changed so consumers
      // of useAuth() don't re-render and re-fetch on tab focus / token refresh.
      setSession((currentSession) => {
        if (currentSession?.user?.id === (nextSession?.user?.id ?? null) &&
            currentSession?.access_token === (nextSession?.access_token ?? null)) {
          return currentSession;
        }
        return nextSession;
      });
      setUser((currentUser) => {
        const nextUser = nextSession?.user ?? null;
        return currentUser?.id === (nextUser?.id ?? null) ? currentUser : nextUser;
      });
    });

    return () => subscription.unsubscribe();
  }, [initialCheckDone]);

  const signUp = useCallback(async (email: string, password: string, displayName: string, birthYear?: number) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName, birth_year: birthYear },
      },
    });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = true) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error) {
      localStorage.setItem('remember_me', rememberMe ? 'true' : 'false');
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    }

    return { error };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signUp, signIn, signOut }),
    [user, session, loading, signUp, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
