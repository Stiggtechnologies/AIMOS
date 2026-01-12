import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/intranet';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isRole: (roles: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Got session:', session ? 'exists' : 'null');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthContext: Loading profile for user:', session.user.id);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? 'session exists' : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthContext: Loading profile after auth change for user:', session.user.id);
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    console.log('AuthContext: loadProfile called for userId:', userId);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('AuthContext: Profile query result:', { data, error });

      if (error) {
        console.error('AuthContext: Profile query error:', error);
        throw error;
      }

      if (!data) {
        console.error('AuthContext: No profile found for user:', userId);
      }

      setProfile(data);
      console.log('AuthContext: Profile set successfully:', data);
    } catch (error) {
      console.error('AuthContext: Error in loadProfile:', error);
    } finally {
      setLoading(false);
      console.log('AuthContext: Loading state set to false');
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Attempting to sign in with Supabase...');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('AuthContext: Sign in error:', error);
      throw error;
    }
    console.log('AuthContext: Sign in successful', data);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const isRole = (roles: string | string[]) => {
    if (!profile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
