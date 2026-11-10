import { supabase } from '@/lib/supabase';

export interface ExamSubmissionItem {
  id: string; // exams_conducted.id
  exam_id: string; // course_exams.id
  batch_exam_id?: string | null;
  member_id: string; // batch_learners.id
  points: number;
  correct: number;
  wrong: number;
  submitted: boolean;
  results_released: boolean;
  created_at: string;
  updated_at: string;

  // Learner details (from batch_learners -> users)
  learner_id: string;
  learner_name: string;
  learner_mobile: string;
  learner_email: string;
}

export interface ExamConductedAnswerDetail {
  id: string;
  exam_conducted_id: string;
  question_id: string;
  selected_choice_id?: string | null;
  points: number;
  created_at?: string;

  // Question & choice details
  question_text: string;
  question_description?: string | null;
  question_hint?: string | null;
  correct_choice_id?: string | null;
  correct_choice_text?: string | null;
  selected_choice_text?: string | null;
  is_correct: boolean;

  // All choices for this question
  all_choices: {
    id: string;
    choice: string;
    is_correct: boolean;
    is_selected: boolean;
  }[];
}

export interface FullSubmissionDetail {
  conducted: {
    id: string;
    exam_id: string;
    batch_exam_id?: string | null;
    member_id: string;
    points: number;
    correct: number;
    wrong: number;
    submitted: boolean;
    results_released: boolean;
    created_at: string;
    updated_at: string;
  };
  learner: {
    id: string;
    name: string;
    email: string;
    mobile: string;
  };
  exam: {
    id: string;
    title: string;
    description?: string | null;
    total_q: number;
  };
  answers: ExamConductedAnswerDetail[];
}

/**
 * Fetch total submissions count for a batch exam
 */
export async function getBatchExamSubmissionsCount(
  batchExamId: string,
  examId?: string
): Promise<number> {
  try {
    let query = supabase
      .from('exams_conducted')
      .select('*', { count: 'exact', head: true });

    if (batchExamId) {
      query = query.or(`batch_exam.eq.${batchExamId},exam_id.eq.${examId || batchExamId}`);
    } else if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { count, error } = await query;
    if (error) {
      console.warn('Error counting batch exam submissions:', error.message);
      // Fallback query if batch_exam column doesn't exist yet in Supabase
      if (examId) {
        const fallback = await supabase
          .from('exams_conducted')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', examId);
        return fallback.count ?? 0;
      }
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error('Exception counting batch exam submissions:', err);
    return 0;
  }
}

/**
 * Fetch list of submissions for a batch_exam, enriched with learner profile (name, mobile, email).
 * Supports search query filtering on learner name or mobile.
 */
export async function getBatchExamSubmissions(
  batchExamId: string,
  batchId?: string,
  examId?: string,
  searchQuery?: string
): Promise<{ data: ExamSubmissionItem[]; error: Error | null }> {
  try {
    // 1. Fetch batch_learners for this batch to ensure we map learners correctly
    let batchLearnersQuery = supabase.from('batch_learners').select('*');
    if (batchId) {
      batchLearnersQuery = batchLearnersQuery.eq('batch_id', batchId);
    }
    const { data: batchLearnersData, error: blError } = await batchLearnersQuery;
    if (blError) {
      return { data: [], error: new Error(blError.message) };
    }

    const memberMap = new Map<string, any>();
    const learnerIds: string[] = [];
    (batchLearnersData || []).forEach((bl) => {
      memberMap.set(bl.id, bl);
      if (bl.learner_id) learnerIds.push(bl.learner_id);
    });

    // 2. Fetch user profile for these learners (name, mobile, email)
    const userMap = new Map<string, { name: string; mobile: string; email: string }>();
    if (learnerIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, mobile, email')
        .in('id', Array.from(new Set(learnerIds)));

      (usersData || []).forEach((u) => {
        userMap.set(u.id, {
          name: u.name || 'Unknown Learner',
          mobile: u.mobile || '—',
          email: u.email || '—',
        });
      });
    }

    // 3. Query exams_conducted
    // First try querying with batch_exam, fallback to exam_id and member_id matching
    let conductedRecords: any[] = [];
    const memberIds = Array.from(memberMap.keys());

    let primaryQuery = supabase.from('exams_conducted').select('*');
    if (batchExamId) {
      primaryQuery = primaryQuery.or(`batch_exam.eq.${batchExamId}${examId ? `,exam_id.eq.${examId}` : ''}`);
    } else if (examId) {
      primaryQuery = primaryQuery.eq('exam_id', examId);
    }

    const { data: recData, error: recError } = await primaryQuery.order('created_at', { ascending: false });

    if (recError) {
      console.warn('Primary query error on exams_conducted, trying fallback:', recError.message);
      if (examId) {
        const { data: fallbackData } = await supabase
          .from('exams_conducted')
          .select('*')
          .eq('exam_id', examId)
          .order('created_at', { ascending: false });
        conductedRecords = fallbackData || [];
      }
    } else {
      conductedRecords = recData || [];
    }

    // If batchId was provided, filter conductedRecords to only members of this batch
    if (memberIds.length > 0) {
      conductedRecords = conductedRecords.filter((r) => memberMap.has(r.member_id));
    }

    // 4. Map into ExamSubmissionItem
    const items: ExamSubmissionItem[] = conductedRecords.map((r) => {
      const bl = memberMap.get(r.member_id);
      const user = bl ? userMap.get(bl.learner_id) : undefined;

      return {
        id: r.id,
        exam_id: r.exam_id,
        batch_exam_id: r.batch_exam || batchExamId,
        member_id: r.member_id,
        points: Number(r.points || 0),
        correct: Number(r.correct || 0),
        wrong: Number(r.wrong || 0),
        submitted: Boolean(r.submitted),
        results_released: Boolean(r.results_released),
        created_at: r.created_at,
        updated_at: r.updated_at,
        learner_id: bl?.learner_id || '',
        learner_name: user?.name || 'Unknown Learner',
        learner_mobile: user?.mobile || '—',
        learner_email: user?.email || '—',
      };
    });

    // 5. Apply search filter on learner name or mobile
    let filtered = items;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().toLowerCase();
      filtered = items.filter(
        (sub) =>
          sub.learner_name.toLowerCase().includes(term) ||
          sub.learner_mobile.toLowerCase().includes(term) ||
          sub.learner_email.toLowerCase().includes(term)
      );
    }

    return { data: filtered, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Release results for a batch exam (updates batch_exams.results_release = true and also exams_conducted.results_released = true).
 */
export async function releaseBatchExamResults(
  batchExamId: string
): Promise<{ error: Error | null }> {
  try {
    // 1. Update batch_exams.results_release = true
    const { error: beError } = await supabase
      .from('batch_exams')
      .update({
        results_release: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchExamId);

    if (beError) {
      console.warn('Error updating batch_exams.results_release:', beError.message);
    }

    // 2. Also update exams_conducted rows associated with this batch_exam or exam
    const { error: ecError } = await supabase
      .from('exams_conducted')
      .update({
        results_released: true,
        updated_at: new Date().toISOString(),
      })
      .eq('batch_exam', batchExamId);

    if (ecError) {
      console.warn('Notice updating exams_conducted:', ecError.message);
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch complete submission details (exams_conducted + learner + exam + questions + choices + exam_conducted_answers)
 */
export async function getSubmissionDetail(
  submissionId: string
): Promise<{ data: FullSubmissionDetail | null; error: Error | null }> {
  try {
    // 1. Fetch exams_conducted record
    const { data: conducted, error: conductedError } = await supabase
      .from('exams_conducted')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (conductedError || !conducted) {
      return {
        data: null,
        error: new Error(conductedError?.message || 'Submission record not found'),
      };
    }

    // 2. Fetch learner info via batch_learners -> users
    let learnerInfo = {
      id: '',
      name: 'Unknown Learner',
      email: '—',
      mobile: '—',
    };

    const { data: blData } = await supabase
      .from('batch_learners')
      .select('id, learner_id, batch_id')
      .eq('id', conducted.member_id)
      .single();

    if (blData?.learner_id) {
      learnerInfo.id = blData.learner_id;
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, mobile')
        .eq('id', blData.learner_id)
        .single();

      if (userData) {
        learnerInfo.name = userData.name || 'Unknown Learner';
        learnerInfo.email = userData.email || '—';
        learnerInfo.mobile = userData.mobile || '—';
      }
    }

    // 3. Fetch exam metadata
    let examInfo = {
      id: conducted.exam_id,
      title: 'Course Examination',
      description: null as string | null,
      total_q: 0,
    };

    const { data: examData } = await supabase
      .from('course_exams')
      .select('id, title, description, total_q')
      .eq('id', conducted.exam_id)
      .single();

    if (examData) {
      examInfo.title = examData.title;
      examInfo.description = examData.description;
      examInfo.total_q = examData.total_q;
    }

    // 4. Fetch questions for this exam
    const { data: questionsData } = await supabase
      .from('exam_questions')
      .select('id, question, description, hint, answer')
      .eq('exam_id', conducted.exam_id)
      .order('created_at', { ascending: true });

    const questions = questionsData || [];
    const questionIds = questions.map((q) => q.id);

    // 5. Fetch all choices for these questions
    let choicesByQuestion: Record<string, any[]> = {};
    if (questionIds.length > 0) {
      const { data: choicesData } = await supabase
        .from('exam_q_choices')
        .select('id, question_id, choice')
        .in('question_id', questionIds);

      (choicesData || []).forEach((c) => {
        if (!choicesByQuestion[c.question_id]) {
          choicesByQuestion[c.question_id] = [];
        }
        choicesByQuestion[c.question_id].push(c);
      });
    }

    // 6. Fetch conducted answers for this submission
    const { data: answersData } = await supabase
      .from('exam_conducted_answers')
      .select('*')
      .eq('exam_conducted_id', submissionId);

    const answerMap: Record<string, any> = {};
    (answersData || []).forEach((a) => {
      answerMap[a.question_id] = a;
    });

    // 7. Assemble detailed answers
    const detailedAnswers: ExamConductedAnswerDetail[] = questions.map((q) => {
      const ans = answerMap[q.id];
      const choices = choicesByQuestion[q.id] || [];

      const correctChoice = choices.find((c) => c.id === q.answer);
      const selectedChoice = choices.find((c) => c.id === ans?.selected_choice_id);
      const isCorrect = Boolean(ans && ans.selected_choice_id && ans.selected_choice_id === q.answer);

      return {
        id: ans?.id || q.id,
        exam_conducted_id: submissionId,
        question_id: q.id,
        selected_choice_id: ans?.selected_choice_id || null,
        points: Number(ans?.points || 0),
        created_at: ans?.created_at,
        question_text: q.question,
        question_description: q.description || null,
        question_hint: q.hint || null,
        correct_choice_id: q.answer || null,
        correct_choice_text: correctChoice?.choice || null,
        selected_choice_text: selectedChoice?.choice || null,
        is_correct: isCorrect,
        all_choices: choices.map((c) => ({
          id: c.id,
          choice: c.choice,
          is_correct: c.id === q.answer,
          is_selected: c.id === ans?.selected_choice_id,
        })),
      };
    });

    return {
      data: {
        conducted: {
          id: conducted.id,
          exam_id: conducted.exam_id,
          batch_exam_id: conducted.batch_exam,
          member_id: conducted.member_id,
          points: Number(conducted.points || 0),
          correct: Number(conducted.correct || 0),
          wrong: Number(conducted.wrong || 0),
          submitted: Boolean(conducted.submitted),
          results_released: Boolean(conducted.results_released),
          created_at: conducted.created_at,
          updated_at: conducted.updated_at,
        },
        learner: learnerInfo,
        exam: examInfo,
        answers: detailedAnswers,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
