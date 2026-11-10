import { supabase } from '@/lib/supabase';

export interface BatchClassRecording {
  id: string;
  batch_id: string;
  date: string; // YYYY-MM-DD
  link: string;
  created_at?: string;
  updated_at?: string;
}

export interface AddBatchRecordingInput {
  batch_id: string;
  date: string;
  link: string;
}

export interface BatchRecordingFilters {
  fromDate?: string;
  toDate?: string;
}

/**
 * Fetch total recordings count for a batch
 */
export async function getBatchRecordingsCount(
  batchId: string,
  filters?: BatchRecordingFilters
): Promise<number> {
  try {
    let query = supabase
      .from('batch_class_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batchId);

    if (filters?.fromDate) {
      query = query.gte('date', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('date', filters.toDate);
    }

    const { count, error } = await query;
    if (error) {
      console.error('Error fetching batch recordings count:', error);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error('Exception fetching batch recordings count:', err);
    return 0;
  }
}

/**
 * Fetch list of recordings for a batch, optionally filtered by date range
 */
export async function getBatchRecordings(
  batchId: string,
  filters?: BatchRecordingFilters
): Promise<{ data: BatchClassRecording[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('batch_class_recordings')
      .select('*')
      .eq('batch_id', batchId);

    if (filters?.fromDate) {
      query = query.gte('date', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('date', filters.toDate);
    }

    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data: data || [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Add a new recording to batch_class_recordings
 */
export async function addBatchRecording(
  input: AddBatchRecordingInput
): Promise<{ data: BatchClassRecording | null; error: Error | null }> {
  try {
    if (!input.batch_id) {
      return { data: null, error: new Error('Batch ID is required') };
    }
    if (!input.date) {
      return { data: null, error: new Error('Date is required') };
    }
    if (!input.link || !input.link.trim()) {
      return { data: null, error: new Error('Recording link is required') };
    }

    const { data, error } = await supabase
      .from('batch_class_recordings')
      .insert({
        batch_id: input.batch_id,
        date: input.date,
        link: input.link.trim(),
      })
      .select('*')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Delete a recording by ID
 */
export async function deleteBatchRecording(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('batch_class_recordings')
      .delete()
      .eq('id', id);
    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Update an existing batch class recording (date, link).
 */
export async function updateBatchRecording(
  id: string,
  input: { date?: string; link?: string }
): Promise<{ data: BatchClassRecording | null; error: Error | null }> {
  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.date) updatePayload.date = input.date;
    if (input.link !== undefined) updatePayload.link = input.link.trim();

    const { data, error } = await supabase
      .from('batch_class_recordings')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

