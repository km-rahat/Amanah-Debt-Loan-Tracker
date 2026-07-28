import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export class AuthError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class PaymentError extends Error {
  code?: string;
  details?: any;
  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Ensures user is authenticated before attempting database operations.
 * Throws AuthError if user is not logged in.
 */
export async function getAuthenticatedUser(): Promise<User> {
  if (!isSupabaseConfigured()) {
    throw new AuthError('Supabase is not configured. Check environment variables.', 'UNCONFIGURED');
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    // Attempt fallback via session check if getUser had temporary networking issue
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      return sessionData.session.user;
    }
    throw new AuthError(
      'Authentication required: Please log in to perform this operation.',
      'UNAUTHENTICATED'
    );
  }

  return data.user;
}

/**
 * Retrieves the current active Supabase Auth session.
 */
export async function getAuthenticatedSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}
