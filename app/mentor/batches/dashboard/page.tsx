'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import {
  getMentorBatches,
  getMentorActiveBatchesCount,
  MentorBatch,
} from '@/lib/mentor/batchmanagementStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  Search,
  Layers,
  Users,
  Video,
  ExternalLink,
  Loader2,
  Clock,
  BookOpen,
} from 'lucide-react';

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

function formatBatchTimeRange(from?: string | null, to?: string | null): string {
  if (!from && !to) return 'Not scheduled';
  if (from && to) return `${formatTime(from)} – ${formatTime(to)}`;
  if (from) return `From ${formatTime(from)}`;
  return `Until ${formatTime(to)}`;
}

export default function MentorBatchesDashboardPage() {
  const [mentorName, setMentorName] = useState<string>('Mentor Name');
  const [batches, setBatches] = useState<MentorBatch[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile?.name && !ignore) {
            setMentorName(profile.name);
          }
        }

        const [actCount, listRes] = await Promise.all([
          getMentorActiveBatchesCount(),
          getMentorBatches(),
        ]);

        if (!ignore) {
          setActiveCount(actCount);
          if (listRes.data) {
            setBatches(listRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load mentor batches:', err);
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
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    const result = await getMentorBatches(undefined, val);
    if (result.data) {
      setBatches(result.data);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await getMentorBatches(undefined, searchQuery);
    if (result.data) {
      setBatches(result.data);
    }
    setLoading(false);
  };

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
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section with Title and Description */}
            <div className="pb-2 border-b border-[#E5DFD3]">
              <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                Assigned Batches
              </h1>
              <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                View your class schedules, check enrolled learners, update live session links, and attach resources.
              </p>
            </div>

            {/* Total Active Batches & Search Bar Section */}
            <div className="card px-3.5 py-2.5 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              {/* Total Active batches count */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] shrink-0 self-start sm:self-auto">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-[var(--color-text-primary)]">
                  Total Active batches :{' '}
                  <span className="font-bold text-[var(--color-tangerine)] text-xs sm:text-sm md:text-base">
                    {loading && activeCount === 0 ? '...' : activeCount}
                  </span>
                </span>
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-tangerine)] shrink-0" />
              </div>

              {/* Search Bar for batch_id or course_id */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:max-w-md w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by batch_id or course_id..."
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

            {/* List of Batches Table */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
                    List of Batches
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {batches.length} {batches.length === 1 ? 'batch' : 'batches'} listed
                  </p>
                </div>
              </div>

              <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
                <table className="table-base w-full">
                  <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                    <tr>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Batch ID
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Course ID
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Time (From – To)
                      </th>
                      <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-44">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body divide-y divide-[#E5DFD3]">
                    {loading && batches.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-[var(--color-text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                            <span className="text-sm">Loading batches...</span>
                          </div>
                        </td>
                      </tr>
                    ) : batches.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2.5">
                            <Layers className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              No batches assigned yet
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                              {searchQuery
                                ? `No batch matches "${searchQuery}". Try a different batch_id or course_id.`
                                : 'You currently do not have any batches assigned. They will appear here once allocated.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch) => (
                        <tr
                          key={batch.id}
                          className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                        >
                          {/* Batch ID */}
                          <td className="table-data-cell py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-mono font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                              {batch.batch_id}
                            </span>
                          </td>

                          {/* Course ID & Title */}
                          <td className="table-data-cell py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
                              <div>
                                <span className="font-semibold text-xs font-mono text-[var(--color-text-primary)] block">
                                  {batch.course_identifier}
                                </span>
                                <span className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
                                  {batch.course_title}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Time (From – To) */}
                          <td className="table-data-cell py-3.5 px-4 text-xs text-[var(--color-text-secondary)]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                              <span>{formatBatchTimeRange(batch.from_time, batch.to_time)}</span>
                            </div>
                          </td>

                          {/* Action: Recording, Learners & Open */}
                          <td className="table-data-cell py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Recording Icon Button */}
                              <Link
                                href={`/mentor/batches/batchrecordings?batch_id=${batch.id}`}
                                className="btn btn-outline inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-soft-cream)] text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
                                title="Manage batch class recordings"
                                aria-label="Batch class recordings"
                              >
                                <Video className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                                <span>Recordings</span>
                              </Link>

                              <Link
                                href={`/mentor/batches/learners?batch_id=${batch.id}`}
                                className="btn btn-outline inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-soft-cream)] text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
                                title="View enrolled learners"
                              >
                                <Users className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                                <span>Learners</span>
                              </Link>

                              <Link
                                href={`/mentor/batches/openbatch?id=${batch.id}`}
                                className="btn btn-outline inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] transition cursor-pointer"
                                title="Open batch details and manage resources"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
