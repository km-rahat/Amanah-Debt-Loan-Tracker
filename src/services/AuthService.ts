import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { assertSupabaseSetup, handleDbError } from './base';
import { ProfileService } from './ProfileService';
import { AuthError } from '../utils/auth';

export class AuthService {
  /**
   * Registers a new user with full name, email, and password via Supabase Auth.
   * Automatically creates the profile row upon successful account creation.
   */
  static async signUp(fullName: string, email: string, password: string) {
    try {
      assertSupabaseSetup();
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      if (!cleanEmail) throw new AuthError('Email address is required.');
      if (!password || password.length < 6) throw new AuthError('Password must be at least 6 characters.');
      if (!cleanName) throw new AuthError('Full name is required.');

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes('already registered') ||
          msg.includes('already exists') ||
          msg.includes('user_already_exists') ||
          error.code === 'user_already_exists'
        ) {
          throw new AuthError('An account with this email already exists.', 'USER_EXISTS');
        }
        if (msg.includes('rate limit') || error.code === 'over_email_send_rate_limit') {
          throw new AuthError(
            'Email send rate limit exceeded. Please wait a few minutes or try logging in if already registered.',
            'RATE_LIMIT'
          );
        }
        throw new AuthError(error.message, error.code);
      }

      // Check anti-enumeration
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new AuthError('An account with this email already exists.', 'USER_EXISTS');
      }

      // Automatically create user profile
      if (data?.user) {
        try {
          await ProfileService.checkAndCreateProfile({
            id: data.user.id,
            email: data.user.email || cleanEmail,
            user_metadata: { full_name: cleanName },
          });
        } catch (profileErr) {
          console.warn('[AuthService.signUp] Profile sync notice:', profileErr);
        }
      }

      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw handleDbError(err);
    }
  }

  /**
   * Performs authentication with email and password via Supabase.
   * Ensures session is properly populated and profile exists.
   */
  static async signIn(email: string, password: string) {
    try {
      assertSupabaseSetup();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) throw new AuthError('Email address is required.');
      if (!password) throw new AuthError('Password is required.');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes('invalid login credentials') ||
          msg.includes('invalid_credentials') ||
          msg.includes('user not found') ||
          msg.includes('invalid grant')
        ) {
          throw new AuthError('Invalid email or password.', 'INVALID_CREDENTIALS');
        }
        if (
          msg.includes('email not confirmed') ||
          msg.includes('email address not confirmed') ||
          msg.includes('email not verified') ||
          msg.includes('confirm email') ||
          error.code === 'email_not_confirmed'
        ) {
          throw new AuthError('Please verify your email address before logging in.', 'EMAIL_NOT_CONFIRMED');
        }
        if (msg.includes('rate limit') || error.code === 'over_request_rate_limit') {
          throw new AuthError('Too many login attempts. Please wait a few minutes.', 'RATE_LIMIT');
        }
        throw new AuthError(error.message, error.code);
      }

      if (data?.user) {
        try {
          await ProfileService.checkAndCreateProfile(data.user);
        } catch (profileErr) {
          console.warn('[AuthService.signIn] Profile sync notice:', profileErr);
        }
      }

      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw handleDbError(err);
    }
  }

  /**
   * Signs the current user out and clears session storage.
   */
  static async signOut(): Promise<void> {
    try {
      if (!isSupabaseConfigured()) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw new AuthError(error.message, error.code);
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw handleDbError(err);
    }
  }

  /**
   * Subscribes to changes in auth session state.
   */
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    try {
      if (!isSupabaseConfigured()) {
        return { unsubscribe: () => {} };
      }
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return data?.subscription || { unsubscribe: () => {} };
    } catch (err) {
      console.warn('[AuthService.onAuthStateChange] Subscription notice:', err);
      return { unsubscribe: () => {} };
    }
  }

  /**
   * Retrieves the current authenticated user session.
   */
  static async getSession(): Promise<Session | null> {
    try {
      if (!isSupabaseConfigured()) return null;
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data?.session || null;
    } catch (err) {
      console.warn('[AuthService.getSession] Session retrieval notice:', err);
      return null;
    }
  }

  /**
   * Retrieves the current authenticated user object directly from Supabase Auth.
   */
  static async getUser(): Promise<User | null> {
    try {
      if (!isSupabaseConfigured()) return null;
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data?.user || null;
    } catch (err) {
      console.warn('[AuthService.getUser] User retrieval notice:', err);
      return null;
    }
  }
}
