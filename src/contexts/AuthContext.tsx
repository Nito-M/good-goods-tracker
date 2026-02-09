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
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Clear any obviously corrupt Supabase storage before even trying
      try {
        const storedSession = localStorage.getItem('sb-awzfdkhntiucfmuorbbr-auth-token');
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          // If the stored token has no refresh_token or it's empty, nuke it immediately
          if (!parsed?.refresh_token && !parsed?.currentSession?.refresh_token) {
            localStorage.removeItem('sb-awzfdkhntiucfmuorbbr-auth-token');
          }
        }
      } catch {
        // Corrupt JSON - remove it
        localStorage.removeItem('sb-awzfdkhntiucfmuorbbr-auth-token');
      }

      // Race the auth check against a timeout to prevent infinite loading
      const timeoutPromise = new Promise<'timeout'>((resolve) => 
        setTimeout(() => resolve('timeout'), 5000)
      );

      const authCheckPromise = (async () => {
        try {
          const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !validatedUser) {
            await supabase.auth.signOut().catch(() => {});
            localStorage.removeItem('remember_me');
            sessionStorage.removeItem(SESSION_ACTIVE_KEY);
            setSession(null);
            setUser(null);
            return;
          }

          const sessionMarker = sessionStorage.getItem(SESSION_ACTIVE_KEY);
          const rememberMe = localStorage.getItem('remember_me');
          
          if (!sessionMarker && rememberMe === 'false') {
            await supabase.auth.signOut().catch(() => {});
            localStorage.removeItem('remember_me');
            setSession(null);
            setUser(null);
          } else {
            const { data: { session } } = await supabase.auth.getSession();
            sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
            setSession(session);
            setUser(validatedUser);
          }
        } catch {
          await supabase.auth.signOut().catch(() => {});
          localStorage.removeItem('remember_me');
          sessionStorage.removeItem(SESSION_ACTIVE_KEY);
          setSession(null);
          setUser(null);
        }
      })();

      const result = await Promise.race([authCheckPromise, timeoutPromise]);
      
      if (result === 'timeout') {
        // Auth hung - force clear everything and show login
        console.warn('Auth initialization timed out - clearing stale session');
        localStorage.removeItem('sb-awzfdkhntiucfmuorbbr-auth-token');
        localStorage.removeItem('remember_me');
        sessionStorage.removeItem(SESSION_ACTIVE_KEY);
        await supabase.auth.signOut().catch(() => {});
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [initialCheckDone]);

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
