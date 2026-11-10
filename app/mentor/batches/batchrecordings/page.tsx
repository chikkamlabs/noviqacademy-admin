'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import AddBatchRecording from '@/components/mentor/addbatchrecording';
import {
  getBatchRecordings,
  getBatchRecordingsCount,
  updateBatchRecording,
  BatchClassRecording,
} from '@/lib/mentor/batchclassrecodingsStore';
import { getMentorBatchById, MentorBatch } from '@/lib/mentor/batchmanagementStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  Video,
  Plus,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Loader2,
  Edit2,
  Filter,
  RefreshCw,
  AlertCircle,
  Layers,
  BookOpen,
  X,
  Link2,
} from 'lucide-react';

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Compute default last 1 week dates (fromDate = 7 days ago, toDate = today)
function getDefaultDateRange() {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 7);
  return {
    fromDate: past.toISOString().split('T')[0],
    toDate: now.toISOString().split('T')[0],
  };
}

function MentorBatchRecordingsContent({ mentorName }: { mentorName: string }) {
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batch_id') || searchParams.get('id') || '';

  const defaultRange = getDefaultDateRange();
  const [fromDate, setFromDate] = useState<string>(defaultRange.fromDate);
  const [toDate, setToDate] = useState<string>(defaultRange.toDate);

  const [batch, setBatch] = useState<MentorBatch | null>(null);
  const [recordings, setRecordings] = useState<BatchClassRecording[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!batchId) {
        if (!ignore) {
          setErrorMsg('No batch ID provided in the URL.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const [batchRes, count, recRes] = await Promise.all([
          getMentorBatchById(batchId),
          getBatchRecordingsCount(batchId, { fromDate, toDate }),
          getBatchRecordings(batchId, { fromDate, toDate }),
        ]);

        if (!ignore) {
          if (batchRes.data) {
            setBatch(batchRes.data);
          } else if (batchRes.error) {
            setErrorMsg(batchRes.error.message);
          }

          setTotalCount(count);

          if (recRes.data) {
            setRecordings(recRes.data);
          } else if (recRes.error) {
            setErrorMsg(recRes.error.message);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load recordings');
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
  }, [batchId, fromDate, toDate, refreshKey]);

  const handleResetFilters = () => {
    const range = getDefaultDateRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
  };

  const handleClearAllDateFilters = () => {
    setFromDate('');
    setToDate('');
  };

  const [editingRecording, setEditingRecording] = useState<BatchClassRecording | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editLink, setEditLink] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleOpenEdit = (rec: BatchClassRecording) => {
    setEditingRecording(rec);
    setEditDate(rec.date);
    setEditLink(rec.link);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecording) return;
    if (!editDate) {
      setEditError('Date is required');
      return;
    }
    if (!editLink.trim()) {
      setEditError('Link is required');
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await updateBatchRecording(editingRecording.id, {
        date: editDate,
        link: editLink.trim(),
      });
      if (res.error) {
        setEditError(res.error.message);
      } else {
        setSuccessMsg('Recording updated successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
        setEditingRecording(null);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update recording');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
        <div className="flex items-center gap-3">
          <Link
            href="/mentor/batches/dashboard"
            className="p-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[#D5CDBD] text-[var(--color-text-secondary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
            title="Back to Batches Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-tangerine)]">
                Batch Recordings
              </span>
              {batch && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] font-semibold">
                  {batch.batch_id}
                </span>
              )}
            </div>
            <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Class Recordings
            </h1>
          </div>
        </div>

        {/* Quick Batch Details */}
        {batch && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] self-start sm:self-auto bg-[var(--color-surface)] px-3 py-1.5 rounded-[var(--radius-md)] border border-[#E5DFD3]">
            <Layers className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
            <span className="font-semibold">{batch.batch_id}</span>
            <span className="text-[var(--color-text-muted)]">•</span>
            <BookOpen className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <span className="font-mono">{batch.course_identifier}</span>
          </div>
        )}
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

      {/* Controls Bar: Total Recordings Count, Add Recording, Filters (from to date default last 1 week) */}
      <div className="card p-4 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs space-y-4">
        {/* Top row: Total Count + Add Recording Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]">
              <Video className="w-4 h-4 text-[var(--color-tangerine)]" />
              <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                Total Recordings:
              </span>
              <span className="text-xs sm:text-sm font-bold text-[var(--color-tangerine)] font-mono">
                {loading ? '...' : totalCount}
              </span>
            </div>
            {(fromDate || toDate) && (
              <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">
                (filtered)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="btn btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recording</span>
          </button>
        </div>

        {/* Filters Row: From Date, To Date (default last 1 week) */}
        <div className="pt-3 border-t border-[#E5DFD3] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
              <Filter className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
              <span>Date Filters:</span>
            </div>

            {/* From Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--color-text-muted)]">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--color-text-muted)]">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
              />
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
              title="Reset to default last 1 week"
            >
              Last 1 Week (Default)
            </button>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={handleClearAllDateFilters}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List of Recordings Table */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
          <div>
            <h2 className="card-title text-base font-bold text-[var(--color-text-primary)]">
              Class Recordings List
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Showing {recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'}
              {fromDate || toDate ? ' for selected range' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'anim-spin' : ''}`} />
          </button>
        </div>

        <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
          <table className="table-base w-full">
            <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
              <tr>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-48">
                  Date
                </th>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                  Link
                </th>
                <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-28">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="table-body divide-y divide-[#E5DFD3]">
              {loading && recordings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                      <span className="text-sm">Loading recordings...</span>
                    </div>
                  </td>
                </tr>
              ) : recordings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <Video className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        No class recordings found
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                        {fromDate || toDate
                          ? 'No recordings match the selected date range. Try clearing or expanding your date filters.'
                          : 'No recordings have been added for this batch yet. Tap Add Recording to post the first one.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddOpen(true)}
                        className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] mt-2 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Recording</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recordings.map((rec) => (
                  <tr
                    key={rec.id}
                    className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                  >
                    {/* Date */}
                    <td className="table-data-cell py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
                        <div>
                          <span className="font-semibold text-xs sm:text-sm block">
                            {formatDateDisplay(rec.date)}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                            {rec.date}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Link */}
                    <td className="table-data-cell py-3.5 px-4">
                      <a
                        href={rec.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--color-tangerine)] hover:underline max-w-lg break-all line-clamp-1"
                        title={rec.link}
                      >
                        <span className="truncate">{rec.link}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </td>

                    {/* Action: Edit */}
                    <td className="table-data-cell py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rec)}
                        className="btn btn-outline inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] border border-[#D5CDBD] hover:bg-[var(--color-soft-cream)] transition cursor-pointer"
                        title="Edit recording"
                        aria-label={`Edit recording from ${rec.date}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Recording Modal */}
      {editingRecording && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-recording-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E5DFD3] bg-[var(--color-soft-orange)]/30">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-tangerine)]/10 text-[var(--color-tangerine)]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="edit-recording-title"
                    className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]"
                  >
                    Edit Class Recording
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Update recording date and destination link
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecording(null)}
                disabled={savingEdit}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Class Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                  />
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Recording Link (URL) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="url"
                    required
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    placeholder="https://drive.google.com/file/... or https://youtube.com/..."
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setEditingRecording(null)}
                  disabled={savingEdit}
                  className="btn btn-outline px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[#D5CDBD] hover:bg-[var(--color-soft-cream)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 anim-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Recording Modal */}
      {isAddOpen && batchId && (
        <AddBatchRecording
          batchId={batchId}
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onRecordingAdded={() => {
            setSuccessMsg('Recording added successfully!');
            setTimeout(() => setSuccessMsg(null), 3000);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

export default function MentorBatchRecordingsPage() {
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
                  Loading batch recordings...
                </span>
              </div>
            }
          >
            <MentorBatchRecordingsContent mentorName={mentorName} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
