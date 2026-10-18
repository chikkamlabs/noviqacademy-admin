import { supabase } from '@/lib/supabase';

export type CourseStatus = 'active' | 'deactivated';

export interface Course {
  id: string;
  course_id: string;
  price: number;
  selling_price: number;
  title: string;
  sub_heading?: string | null;
  description?: string | null;
  duration: number; // duration in days
  mentor_id?: string | null;
  preview_media_id?: string | null;
  course_learnings: string[];
  course_includes: string[];
  status: CourseStatus;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MentorSummary {
  id: string;
  name: string;
  email: string;
}

/**
 * Fetch total count of courses in the database.
 */
export async function getCoursesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching courses count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('Unexpected error fetching courses count:', err);
    return 0;
  }
}

/**
 * Fetch list of courses, optionally filtered by course_id search.
 */
export async function getCourses(searchQuery?: string): Promise<{ data: Course[]; error: Error | null }> {
  try {
    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.ilike('course_id', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const formattedCourses: Course[] = (data || []).map((c) => ({
      ...c,
      price: Number(c.price || 0),
      selling_price: Number(c.selling_price || 0),
      duration: Number(c.duration || 0),
      course_learnings: Array.isArray(c.course_learnings) ? c.course_learnings : [],
      course_includes: Array.isArray(c.course_includes) ? c.course_includes : [],
    }));

    return { data: formattedCourses, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch a single course by its UUID or course_id.
 */
export async function getCourseById(identifier: string): Promise<{ data: Course | null; error: Error | null }> {
  try {
    // Check if UUID or course_id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    let query = supabase.from('courses').select('*');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('course_id', identifier);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: null, error: new Error('Course not found') };
    }

    const formatted: Course = {
      ...data,
      price: Number(data.price || 0),
      selling_price: Number(data.selling_price || 0),
      duration: Number(data.duration || 0),
      course_learnings: Array.isArray(data.course_learnings) ? data.course_learnings : [],
      course_includes: Array.isArray(data.course_includes) ? data.course_includes : [],
    };

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Automatically compute next course_id following course_101, course_102, ...
 */
export async function generateNextCourseId(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('course_id');

    if (error || !data || data.length === 0) {
      return 'course_101';
    }

    let maxNum = 100;

    for (const item of data) {
      if (item.course_id) {
        const match = item.course_id.match(/course_(\d+)/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    return `course_${maxNum + 1}`;
  } catch (err) {
    console.error('Error generating course id:', err);
    return 'course_101';
  }
}

/**
 * Insert a new course into Supabase.
 */
export async function createCourse(
  courseInput: Omit<Course, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Course | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([
        {
          course_id: courseInput.course_id,
          title: courseInput.title,
          sub_heading: courseInput.sub_heading || null,
          description: courseInput.description || null,
          price: Number(courseInput.price || 0),
          selling_price: Number(courseInput.selling_price || 0),
          duration: Number(courseInput.duration || 0),
          mentor_id: courseInput.mentor_id || null,
          preview_media_id: courseInput.preview_media_id || null,
          course_learnings: courseInput.course_learnings || [],
          course_includes: courseInput.course_includes || [],
          status: courseInput.status || 'deactivated',
          is_featured: Boolean(courseInput.is_featured),
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Course, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update course details in Supabase.
 * course_id is explicitly locked and cannot be modified.
 */
export async function updateCourse(
  id: string,
  courseUpdates: Partial<Omit<Course, 'id' | 'course_id' | 'created_at' | 'updated_at'>>
): Promise<{ data: Course | null; error: Error | null }> {
  try {
    const updatePayload: Record<string, unknown> = {};

    if (courseUpdates.title !== undefined) updatePayload.title = courseUpdates.title;
    if (courseUpdates.sub_heading !== undefined) updatePayload.sub_heading = courseUpdates.sub_heading || null;
    if (courseUpdates.description !== undefined) updatePayload.description = courseUpdates.description || null;
    if (courseUpdates.price !== undefined) updatePayload.price = Number(courseUpdates.price);
    if (courseUpdates.selling_price !== undefined) updatePayload.selling_price = Number(courseUpdates.selling_price);
    if (courseUpdates.duration !== undefined) updatePayload.duration = Number(courseUpdates.duration);
    if (courseUpdates.mentor_id !== undefined) updatePayload.mentor_id = courseUpdates.mentor_id || null;
    if (courseUpdates.preview_media_id !== undefined) updatePayload.preview_media_id = courseUpdates.preview_media_id || null;
    if (courseUpdates.course_learnings !== undefined) updatePayload.course_learnings = courseUpdates.course_learnings;
    if (courseUpdates.course_includes !== undefined) updatePayload.course_includes = courseUpdates.course_includes;
    if (courseUpdates.status !== undefined) updatePayload.status = courseUpdates.status;
    if (courseUpdates.is_featured !== undefined) updatePayload.is_featured = Boolean(courseUpdates.is_featured);

    const { data, error } = await supabase
      .from('courses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Course, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch list of mentors to assign to courses.
 */
export async function getMentorsList(): Promise<MentorSummary[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'mentor')
      .order('name', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as MentorSummary[];
  } catch {
    return [];
  }
}

export interface Topic {
  id: string;
  topic_name: string;
  created_at?: string;
}

export interface CourseModuleContent {
  id: string;
  course_module_id: string;
  emoji?: string | null;
  content: string;
  is_preview: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  display_order: number;
  is_preview: boolean;
  created_at?: string;
  updated_at?: string;
  contents?: CourseModuleContent[];
}

/**
 * Fetch all topics from topics table.
 */
export async function getAllTopics(): Promise<{ data: Topic[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('id, topic_name, created_at')
      .order('topic_name', { ascending: true });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Quick add a new topic to topics table.
 */
export async function createTopic(topicName: string): Promise<{ data: Topic | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .insert([{ topic_name: topicName.trim() }])
      .select('id, topic_name, created_at')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch assigned topic IDs for a given course.
 */
export async function getCourseTopicIds(courseId: string): Promise<{ data: string[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('course_topics')
      .select('topic_id')
      .eq('course_id', courseId);

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const ids = (data || []).map((row) => row.topic_id);
    return { data: ids, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Save / replace assigned topics for a course.
 */
export async function saveCourseTopics(
  courseId: string,
  topicIds: string[]
): Promise<{ error: Error | null }> {
  try {
    // Remove existing relations for this course
    const { error: deleteError } = await supabase
      .from('course_topics')
      .delete()
      .eq('course_id', courseId);

    if (deleteError) {
      return { error: new Error(deleteError.message) };
    }

    if (topicIds.length === 0) {
      return { error: null };
    }

    // Insert new selected relations
    const rows = topicIds.map((tid) => ({
      course_id: courseId,
      topic_id: tid,
    }));

    const { error: insertError } = await supabase
      .from('course_topics')
      .insert(rows);

    if (insertError) {
      return { error: new Error(insertError.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch course modules and their nested module content.
 */
export async function getCourseModulesWithContent(
  courseId: string
): Promise<{ data: CourseModule[]; error: Error | null }> {
  try {
    const { data: modulesData, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('display_order', { ascending: true });

    if (modulesError) {
      return { data: [], error: new Error(modulesError.message) };
    }

    if (!modulesData || modulesData.length === 0) {
      return { data: [], error: null };
    }

    const moduleIds = modulesData.map((m) => m.id);

    const { data: contentsData, error: contentsError } = await supabase
      .from('course_module_content')
      .select('*')
      .in('course_module_id', moduleIds)
      .order('created_at', { ascending: true });

    if (contentsError) {
      return { data: [], error: new Error(contentsError.message) };
    }

    const contentsByModule: Record<string, CourseModuleContent[]> = {};
    (contentsData || []).forEach((c) => {
      if (!contentsByModule[c.course_module_id]) {
        contentsByModule[c.course_module_id] = [];
      }
      contentsByModule[c.course_module_id].push(c as CourseModuleContent);
    });

    const assembled: CourseModule[] = modulesData.map((m) => ({
      ...m,
      display_order: Number(m.display_order || 0),
      is_preview: Boolean(m.is_preview),
      contents: contentsByModule[m.id] || [],
    }));

    return { data: assembled, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Create a course module and immediately create its module content.
 */
export async function createCourseModuleWithContent(
  courseId: string,
  moduleInput: { title: string; display_order?: number; is_preview?: boolean },
  contentInput?: { emoji?: string; content: string; is_preview?: boolean }
): Promise<{ data: CourseModule | null; error: Error | null }> {
  try {
    // 1. Insert module
    const { data: moduleData, error: moduleError } = await supabase
      .from('course_modules')
      .insert([
        {
          course_id: courseId,
          title: moduleInput.title.trim(),
          display_order: Number(moduleInput.display_order || 0),
          is_preview: Boolean(moduleInput.is_preview),
        },
      ])
      .select()
      .single();

    if (moduleError || !moduleData) {
      return { data: null, error: new Error(moduleError?.message || 'Failed to create module') };
    }

    let createdContent: CourseModuleContent | null = null;

    // 2. Immediately insert content if provided
    if (contentInput && contentInput.content && contentInput.content.trim()) {
      const { data: contentData, error: contentError } = await supabase
        .from('course_module_content')
        .insert([
          {
            course_module_id: moduleData.id,
            emoji: contentInput.emoji?.trim() || null,
            content: contentInput.content.trim(),
            is_preview: Boolean(contentInput.is_preview),
          },
        ])
        .select()
        .single();

      if (!contentError && contentData) {
        createdContent = contentData as CourseModuleContent;
      }
    }

    const fullModule: CourseModule = {
      ...moduleData,
      display_order: Number(moduleData.display_order || 0),
      is_preview: Boolean(moduleData.is_preview),
      contents: createdContent ? [createdContent] : [],
    };

    return { data: fullModule, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Add an additional content item to an existing module.
 */
export async function addCourseModuleContent(
  moduleId: string,
  contentInput: { emoji?: string; content: string; is_preview?: boolean }
): Promise<{ data: CourseModuleContent | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('course_module_content')
      .insert([
        {
          course_module_id: moduleId,
          emoji: contentInput.emoji?.trim() || null,
          content: contentInput.content.trim(),
          is_preview: Boolean(contentInput.is_preview),
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as CourseModuleContent, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Delete a course module.
 */
export async function deleteCourseModule(moduleId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Delete a specific course module content item.
 */
export async function deleteCourseModuleContent(contentId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('course_module_content')
      .delete()
      .eq('id', contentId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

