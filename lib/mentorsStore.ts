import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export interface Mentor {
  id: string;
  mentor_id: string;
  name: string;
  email: string;
  mobile?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMentorInput {
  mentor_id: string;
  name: string;
  email: string;
  mobile?: string | null;
  password?: string;
}

export interface UpdateMentorInput {
  name: string;
  mobile?: string | null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Fetch total count of mentors.
 */
export async function getMentorsCount(): Promise<number> {
  try {
    // Count from mentor_profile first
    const { count, error } = await supabase
      .from('mentor_profile')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null && count !== undefined) {
      return count;
    }

    // Fallback: count from users where role = 'mentor'
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'mentor');

    if (!usersError && usersCount !== null && usersCount !== undefined) {
      return usersCount;
    }

    return 0;
  } catch (err) {
    console.error('Error fetching mentors count:', err);
    return 0;
  }
}

/**
 * Fetch list of mentors, with optional search filter matching mentor_id, name, or email.
 */
export async function getMentors(
  searchQuery?: string
): Promise<{ data: Mentor[]; error: Error | null }> {
  try {
    // Fetch users with role = 'mentor'
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, mobile, created_at, updated_at')
      .eq('role', 'mentor')
      .order('created_at', { ascending: false });

    if (usersError) {
      return { data: [], error: new Error(usersError.message) };
    }

    // Fetch corresponding mentor_profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('mentor_profile')
      .select('id, mentor_id, created_at, updated_at');

    if (profilesError) {
      console.warn('Could not query mentor_profile:', profilesError.message);
    }

    const profileMap = new Map<string, { mentor_id: string; created_at?: string; updated_at?: string }>();
    (profilesData || []).forEach((p) => {
      if (p.id) {
        profileMap.set(p.id, {
          mentor_id: p.mentor_id,
          created_at: p.created_at,
          updated_at: p.updated_at,
        });
      }
    });

    // Also collect any profiles whose users might not have role='mentor' yet
    const mentorList: Mentor[] = [];

    (usersData || []).forEach((u) => {
      const profile = profileMap.get(u.id);
      mentorList.push({
        id: u.id,
        mentor_id: profile?.mentor_id || `mentor_${u.id.substring(0, 4)}`,
        name: u.name,
        email: u.email,
        mobile: u.mobile || null,
        created_at: profile?.created_at || u.created_at,
        updated_at: profile?.updated_at || u.updated_at,
      });
    });

    // Filter by search query (matches mentor_id, name, or email)
    let filteredList = mentorList;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().toLowerCase();
      filteredList = mentorList.filter((m) => {
        const mId = (m.mentor_id || '').toLowerCase();
        const mName = (m.name || '').toLowerCase();
        const mEmail = (m.email || '').toLowerCase();
        return mId.includes(term) || mName.includes(term) || mEmail.includes(term);
      });
    }

    return { data: filteredList, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Generate next mentor_id automatically.
 * Scans existing mentor_ids (e.g. mentor_101, mentor_102) and returns mentor_101+1 on every new entry.
 */
export async function generateNextMentorId(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('mentor_profile')
      .select('mentor_id');

    if (error || !data || data.length === 0) {
      return 'mentor_101';
    }

    let maxNum = 100;

    for (const item of data) {
      if (item.mentor_id) {
        const match = item.mentor_id.match(/mentor_(\d+)/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    return `mentor_${maxNum + 1}`;
  } catch (err) {
    console.error('Error generating mentor id:', err);
    return 'mentor_101';
  }
}

/**
 * Create a new Mentor:
 * 1. Creates auth.user with email and password
 * 2. Updates public.users with role='mentor', name, mobile, email
 * 3. Removes any default learner_profile row
 * 4. Inserts into public.mentor_profile with mentor_id
 */
export async function createMentor(
  input: CreateMentorInput
): Promise<{ data: Mentor | null; error: Error | null }> {
  try {
    const email = input.email.trim();
    const password = input.password?.trim() || 'Temporary@123';
    const name = input.name.trim();
    const mobile = input.mobile?.trim() || null;
    const mentorId = input.mentor_id.trim();

    // Use isolated Supabase client without session persistence to prevent
    // overwriting the currently logged-in Admin's browser session.
    const tempAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          mobile,
          role: 'mentor',
          mentor_id: mentorId,
        },
      },
    });

    if (authError) {
      return { data: null, error: new Error(authError.message) };
    }

    if (!authData.user) {
      return { data: null, error: new Error('Failed to create mentor authentication record.') };
    }

    const newUserId = authData.user.id;

    // Ensure public.users has the correct role='mentor', name, and mobile
    const { error: userUpsertError } = await supabase.from('users').upsert({
      id: newUserId,
      name,
      email,
      mobile,
      role: 'mentor',
      updated_at: new Date().toISOString(),
    });

    if (userUpsertError) {
      console.warn('Note on public.users upsert:', userUpsertError.message);
    }

    // Remove learner_profile if auth trigger automatically added it
    await supabase.from('learner_profile').delete().eq('id', newUserId);

    // Insert public.mentor_profile with mentor_id
    const { error: profileError } = await supabase.from('mentor_profile').upsert({
      id: newUserId,
      mentor_id: mentorId,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      return { data: null, error: new Error(`User created, but mentor profile failed: ${profileError.message}`) };
    }

    return {
      data: {
        id: newUserId,
        mentor_id: mentorId,
        name,
        email,
        mobile,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch a single mentor by UUID or mentor_id.
 */
export async function getMentorById(
  identifier: string
): Promise<{ data: Mentor | null; error: Error | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    let targetUserId = identifier;
    let targetMentorId = '';

    if (isUuid) {
      // Find profile for this user ID
      const { data: profile } = await supabase
        .from('mentor_profile')
        .select('mentor_id, created_at, updated_at')
        .eq('id', identifier)
        .maybeSingle();

      targetMentorId = profile?.mentor_id || '';
    } else {
      // Identifier is mentor_id (e.g. mentor_101)
      const { data: profile } = await supabase
        .from('mentor_profile')
        .select('id, mentor_id, created_at, updated_at')
        .eq('mentor_id', identifier)
        .maybeSingle();

      if (!profile) {
        return { data: null, error: new Error('Mentor profile not found') };
      }

      targetUserId = profile.id;
      targetMentorId = profile.mentor_id;
    }

    // Fetch user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, mobile, created_at, updated_at')
      .eq('id', targetUserId)
      .maybeSingle();

    if (userError || !user) {
      return { data: null, error: new Error(userError?.message || 'Mentor user record not found') };
    }

    return {
      data: {
        id: user.id,
        mentor_id: targetMentorId || `mentor_${user.id.substring(0, 4)}`,
        name: user.name,
        email: user.email,
        mobile: user.mobile || null,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update editable mentor fields (Name and Mobile number only).
 * mentor_id and email are protected and cannot be changed.
 */
export async function updateMentorProfile(
  id: string,
  updates: UpdateMentorInput
): Promise<{ data: Mentor | null; error: Error | null }> {
  try {
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: updates.name.trim(),
        mobile: updates.mobile?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (userError) {
      return { data: null, error: new Error(userError.message) };
    }

    return getMentorById(id);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Change mentor's password using the admin SQL function.
 */
export async function updateMentorPassword(
  userId: string,
  newPassword: string
): Promise<{ error: Error | null }> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { error: new Error('Password must be at least 6 characters long.') };
    }

    // 1. Try PostgreSQL RPC admin_update_user_password
    const { error: rpcError } = await supabase.rpc('admin_update_user_password', {
      p_user_id: userId,
      p_new_password: newPassword,
    });

    if (!rpcError) {
      return { error: null };
    }

    // 2. If RPC not yet installed, inform user clearly
    return {
      error: new Error(
        rpcError.message.includes('function')
          ? 'Database function admin_update_user_password is not yet created in Supabase. Please execute the provided SQL script in your Supabase SQL editor.'
          : rpcError.message
      ),
    };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
