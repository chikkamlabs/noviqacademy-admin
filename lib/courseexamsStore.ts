import { supabase } from '@/lib/supabase';

export interface ExamChoice {
  id: string;
  question_id: string;
  choice: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question: string;
  description?: string | null;
  hint?: string | null;
  answer?: string | null; // UUID of chosen exam_q_choices
  created_at?: string;
  updated_at?: string;
  choices?: ExamChoice[];
}

export interface CourseExam {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  total_q: number;
  created_at?: string;
  updated_at?: string;
}

export interface FullCourseExam extends CourseExam {
  course_title?: string;
  questions?: ExamQuestion[];
}

export interface QuestionInput {
  question: string;
  description?: string;
  hint?: string;
  choices: string[];
  answerIndex: number; // 0-based index of which choice in choices is correct
}

export interface CreateExamInput {
  course_id: string;
  title: string;
  description?: string;
  total_q?: number;
  questions?: QuestionInput[];
}

/**
 * Fetch total count of exams for a given course (or overall if no courseId provided).
 */
export async function getCourseExamsCount(courseId?: string): Promise<number> {
  try {
    let query = supabase
      .from('course_exams')
      .select('*', { count: 'exact', head: true });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { count, error } = await query;
    if (error) {
      console.error('Error fetching course exams count:', error);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error('Error in getCourseExamsCount:', err);
    return 0;
  }
}

/**
 * Fetch all exams for a specific course (or all courses).
 */
export async function getCourseExams(
  courseId?: string
): Promise<{ data: CourseExam[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('course_exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;
    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as CourseExam[]) || [], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch a single course exam along with all its questions and their choices.
 */
export async function getExamById(
  examId: string
): Promise<{ data: FullCourseExam | null; error: Error | null }> {
  try {
    // 1. Fetch exam
    const { data: examData, error: examError } = await supabase
      .from('course_exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (examError || !examData) {
      return {
        data: null,
        error: examError ? new Error(examError.message) : new Error('Exam not found'),
      };
    }

    // 2. Fetch course title for breadcrumb/context
    let courseTitle = '';
    if (examData.course_id) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', examData.course_id)
        .single();
      if (courseData?.title) {
        courseTitle = courseData.title;
      }
    }

    // 3. Fetch questions for this exam
    const { data: questionsData, error: qError } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });

    if (qError) {
      return {
        data: {
          ...examData,
          course_title: courseTitle,
          questions: [],
        },
        error: null,
      };
    }

    const questionList: ExamQuestion[] = (questionsData as ExamQuestion[]) || [];

    if (questionList.length === 0) {
      return {
        data: {
          ...examData,
          course_title: courseTitle,
          questions: [],
        },
        error: null,
      };
    }

    // 4. Fetch choices for all these questions
    const questionIds = questionList.map((q) => q.id);
    const { data: choicesData } = await supabase
      .from('exam_q_choices')
      .select('*')
      .in('question_id', questionIds)
      .order('created_at', { ascending: true });

    const choicesByQuestion: Record<string, ExamChoice[]> = {};
    (choicesData || []).forEach((c: ExamChoice) => {
      if (!choicesByQuestion[c.question_id]) {
        choicesByQuestion[c.question_id] = [];
      }
      choicesByQuestion[c.question_id].push(c);
    });

    const populatedQuestions = questionList.map((q) => ({
      ...q,
      choices: choicesByQuestion[q.id] || [],
    }));

    return {
      data: {
        ...examData,
        course_title: courseTitle,
        questions: populatedQuestions,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Add a single question with choices and correct answer to an existing exam.
 */
export async function addQuestionToExam(
  examId: string,
  input: QuestionInput
): Promise<{ data: ExamQuestion | null; error: Error | null }> {
  try {
    const qText = input.question.trim();
    if (!qText) {
      return { data: null, error: new Error('Question text is required.') };
    }

    const validChoices = input.choices.map((c) => c.trim()).filter(Boolean);
    if (validChoices.length < 2) {
      return { data: null, error: new Error('At least 2 choices are required.') };
    }

    if (input.answerIndex < 0 || input.answerIndex >= validChoices.length) {
      return { data: null, error: new Error('Please select a valid correct answer choice.') };
    }

    // 1. Insert question (initially answer = null)
    const { data: questionData, error: qError } = await supabase
      .from('exam_questions')
      .insert({
        exam_id: examId,
        question: qText,
        description: input.description?.trim() || null,
        hint: input.hint?.trim() || null,
        answer: null,
      })
      .select()
      .single();

    if (qError || !questionData) {
      return { data: null, error: new Error(qError?.message || 'Failed to insert question.') };
    }

    const questionId = questionData.id;

    // 2. Insert choices for this question
    const choicesToInsert = validChoices.map((choice) => ({
      question_id: questionId,
      choice,
    }));

    const { data: insertedChoices, error: choicesError } = await supabase
      .from('exam_q_choices')
      .insert(choicesToInsert)
      .select();

    if (choicesError || !insertedChoices || insertedChoices.length === 0) {
      return {
        data: null,
        error: new Error(choicesError?.message || 'Failed to insert choices for question.'),
      };
    }

    // 3. Link the correct answer choice
    const chosenAnswer = insertedChoices[input.answerIndex];
    if (chosenAnswer?.id) {
      await supabase
        .from('exam_questions')
        .update({ answer: chosenAnswer.id, updated_at: new Date().toISOString() })
        .eq('id', questionId);
      questionData.answer = chosenAnswer.id;
    }

    // 4. Update total_q on course_exams
    const { count: currentTotal } = await supabase
      .from('exam_questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId);

    if (currentTotal !== null && currentTotal !== undefined) {
      await supabase
        .from('course_exams')
        .update({ total_q: currentTotal, updated_at: new Date().toISOString() })
        .eq('id', examId);
    }

    return {
      data: {
        ...questionData,
        choices: insertedChoices as ExamChoice[],
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Create a new exam in course_exams table and optionally insert questions.
 */
export async function createCourseExam(
  input: CreateExamInput
): Promise<{ data: CourseExam | null; error: Error | null }> {
  try {
    const title = input.title.trim();
    if (!title) {
      return { data: null, error: new Error('Exam title is required.') };
    }

    if (!input.course_id) {
      return { data: null, error: new Error('Course ID is required.') };
    }

    const questions = input.questions || [];
    const totalQ = typeof input.total_q === 'number' && input.total_q >= 0
      ? input.total_q
      : questions.length;

    // 1. Insert course_exam
    const { data: examData, error: examError } = await supabase
      .from('course_exams')
      .insert({
        course_id: input.course_id,
        title,
        description: input.description?.trim() || null,
        total_q: totalQ,
      })
      .select()
      .single();

    if (examError || !examData) {
      return { data: null, error: new Error(examError?.message || 'Failed to create exam.') };
    }

    // 2. Insert any initially provided questions
    for (const q of questions) {
      await addQuestionToExam(examData.id, q);
    }

    // Re-sync final total_q
    if (questions.length > 0) {
      const { count } = await supabase
        .from('exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examData.id);

      if (count !== null && count !== undefined) {
        await supabase
          .from('course_exams')
          .update({ total_q: count, updated_at: new Date().toISOString() })
          .eq('id', examData.id);
        examData.total_q = count;
      }
    }

    return { data: examData as CourseExam, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update exam details (title, description, total_q).
 */
export async function updateCourseExam(
  examId: string,
  updates: { title?: string; description?: string | null; total_q?: number }
): Promise<{ data: CourseExam | null; error: Error | null }> {
  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) {
      payload.title = updates.title.trim();
    }
    if (updates.description !== undefined) {
      payload.description = updates.description?.trim() || null;
    }
    if (updates.total_q !== undefined) {
      payload.total_q = updates.total_q;
    }

    const { data, error } = await supabase
      .from('course_exams')
      .update(payload)
      .eq('id', examId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as CourseExam, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Delete a question from an exam and update total_q count.
 */
export async function deleteQuestionFromExam(
  questionId: string,
  examId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('exam_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      return { error: new Error(error.message) };
    }

    // Update total_q count
    const { count } = await supabase
      .from('exam_questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId);

    if (count !== null && count !== undefined) {
      await supabase
        .from('course_exams')
        .update({ total_q: count, updated_at: new Date().toISOString() })
        .eq('id', examId);
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Delete an entire exam (cascades to questions and choices).
 */
export async function deleteCourseExam(
  examId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('course_exams')
      .delete()
      .eq('id', examId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface UpdateChoiceInput {
  id?: string;
  choice: string;
}

export interface UpdateQuestionInput {
  question: string;
  description?: string | null;
  hint?: string | null;
  choices: UpdateChoiceInput[];
  answerIndex: number;
}

/**
 * Update an existing question, its choices (update existing / insert new / remove deleted),
 * and its correct answer choice reference.
 */
export async function updateQuestionInExam(
  questionId: string,
  input: UpdateQuestionInput
): Promise<{ data: ExamQuestion | null; error: Error | null }> {
  try {
    const qText = input.question.trim();
    if (!qText) {
      return { data: null, error: new Error('Question text is required.') };
    }

    const cleanedChoices = input.choices.map((c) => ({
      id: c.id,
      choice: c.choice.trim(),
    }));

    if (cleanedChoices.some((c) => !c.choice)) {
      return { data: null, error: new Error('All choice fields must be filled in.') };
    }

    if (cleanedChoices.length < 2) {
      return { data: null, error: new Error('At least 2 choices are required.') };
    }

    if (input.answerIndex < 0 || input.answerIndex >= cleanedChoices.length) {
      return { data: null, error: new Error('Please select a valid correct answer choice.') };
    }

    // 1. Fetch existing choices for this question
    const { data: existingChoicesData, error: fetchChoicesError } = await supabase
      .from('exam_q_choices')
      .select('id')
      .eq('question_id', questionId);

    if (fetchChoicesError) {
      return { data: null, error: new Error(fetchChoicesError.message) };
    }

    const existingIds = (existingChoicesData || []).map((c) => c.id as string);
    const keptIds = new Set<string>();
    const finalChoices: ExamChoice[] = [];
    const now = new Date().toISOString();

    // 2. Update kept choices and insert newly added choices in order
    for (const c of cleanedChoices) {
      if (c.id && existingIds.includes(c.id)) {
        keptIds.add(c.id);
        const { data: updatedChoice, error: updateChoiceErr } = await supabase
          .from('exam_q_choices')
          .update({ choice: c.choice, updated_at: now })
          .eq('id', c.id)
          .select()
          .single();

        if (updateChoiceErr || !updatedChoice) {
          return {
            data: null,
            error: new Error(updateChoiceErr?.message || 'Failed to update choice.'),
          };
        }
        finalChoices.push(updatedChoice as ExamChoice);
      } else {
        const { data: insertedChoice, error: insertChoiceErr } = await supabase
          .from('exam_q_choices')
          .insert({ question_id: questionId, choice: c.choice })
          .select()
          .single();

        if (insertChoiceErr || !insertedChoice) {
          return {
            data: null,
            error: new Error(insertChoiceErr?.message || 'Failed to add new choice.'),
          };
        }
        finalChoices.push(insertedChoice as ExamChoice);
      }
    }

    const correctChoiceId = finalChoices[input.answerIndex]?.id || null;

    // 3. Update question fields and correct answer
    const { data: updatedQuestion, error: updateQErr } = await supabase
      .from('exam_questions')
      .update({
        question: qText,
        description: input.description?.trim() || null,
        hint: input.hint?.trim() || null,
        answer: correctChoiceId,
        updated_at: now,
      })
      .eq('id', questionId)
      .select()
      .single();

    if (updateQErr || !updatedQuestion) {
      return {
        data: null,
        error: new Error(updateQErr?.message || 'Failed to update question.'),
      };
    }

    // 4. Delete choices that were removed
    const removedIds = existingIds.filter((id) => !keptIds.has(id));
    if (removedIds.length > 0) {
      const { error: deleteChoiceErr } = await supabase
        .from('exam_q_choices')
        .delete()
        .in('id', removedIds);

      if (deleteChoiceErr) {
        return { data: null, error: new Error(deleteChoiceErr.message) };
      }
    }

    return {
      data: {
        ...(updatedQuestion as ExamQuestion),
        choices: finalChoices,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

