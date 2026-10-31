import { supabase } from '@/lib/supabase';

export interface CouponCode {
  id: string;
  code: string;
  discount_value: number;
  uk_discount_value: number;
  valid_till?: string | null;
  count: number;
  thersold: number; // Matches database column 'thersold'
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCouponInput {
  code: string;
  discount_value: number;
  uk_discount_value?: number;
  valid_till?: string | null;
  thersold: number;
  is_public: boolean;
}

export interface UpdateCouponInput {
  code?: string;
  discount_value?: number;
  uk_discount_value?: number;
  valid_till?: string | null;
  count?: number;
  thersold?: number;
  is_public?: boolean;
}

/**
 * Check whether a given coupon is currently active.
 * Active if: (valid_till is null or future) AND (thersold == 0 or count < thersold).
 */
export function isCouponActive(coupon: CouponCode): boolean {
  const isNotExpired = !coupon.valid_till || new Date(coupon.valid_till).getTime() > Date.now();
  const isUnderThreshold = coupon.thersold === 0 || coupon.count < coupon.thersold;
  return isNotExpired && isUnderThreshold;
}

/**
 * Fetch total count of active coupons.
 */
export async function getActiveCouponsCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('valid_till, count, thersold');

    if (error || !data) {
      console.error('Error fetching active coupons count:', error);
      return 0;
    }

    const now = Date.now();
    let activeCount = 0;

    for (const c of data) {
      const isNotExpired = !c.valid_till || new Date(c.valid_till).getTime() > now;
      const thersoldNum = Number(c.thersold || 0);
      const countNum = Number(c.count || 0);
      const isUnderThreshold = thersoldNum === 0 || countNum < thersoldNum;

      if (isNotExpired && isUnderThreshold) {
        activeCount++;
      }
    }

    return activeCount;
  } catch (err) {
    console.error('Unexpected error fetching active coupons count:', err);
    return 0;
  }
}

/**
 * Fetch total count of all coupons.
 */
export async function getTotalCouponsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('coupon_codes')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total coupons count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching total coupons count:', err);
    return 0;
  }
}

/**
 * Fetch list of coupons with optional search query on code.
 */
export async function getCoupons(
  searchQuery?: string
): Promise<{ data: CouponCode[]; error: Error | null }> {
  try {
    let query = supabase
      .from('coupon_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.ilike('code', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const formatted: CouponCode[] = (data || []).map((c) => ({
      id: c.id,
      code: c.code,
      discount_value: Number(c.discount_value || 0),
      uk_discount_value: Number(c.uk_discount_value || 0),
      valid_till: c.valid_till || null,
      count: Number(c.count || 0),
      thersold: Number(c.thersold || 0),
      is_public: Boolean(c.is_public),
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    return { data: formatted, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch a single coupon by UUID or coupon code.
 */
export async function getCouponById(
  identifier: string
): Promise<{ data: CouponCode | null; error: Error | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    let query = supabase.from('coupon_codes').select('*');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('code', identifier.trim().toUpperCase());
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: null, error: new Error('Coupon code not found') };
    }

    const formatted: CouponCode = {
      id: data.id,
      code: data.code,
      discount_value: Number(data.discount_value || 0),
      uk_discount_value: Number(data.uk_discount_value || 0),
      valid_till: data.valid_till || null,
      count: Number(data.count || 0),
      thersold: Number(data.thersold || 0),
      is_public: Boolean(data.is_public),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Create a new coupon code in Supabase (count defaults to 0).
 */
export async function createCoupon(
  input: CreateCouponInput
): Promise<{ data: CouponCode | null; error: Error | null }> {
  try {
    const cleanedCode = input.code.trim().toUpperCase();

    const { data, error } = await supabase
      .from('coupon_codes')
      .insert([
        {
          code: cleanedCode,
          discount_value: Number(input.discount_value || 0),
          uk_discount_value: Number(input.uk_discount_value || 0),
          valid_till: input.valid_till || null,
          count: 0,
          thersold: Number(input.thersold || 0),
          is_public: Boolean(input.is_public),
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const formatted: CouponCode = {
      id: data.id,
      code: data.code,
      discount_value: Number(data.discount_value || 0),
      uk_discount_value: Number(data.uk_discount_value || 0),
      valid_till: data.valid_till || null,
      count: Number(data.count || 0),
      thersold: Number(data.thersold || 0),
      is_public: Boolean(data.is_public),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update an existing coupon in Supabase.
 */
export async function updateCoupon(
  id: string,
  updates: UpdateCouponInput
): Promise<{ data: CouponCode | null; error: Error | null }> {
  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.code !== undefined) payload.code = updates.code.trim().toUpperCase();
    if (updates.discount_value !== undefined) payload.discount_value = Number(updates.discount_value || 0);
    if (updates.uk_discount_value !== undefined) payload.uk_discount_value = Number(updates.uk_discount_value || 0);
    if (updates.valid_till !== undefined) payload.valid_till = updates.valid_till || null;
    if (updates.count !== undefined) payload.count = Number(updates.count || 0);
    if (updates.thersold !== undefined) payload.thersold = Number(updates.thersold || 0);
    if (updates.is_public !== undefined) payload.is_public = Boolean(updates.is_public);

    const { data, error } = await supabase
      .from('coupon_codes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const formatted: CouponCode = {
      id: data.id,
      code: data.code,
      discount_value: Number(data.discount_value || 0),
      uk_discount_value: Number(data.uk_discount_value || 0),
      valid_till: data.valid_till || null,
      count: Number(data.count || 0),
      thersold: Number(data.thersold || 0),
      is_public: Boolean(data.is_public),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Delete a coupon code.
 */
export async function deleteCoupon(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('coupon_codes')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
