'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import {
  getSubmissionDetail,
  FullSubmissionDetail,
} from '@/lib/mentor/batchexamsubmissionsStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Calendar,
  User,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

function SubmissionDetailContent({ mentorName }: { mentorName: string }) {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id') || '';
  const batchId = searchParams.get('batch_id') || '';
  const batchExamId = searchParams.get('batch_exam_id') || '';

  const [detail, setDetail] = useState<FullSubmissionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!submissionId) {
        if (!ignore) {
          setErrorMsg('No submission ID provided in URL.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await getSubmissionDetail(submissionId);
        if (!ignore) {
          if (res.data) {
            setDetail(res.data);
          } else if (res.error) {
            setErrorMsg(res.error.message);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load submission details');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [submissionId]);

  const backLink = batchExamId
    ? `/mentor/batches/batchexamsubmissions?batch_exam_id=${batchExamId}&batch_id=${batchId}`
    : batchId
    ? `/mentor/batches/openbatch?id=${batchId}`
    : '/mentor/batches/dashboard';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumbs & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
        <div className="flex items-center gap-3">
          <Link
            href={backLink}
            className="p-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[#D5CDBD] text-[var(--color-text-secondary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
            title="Back to submissions"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-tangerine)]">
              Learner Submission Inspection
            </span>
            <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              {detail?.exam.title || 'Submission Details'}
            </h1>
          </div>
        </div>

        {detail && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                detail.conducted.submitted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {detail.conducted.submitted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Submitted</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Incomplete</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
          <span className="text-sm text-[var(--color-text-muted)]">
            Loading submission and answer details...
          </span>
        </div>
      ) : !detail ? (
        <div className="card p-12 text-center bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)]">
          <FileText className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2 opacity-60" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Submission not found
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards: Learner & Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Learner Card */}
            <div className="card p-4 sm:p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[var(--color-tangerine)]" />
                <h3 className="card-title text-sm font-bold text-[var(--color-text-primary)]">
                  Learner Information
                </h3>
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <div>
                  <span className="text-[var(--color-text-muted)] block text-xs">Name:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {detail.learner.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span className="font-mono">{detail.learner.mobile}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{detail.learner.email}</span>
                </div>
              </div>
            </div>

            {/* Score & Evaluation Card */}
            <div className="card p-4 sm:p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-[var(--color-tangerine)]" />
                <h3 className="card-title text-sm font-bold text-[var(--color-text-primary)]">
                  Exam Result Overview
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]">
                  <span className="text-[11px] text-[var(--color-text-muted)] block">Points</span>
                  <span className="text-lg font-bold font-mono text-[var(--color-tangerine)]">
                    {detail.conducted.points}
                  </span>
                </div>
                <div className="p-2.5 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block">Correct</span>
                  <span className="text-lg font-bold font-mono text-emerald-800">
                    {detail.conducted.correct}
                  </span>
                </div>
                <div className="p-2.5 rounded-[var(--radius-md)] bg-rose-50 border border-rose-200">
                  <span className="text-[11px] text-rose-700 block">Wrong</span>
                  <span className="text-lg font-bold font-mono text-rose-800">
                    {detail.conducted.wrong}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E5DFD3] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>Total Questions: <strong>{detail.exam.total_q}</strong></span>
                <span>Results Released: <strong>{detail.conducted.results_released ? 'Yes' : 'No'}</strong></span>
              </div>
            </div>
          </div>

          {/* Questions & Selected Choices List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Questions & Answers Inspection ({detail.answers.length})
              </h2>
            </div>

            {detail.answers.length === 0 ? (
              <div className="card p-8 text-center bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)]">
                <p className="text-xs text-[var(--color-text-muted)]">
                  No questions or answer records found for this examination.
                </p>
              </div>
            ) : (
              detail.answers.map((ans, idx) => (
                <div
                  key={ans.question_id || idx}
                  className="card p-4 sm:p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-xs space-y-3"
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-soft-orange)]/60 text-[var(--color-tangerine)] text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {ans.question_text}
                        </h4>
                        {ans.question_description && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {ans.question_description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Result Pill */}
                    {ans.is_correct ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Correct</span>
                      </span>
                    ) : ans.selected_choice_id ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Incorrect</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                        <span>Unanswered</span>
                      </span>
                    )}
                  </div>

                  {/* Choices list */}
                  <div className="space-y-1.5 pt-1 pl-8">
                    {ans.all_choices.map((c, cIdx) => {
                      const isCorrectChoice = c.is_correct;
                      const isLearnerSelected = c.is_selected;

                      let rowClasses =
                        'p-2.5 rounded-[var(--radius-md)] border text-xs sm:text-sm flex items-center justify-between gap-2 ';

                      if (isLearnerSelected && isCorrectChoice) {
                        rowClasses += 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium';
                      } else if (isLearnerSelected && !isCorrectChoice) {
                        rowClasses += 'bg-rose-50 border-rose-300 text-rose-900 font-medium';
                      } else if (isCorrectChoice) {
                        rowClasses += 'bg-emerald-50/50 border-emerald-200 text-emerald-800';
                      } else {
                        rowClasses += 'bg-[var(--color-surface)] border-[#E5DFD3] text-[var(--color-text-secondary)]';
                      }

                      return (
                        <div key={c.id || cIdx} className={rowClasses}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[var(--color-text-muted)]">
                              {String.fromCharCode(65 + cIdx)}.
                            </span>
                            <span>{c.choice}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-xs">
                            {isLearnerSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-black/5 text-[11px] font-semibold text-[var(--color-text-primary)]">
                                Learner&apos;s Pick
                              </span>
                            )}
                            {isCorrectChoice && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hint if present */}
                  {ans.question_hint && (
                    <div className="pl-8 pt-1 text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                      <span>Hint: {ans.question_hint}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function SubmissionInspectionPage() {
  const [mentorName, setMentorName] = useState<string>('Mentor Name');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        if (profile?.name) {
          setMentorName(profile.name);
        }
      }
    }
    loadUser();
  }, []);

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
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                <span className="text-sm text-[var(--color-text-muted)]">
                  Loading submission inspection...
                </span>
              </div>
            }
          >
            <SubmissionDetailContent mentorName={mentorName} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
