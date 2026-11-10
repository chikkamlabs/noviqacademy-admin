import { supabase } from '@/lib/supabase';

export interface BatchExamItem {
  id: string; // batch_exams.id
  batch_id: string;
  exam_id: string;
  status: boolean;
  conduct: boolean;
  results_release: boolean;
  start_time?: string | null;
  duration?: number | null;
  end_time?: string | null;
  created_at?: string;
  updated_at?: string;
  title: string;
  total_q: number;
  description?: string | null;
}

export interface AvailableCourseExam {
  id: string;
  course_id: string;
  title: string;
  total_q: number;
  description?: string | null;
}

/**
 * Fetch total count of exams assigned to a batch.
 */
export async function getBatchExamsCount(batchId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('batch_exams')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batchId);

    if (error) {
      console.error('Error fetching batch exams count:', error);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error('Error in getBatchExamsCount:', err);
    return 0;
  }
}

/**
 * Fetch all batch exams for a specific batch, joined with course exam information.
 */
export async function getBatchExams(
  batchId: string
): Promise<{ data: BatchExamItem[] | null; error: Error | null }> {
  try {
    // 1. Fetch batch_exams rows
    const { data: batchExamsData, error: beError } = await supabase
      .from('batch_exams')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (beError) {
      return { data: null, error: new Error(beError.message) };
    }

    if (!batchExamsData || batchExamsData.length === 0) {
      return { data: [], error: null };
    }

    // 2. Fetch associated course_exams details
    const examIds = batchExamsData.map((be) => be.exam_id);
    const { data: courseExamsData, error: ceError } = await supabase
      .from('course_exams')
      .select('id, title, total_q, description')
      .in('id', examIds);

    if (ceError) {
      console.warn('Error fetching course exams for batch exams:', ceError.message);
    }

    const courseExamMap: Record<string, { title: string; total_q: number; description?: string | null }> = {};
    (courseExamsData || []).forEach((ce) => {
      courseExamMap[ce.id] = {
        title: ce.title,
        total_q: ce.total_q ?? 0,
        description: ce.description,
      };
    });

    const items: BatchExamItem[] = batchExamsData.map((row) => ({
      id: row.id,
      batch_id: row.batch_id,
      exam_id: row.exam_id,
      status: typeof row.status === 'boolean' ? row.status : true,
      conduct: typeof row.conduct === 'boolean' ? row.conduct : false,
      results_release: typeof row.results_release === 'boolean' ? row.results_release : false,
      start_time: row.start_time || null,
      duration: typeof row.duration === 'number' ? row.duration : 0,
      end_time: row.end_time || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      title: courseExamMap[row.exam_id]?.title || 'Untitled Exam',
      total_q: courseExamMap[row.exam_id]?.total_q ?? 0,
      description: courseExamMap[row.exam_id]?.description || null,
    }));

    return { data: items, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch course exams for this batch's course that are NOT yet added to this batch.
 */
export async function getAvailableCourseExamsForBatch(
  batchId: string,
  courseId: string
): Promise<{ data: AvailableCourseExam[] | null; error: Error | null }> {
  try {
    // 1. Fetch already assigned exam IDs in batch_exams
    const { data: assignedRows, error: assignedError } = await supabase
      .from('batch_exams')
      .select('exam_id')
      .eq('batch_id', batchId);

    if (assignedError) {
      return { data: null, error: new Error(assignedError.message) };
    }

    const assignedIds = new Set((assignedRows || []).map((r) => r.exam_id));

    // 2. Fetch all exams for this course
    const { data: allCourseExams, error: courseExamsError } = await supabase
      .from('course_exams')
      .select('id, course_id, title, total_q, description')
      .eq('course_id', courseId)
      .order('title', { ascending: true });

    if (courseExamsError) {
      return { data: null, error: new Error(courseExamsError.message) };
    }

    // 3. Filter out assigned exams
    const available = (allCourseExams || []).filter((ce) => !assignedIds.has(ce.id));

    return { data: available, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface AddBatchExamInput {
  batch_id: string;
  exam_id: string;
  status?: boolean;
  conduct?: boolean;
  start_time?: string | null;
  duration?: number | null;
  end_time?: string | null;
}

/**
 * Add a course exam to batch_exams.
 */
export async function addBatchExam(
  input: AddBatchExamInput
): Promise<{ data: BatchExamItem | null; error: Error | null }> {
  try {
    const statusVal = typeof input.status === 'boolean' ? input.status : true;
    const conductVal = typeof input.conduct === 'boolean' ? input.conduct : false;

    const { data, error } = await supabase
      .from('batch_exams')
      .insert({
        batch_id: input.batch_id,
        exam_id: input.exam_id,
        status: statusVal,
        conduct: conductVal,
        start_time: input.start_time || null,
        duration: typeof input.duration === 'number' ? input.duration : 0,
        end_time: input.end_time || null,
      })
      .select()
      .single();

    if (error || !data) {
      return { data: null, error: new Error(error?.message || 'Failed to add batch exam.') };
    }

    // Get exam title and total_q
    const { data: examData } = await supabase
      .from('course_exams')
      .select('title, total_q, description')
      .eq('id', input.exam_id)
      .single();

    const result: BatchExamItem = {
      id: data.id,
      batch_id: data.batch_id,
      exam_id: data.exam_id,
      status: typeof data.status === 'boolean' ? data.status : true,
      conduct: typeof data.conduct === 'boolean' ? data.conduct : false,
      results_release: typeof data.results_release === 'boolean' ? data.results_release : false,
      start_time: data.start_time || null,
      duration: typeof data.duration === 'number' ? data.duration : 0,
      end_time: data.end_time || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      title: examData?.title || 'Exam',
      total_q: examData?.total_q ?? 0,
      description: examData?.description || null,
    };

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Toggle or update the status of a batch_exam.
 */
export async function updateBatchExamStatus(
  batchExamId: string,
  newStatus: boolean
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('batch_exams')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchExamId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update the conduct flag of a batch_exam.
 */
export async function updateBatchExamConduct(
  batchExamId: string,
  conduct: boolean
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('batch_exams')
      .update({
        conduct,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchExamId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Remove an exam from a batch.
 */
export async function deleteBatchExam(
  batchExamId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('batch_exams')
      .delete()
      .eq('id', batchExamId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
