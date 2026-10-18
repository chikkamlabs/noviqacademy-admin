'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getBatches,
  getActiveBatchesCount,
  getTotalBatchesCount,
  Batch,
} from '@/lib/batchesStore';
import {
  Plus,
  Search,
  Layers,
  ExternalLink,
  Loader2,
  Clock,
  BookOpen,
  GraduationCap,
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

export default function BatchesDashboardPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const [actCount, totCount, listRes] = await Promise.all([
        getActiveBatchesCount(),
        getTotalBatchesCount(),
        getBatches(),
      ]);

      if (!ignore) {
        setActiveCount(actCount);
        setTotalCount(totCount);
        if (listRes.data) {
          setBatches(listRes.data);
        }
        setLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    const result = await getBatches(val);
    if (result.data) {
      setBatches(result.data);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await getBatches(searchQuery);
    if (result.data) {
      setBatches(result.data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section with Title, Subtitle, and Add Batch button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Batches Management
                </h1>
                <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Manage class schedules, student registrations, assigned mentors, and session timings.
                </p>
              </div>

              {/* Add Batch Button */}
              <Link
                href="/admin/batches/addbatch"
                className="btn btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Batch</span>
              </Link>
            </div>

            {/* Metrics & Search Bar Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Active Batches Card */}
              <div className="card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                    Total Active Batches
                  </div>
                  <div className="metric-value text-3xl font-bold text-[var(--color-text-primary)] mt-1">
                    {loading && activeCount === 0 ? '...' : activeCount}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    Open for learner registrations ({totalCount} total)
                  </div>
                </div>
                <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-primary-subtle)] flex items-center justify-center text-[var(--color-tangerine)]">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              {/* Search Bar (Spans 2 columns on md) */}
              <div className="md:col-span-2 card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex flex-col justify-center">
                <label className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-2">
                  Search Batches (batch_id, course_id)
                </label>
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by batch_id (e.g. batch_101) or course_id..."
                    className="input-base pl-9 pr-24 py-2 text-sm border-[#E5DFD3]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="absolute right-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Batches List Table */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
                    List of Batches
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {batches.length} {batches.length === 1 ? 'batch' : 'batches'} found
                  </p>
                </div>
              </div>

              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table-base">
                  <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                    <tr>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Batch ID
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Course ID
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Mentor
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Registrations
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Time (From – To)
                      </th>
                      <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body divide-y divide-[#E5DFD3]">
                    {loading && batches.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[var(--color-text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                            <span className="text-sm">Loading batches...</span>
                          </div>
                        </td>
                      </tr>
                    ) : batches.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Layers className="w-10 h-10 text-[var(--color-text-muted)]" />
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              No batches found
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                              {searchQuery
                                ? `No batch matches "${searchQuery}". Try a different batch_id or course_id.`
                                : 'Get started by clicking Add Batch above to create your first course batch.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch) => {
                        const isOpen = batch.registrations === 'open';

                        return (
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

                            {/* Mentor */}
                            <td className="table-data-cell py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                                <span className="text-sm text-[var(--color-text-secondary)]">
                                  {batch.mentor_name}
                                </span>
                              </div>
                            </td>

                            {/* Registrations Status */}
                            <td className="table-data-cell py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] text-xs font-semibold ${
                                  isOpen
                                    ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]/30'
                                    : 'bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] border border-[#E5DFD3]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOpen ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]'
                                  }`}
                                />
                                {isOpen ? 'Open' : 'Closed'}
                              </span>
                            </td>

                            {/* Time (From – To) */}
                            <td className="table-data-cell py-3.5 px-4 text-xs text-[var(--color-text-secondary)]">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                                <span>{formatBatchTimeRange(batch.from_time, batch.to_time)}</span>
                              </div>
                            </td>

                            {/* Action: Open */}
                            <td className="table-data-cell py-3.5 px-4 text-right">
                              <Link
                                href={`/admin/batches/openbatch?id=${batch.id}`}
                                className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] transition cursor-pointer"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
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
