'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddQuestionModal from '@/components/addquestion';
import {
  createCourseExam,
  QuestionInput,
} from '@/lib/courseexamsStore';
import { getCourses, Course, getCourseById } from '@/lib/coursesStore';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';

function AddExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCourseId = searchParams.get('course_id') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(queryCourseId);
  const [courseInfo, setCourseInfo] = useState<Course | null>(null);

  // Exam Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customTotalQ, setCustomTotalQ] = useState<number | ''>('');

  // Questions in draft
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  // Question Modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  // Loading & error feedback
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        const coursesRes = await getCourses();
        if (!ignore && coursesRes.data) {
          setCourses(coursesRes.data);

          // If query course_id given, pre-select it
          if (queryCourseId) {
            setSelectedCourseId(queryCourseId);
            const found = coursesRes.data.find((c) => c.id === queryCourseId);
            if (found) {
              setCourseInfo(found);
            } else {
              const single = await getCourseById(queryCourseId);
              if (single.data && !ignore) {
                setCourseInfo(single.data);
              }
            }
          } else if (coursesRes.data.length > 0) {
            setSelectedCourseId(coursesRes.data[0].id);
            setCourseInfo(coursesRes.data[0]);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load courses');
        }
      } finally {
        if (!ignore) {
          setPageLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [queryCourseId]);

  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    const found = courses.find((c) => c.id === newCourseId);
    setCourseInfo(found || null);
  };

  const toggleQuestionExpand = (index: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAddQuestionToDraft = (input: QuestionInput) => {
    setQuestions((prev) => {
      const updated = [...prev, input];
      // Automatically expand newly added question
      setExpandedIndices((exp) => ({ ...exp, [updated.length - 1]: true }));
      return updated;
    });
  };

  const handleRemoveQuestionFromDraft = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setExpandedIndices((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const k = Number(key);
        if (k < index) next[k] = prev[k];
        else if (k > index) next[k - 1] = prev[k];
      });
      return next;
    });
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Please enter an exam title.');
      return;
    }

    if (!selectedCourseId) {
      setErrorMsg('Please select a course for this exam.');
      return;
    }

    setLoading(true);
    try {
      const finalTotalQ = typeof customTotalQ === 'number' && customTotalQ >= 0
        ? customTotalQ
        : questions.length;

      const { data, error } = await createCourseExam({
        course_id: selectedCourseId,
        title: trimmedTitle,
        description: description.trim() || undefined,
        total_q: finalTotalQ,
        questions,
      });

      if (error || !data) {
        setErrorMsg(error?.message || 'Failed to create exam.');
        setLoading(false);
        return;
      }

      // Navigate back to course exams page
      router.push(`/admin/courses/exams?course_id=${selectedCourseId}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating exam');
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-12 text-center text-[var(--color-text-muted)]">
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
          <span>Loading course exam setup...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#E5DFD3]">
        <Link
          href={`/admin/courses/exams?course_id=${selectedCourseId || queryCourseId}`}
          className="p-2 rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
          title="Back to Exams"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-tangerine)]">
            Course Examination
          </span>
          <h1 className="page-title text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Add New Exam
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitExam} className="space-y-6">
        {/* Exam Information Card */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] pb-2 border-b border-[#E5DFD3] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-tangerine)]" />
            <span>Exam Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Selector */}
            <div>
              <label
                htmlFor="select_course"
                className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
              >
                Target Course <span className="text-red-500">*</span>
              </label>
              <select
                id="select_course"
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                required
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
              >
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.course_id})
                  </option>
                ))}
              </select>
              {courseInfo && (
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Selected Course ID: <span className="font-mono font-semibold text-[var(--color-tangerine)]">{courseInfo.course_id}</span>
                </p>
              )}
            </div>

            {/* Total Questions (total_q) */}
            <div>
              <label
                htmlFor="exam_total_q"
                className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
              >
                Total Questions (total_q)
              </label>
              <input
                id="exam_total_q"
                type="number"
                min="0"
                value={customTotalQ === '' ? questions.length : customTotalQ}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomTotalQ(val === '' ? '' : parseInt(val, 10));
                }}
                placeholder={String(questions.length)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Defaults automatically to the count of questions added ({questions.length}).
              </p>
            </div>
          </div>

          {/* Exam Title */}
          <div>
            <label
              htmlFor="exam_title"
              className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
            >
              Exam Title <span className="text-red-500">*</span>
            </label>
            <input
              id="exam_title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React & TypeScript Mid-Term Assessment"
              required
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            />
          </div>

          {/* Exam Description */}
          <div>
            <label
              htmlFor="exam_description"
              className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
            >
              Description <span className="text-xs font-normal text-[var(--color-text-muted)]">(optional)</span>
            </label>
            <textarea
              id="exam_description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the coverage, rules, or instructions for this examination..."
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            />
          </div>
        </div>

        {/* Questions Section */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-[var(--color-tangerine)]" />
                <span>Questions ({questions.length})</span>
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Tap any question to expand and inspect its choices and correct answer.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsQuestionModalOpen(true)}
              className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-tangerine)] border-dashed border-[var(--color-tangerine)]/60 hover:bg-[var(--color-soft-orange)]/30 rounded-[var(--radius-md)] cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="py-8 text-center rounded-[var(--radius-md)] border border-dashed border-[#D5CDBD] bg-[var(--color-soft-cream)]/30">
              <FileQuestion className="w-8 h-8 text-[var(--color-text-muted)] mx-auto opacity-50 mb-2" />
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                No questions added yet
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] max-w-xs mx-auto mt-1">
                Click &quot;Add Question&quot; above to add multiple-choice questions with answers and hints.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const isExpanded = !!expandedIndices[idx];
                return (
                  <div
                    key={idx}
                    className="rounded-[var(--radius-md)] border border-[#E5DFD3] bg-[var(--color-surface)] shadow-2xs overflow-hidden transition"
                  >
                    {/* Expandable Question Bar Header */}
                    <div
                      onClick={() => toggleQuestionExpand(idx)}
                      className="p-3.5 bg-[var(--color-soft-cream)]/40 hover:bg-[var(--color-soft-cream)] cursor-pointer flex items-start justify-between gap-3 select-none"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2">
                            {q.question}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--color-text-muted)]">
                            <span>{q.choices.length} choices</span>
                            <span>•</span>
                            <span className="text-[var(--color-tangerine)] font-medium">
                              Answer: Option {String.fromCharCode(65 + q.answerIndex)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveQuestionFromDraft(idx);
                          }}
                          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Question"
                          aria-label={`Delete Question ${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

                    {/* Expanded details: Description, Hint, Choices & Answer */}
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

                        {/* Choices list with answer indicator */}
                        <div>
                          <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1.5">
                            Choices &amp; Correct Answer:
                          </span>
                          <div className="space-y-1.5">
                            {q.choices.map((choice, cIdx) => {
                              const isCorrect = q.answerIndex === cIdx;
                              return (
                                <div
                                  key={cIdx}
                                  className={`flex items-center justify-between gap-2 p-2 rounded-[var(--radius-sm)] text-xs border ${
                                    isCorrect
                                      ? 'border-[var(--color-tangerine)] bg-[var(--color-soft-orange)]/25 font-semibold text-[var(--color-text-primary)]'
                                      : 'border-[#E5DFD3] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 font-mono font-bold text-[var(--color-text-muted)]">
                                      {String.fromCharCode(65 + cIdx)}.
                                    </span>
                                    <span>{choice}</span>
                                  </div>

                                  {isCorrect && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-tangerine)] shrink-0 bg-[var(--color-primary-subtle)] px-2 py-0.5 rounded-[var(--radius-sm)]">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Correct Answer
                                    </span>
                                  )}
                                </div>
                              );
                            })}
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

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/admin/courses/exams?course_id=${selectedCourseId || queryCourseId}`}
            className="btn btn-outline px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] border border-[#D5CDBD] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 anim-spin" />
                <span>Creating Exam...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Save Exam</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Add Question Modal */}
      <AddQuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onQuestionAdded={handleAddQuestionToDraft}
      />
    </div>
  );
}

export default function AddExamPage() {
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
                    <span>Loading exam form...</span>
                  </div>
                </div>
              }
            >
              <AddExamContent />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
