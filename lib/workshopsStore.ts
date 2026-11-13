import { supabase } from '@/lib/supabase';

export type WorkshopMode = 'online' | 'offline';

export interface Workshop {
  id: string;
  title: string;
  description?: string | null;
  learnings: string[];
  date?: string | null;
  time?: string | null;
  mode: WorkshopMode;
  duration?: string | null;
  registrations_link?: string | null;
  tag?: string | null;
  preview_image_link?: string | null;
  status: boolean;
  whatsapp_group_link?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWorkshopInput {
  title: string;
  description?: string | null;
  learnings?: string[];
  date?: string | null;
  time?: string | null;
  mode?: WorkshopMode;
  duration?: string | null;
  registrations_link?: string | null;
  tag?: string | null;
  preview_image_link?: string | null;
  status?: boolean;
  whatsapp_group_link?: string | null;
}

export interface UpdateWorkshopInput {
  title?: string;
  description?: string | null;
  learnings?: string[];
  date?: string | null;
  time?: string | null;
  mode?: WorkshopMode;
  duration?: string | null;
  registrations_link?: string | null;
  tag?: string | null;
  preview_image_link?: string | null;
  status?: boolean;
  whatsapp_group_link?: string | null;
}

/**
 * Normalize workshop status from either boolean (true/false) or text ('active'/'true'/'deactivated'/'false').
 */
export function isWorkshopActive(status: unknown): boolean {
  if (typeof status === 'boolean') return status;
  if (typeof status === 'string') {
    const normalized = status.trim().toLowerCase();
    return normalized === 'true' || normalized === 'active';
  }
  return false;
}

function formatWorkshopRow(row: Record<string, unknown>): Workshop {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    description: (row.description as string | null) ?? null,
    learnings: Array.isArray(row.learnings) ? (row.learnings as string[]) : [],
    date: (row.date as string | null) ?? null,
    time: (row.time as string | null) ?? null,
    mode: row.mode === 'offline' ? 'offline' : 'online',
    duration: (row.duration as string | null) ?? null,
    registrations_link: (row.registrations_link as string | null) ?? null,
    tag: (row.tag as string | null) ?? null,
    preview_image_link: (row.preview_image_link as string | null) ?? null,
    status: isWorkshopActive(row.status),
    whatsapp_group_link: (row.whatsapp_group_link as string | null) ?? null,
    created_at: (row.created_at as string | undefined) ?? undefined,
    updated_at: (row.updated_at as string | undefined) ?? undefined,
  };
}

/**
 * Fetch total count of active workshops (status = true / 'active').
 */
export async function getActiveWorkshopsCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('workshops')
      .select('status');

    if (error || !data) {
      console.error('Error fetching active workshops count:', error);
      return 0;
    }

    return data.filter((row) => isWorkshopActive(row.status)).length;
  } catch (err) {
    console.error('Unexpected error fetching active workshops count:', err);
    return 0;
  }
}

/**
 * Fetch list of workshops, optionally filtered by title search query.
 */
export async function getWorkshops(
  searchQuery?: string
): Promise<{ data: Workshop[]; error: Error | null }> {
  try {
    let query = supabase
      .from('workshops')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const formatted = (data || []).map((row) =>
      formatWorkshopRow(row as Record<string, unknown>)
    );

    return { data: formatted, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch a single workshop by its UUID.
 */
export async function getWorkshopById(
  id: string
): Promise<{ data: Workshop | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: null, error: new Error('Workshop not found') };
    }

    return {
      data: formatWorkshopRow(data as Record<string, unknown>),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Insert a new workshop into Supabase.
 * Supports both TEXT ('active'/'deactivated') and BOOLEAN (true/false) status column types.
 */
export async function createWorkshop(
  input: CreateWorkshopInput
): Promise<{ data: Workshop | null; error: Error | null }> {
  try {
    const active = input.status !== undefined ? Boolean(input.status) : true;
    const basePayload = {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      learnings: Array.isArray(input.learnings) ? input.learnings : [],
      date: input.date || null,
      time: input.time?.trim() || null,
      mode: input.mode || 'online',
      duration: input.duration?.trim() || null,
      registrations_link: input.registrations_link?.trim() || null,
      tag: input.tag?.trim() || null,
      preview_image_link: input.preview_image_link?.trim() || null,
      whatsapp_group_link: input.whatsapp_group_link?.trim() || null,
    };

    const { data, error } = await supabase
      .from('workshops')
      .insert([
        {
          ...basePayload,
          status: active ? 'active' : 'deactivated',
        },
      ])
      .select()
      .single();

    if (error && error.message.toLowerCase().includes('boolean')) {
      const retry = await supabase
        .from('workshops')
        .insert([
          {
            ...basePayload,
            status: active,
          },
        ])
        .select()
        .single();

      if (retry.error || !retry.data) {
        return {
          data: null,
          error: new Error(retry.error?.message || 'Failed to create workshop.'),
        };
      }

      return {
        data: formatWorkshopRow(retry.data as Record<string, unknown>),
        error: null,
      };
    }

    if (error || !data) {
      return {
        data: null,
        error: new Error(error?.message || 'Failed to create workshop.'),
      };
    }

    return {
      data: formatWorkshopRow(data as Record<string, unknown>),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Update an existing workshop in Supabase.
 * Supports both TEXT ('active'/'deactivated') and BOOLEAN (true/false) status column types.
 */
export async function updateWorkshop(
  id: string,
  updates: UpdateWorkshopInput
): Promise<{ data: Workshop | null; error: Error | null }> {
  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.learnings !== undefined) payload.learnings = updates.learnings;
    if (updates.date !== undefined) payload.date = updates.date || null;
    if (updates.time !== undefined) payload.time = updates.time?.trim() || null;
    if (updates.mode !== undefined) payload.mode = updates.mode;
    if (updates.duration !== undefined) payload.duration = updates.duration?.trim() || null;
    if (updates.registrations_link !== undefined) {
      payload.registrations_link = updates.registrations_link?.trim() || null;
    }
    if (updates.tag !== undefined) payload.tag = updates.tag?.trim() || null;
    if (updates.preview_image_link !== undefined) {
      payload.preview_image_link = updates.preview_image_link?.trim() || null;
    }
    if (updates.whatsapp_group_link !== undefined) {
      payload.whatsapp_group_link = updates.whatsapp_group_link?.trim() || null;
    }
    if (updates.status !== undefined) {
      payload.status = updates.status ? 'active' : 'deactivated';
    }

    const { data, error } = await supabase
      .from('workshops')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (
      error &&
      updates.status !== undefined &&
      error.message.toLowerCase().includes('boolean')
    ) {
      const retry = await supabase
        .from('workshops')
        .update({
          ...payload,
          status: Boolean(updates.status),
        })
        .eq('id', id)
        .select()
        .single();

      if (retry.error || !retry.data) {
        return {
          data: null,
          error: new Error(retry.error?.message || 'Failed to update workshop.'),
        };
      }

      return {
        data: formatWorkshopRow(retry.data as Record<string, unknown>),
        error: null,
      };
    }

    if (error || !data) {
      return {
        data: null,
        error: new Error(error?.message || 'Failed to update workshop.'),
      };
    }

    return {
      data: formatWorkshopRow(data as Record<string, unknown>),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Upload a workshop preview image to the 'workshop_preview_images' Supabase storage bucket
 * and return its public URL.
 */
export async function uploadWorkshopPreviewImage(
  file: File
): Promise<{ publicUrl: string | null; error: Error | null }> {
  try {
    const ext =
      file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const safeBase =
      file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .slice(0, 40) || 'workshop-preview';
    const filePath = `workshop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('workshop_preview_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      return { publicUrl: null, error: new Error(uploadError.message) };
    }

    const { data } = supabase.storage
      .from('workshop_preview_images')
      .getPublicUrl(filePath);

    return { publicUrl: data.publicUrl, error: null };
  } catch (err) {
    return {
      publicUrl: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Delete a workshop by ID.
 */
export async function deleteWorkshop(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('workshops').delete().eq('id', id);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
