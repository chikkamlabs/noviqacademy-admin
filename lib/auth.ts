import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'mentor' | 'learner';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: UserProfile | null;
  error: Error | null;
}

/**
 * Sign in user with email and password, and identify their role.
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        user: null,
        session: null,
        role: null,
        profile: null,
        error: error || new Error('Authentication failed'),
      };
    }

    // Identify user role from public.users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('id, name, email, mobile, role')
      .eq('id', data.user.id)
      .maybeSingle();

    let resolvedRole: UserRole | null = null;

    if (profileData?.role) {
      resolvedRole = profileData.role as UserRole;
    } else if (data.user.user_metadata?.role) {
      resolvedRole = data.user.user_metadata.role as UserRole;
    } else {
      // Default to learner if not explicitly set
      resolvedRole = 'learner';
    }

    const userProfile: UserProfile | null = profileData
      ? (profileData as UserProfile)
      : {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || '',
          role: resolvedRole,
        };

    return {
      user: data.user,
      session: data.session,
      role: resolvedRole,
      profile: userProfile,
      error: null,
    };
  } catch (err: unknown) {
    return {
      user: null,
      session: null,
      role: null,
      profile: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Sign out current authenticated user.
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error || null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Get current session.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Get current user.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Fetch user profile and role from the database.
 */
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  try {
    let targetId = userId;
    if (!targetId) {
      const user = await getCurrentUser();
      if (!user) return null;
      targetId = user.id;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, role')
      .eq('id', targetId)
      .maybeSingle();

    if (error || !data) {
      const user = await getCurrentUser();
      if (user && user.id === targetId) {
        return {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: (user.user_metadata?.role as UserRole) || 'learner',
        };
      }
      return null;
    }

    return data as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Subscribe to Supabase auth state changes.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
