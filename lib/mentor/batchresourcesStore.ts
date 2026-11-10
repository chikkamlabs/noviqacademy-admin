import { supabase } from '@/lib/supabase';
import { ResourceType, UploaderRole } from '@/lib/courseresourcesStore';

export type BatchResourceStatus = 'active' | 'deactivated';

export interface BatchResourceItem {
  id: string;
  batch_id: string;
  resource_id: string;
  status: BatchResourceStatus;
  created_at: string;
  updated_at: string;
  // Resource details from course_resources
  name: string;
  type: ResourceType;
  description?: string | null;
  related_url?: string | null;
  uploaded_by?: UploaderRole;
  is_preview?: boolean;
}

export interface AvailableCourseResource {
  id: string;
  name: string;
  type: ResourceType;
  description?: string | null;
  related_url?: string | null;
  uploaded_by: UploaderRole;
}

export interface AddBatchResourceInput {
  batch_id: string;
  resource_id: string;
  status?: BatchResourceStatus;
}

/**
 * Fetch all batch_resources for a given batch, with complete resource details.
 */
export async function getBatchResources(
  batchId: string
): Promise<{ data: BatchResourceItem[]; error: Error | null }> {
  try {
    // 1. Fetch batch_resources
    const { data: batchRes, error: batchErr } = await supabase
      .from('batch_resources')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (batchErr) {
      return { data: [], error: new Error(batchErr.message) };
    }

    if (!batchRes || batchRes.length === 0) {
      return { data: [], error: null };
    }

    // 2. Fetch corresponding course_resources
    const resourceIds = Array.from(new Set(batchRes.map((b) => b.resource_id)));
    const { data: courseRes, error: courseErr } = await supabase
      .from('course_resources')
      .select('*')
      .in('id', resourceIds);

    if (courseErr) {
      console.error('Error fetching course resources details:', courseErr);
    }

    const courseResMap = new Map<string, any>();
    (courseRes || []).forEach((c) => {
      courseResMap.set(c.id, c);
    });

    const items: BatchResourceItem[] = batchRes.map((b) => {
      const cr = courseResMap.get(b.resource_id);
      return {
        id: b.id,
        batch_id: b.batch_id,
        resource_id: b.resource_id,
        status: (b.status as BatchResourceStatus) || 'active',
        created_at: b.created_at,
        updated_at: b.updated_at,
        name: cr?.name || 'Unknown Resource',
        type: (cr?.type as ResourceType) || 'doc',
        description: cr?.description || null,
        related_url: cr?.related_url || null,
        uploaded_by: (cr?.uploaded_by as UploaderRole) || 'admin',
        is_preview: Boolean(cr?.is_preview),
      };
    });

    return { data: items, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch available (not yet added to this batch) course resources for a given course.
 */
export async function getAvailableCourseResources(
  courseId: string,
  batchId: string
): Promise<{ data: AvailableCourseResource[]; error: Error | null }> {
  try {
    // 1. Get all resources for this course
    const { data: allResources, error: allErr } = await supabase
      .from('course_resources')
      .select('id, name, type, description, related_url, uploaded_by')
      .eq('course_id', courseId)
      .order('name', { ascending: true });

    if (allErr) {
      return { data: [], error: new Error(allErr.message) };
    }

    if (!allResources || allResources.length === 0) {
      return { data: [], error: null };
    }

    // 2. Get already added resource_ids in batch_resources for this batch
    const { data: existingBatchRes, error: existingErr } = await supabase
      .from('batch_resources')
      .select('resource_id')
      .eq('batch_id', batchId);

    if (existingErr) {
      return { data: [], error: new Error(existingErr.message) };
    }

    const existingSet = new Set((existingBatchRes || []).map((e) => e.resource_id));

    // 3. Filter out resources already added
    const available = (allResources as AvailableCourseResource[]).filter(
      (r) => !existingSet.has(r.id)
    );

    return { data: available, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Add a course resource to a batch (inserts into batch_resources).
 */
export async function addBatchResource(
  input: AddBatchResourceInput
): Promise<{ data: BatchResourceItem | null; error: Error | null }> {
  try {
    const payload = {
      batch_id: input.batch_id,
      resource_id: input.resource_id,
      status: input.status || 'active',
    };

    const { data, error } = await supabase
      .from('batch_resources')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Fetch the attached course_resource for display
    const { data: cr } = await supabase
      .from('course_resources')
      .select('*')
      .eq('id', data.resource_id)
      .maybeSingle();

    const item: BatchResourceItem = {
      id: data.id,
      batch_id: data.batch_id,
      resource_id: data.resource_id,
      status: (data.status as BatchResourceStatus) || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
      name: cr?.name || 'Resource',
      type: (cr?.type as ResourceType) || 'doc',
      description: cr?.description || null,
      related_url: cr?.related_url || null,
      uploaded_by: (cr?.uploaded_by as UploaderRole) || 'admin',
      is_preview: Boolean(cr?.is_preview),
    };

    return { data: item, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update status of a batch resource (active vs deactivated).
 */
export async function updateBatchResourceStatus(
  batchResourceId: string,
  status: BatchResourceStatus
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('batch_resources')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchResourceId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Remove a batch resource mapping.
 */
export async function deleteBatchResource(
  batchResourceId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('batch_resources')
      .delete()
      .eq('id', batchResourceId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
