'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddQuestionModal from '@/components/addquestion';
import {
  getExamById,
  updateCourseExam,
  deleteQuestionFromExam,
  FullCourseExam,
  ExamQuestion,
} from '@/lib/courseexamsStore';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileQuestion,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Calendar,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function OpenExamContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('exam_id') || searchParams.get('id') || '';
  const courseIdParam = searchParams.get('course_id') || '';

  const [exam, setExam] = useState<FullCourseExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalQ, setTotalQ] = useState<number>(0);
  const [savingDetails, setSavingDetails] = useState(false);

  // Questions expandable tracking
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  // Add Question modal
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadExam() {
      if (!examId) {
        if (!ignore) {
          setErrorMsg('No exam ID specified in URL.');
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await getExamById(examId);
        if (!ignore) {
          if (error || !data) {
            setErrorMsg(error?.message || 'Exam not found');
          } else {
            setExam(data);
            setTitle(data.title || '');
            setDescription(data.description || '');
            setTotalQ(data.total_q ?? 0);

            // Expand all questions by default for easy review
            const initialExpanded: Record<number, boolean> = {};
            (data.questions || []).forEach((_, idx) => {
              initialExpanded[idx] = true;
            });
            setExpandedIndices(initialExpanded);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load exam details');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadExam();

    return () => {
      ignore = true;
    };
  }, [examId]);

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Exam title cannot be empty.');
      return;
    }

    setSavingDetails(true);
    try {
      const { data, error } = await updateCourseExam(examId, {
        title: trimmedTitle,
        description: description.trim() || null,
        total_q: totalQ,
      });

      if (error || !data) {
        setErrorMsg(error?.message || 'Failed to update exam details.');
      } else {
        setExam((prev) => (prev ? { ...prev, ...data } : null));
        setSuccessMsg('Exam details updated successfully.');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error updating exam');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string, qIndex: number) => {
    if (!examId) return;
    if (!window.confirm(`Are you sure you want to delete Question ${qIndex + 1}?`)) {
      return;
    }

    setDeletingQuestionId(questionId);
    try {
      const { error } = await deleteQuestionFromExam(questionId, examId);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setExam((prev) => {
          if (!prev) return null;
          const updatedQ = (prev.questions || []).filter((q) => q.id !== questionId);
          return {
            ...prev,
            questions: updatedQ,
            total_q: updatedQ.length,
          };
        });
        setTotalQ((prev) => Math.max(0, prev - 1));
        setSuccessMsg(`Question ${qIndex + 1} deleted.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const handleQuestionAdded = (_: unknown, savedQuestion?: ExamQuestion) => {
    if (savedQuestion) {
      setExam((prev) => {
        if (!prev) return null;
        const currentQuestions = prev.questions || [];
        const nextList = [...currentQuestions, savedQuestion];
        return {
          ...prev,
          questions: nextList,
          total_q: nextList.length,
        };
      });
      setTotalQ((prev) => prev + 1);
      setExpandedIndices((prev) => {
        const nextIdx = (exam?.questions || []).length;
        return { ...prev, [nextIdx]: true };
      });
      setSuccessMsg('New question added successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const backLink = courseIdParam || exam?.course_id
    ? `/admin/courses/exams?course_id=${courseIdParam || exam?.course_id}`
    : '/admin/courses/dashboard';

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--color-text-muted)]">
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
          <span>Loading exam information...</span>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="card p-8 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Exam Not Found</h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          {errorMsg || 'The requested exam could not be loaded.'}
        </p>
        <Link
          href={backLink}
          className="btn btn-outline inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Exams List</span>
        </Link>
      </div>
    );
  }

  const questionsList = exam.questions || [];

  return (
    <div className="space-y-6">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
        <div className="flex items-center gap-3">
          <Link
            href={backLink}
            className="p-2 rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
            title="Back to Exams"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-tangerine)]">
                Exam Details
              </span>
              {exam.course_title && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-soft-orange)]/40 border border-[#E5DFD3] text-[var(--color-text-primary)]">
                  {exam.course_title}
                </span>
              )}
            </div>
            <h1 className="page-title text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              {exam.title}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddQuestionOpen(true)}
          className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Exam Details Section (editable) */}
      <form
        onSubmit={handleSaveDetails}
        className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD3]">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-tangerine)]" />
            <span>General Information</span>
          </h2>

          <button
            type="submit"
            disabled={savingDetails}
            className="btn btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer disabled:opacity-50"
          >
            {savingDetails ? (
              <Loader2 className="w-3.5 h-3.5 anim-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Details</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label
              htmlFor="open_exam_title"
              className="block text-xs font-semibold text-[var(--color-text-primary)]"
            >
              Exam Title <span className="text-red-500">*</span>
            </label>
            <input
              id="open_exam_title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="open_exam_total_q"
              className="block text-xs font-semibold text-[var(--color-text-primary)]"
            >
              Total Questions (total_q)
            </label>
            <input
              id="open_exam_total_q"
              type="number"
              min="0"
              value={totalQ}
              onChange={(e) => setTotalQ(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="open_exam_desc"
            className="block text-xs font-semibold text-[var(--color-text-primary)]"
          >
            Description
          </label>
          <textarea
            id="open_exam_desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Exam instructions or syllabus..."
            className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-[var(--color-text-muted)] border-t border-[#E5DFD3]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
            Created:{' '}
            {exam.created_at ? new Date(exam.created_at).toLocaleString() : 'N/A'}
          </span>
          {exam.updated_at && (
            <span>
              Updated: {new Date(exam.updated_at).toLocaleString()}
            </span>
          )}
        </div>
      </form>

      {/* Questions & Choices Section (Display in order of add exam) */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-[var(--color-tangerine)]" />
              <span>Questions &amp; Choices ({questionsList.length})</span>
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              All questions, multiple choices, and verified answers displayed in order.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const allOpen: Record<number, boolean> = {};
                questionsList.forEach((_, idx) => {
                  allOpen[idx] = true;
                });
                setExpandedIndices(allOpen);
              }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-[var(--color-text-muted)]">•</span>
            <button
              type="button"
              onClick={() => setExpandedIndices({})}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {questionsList.length === 0 ? (
          <div className="py-8 text-center rounded-[var(--radius-md)] border border-dashed border-[#D5CDBD] bg-[var(--color-soft-cream)]/30">
            <FileQuestion className="w-8 h-8 text-[var(--color-text-muted)] mx-auto opacity-50 mb-2" />
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">
              No questions found for this exam
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] max-w-xs mx-auto mt-1">
              Add questions to complete this exam syllabus.
            </p>
            <button
              type="button"
              onClick={() => setIsAddQuestionOpen(true)}
              className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] mt-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Question</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {questionsList.map((q, idx) => {
              const isExpanded = !!expandedIndices[idx];
              const choices = q.choices || [];
              const correctChoice = choices.find((c) => c.id === q.answer);

              return (
                <div
                  key={q.id}
                  className="rounded-[var(--radius-md)] border border-[#E5DFD3] bg-[var(--color-surface)] shadow-2xs overflow-hidden transition"
                >
                  {/* Question Bar Header */}
                  <div
                    onClick={() => toggleExpand(idx)}
                    className="p-3.5 bg-[var(--color-soft-cream)]/40 hover:bg-[var(--color-soft-cream)] cursor-pointer flex items-start justify-between gap-3 select-none"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                          {q.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--color-text-muted)]">
                          <span>{choices.length} choices</span>
                          {correctChoice && (
                            <>
                              <span>•</span>
                              <span className="text-[var(--color-tangerine)] font-medium">
                                Answer: &quot;{correctChoice.choice}&quot;
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(q.id, idx);
                        }}
                        disabled={deletingQuestionId === q.id}
                        className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                        title="Delete Question"
                        aria-label={`Delete Question ${idx + 1}`}
                      >
                        {deletingQuestionId === q.id ? (
                          <Loader2 className="w-3.5 h-3.5 anim-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="p-1 text-[var(--color-text-muted)]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded view */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#E5DFD3] bg-[var(--color-surface)] space-y-3">
                      {q.description && (
                        <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-soft-cream)]/50 border border-[#E5DFD3] text-xs text-[var(--color-text-secondary)]">
                          <span className="font-semibold block mb-0.5 text-[var(--color-text-primary)]">
                            Description / Context:
                          </span>
                          {q.description}
                        </div>
                      )}

                      {q.hint && (
                        <div className="flex items-start gap-1.5 text-xs text-[var(--color-tangerine)] bg-[var(--color-soft-orange)]/20 p-2 rounded-[var(--radius-sm)] border border-[var(--color-tangerine)]/20">
                          <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold">Hint:</strong> {q.hint}
                          </span>
                        </div>
                      )}

                      {/* Choices list */}
                      <div>
                        <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1.5">
                          Choices (exam_q_choices) &amp; Verified Answer:
                        </span>
                        <div className="space-y-1.5">
                          {choices.length === 0 ? (
                            <span className="text-xs text-[var(--color-text-muted)] italic">
                              No choices registered for this question.
                            </span>
                          ) : (
                            choices.map((choice, cIdx) => {
                              const isCorrect = choice.id === q.answer;
                              return (
                                <div
                                  key={choice.id}
                                  className={`flex items-center justify-between gap-2 p-2.5 rounded-[var(--radius-sm)] text-xs border ${
                                    isCorrect
                                      ? 'border-[var(--color-tangerine)] bg-[var(--color-soft-orange)]/25 font-semibold text-[var(--color-text-primary)]'
                                      : 'border-[#E5DFD3] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 font-mono font-bold text-[var(--color-text-muted)]">
                                      {String.fromCharCode(65 + cIdx)}.
                                    </span>
                                    <span>{choice.choice}</span>
                                  </div>

                                  {isCorrect && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-tangerine)] shrink-0 bg-[var(--color-primary-subtle)] px-2 py-0.5 rounded-[var(--radius-sm)]">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Correct Answer
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
        examId={examId}
        onQuestionAdded={handleQuestionAdded}
      />
    </div>
  );
}

export default function OpenExamPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <Suspense
              fallback={
                <div className="p-12 text-center text-[var(--color-text-muted)]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                    <span>Loading exam workspace...</span>
                  </div>
                </div>
              }
            >
              <OpenExamContent />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
