import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export type ResourceType = 'doc' | 'pdf' | 'ppt' | 'link' | 'image';
export type UploaderRole = 'admin' | 'mentor';

export interface CourseResource {
  id: string;
  type: ResourceType;
  name: string;
  uploaded_by: UploaderRole;
  course_id: string;
  description?: string | null;
  related_url?: string | null;
  is_preview: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCourseResourceInput {
  course_id: string;
  name: string;
  type: ResourceType;
  description?: string | null;
  related_url?: string | null;
  uploaded_by?: UploaderRole;
  is_preview?: boolean;
}

export interface ResourceFilters {
  type?: ResourceType | 'all';
  uploaded_by?: UploaderRole | 'all';
  search?: string;
}

/**
 * Fetch total count of resources for a given course.
 */
export async function getCourseResourcesCount(courseId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('course_resources')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching course resources count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching course resources count:', err);
    return 0;
  }
}

/**
 * Fetch course resources for a course with optional type and uploaded_by filters.
 */
export async function getCourseResources(
  courseId: string,
  filters?: ResourceFilters
): Promise<{ data: CourseResource[]; error: Error | null }> {
  try {
    let query = supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters?.uploaded_by && filters.uploaded_by !== 'all') {
      query = query.eq('uploaded_by', filters.uploaded_by);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    let resources: CourseResource[] = (data || []).map((r) => ({
      ...r,
      type: r.type as ResourceType,
      uploaded_by: r.uploaded_by as UploaderRole,
    }));

    if (filters?.search && filters.search.trim() !== '') {
      const term = filters.search.trim().toLowerCase();
      resources = resources.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          (r.description && r.description.toLowerCase().includes(term))
      );
    }

    return { data: resources, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Create a new course resource record in Supabase course_resources table.
 */
export async function createCourseResource(
  input: CreateCourseResourceInput
): Promise<{ data: CourseResource | null; error: Error | null }> {
  try {
    const payload = {
      course_id: input.course_id,
      name: input.name.trim(),
      type: input.type,
      description: input.description?.trim() || null,
      related_url: input.related_url?.trim() || null,
      uploaded_by: input.uploaded_by || 'admin',
      is_preview: Boolean(input.is_preview),
    };

    const { data, error } = await supabase
      .from('course_resources')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as CourseResource, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Delete a course resource.
 */
export async function deleteCourseResource(
  resourceId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('course_resources')
      .delete()
      .eq('id', resourceId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface UpdateCourseResourceInput {
  description?: string | null;
  related_url?: string | null;
}

/**
 * Update course resource description and related link.
 */
export async function updateCourseResource(
  id: string,
  input: UpdateCourseResourceInput
): Promise<{ data: CourseResource | null; error: Error | null }> {
  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.description !== undefined) {
      payload.description = input.description?.trim() || null;
    }

    if (input.related_url !== undefined) {
      payload.related_url = input.related_url?.trim() || null;
    }

    const { data, error } = await supabase
      .from('course_resources')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as CourseResource, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface MentorCourseItem {
  id: string;
  course_id: string;
  title: string;
  sub_heading?: string | null;
  price: number;
  selling_price: number;
  duration: number;
  mentor_id?: string | null;
  status: string;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch total count of courses assigned to this mentor.
 */
export async function getMentorCoursesCount(mentorId?: string): Promise<number> {
  try {
    let resolvedMentorId = mentorId;
    if (!resolvedMentorId) {
      const user = await getCurrentUser();
      resolvedMentorId = user?.id;
    }

    let query = supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (resolvedMentorId) {
      query = query.eq('mentor_id', resolvedMentorId);
    }

    const { count, error } = await query;
    if (error) {
      console.error('Error fetching mentor courses count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching mentor courses count:', err);
    return 0;
  }
}

/**
 * Fetch list of courses assigned to this mentor, optionally filtered by course_id or title.
 */
export async function getMentorCourses(
  mentorId?: string,
  searchQuery?: string
): Promise<{ data: MentorCourseItem[]; error: Error | null }> {
  try {
    let resolvedMentorId = mentorId;
    if (!resolvedMentorId) {
      const user = await getCurrentUser();
      resolvedMentorId = user?.id;
    }

    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolvedMentorId) {
      query = query.eq('mentor_id', resolvedMentorId);
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    let items: MentorCourseItem[] = (data || []).map((c) => ({
      id: c.id,
      course_id: c.course_id,
      title: c.title,
      sub_heading: c.sub_heading,
      price: Number(c.price || 0),
      selling_price: Number(c.selling_price || 0),
      duration: Number(c.duration || 0),
      mentor_id: c.mentor_id,
      status: c.status,
      is_featured: Boolean(c.is_featured),
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().toLowerCase();
      items = items.filter(
        (c) =>
          c.course_id.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term)
      );
    }

    return { data: items, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}


