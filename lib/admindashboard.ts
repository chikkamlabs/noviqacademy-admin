import { supabase } from '@/lib/supabase';

export interface AdminDashboardStats {
  totalCourses: number;
  totalBatches: number;
  lastWeekRegistrations: number;
}

/**
 * Fetch total count of courses.
 */
export async function getTotalCoursesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total courses count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching total courses count:', err);
    return 0;
  }
}

/**
 * Fetch total count of batches.
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
 * Fetch total count of registrations created in the last 1 week (last 7 days).
 */
export async function getLastWeekRegistrationsCount(): Promise<number> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoIso = oneWeekAgo.toISOString();

    const { count, error } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgoIso);

    if (error) {
      console.error('Error fetching last week registrations count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching last week registrations count:', err);
    return 0;
  }
}

/**
 * Fetch all dashboard metric counts in parallel.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [totalCourses, totalBatches, lastWeekRegistrations] = await Promise.all([
    getTotalCoursesCount(),
    getTotalBatchesCount(),
    getLastWeekRegistrationsCount(),
  ]);

  return {
    totalCourses,
    totalBatches,
    lastWeekRegistrations,
  };
}
