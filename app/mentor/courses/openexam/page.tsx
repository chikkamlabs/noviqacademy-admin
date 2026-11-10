'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import { getExamById, FullCourseExam } from '@/lib/courseexamsStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  ArrowLeft,
  FileQuestion,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function MentorOpenExamContent({ mentorName }: { mentorName: string }) {
  const searchParams = useSearchParams();
  const examId = searchParams.get('exam_id') || searchParams.get('id') || '';
  const courseIdParam = searchParams.get('course_id') || '';
  const batchIdParam = searchParams.get('batch_id') || '';

  const [exam, setExam] = useState<FullCourseExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let ignore = false;

    async function loadExam() {
      if (!examId) {
        if (!ignore) {
          setErrorMsg('No exam ID was specified in URL.');
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await getExamById(examId);
        if (!ignore) {
          if (error || !data) {
            setErrorMsg(error?.message || 'Exam could not be found.');
          } else {
            setExam(data);
            // Expand all questions by default for reading
            const initialExpanded: Record<number, boolean> = {};
            (data.questions || []).forEach((_, idx) => {
              initialExpanded[idx] = true;
            });
            setExpandedIndices(initialExpanded);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load exam');
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

  const backLink = batchIdParam
    ? `/mentor/batches/openbatch?id=${batchIdParam}`
    : courseIdParam || exam?.course_id
    ? `/mentor/courses/exams?course_id=${courseIdParam || exam?.course_id}`
    : '/mentor/courses/dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <MentorHeader
        mentorName={mentorName}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 relative">
        <MentorSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Breadcrumb & Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5DFD3]">
              <Link
                href={backLink}
                className="p-2 rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-tangerine)]">
                    Exam Viewer (Read Only)
                  </span>
                  {exam?.course_title && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-soft-orange)]/40 border border-[#E5DFD3] text-[var(--color-text-primary)]">
                      {exam.course_title}
                    </span>
                  )}
                </div>
                <h1 className="page-title text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  {exam?.title || 'Exam Details'}
                </h1>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-[var(--color-text-muted)]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                  <span>Loading exam details...</span>
                </div>
              </div>
            ) : !exam ? (
              <div className="card p-8 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Unable to load exam
                </p>
                <Link
                  href={backLink}
                  className="btn btn-outline inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-[var(--radius-md)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return</span>
                </Link>
              </div>
            ) : (
              <>
                {/* General Information Card (Read Only) */}
                <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD3]">
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[var(--color-tangerine)]" />
                      <span>Exam Overview</span>
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-mono font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                      Total Questions: {exam.total_q}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                        Title
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
                        {exam.title}
                      </p>
                    </div>

                    {exam.description && (
                      <div>
                        <span className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">
                          Description
                        </span>
                        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)]/50 border border-[#E5DFD3] text-xs sm:text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                          {exam.description}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-[var(--color-text-muted)] border-t border-[#E5DFD3]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                        Created: {exam.created_at ? new Date(exam.created_at).toLocaleString() : 'N/A'}
                      </span>
                      {exam.updated_at && (
                        <span>Updated: {new Date(exam.updated_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Questions & Choices Section (Read Only) */}
                <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
                    <div>
                      <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-[var(--color-tangerine)]" />
                        <span>Questions &amp; Choices ({exam.questions?.length || 0})</span>
                      </h2>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Inspection view of all multiple choice questions and verified answers.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allOpen: Record<number, boolean> = {};
                          (exam.questions || []).forEach((_, idx) => {
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

                  {!exam.questions || exam.questions.length === 0 ? (
                    <div className="py-8 text-center rounded-[var(--radius-md)] border border-dashed border-[#D5CDBD] bg-[var(--color-soft-cream)]/30">
                      <FileQuestion className="w-8 h-8 text-[var(--color-text-muted)] mx-auto opacity-50 mb-2" />
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                        No questions registered in this exam
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exam.questions.map((q, idx) => {
                        const isExpanded = !!expandedIndices[idx];
                        const choices = q.choices || [];
                        const correctChoice = choices.find((c) => c.id === q.answer);

                        return (
                          <div
                            key={q.id}
                            className="rounded-[var(--radius-md)] border border-[#E5DFD3] bg-[var(--color-surface)] shadow-2xs overflow-hidden transition"
                          >
                            {/* Question Header Bar */}
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

                              <div className="p-1 text-[var(--color-text-muted)] shrink-0">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>

                            {/* Question Expanded Details */}
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

                                <div>
                                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1.5">
                                    Choices &amp; Verified Answer:
                                  </span>
                                  <div className="space-y-1.5">
                                    {choices.length === 0 ? (
                                      <span className="text-xs text-[var(--color-text-muted)] italic">
                                        No choices registered.
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function MentorOpenExamPage() {
  const [mentorName, setMentorName] = useState('Mentor Name');

  useEffect(() => {
    async function loadMentor() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile?.name) {
            setMentorName(profile.name);
          }
        }
      } catch (err) {
        console.error('Failed to load mentor name:', err);
      }
    }
    loadMentor();
  }, []);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
            <span className="text-sm text-[var(--color-text-muted)]">Loading exam viewer...</span>
          </div>
        </div>
      }
    >
      <MentorOpenExamContent mentorName={mentorName} />
    </Suspense>
  );
}
