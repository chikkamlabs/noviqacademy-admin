'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import {
  getBatchExamSubmissions,
  releaseBatchExamResults,
  ExamSubmissionItem,
} from '@/lib/mentor/batchexamsubmissionsStore';
import { getMentorBatchById, MentorBatch } from '@/lib/mentor/batchmanagementStore';
import { getBatchExams, BatchExamItem } from '@/lib/mentor/batchexamsStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Users,
  Award,
  Layers,
  FileText,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';

function MentorBatchExamSubmissionsContent({ mentorName }: { mentorName: string }) {
  const searchParams = useSearchParams();
  const batchExamId = searchParams.get('batch_exam_id') || '';
  const batchId = searchParams.get('batch_id') || '';
  const examId = searchParams.get('exam_id') || '';

  const [batch, setBatch] = useState<MentorBatch | null>(null);
  const [currentExam, setCurrentExam] = useState<BatchExamItem | null>(null);
  const [submissions, setSubmissions] = useState<ExamSubmissionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [releasing, setReleasing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!batchExamId && !batchId) {
        if (!ignore) {
          setErrorMsg('Missing batch exam identifier in URL.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const promises: Promise<any>[] = [];

        if (batchId) {
          promises.push(getMentorBatchById(batchId));
          promises.push(getBatchExams(batchId));
        } else {
          promises.push(Promise.resolve({ data: null, error: null }));
          promises.push(Promise.resolve({ data: null, error: null }));
        }

        promises.push(
          getBatchExamSubmissions(batchExamId, batchId, examId, searchQuery)
        );

        const [batchRes, examsRes, subsRes] = await Promise.all(promises);

        if (!ignore) {
          if (batchRes.data) {
            setBatch(batchRes.data);
          }
          if (examsRes.data) {
            const found = (examsRes.data as BatchExamItem[]).find(
              (e) => e.id === batchExamId || e.exam_id === examId
            );
            if (found) setCurrentExam(found);
          }
          if (subsRes.data) {
            setSubmissions(subsRes.data);
          } else if (subsRes.error) {
            setErrorMsg(subsRes.error.message);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load submissions');
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
  }, [batchExamId, batchId, examId, refreshKey]);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    const res = await getBatchExamSubmissions(batchExamId, batchId, examId, val);
    if (res.data) {
      setSubmissions(res.data);
    }
  };

  const handleReleaseResults = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to release the exam results to learners? Learners will be able to see their scores and answer explanations.'
    );
    if (!confirmed) return;

    setReleasing(true);
    setErrorMsg(null);
    try {
      const res = await releaseBatchExamResults(batchExamId);
      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg('Exam results have been released successfully!');
        if (currentExam) {
          setCurrentExam({ ...currentExam, results_release: true });
        }
        setTimeout(() => setSuccessMsg(null), 3500);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to release results');
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
        <div className="flex items-center gap-3">
          <Link
            href={batchId ? `/mentor/batches/openbatch?id=${batchId}` : '/mentor/batches/dashboard'}
            className="p-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[#D5CDBD] text-[var(--color-text-secondary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
            title="Back to Batch Details"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-tangerine)]">
                Exam Evaluation
              </span>
              {batch && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] font-semibold">
                  {batch.batch_id}
                </span>
              )}
            </div>
            <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              {currentExam?.title || 'Batch Exam Submissions'}
            </h1>
          </div>
        </div>

        {/* Release Results Button / Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {currentExam?.results_release ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Results Released</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleReleaseResults}
              disabled={releasing}
              className="btn btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer shadow-xs disabled:opacity-50"
              title="Release results and scores to learners"
            >
              {releasing ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Releasing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Release Results?</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="p-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[#D5CDBD] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] transition cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'anim-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Control Card: Total Submissions Count & Search Bar */}
      <div className="card px-4 py-3 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Total Submissions Count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]">
            <Users className="w-4 h-4 text-[var(--color-tangerine)]" />
            <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
              Total Submissions:
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--color-tangerine)] font-mono">
              {loading && submissions.length === 0 ? '...' : submissions.length}
            </span>
          </div>
          {currentExam && (
            <span className="text-xs text-[var(--color-text-muted)] hidden md:inline">
              Total Questions: <strong className="text-[var(--color-text-primary)]">{currentExam.total_q}</strong>
            </span>
          )}
        </div>

        {/* Search Bar for Learner Name or Mobile */}
        <div className="relative flex-1 sm:max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by learner name or mobile..."
            className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-14 py-1.5 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Submissions List Table */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
          <div>
            <h2 className="card-title text-base font-bold text-[var(--color-text-primary)]">
              Learner Exam Submissions
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} recorded
            </p>
          </div>
        </div>

        <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
          <table className="table-base w-full">
            <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
              <tr>
                <th className="table-header-cell text-center py-3 px-3 font-semibold text-xs text-[var(--color-text-primary)] w-16">
                  S.No
                </th>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                  Learner Details
                </th>
                <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-32">
                  Points
                </th>
                <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-32">
                  Submitted?
                </th>
                <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-28">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="table-body divide-y divide-[#E5DFD3]">
              {loading && submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                      <span className="text-sm">Loading exam submissions...</span>
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <FileText className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        No submissions recorded yet
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                        {searchQuery
                          ? `No submissions match "${searchQuery}". Try a different name or mobile.`
                          : 'Learners enrolled in this batch have not submitted their attempts for this exam yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                  >
                    {/* S.No */}
                    <td className="table-data-cell py-3.5 px-3 text-center text-xs font-mono font-semibold text-[var(--color-text-muted)]">
                      {idx + 1}
                    </td>

                    {/* Learner Details */}
                    <td className="table-data-cell py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)] block">
                          {sub.learner_name}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
                          <span>Mobile: <strong className="font-mono text-[var(--color-text-secondary)]">{sub.learner_mobile}</strong></span>
                          <span>•</span>
                          <span>{sub.learner_email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Points */}
                    <td className="table-data-cell py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold font-mono bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                        <Award className="w-3 h-3" />
                        {sub.points} pts
                      </span>
                    </td>

                    {/* Submitted? */}
                    <td className="table-data-cell py-3.5 px-4 text-center">
                      {sub.submitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Submitted</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Incomplete</span>
                        </span>
                      )}
                    </td>

                    {/* Action: Open */}
                    <td className="table-data-cell py-3.5 px-4 text-right">
                      <Link
                        href={`/mentor/batches/submission?id=${sub.id}&batch_id=${batchId}&batch_exam_id=${batchExamId}`}
                        className="btn btn-outline inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] border border-[#D5CDBD] hover:bg-[var(--color-soft-cream)] transition cursor-pointer"
                        title="Open attempt answers and details"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MentorBatchExamSubmissionsPage() {
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
                  Loading exam submissions...
                </span>
              </div>
            }
          >
            <MentorBatchExamSubmissionsContent mentorName={mentorName} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
