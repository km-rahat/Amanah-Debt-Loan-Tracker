import { PostgrestError } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '../lib/supabase';

export class FriendlyError extends Error {
  originalError: any;
  isConfigurationError: boolean;

  constructor(message: string, originalError?: any, isConfigurationError = false) {
    super(message);
    this.name = 'FriendlyError';
    this.originalError = originalError;
    this.isConfigurationError = isConfigurationError;
  }
}

/**
 * Parses any DB/API error and translates it into a human-readable format.
 */
export function handleDbError(error: any): FriendlyError {
  if (!isSupabaseConfigured()) {
    console.warn('Database operation skipped (Supabase unconfigured):', error?.message || error);
    return new FriendlyError(
      'Supabase integration is not fully configured. Please configure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.',
      error,
      true
    );
  }

  console.error('Database Operation Error:', {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    rawError: error,
  });

  let friendlyMessage = '';

  if (error && typeof error === 'object') {
    // If it's a Supabase PostgrestError or error with code/message
    if ('message' in error && error.message) {
      const codeStr = error.code ? `[${error.code}] ` : '';
      const detailsStr = error.details ? ` (${error.details})` : '';
      const hintStr = error.hint ? ` [Hint: ${error.hint}]` : '';
      friendlyMessage = `${codeStr}${error.message}${detailsStr}${hintStr}`;
    } else if (error instanceof Error) {
      friendlyMessage = error.message;
    }
  }

  if (!friendlyMessage) {
    friendlyMessage = typeof error === 'string' ? error : 'An unexpected database error occurred. Please try again.';
  }

  return new FriendlyError(friendlyMessage, error, false);
}

/**
 * Assures Supabase environment variables are provided before making queries.
 */
export function assertSupabaseSetup() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not set.');
  }
}
