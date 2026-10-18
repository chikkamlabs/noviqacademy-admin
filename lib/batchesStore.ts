import { supabase } from '@/lib/supabase';

export type BatchRegistrationStatus = 'open' | 'closed';
export type BatchLanguage = 'english' | 'telugu';

export interface Batch {
  id: string;
  course_id: string;
  batch_id: string;
  start_date?: string | null;
  end_date?: string | null;
  grace_period: number;
  mentor_id?: string | null;
  registrations: BatchRegistrationStatus;
  notes?: string | null;
  live_link?: string | null;
  from_time?: string | null;
  to_time?: string | null;
  language: BatchLanguage;
  created_at?: string;
  updated_at?: string;
  // Augmented display fields
  course_identifier?: string;
  course_title?: string;
  mentor_name?: string;
  mentor_identifier?: string;
}

export interface CreateBatchInput {
  course_id: string;
  batch_id: string;
  start_date?: string | null;
  end_date?: string | null;
  grace_period?: number;
  mentor_id?: string | null;
  registrations?: BatchRegistrationStatus;
  notes?: string | null;
  live_link?: string | null;
  from_time?: string | null;
  to_time?: string | null;
  language?: BatchLanguage;
}

export interface UpdateBatchInput {
  start_date?: string | null;
  end_date?: string | null;
  grace_period?: number;
  registrations?: BatchRegistrationStatus;
  notes?: string | null;
  live_link?: string | null;
  from_time?: string | null;
  to_time?: string | null;
  language?: BatchLanguage;
}

export interface CourseOptionForBatch {
  id: string;
  course_id: string;
  title: string;
  mentor_id?: string | null;
  mentor_name?: string | null;
  mentor_identifier?: string | null;
}

/**
 * Fetch total count of active batches (registrations = 'open').
 */
export async function getActiveBatchesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('registrations', 'open');

    if (error) {
      console.error('Error fetching active batches count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching active batches count:', err);
    return 0;
  }
}

/**
 * Fetch total count of all batches.
 */
export async function getTotalBatchesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total batches count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching total batches count:', err);
    return 0;
  }
}

/**
 * Generate next batch_id automatically (batch_101+1 on every new entry).
 */
export async function generateNextBatchId(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select('batch_id');

    if (error || !data || data.length === 0) {
      return 'batch_101';
    }

    let maxNum = 100;

    for (const item of data) {
      if (item.batch_id) {
        const match = item.batch_id.match(/batch_(\d+)/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    return `batch_${maxNum + 1}`;
  } catch (err) {
    console.error('Error generating batch id:', err);
    return 'batch_101';
  }
}

/**
 * Fetch courses with their mentor info for batch dropdown selection.
 */
export async function getCoursesForBatchDropdown(): Promise<CourseOptionForBatch[]> {
  try {
    const [coursesRes, usersRes, mentorsProfileRes] = await Promise.all([
      supabase.from('courses').select('id, course_id, title, mentor_id').order('title', { ascending: true }),
      supabase.from('users').select('id, name, email'),
      supabase.from('mentor_profile').select('id, mentor_id'),
    ]);

    const coursesData = coursesRes.data || [];
    const usersMap = new Map<string, string>();
    (usersRes.data || []).forEach((u) => {
      usersMap.set(u.id, u.name || u.email);
    });

    const mentorIdMap = new Map<string, string>();
    (mentorsProfileRes.data || []).forEach((m) => {
      mentorIdMap.set(m.id, m.mentor_id);
    });

    return coursesData.map((c) => ({
      id: c.id,
      course_id: c.course_id,
      title: c.title,
      mentor_id: c.mentor_id || null,
      mentor_name: c.mentor_id ? usersMap.get(c.mentor_id) || null : null,
      mentor_identifier: c.mentor_id ? mentorIdMap.get(c.mentor_id) || null : null,
    }));
  } catch (err) {
    console.error('Error fetching courses for batch dropdown:', err);
    return [];
  }
}

/**
 * Fetch list of batches, with search query filtering on batch_id or course_id.
 */
export async function getBatches(
  searchQuery?: string
): Promise<{ data: Batch[]; error: Error | null }> {
  try {
    // 1. Fetch raw batches
    const { data: batchesData, error: batchesError } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (batchesError) {
      return { data: [], error: new Error(batchesError.message) };
    }

    if (!batchesData || batchesData.length === 0) {
      return { data: [], error: null };
    }

    // 2. Fetch courses and mentors to augment display data
    const [coursesRes, usersRes, profilesRes] = await Promise.all([
      supabase.from('courses').select('id, course_id, title'),
      supabase.from('users').select('id, name, email'),
      supabase.from('mentor_profile').select('id, mentor_id'),
    ]);

    const courseMap = new Map<string, { course_id: string; title: string }>();
    (coursesRes.data || []).forEach((c) => {
      courseMap.set(c.id, { course_id: c.course_id, title: c.title });
    });

    const userMap = new Map<string, string>();
    (usersRes.data || []).forEach((u) => {
      userMap.set(u.id, u.name || u.email);
    });

    const mentorProfileMap = new Map<string, string>();
    (profilesRes.data || []).forEach((p) => {
      mentorProfileMap.set(p.id, p.mentor_id);
    });

    const enrichedBatches: Batch[] = batchesData.map((b) => {
      const course = b.course_id ? courseMap.get(b.course_id) : undefined;
      const mentorName = b.mentor_id ? userMap.get(b.mentor_id) : undefined;
      const mentorIdentifier = b.mentor_id ? mentorProfileMap.get(b.mentor_id) : undefined;

      return {
        ...b,
        grace_period: Number(b.grace_period || 0),
        course_identifier: course?.course_id || 'Unknown',
        course_title: course?.title || 'Unknown Course',
        mentor_name: mentorName || 'No Mentor Assigned',
        mentor_identifier: mentorIdentifier || (b.mentor_id ? `mentor_${b.mentor_id.substring(0, 4)}` : undefined),
      };
    });

    // 3. Search filter by batch_id or course_id (including course title)
    let filtered = enrichedBatches;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().toLowerCase();
      filtered = enrichedBatches.filter((b) => {
        const bId = (b.batch_id || '').toLowerCase();
        const cId = (b.course_identifier || '').toLowerCase();
        const cTitle = (b.course_title || '').toLowerCase();
        return bId.includes(term) || cId.includes(term) || cTitle.includes(term);
      });
    }

    return { data: filtered, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch single batch by UUID or batch_id.
 */
export async function getBatchById(
  identifier: string
): Promise<{ data: Batch | null; error: Error | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    let query = supabase.from('batches').select('*');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('batch_id', identifier);
    }

    const { data: b, error } = await query.maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    if (!b) {
      return { data: null, error: new Error('Batch not found') };
    }

    // Augment with course and mentor metadata
    const [courseRes, userRes, profileRes] = await Promise.all([
      b.course_id ? supabase.from('courses').select('id, course_id, title').eq('id', b.course_id).maybeSingle() : Promise.resolve({ data: null }),
      b.mentor_id ? supabase.from('users').select('id, name, email').eq('id', b.mentor_id).maybeSingle() : Promise.resolve({ data: null }),
      b.mentor_id ? supabase.from('mentor_profile').select('id, mentor_id').eq('id', b.mentor_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    const enriched: Batch = {
      ...b,
      grace_period: Number(b.grace_period || 0),
      course_identifier: courseRes.data?.course_id || 'Unknown',
      course_title: courseRes.data?.title || 'Unknown Course',
      mentor_name: userRes.data?.name || userRes.data?.email || 'No Mentor Assigned',
      mentor_identifier: profileRes.data?.mentor_id || (b.mentor_id ? `mentor_${b.mentor_id.substring(0, 4)}` : undefined),
    };

    return { data: enriched, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Insert a new batch into Supabase.
 */
export async function createBatch(
  input: CreateBatchInput
): Promise<{ data: Batch | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('batches')
      .insert([
        {
          course_id: input.course_id,
          batch_id: input.batch_id.trim(),
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          grace_period: Number(input.grace_period || 0),
          mentor_id: input.mentor_id || null,
          registrations: input.registrations || 'open',
          notes: input.notes?.trim() || null,
          live_link: input.live_link?.trim() || null,
          from_time: input.from_time || null,
          to_time: input.to_time || null,
          language: input.language || 'english',
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return getBatchById(data.id);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update an existing batch (except batch_id, course_id, and mentor_id).
 */
export async function updateBatch(
  id: string,
  updates: UpdateBatchInput
): Promise<{ data: Batch | null; error: Error | null }> {
  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.start_date !== undefined) payload.start_date = updates.start_date || null;
    if (updates.end_date !== undefined) payload.end_date = updates.end_date || null;
    if (updates.grace_period !== undefined) payload.grace_period = Number(updates.grace_period || 0);
    if (updates.registrations !== undefined) payload.registrations = updates.registrations;
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
    if (updates.live_link !== undefined) payload.live_link = updates.live_link?.trim() || null;
    if (updates.from_time !== undefined) payload.from_time = updates.from_time || null;
    if (updates.to_time !== undefined) payload.to_time = updates.to_time || null;
    if (updates.language !== undefined) payload.language = updates.language;

    const { error } = await supabase
      .from('batches')
      .update(payload)
      .eq('id', id);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return getBatchById(id);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
