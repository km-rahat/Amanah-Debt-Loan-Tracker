import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { assertSupabaseSetup, handleDbError } from './base';

export class ProfileService {
  /**
   * Maps database snake_case row to camelCase React UI interface.
   */
  static mapRow(row: any): Profile {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone || null,
      avatarUrl: row.avatar_url || null,
      createdAt: row.created_at,
    };
  }

  /**
   * Maps React UI model properties to database snake_case columns.
   */
  static mapToDb(item: Partial<Profile>) {
    const dbObj: any = {};
    if (item.id !== undefined) dbObj.id = item.id;
    if (item.fullName !== undefined) dbObj.full_name = item.fullName;
    if (item.email !== undefined) dbObj.email = item.email;
    if (item.phone !== undefined) dbObj.phone = item.phone;
    if (item.avatarUrl !== undefined) dbObj.avatar_url = item.avatarUrl;
    return dbObj;
  }

  /**
   * Reads a profile by its unique ID.
   * Returns null if the profile does not exist.
   */
  static async getById(id: string): Promise<Profile | null> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        // If the table doesn't exist, we log a warning and return null instead of throwing
        if (error.code === '42P01') {
          console.warn('Profiles table not found in Supabase. Profile retrieval skipped.');
          return null;
        }
        throw error;
      }

      if (!data) return null;
      return this.mapRow(data);
    } catch (err) {
      console.warn('Handled profile fetch warning:', err);
      // Handle gracefully without disrupting user flow
      return null;
    }
  }

  /**
   * Creates a new profile record.
   */
  static async create(profile: Profile): Promise<Profile | null> {
    try {
      assertSupabaseSetup();
      const dbData = this.mapToDb(profile);
      
      // Try inserting with select to return the updated record
      const { data, error } = await supabase
        .from('profiles')
        .insert(dbData)
        .select();

      if (error) {
        // Handle table missing
        if (error.code === '42P01') {
          console.warn('Profiles table not found in Supabase. Profile creation skipped.');
          return null;
        }
        
        // Handle duplicate key (profile already exists)
        if (error.code === '23505') {
          console.log('Profile already exists (duplicate key). Returning existing/provided profile.');
          return profile;
        }

        // Fallback: try inserting without select (in case SELECT is blocked by RLS)
        console.warn('Error inserting with select, trying simple insert fallback:', error);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(dbData);

        if (insertError) {
          if (insertError.code === '23505') {
            return profile;
          }
          throw insertError;
        }
        return profile;
      }

      if (data && data.length > 0) {
        return this.mapRow(data[0]);
      }
      return profile;
    } catch (err) {
      console.warn('Handled profile creation warning:', err);
      // Return the profile object as an in-memory fallback to avoid breaking the application flow
      return profile;
    }
  }

  /**
   * Automatically checks for profile and creates one if not present, following the exact rules.
   */
  static async checkAndCreateProfile(authUser: {
    id: string;
    email?: string;
    user_metadata?: { full_name?: string };
  }): Promise<Profile | null> {
    try {
      if (!authUser || !authUser.id) {
        return null;
      }

      const email = authUser.email || '';
      // Rule 1: Check whether a profile exists in the profiles table matching the auth user id.
      const existingProfile = await this.getById(authUser.id);
      if (existingProfile) {
        console.log(`Profile already exists for user ID: ${authUser.id}. Doing nothing.`);
        return existingProfile;
      }

      // Rule 2: If no profile exists, automatically create one
      // Rule 2 details:
      // - id = auth.user.id
      // - full_name = auth.user.user_metadata.full_name if available, otherwise use the email prefix.
      // - email = auth.user.email
      // - phone = null
      // - avatar_url = null
      const emailPrefix = email ? email.split('@')[0] : 'User';
      const fullName = authUser.user_metadata?.full_name || emailPrefix;

      const newProfile: Profile = {
        id: authUser.id,
        fullName: fullName,
        email: email,
        phone: null,
        avatarUrl: null,
      };

      console.log(`Creating automatic profile for user ID: ${authUser.id}`);
      const created = await this.create(newProfile);
      return created || newProfile; // fallback to in-memory representation if DB table was missing
    } catch (err) {
      console.error('Failed to run automatic check and create profile:', err);
      return null;
    }
  }
}
