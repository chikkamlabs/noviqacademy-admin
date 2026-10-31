import { supabase } from '@/lib/supabase';

export type RegistrationStatus = 'pending' | 'active' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
export type PaymentProvider = 'cashfree' | 'stripe';

export interface PaymentRecord {
  id: string;
  registration_id: string;
  provider: PaymentProvider;
  provider_order_id: string;
  provider_payment_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegistrationSummary {
  id: string;
  registration_id: string;
  amount: number;
  currency: string;
  status: RegistrationStatus;
  coupon_code?: string | null;
  discount?: number | null;
  created_at: string;
  updated_at: string;

  // Learner details
  learner_id: string;
  learner_name: string;
  learner_email: string;
  learner_mobile?: string | null;
  learner_region?: string | null;

  // Course details
  course_id: string;
  course_identifier: string; // e.g. course_101
  course_title: string;
  course_price?: number | null;
  course_selling_price?: number | null;

  // Batch details
  batch_id: string;
  batch_identifier: string; // e.g. batch_101
  batch_language?: string | null;
  batch_time_range?: string | null;

  // Payment status
  payment_status: PaymentStatus | 'unpaid';
  payment_provider?: PaymentProvider | null;
  payment_id?: string | null;
}

export interface RegistrationDetail extends RegistrationSummary {
  payments: PaymentRecord[];
  notes?: string | null;
  batch_start_date?: string | null;
  batch_end_date?: string | null;
}

export interface RegistrationFilterOptions {
  courses: { id: string; course_id: string; title: string }[];
  batches: { id: string; batch_id: string; course_id: string }[];
}

/**
 * Fetch total count of registrations created today (since midnight).
 */
export async function getTodayRegistrationsCount(): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfTodayIso = today.toISOString();

    const { count, error } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfTodayIso);

    if (error) {
      console.error('Error fetching today registrations count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching today registrations count:', err);
    return 0;
  }
}

/**
 * Fetch total count of all registrations.
 */
export async function getTotalRegistrationsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total registrations count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching total registrations count:', err);
    return 0;
  }
}

/**
 * Fetch filter options (Courses and Batches) for registrations dashboard.
 */
export async function getFilterOptions(): Promise<RegistrationFilterOptions> {
  try {
    const [coursesRes, batchesRes] = await Promise.all([
      supabase.from('courses').select('id, course_id, title').order('title', { ascending: true }),
      supabase.from('batches').select('id, batch_id, course_id').order('batch_id', { ascending: true }),
    ]);

    return {
      courses: (coursesRes.data || []).map((c) => ({
        id: c.id,
        course_id: c.course_id,
        title: c.title,
      })),
      batches: (batchesRes.data || []).map((b) => ({
        id: b.id,
        batch_id: b.batch_id,
        course_id: b.course_id,
      })),
    };
  } catch (err) {
    console.error('Error fetching filter options:', err);
    return { courses: [], batches: [] };
  }
}

/**
 * Fetch registrations list with joined learner, course, batch, and payment status info.
 * Supports search on registration_id and filtering by course and batch.
 */
export async function getRegistrations(options?: {
  searchQuery?: string;
  courseId?: string;
  batchId?: string;
}): Promise<{ data: RegistrationSummary[]; error: Error | null }> {
  try {
    // 1. Fetch registrations
    let query = supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.courseId && options.courseId !== 'all') {
      query = query.eq('course_id', options.courseId);
    }

    if (options?.batchId && options.batchId !== 'all') {
      query = query.eq('batch_id', options.batchId);
    }

    if (options?.searchQuery && options.searchQuery.trim() !== '') {
      query = query.ilike('registration_id', `%${options.searchQuery.trim()}%`);
    }

    const { data: regsData, error: regsError } = await query;

    if (regsError) {
      return { data: [], error: new Error(regsError.message) };
    }

    if (!regsData || regsData.length === 0) {
      return { data: [], error: null };
    }

    const regIds = regsData.map((r) => r.id);
    const courseUuids = Array.from(new Set(regsData.map((r) => r.course_id).filter(Boolean)));
    const batchUuids = Array.from(new Set(regsData.map((r) => r.batch_id).filter(Boolean)));
    const learnerUuids = Array.from(new Set(regsData.map((r) => r.learner_id).filter(Boolean)));

    // 2. Parallel auxiliary fetches
    const [coursesRes, batchesRes, usersRes, learnerProfilesRes, paymentsRes] = await Promise.all([
      courseUuids.length > 0 ? supabase.from('courses').select('id, course_id, title').in('id', courseUuids) : Promise.resolve({ data: [] }),
      batchUuids.length > 0 ? supabase.from('batches').select('id, batch_id, language, from_time, to_time').in('id', batchUuids) : Promise.resolve({ data: [] }),
      learnerUuids.length > 0 ? supabase.from('users').select('id, name, email, mobile').in('id', learnerUuids) : Promise.resolve({ data: [] }),
      learnerUuids.length > 0 ? supabase.from('learner_profile').select('id, region').in('id', learnerUuids) : Promise.resolve({ data: [] }),
      regIds.length > 0 ? supabase.from('payments').select('id, registration_id, status, provider, amount').in('registration_id', regIds) : Promise.resolve({ data: [] }),
    ]);

    const courseMap = new Map<string, { course_id: string; title: string }>();
    (coursesRes.data || []).forEach((c) => courseMap.set(c.id, { course_id: c.course_id, title: c.title }));

    const batchMap = new Map<string, { batch_id: string; language: string; time: string }>();
    (batchesRes.data || []).forEach((b) => {
      const fromTime = b.from_time ? b.from_time.slice(0, 5) : '';
      const toTime = b.to_time ? b.to_time.slice(0, 5) : '';
      const timeStr = fromTime && toTime ? `${fromTime} - ${toTime}` : fromTime || toTime || '';
      batchMap.set(b.id, { batch_id: b.batch_id, language: b.language, time: timeStr });
    });

    const userMap = new Map<string, { name: string; email: string; mobile?: string | null }>();
    (usersRes.data || []).forEach((u) => userMap.set(u.id, { name: u.name, email: u.email, mobile: u.mobile }));

    const profileMap = new Map<string, { region: string }>();
    (learnerProfilesRes.data || []).forEach((p) => profileMap.set(p.id, { region: p.region }));

    // Map registration_id -> latest payment status
    const paymentMap = new Map<string, { status: PaymentStatus; provider: PaymentProvider; id: string }>();
    (paymentsRes.data || []).forEach((p) => {
      // Prioritize success or latest payment
      const existing = paymentMap.get(p.registration_id);
      if (!existing || p.status === 'success') {
        paymentMap.set(p.registration_id, {
          status: p.status as PaymentStatus,
          provider: p.provider as PaymentProvider,
          id: p.id,
        });
      }
    });

    // 3. Assemble complete records
    const enrichedList: RegistrationSummary[] = regsData.map((r) => {
      const course = courseMap.get(r.course_id);
      const batch = batchMap.get(r.batch_id);
      const user = userMap.get(r.learner_id);
      const profile = profileMap.get(r.learner_id);
      const payment = paymentMap.get(r.id);

      return {
        id: r.id,
        registration_id: r.registration_id || `reg_${r.id.substring(0, 6)}`,
        amount: Number(r.amount || 0),
        currency: r.currency || 'INR',
        status: (r.status as RegistrationStatus) || 'pending',
        created_at: r.created_at,
        updated_at: r.updated_at,

        learner_id: r.learner_id,
        learner_name: user?.name || 'Unknown Learner',
        learner_email: user?.email || 'No Email',
        learner_mobile: user?.mobile || null,
        learner_region: profile?.region || 'india',

        course_id: r.course_id,
        course_identifier: course?.course_id || 'Unknown',
        course_title: course?.title || 'Unknown Course',

        batch_id: r.batch_id,
        batch_identifier: batch?.batch_id || 'Unknown',
        batch_language: batch?.language || null,
        batch_time_range: batch?.time || null,

        payment_status: payment?.status || 'unpaid',
        payment_provider: payment?.provider || null,
        payment_id: payment?.id || null,
      };
    });

    return { data: enrichedList, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch full registration details with all payment transactions.
 */
export async function getRegistrationDetails(
  identifier: string
): Promise<{ data: RegistrationDetail | null; error: Error | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    let query = supabase.from('registrations').select('*');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('registration_id', identifier.trim());
    }

    const { data: reg, error: regError } = await query.maybeSingle();

    if (regError) {
      return { data: null, error: new Error(regError.message) };
    }

    if (!reg) {
      return { data: null, error: new Error('Registration record not found') };
    }

    // Parallel detail queries
    const [courseRes, batchRes, userRes, profileRes, paymentsRes] = await Promise.all([
      reg.course_id ? supabase.from('courses').select('id, course_id, title, price, selling_price, uk_price, uk_selling_price').eq('id', reg.course_id).maybeSingle() : Promise.resolve({ data: null }),
      reg.batch_id ? supabase.from('batches').select('id, batch_id, language, from_time, to_time, start_date, end_date, notes').eq('id', reg.batch_id).maybeSingle() : Promise.resolve({ data: null }),
      reg.learner_id ? supabase.from('users').select('id, name, email, mobile').eq('id', reg.learner_id).maybeSingle() : Promise.resolve({ data: null }),
      reg.learner_id ? supabase.from('learner_profile').select('id, region').eq('id', reg.learner_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('payments').select('*').eq('registration_id', reg.id).order('created_at', { ascending: false }),
    ]);

    const paymentsList: PaymentRecord[] = (paymentsRes.data || []).map((p) => ({
      id: p.id,
      registration_id: p.registration_id,
      provider: p.provider as PaymentProvider,
      provider_order_id: p.provider_order_id,
      provider_payment_id: p.provider_payment_id || null,
      amount: Number(p.amount || 0),
      currency: p.currency || 'INR',
      status: p.status as PaymentStatus,
      paid_at: p.paid_at || null,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    // Find main payment status
    const successfulPayment = paymentsList.find((p) => p.status === 'success');
    const latestPayment = paymentsList[0];
    const resolvedPaymentStatus = successfulPayment ? 'success' : latestPayment?.status || 'unpaid';

    const b = batchRes.data;
    const fromTime = b?.from_time ? b.from_time.slice(0, 5) : '';
    const toTime = b?.to_time ? b.to_time.slice(0, 5) : '';
    const timeStr = fromTime && toTime ? `${fromTime} - ${toTime}` : fromTime || toTime || null;

    const detail: RegistrationDetail = {
      id: reg.id,
      registration_id: reg.registration_id || `reg_${reg.id.substring(0, 6)}`,
      amount: Number(reg.amount || 0),
      currency: reg.currency || 'INR',
      status: (reg.status as RegistrationStatus) || 'pending',
      coupon_code: reg.coupon_code || null,
      discount: reg.discount != null ? Number(reg.discount) : 0,
      created_at: reg.created_at,
      updated_at: reg.updated_at,

      learner_id: reg.learner_id,
      learner_name: userRes.data?.name || 'Unknown Learner',
      learner_email: userRes.data?.email || 'No Email',
      learner_mobile: userRes.data?.mobile || null,
      learner_region: profileRes.data?.region || 'india',

      course_id: reg.course_id,
      course_identifier: courseRes.data?.course_id || 'Unknown',
      course_title: courseRes.data?.title || 'Unknown Course',
      course_price: courseRes.data?.price != null ? Number(courseRes.data.price) : null,
      course_selling_price: courseRes.data?.selling_price != null ? Number(courseRes.data.selling_price) : null,

      batch_id: reg.batch_id,
      batch_identifier: b?.batch_id || 'Unknown',
      batch_language: b?.language || null,
      batch_time_range: timeStr,
      batch_start_date: b?.start_date || null,
      batch_end_date: b?.end_date || null,
      notes: b?.notes || null,

      payment_status: resolvedPaymentStatus,
      payment_provider: successfulPayment?.provider || latestPayment?.provider || null,
      payment_id: successfulPayment?.id || latestPayment?.id || null,

      payments: paymentsList,
    };

    return { data: detail, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
