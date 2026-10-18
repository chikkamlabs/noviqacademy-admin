import { supabase } from '@/lib/supabase';

export type LearnerRegion = 'india' | 'uk';

export interface Learner {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  region: LearnerRegion;
  referral_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateLearnerInput {
  name?: string;
  email?: string;
  mobile?: string | null;
  region?: LearnerRegion;
  referral_code?: string | null;
}

/**
 * Fetch total count of learners.
 */
export async function getLearnersCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'learner');

    if (!error && count !== null && count !== undefined) {
      return count;
    }

    // Fallback: count from learner_profile
    const { count: profileCount, error: profileError } = await supabase
      .from('learner_profile')
      .select('*', { count: 'exact', head: true });

    if (!profileError && profileCount !== null && profileCount !== undefined) {
      return profileCount;
    }

    return 0;
  } catch (err) {
    console.error('Error fetching learners count:', err);
    return 0;
  }
}

/**
 * Fetch list of learners with optional search query on mobile, email, or name.
 */
export async function getLearners(
  searchQuery?: string
): Promise<{ data: Learner[]; error: Error | null }> {
  try {
    // 1. Fetch all users with role 'learner'
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, mobile, created_at, updated_at')
      .eq('role', 'learner')
      .order('created_at', { ascending: false });

    if (usersError) {
      return { data: [], error: new Error(usersError.message) };
    }

    // 2. Fetch all learner_profiles
    const { data: profilesData } = await supabase
      .from('learner_profile')
      .select('id, referral_code, region, created_at, updated_at');

    const profileMap = new Map<string, { referral_code?: string | null; region: LearnerRegion }>();
    (profilesData || []).forEach((p) => {
      profileMap.set(p.id, {
        referral_code: p.referral_code || null,
        region: (p.region as LearnerRegion) || 'india',
      });
    });

    const enrichedLearners: Learner[] = (usersData || []).map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile || null,
        region: profile?.region || 'india',
        referral_code: profile?.referral_code || null,
        created_at: u.created_at,
        updated_at: u.updated_at,
      };
    });

    // 3. Search filter matching mobile, email, or name
    let filtered = enrichedLearners;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().toLowerCase();
      filtered = enrichedLearners.filter((l) => {
        const nameMatch = (l.name || '').toLowerCase().includes(term);
        const emailMatch = (l.email || '').toLowerCase().includes(term);
        const mobileMatch = (l.mobile || '').toLowerCase().includes(term);
        return nameMatch || emailMatch || mobileMatch;
      });
    }

    return { data: filtered, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch a single learner by UUID.
 */
export async function getLearnerById(
  id: string
): Promise<{ data: Learner | null; error: Error | null }> {
  try {
    const [userRes, profileRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', id).maybeSingle(),
      supabase.from('learner_profile').select('*').eq('id', id).maybeSingle(),
    ]);

    if (userRes.error) {
      return { data: null, error: new Error(userRes.error.message) };
    }

    if (!userRes.data) {
      return { data: null, error: new Error('Learner record not found') };
    }

    const u = userRes.data;
    const p = profileRes.data;

    const learner: Learner = {
      id: u.id,
      name: u.name,
      email: u.email,
      mobile: u.mobile || null,
      region: (p?.region as LearnerRegion) || 'india',
      referral_code: p?.referral_code || null,
      created_at: u.created_at,
      updated_at: u.updated_at,
    };

    return { data: learner, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update learner details across users and learner_profile tables.
 */
export async function updateLearner(
  id: string,
  updates: UpdateLearnerInput
): Promise<{ data: Learner | null; error: Error | null }> {
  try {
    const userPayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) userPayload.name = updates.name.trim();
    if (updates.email !== undefined) userPayload.email = updates.email.trim().toLowerCase();
    if (updates.mobile !== undefined) userPayload.mobile = updates.mobile?.trim() || null;

    const { error: userError } = await supabase
      .from('users')
      .update(userPayload)
      .eq('id', id);

    if (userError) {
      return { data: null, error: new Error(userError.message) };
    }

    // Update learner_profile
    if (updates.region !== undefined || updates.referral_code !== undefined) {
      const profilePayload: Record<string, unknown> = {
        id,
        updated_at: new Date().toISOString(),
      };
      if (updates.region !== undefined) profilePayload.region = updates.region;
      if (updates.referral_code !== undefined) profilePayload.referral_code = updates.referral_code?.trim() || null;

      const { error: profileError } = await supabase
        .from('learner_profile')
        .upsert(profilePayload);

      if (profileError) {
        return { data: null, error: new Error(profileError.message) };
      }
    }

    return getLearnerById(id);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update learner's login password.
 */
export async function updateLearnerPassword(
  userId: string,
  newPassword: string
): Promise<{ error: Error | null }> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { error: new Error('Password must be at least 6 characters long.') };
    }

    // Call PostgreSQL RPC admin_update_user_password
    const { error: rpcError } = await supabase.rpc('admin_update_user_password', {
      p_user_id: userId,
      p_new_password: newPassword,
    });

    if (!rpcError) {
      return { error: null };
    }

    return {
      error: new Error(
        rpcError.message.includes('function')
          ? 'Database function admin_update_user_password is not yet created in Supabase. Please ensure the SQL schema is executed in your Supabase SQL editor.'
          : rpcError.message
      ),
    };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
