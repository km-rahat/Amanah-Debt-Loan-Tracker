import { supabase } from '../lib/supabase';
import { TimelineEvent } from '../types';
import { assertSupabaseSetup, handleDbError } from './base';

export interface CreateTimelineEventInput {
  loanId: string;
  eventType: 
    | 'Loan Created'
    | 'Loan Updated'
    | 'Payment Received'
    | 'Payment Updated'
    | 'Payment Deleted'
    | 'Loan Completed'
    | 'Loan Reopened'
    | 'Reminder Sent'
    | 'Agreement Generated'
    | string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
}

export class TimelineService {
  /**
   * Maps database snake_case row to camelCase React UI interface.
   */
  static mapRow(row: any): TimelineEvent {
    let parsedMetadata = row.metadata;
    if (typeof row.metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(row.metadata);
      } catch (e) {
        parsedMetadata = {};
      }
    }

    return {
      id: row.id,
      loanId: row.loan_id,
      eventType: row.event_type || 'General',
      title: row.title || 'Timeline Event',
      description: row.description || undefined,
      metadata: parsedMetadata || undefined,
      createdBy: row.created_by || undefined,
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  /**
   * Universal reusable function to add a timeline event.
   */
  static async addTimelineEvent(input: CreateTimelineEventInput): Promise<TimelineEvent> {
    try {
      assertSupabaseSetup();

      let author = input.createdBy;
      if (!author) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            author = user.user_metadata?.full_name || user.email?.split('@')[0] || 'System Admin';
          }
        } catch (e) {
          author = 'System Admin';
        }
      }

      const dbData = {
        loan_id: input.loanId,
        event_type: input.eventType,
        title: input.title,
        description: input.description || null,
        metadata: input.metadata ? input.metadata : null,
        created_by: author || 'System Admin',
      };

      const { data, error } = await supabase
        .from('loan_timeline')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.warn('Could not save timeline event to loan_timeline table:', error.message);
        // Fallback local mock row if table does not exist yet or triggers fail
        return {
          id: `tl-${Date.now()}`,
          loanId: input.loanId,
          eventType: input.eventType,
          title: input.title,
          description: input.description,
          metadata: input.metadata,
          createdBy: input.createdBy || 'System',
          createdAt: new Date().toISOString(),
        };
      }

      return this.mapRow(data);
    } catch (err) {
      console.warn('Timeline error caught:', err);
      return {
        id: `tl-${Date.now()}`,
        loanId: input.loanId,
        eventType: input.eventType,
        title: input.title,
        description: input.description,
        metadata: input.metadata,
        createdBy: input.createdBy || 'System',
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetches timeline events for a specific loan ID in descending order (newest first).
   */
  static async getTimelineByLoanId(loanId: string): Promise<TimelineEvent[]> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('loan_timeline')
        .select('*')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => this.mapRow(row));
    } catch (err) {
      console.warn('Failed to fetch loan_timeline from DB:', err);
      return [];
    }
  }

  /**
   * Fetches all timeline events across all loans in descending order.
   */
  static async getAllTimeline(): Promise<TimelineEvent[]> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('loan_timeline')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => this.mapRow(row));
    } catch (err) {
      console.warn('Failed to fetch all loan_timeline from DB:', err);
      return [];
    }
  }
}
