import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { AuthService } from '../services/AuthService';
import { ProfileService } from '../services/ProfileService';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  user: AuthUser | null; // Alias for compatibility
  session: Session | null;
  loading: boolean;
  authLoading: boolean; // Alias for compatibility
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (fullName: string, email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user profile from Supabase Auth session
  const mapSessionToAuthUser = async (session: Session | null): Promise<AuthUser | null> => {
    if (!session?.user) return null;
    const authUser: User = session.user;
    let fullName = authUser.user_metadata?.full_name || '';
    let avatarUrl = authUser.user_metadata?.avatar_url || '';

    try {
      const profile = await ProfileService.checkAndCreateProfile(authUser);
      if (profile?.fullName) fullName = profile.fullName;
      if (profile?.avatarUrl) avatarUrl = profile.avatarUrl;
    } catch (err) {
      console.warn('[AuthProvider] Profile check notice:', err);
    }

    const email = authUser.email || '';
    const name = fullName || (email ? email.split('@')[0] : 'Administrator');

    return {
      id: authUser.id,
      email: email,
      fullName: name,
      role: 'Administrator',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    };
  };

  useEffect(() => {
    let isMounted = true;

    // Initialize active session on mount
    const initializeAuth = async () => {
      try {
        const activeSession = await AuthService.getSession();
        if (isMounted) {
          setSession(activeSession);
          if (activeSession) {
            const authUser = await mapSessionToAuthUser(activeSession);
            if (isMounted) setCurrentUser(authUser);
          } else {
            if (isMounted) setCurrentUser(null);
          }
        }
      } catch (err) {
        console.warn('[AuthProvider] Initial session error:', err);
        if (isMounted) {
          setSession(null);
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen to real-time Auth State Changes
    const subscription = AuthService.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      if (newSession) {
        const authUser = await mapSessionToAuthUser(newSession);
        if (isMounted) setCurrentUser(authUser);
      } else {
        if (isMounted) setCurrentUser(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const data = await AuthService.signIn(email, password || '');
      setSession(data?.session || null);
      if (data?.session) {
        const authUser = await mapSessionToAuthUser(data.session);
        setCurrentUser(authUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (fullName: string, email: string, password?: string) => {
    setLoading(true);
    try {
      const data = await AuthService.signUp(fullName, email, password || '');
      setSession(data?.session || null);
      if (data?.session) {
        const authUser = await mapSessionToAuthUser(data.session);
        setCurrentUser(authUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setSession(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser, // Alias for compatibility
        session,
        loading,
        authLoading: loading, // Alias for compatibility
        signIn,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
