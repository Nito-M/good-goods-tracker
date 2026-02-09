import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  useEffect(() => {
    let isMounted = true;

    // 1. Set up the ongoing auth state listener FIRST (Supabase requirement)
    //    This handles sign-in, sign-out, token refresh AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    // 2. Initial load - get session, then set loading false
    const initializeAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!isMounted) return;

        // Timeout fired — nuke all auth state so user sees login
        if (!result || !('data' in result)) {
          console.warn('Auth init timed out — clearing stale session');
          // Force-clear stored token that's causing the hang
          try { localStorage.removeItem('sb-awzfdkhntiucfmuorbbr-auth-token'); } catch {}
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setSession(null);
          setUser(null);
          return;
        }

        const currentSession = result.data.session;

        if (currentSession?.user) {
          const sessionMarker = sessionStorage.getItem(SESSION_ACTIVE_KEY);
          const rememberMe = localStorage.getItem('remember_me');

          if (!sessionMarker && rememberMe === 'false') {
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            localStorage.removeItem('remember_me');
            if (isMounted) {
              setSession(null);
              setUser(null);
            }
          } else {
            sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
            if (isMounted) {
              setSession(currentSession);
              setUser(currentSession.user);
            }
          }
        } else {
          if (isMounted) {
            setSession(null);
            setUser(null);
          }
        }
      } catch {
        if (isMounted) {
          // On any error, sign out locally so user isn't stuck
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string, birthYear?: number) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName, birth_year: birthYear },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error) {
      // Store remember me preference
      localStorage.setItem('remember_me', rememberMe ? 'true' : 'false');
      // Set session marker (will be cleared when browser closes)
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    }
    
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
