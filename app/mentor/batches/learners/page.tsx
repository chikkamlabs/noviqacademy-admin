'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import {
  getMentorBatchById,
  getMentorBatchLearners,
  getMentorBatchLearnersCount,
  MentorBatch,
  MentorBatchLearner,
} from '@/lib/mentor/batchmanagementStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  Users,
  Search,
  ArrowLeft,
  Loader2,
  Award,
  CalendarCheck,
  Phone,
  User as UserIcon,
  Layers,
} from 'lucide-react';

function MentorBatchLearnersContent({ mentorName }: { mentorName: string }) {
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batch_id') || searchParams.get('id') || '';

  const [batch, setBatch] = useState<MentorBatch | null>(null);
  const [learners, setLearners] = useState<MentorBatchLearner[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!batchId) {
        await Promise.resolve();
        if (!ignore) {
          setErrorMsg('No batch ID was specified in the URL.');
          setLoading(false);
        }
        return;
      }

      try {
        const [batchRes, count, learnersRes] = await Promise.all([
          getMentorBatchById(batchId),
          getMentorBatchLearnersCount(batchId),
          getMentorBatchLearners(batchId),
        ]);

        if (!ignore) {
          if (batchRes.data) {
            setBatch(batchRes.data);
          } else if (batchRes.error) {
            setErrorMsg(batchRes.error.message);
          }

          setTotalCount(count);

          if (learnersRes.data) {
            setLearners(learnersRes.data);
          } else if (learnersRes.error) {
            setErrorMsg(learnersRes.error.message);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load learners');
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
  }, [batchId]);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!batchId) return;
    const res = await getMentorBatchLearners(batchId, val);
    if (res.data) {
      setLearners(res.data);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!batchId) return;
    setLoading(true);
    const res = await getMentorBatchLearners(batchId, searchQuery);
    if (res.data) {
      setLearners(res.data);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/mentor/batches/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-tangerine)] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Batches</span>
        </Link>
      </div>

      {/* Header section with Title and Batch details */}
      <div className="pb-2 border-b border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Batch Learners
            </h1>
            {batch?.batch_id && (
              <span className="px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-mono font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/30">
                {batch.batch_id}
              </span>
            )}
          </div>
          <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
            {batch?.course_title
              ? `Enrolled learners for ${batch.course_title} (${batch.course_identifier})`
              : 'View learners enrolled in this batch, track attendance and reward points.'}
          </p>
        </div>

        {batch && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[#E5DFD3] px-3 py-1.5 rounded-[var(--radius-md)] self-start sm:self-auto">
            <Layers className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
            <span>Mentor: <strong className="text-[var(--color-text-primary)]">{mentorName || batch.mentor_name}</strong></span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Total Learners Count & Search Learner Bar */}
      <div className="card px-3.5 py-2.5 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        {/* Total Learners Count */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] shrink-0 self-start sm:self-auto">
          <span className="font-semibold text-xs sm:text-sm md:text-base text-[var(--color-text-primary)]">
            Total Learners :{' '}
            <span className="font-bold text-[var(--color-tangerine)] text-xs sm:text-sm md:text-base">
              {loading && totalCount === 0 ? '...' : totalCount}
            </span>
          </span>
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-tangerine)] shrink-0" />
        </div>

        {/* Search learner by mobile number or name */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search learner (mobile number or name)..."
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
          <button
            type="submit"
            className="btn btn-primary px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* List of Learners Table */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
          <div>
            <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
              List of Learners
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {learners.length} {learners.length === 1 ? 'learner' : 'learners'} displayed
            </p>
          </div>
        </div>

        <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
          <table className="table-base w-full">
            <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
              <tr>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-16">
                  s.no
                </th>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                  Name
                </th>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                  Mobile
                </th>
                <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                  points
                </th>
                <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                  attendance
                </th>
              </tr>
            </thead>
            <tbody className="table-body divide-y divide-[#E5DFD3]">
              {loading && learners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                      <span className="text-sm">Loading learners...</span>
                    </div>
                  </td>
                </tr>
              ) : learners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <Users className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        No learners found in this batch
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                        {searchQuery
                          ? `No learner matches "${searchQuery}". Try searching by another name or mobile number.`
                          : 'No learners have been enrolled in this batch yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                learners.map((learner, idx) => (
                  <tr
                    key={learner.id}
                    className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                  >
                    {/* s.no */}
                    <td className="table-data-cell py-3.5 px-4 font-mono text-xs text-[var(--color-text-muted)] font-semibold">
                      {idx + 1}
                    </td>

                    {/* Name */}
                    <td className="table-data-cell py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-soft-cream)] border border-[#E5DFD3] flex items-center justify-center shrink-0 text-[var(--color-tangerine)]">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)] block">
                            {learner.name}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {learner.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="table-data-cell py-3.5 px-4 text-xs font-mono text-[var(--color-text-secondary)]">
                      <div className="inline-flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[var(--color-text-muted)]" />
                        <span>{learner.mobile || '—'}</span>
                      </div>
                    </td>

                    {/* points */}
                    <td className="table-data-cell py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)]">
                        <Award className="w-3 h-3 text-[var(--color-tangerine)]" />
                        {learner.points}
                      </span>
                    </td>

                    {/* attendance */}
                    <td className="table-data-cell py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CalendarCheck className="w-3 h-3" />
                        {learner.attendance}%
                      </span>
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

export default function MentorBatchLearnersPage() {
  const [mentorName, setMentorName] = useState<string>('Mentor Name');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      } catch {
        // Fall back gracefully
      }
    }
    loadMentor();
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
              <div className="flex items-center justify-center py-20 text-[var(--color-text-muted)]">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
              </div>
            }
          >
            <MentorBatchLearnersContent mentorName={mentorName} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
