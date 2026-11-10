import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export type BatchRegistrationStatus = 'open' | 'closed';
export type BatchLanguage = 'english' | 'telugu';
export type BatchRegion = 'india' | 'uk';

export interface MentorBatch {
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
  region: BatchRegion;
  created_at?: string;
  updated_at?: string;
  // Augmented display fields
  course_identifier?: string;
  course_title?: string;
  mentor_name?: string;
}

export interface MentorBatchLearner {
  id: string;
  batch_id: string;
  learner_id: string;
  course_id: string;
  points: number;
  attendance: number;
  name: string;
  mobile: string;
  email: string;
  created_at?: string;
}

/**
 * Fetch total count of active batches (registrations = 'open') for the current mentor.
 */
export async function getMentorActiveBatchesCount(mentorId?: string): Promise<number> {
  try {
    let resolvedMentorId = mentorId;
    if (!resolvedMentorId) {
      const user = await getCurrentUser();
      resolvedMentorId = user?.id;
    }

    let query = supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('registrations', 'open');

    if (resolvedMentorId) {
      query = query.eq('mentor_id', resolvedMentorId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching mentor active batches count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching mentor active batches count:', err);
    return 0;
  }
}

/**
 * Fetch list of batches assigned to the mentor (or all batches if admin viewing),
 * with optional search by batch_id or course_id.
 */
export async function getMentorBatches(
  mentorId?: string,
  searchQuery?: string
): Promise<{ data: MentorBatch[]; error: Error | null }> {
  try {
    let resolvedMentorId = mentorId;
    if (!resolvedMentorId) {
      const user = await getCurrentUser();
      resolvedMentorId = user?.id;
    }

    let query = supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolvedMentorId) {
      query = query.eq('mentor_id', resolvedMentorId);
    }

    const { data: batchesData, error: batchesError } = await query;

    if (batchesError) {
      return { data: [], error: new Error(batchesError.message) };
    }

    if (!batchesData || batchesData.length === 0) {
      return { data: [], error: null };
    }

    // Augment with course titles and mentor names
    const [coursesRes, usersRes] = await Promise.all([
      supabase.from('courses').select('id, course_id, title'),
      supabase.from('users').select('id, name, email'),
    ]);

    const courseMap = new Map<string, { course_id: string; title: string }>();
    (coursesRes.data || []).forEach((c) => {
      courseMap.set(c.id, { course_id: c.course_id, title: c.title });
    });

    const userMap = new Map<string, string>();
    (usersRes.data || []).forEach((u) => {
      userMap.set(u.id, u.name || u.email);
    });

    const enriched: MentorBatch[] = batchesData.map((b) => {
      const course = b.course_id ? courseMap.get(b.course_id) : undefined;
      const mentorName = b.mentor_id ? userMap.get(b.mentor_id) : undefined;

      return {
        ...b,
        grace_period: Number(b.grace_period || 0),
        course_identifier: course?.course_id || 'Unknown Course',
        course_title: course?.title || 'Unknown Title',
        mentor_name: mentorName || 'Assigned Mentor',
      };
    });

    // Search filter on batch_id or course_id (including course title)
    let filtered = enriched;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().toLowerCase();
      filtered = enriched.filter((b) => {
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
 * Fetch a single batch by ID with course & mentor details.
 */
export async function getMentorBatchById(
  identifier: string
): Promise<{ data: MentorBatch | null; error: Error | null }> {
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

    const [courseRes, userRes] = await Promise.all([
      b.course_id ? supabase.from('courses').select('id, course_id, title').eq('id', b.course_id).maybeSingle() : Promise.resolve({ data: null }),
      b.mentor_id ? supabase.from('users').select('id, name, email').eq('id', b.mentor_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    const enriched: MentorBatch = {
      ...b,
      grace_period: Number(b.grace_period || 0),
      course_identifier: courseRes.data?.course_id || 'Unknown',
      course_title: courseRes.data?.title || 'Unknown Course',
      mentor_name: userRes.data?.name || userRes.data?.email || 'Assigned Mentor',
    };

    return { data: enriched, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update the batch live_link.
 */
export async function updateBatchLiveLink(
  batchId: string,
  liveLink: string
): Promise<{ data: MentorBatch | null; error: Error | null }> {
  try {
    const payload = {
      live_link: liveLink.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('batches')
      .update(payload)
      .eq('id', batchId);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return getMentorBatchById(batchId);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch learners for a batch, augmented with user profile details (name, mobile, email).
 * Supports search filtering on mobile number or name.
 */
export async function getMentorBatchLearners(
  batchId: string,
  searchQuery?: string
): Promise<{ data: MentorBatchLearner[]; error: Error | null }> {
  try {
    const { data: records, error } = await supabase
      .from('batch_learners')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    if (!records || records.length === 0) {
      return { data: [], error: null };
    }

    const learnerIds = Array.from(new Set(records.map((r) => r.learner_id)));
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name, mobile, email')
      .in('id', learnerIds);

    const userMap = new Map<string, { name: string; mobile: string; email: string }>();
    (usersData || []).forEach((u) => {
      userMap.set(u.id, {
        name: u.name || 'Unknown',
        mobile: u.mobile || '—',
        email: u.email || '—',
      });
    });

    const items: MentorBatchLearner[] = records.map((r) => {
      const u = userMap.get(r.learner_id);
      return {
        id: r.id,
        batch_id: r.batch_id,
        learner_id: r.learner_id,
        course_id: r.course_id,
        points: Number(r.points || 0),
        attendance: Number(r.attendance || 0),
        name: u?.name || 'Unknown Learner',
        mobile: u?.mobile || '—',
        email: u?.email || '—',
        created_at: r.created_at,
      };
    });

    let filtered = items;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().toLowerCase();
      filtered = items.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          l.mobile.toLowerCase().includes(term)
      );
    }

    return { data: filtered, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch total count of learners for a specific batch.
 */
export async function getMentorBatchLearnersCount(batchId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('batch_learners')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batchId);

    if (error) {
      console.error('Error fetching batch learners count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching batch learners count:', err);
    return 0;
  }
}
