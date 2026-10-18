'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getBatchById,
  updateBatch,
  Batch,
  BatchRegistrationStatus,
  BatchLanguage,
} from '@/lib/batchesStore';
import {
  ArrowLeft,
  Lock,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  Layers,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

function OpenBatchContent() {
  const searchParams = useSearchParams();
  const batchIdParam = searchParams.get('id') || '';

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable Form fields
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [gracePeriod, setGracePeriod] = useState<number>(0);
  const [registrations, setRegistrations] = useState<BatchRegistrationStatus>('open');
  const [language, setLanguage] = useState<BatchLanguage>('english');
  const [fromTime, setFromTime] = useState<string>('');
  const [toTime, setToTime] = useState<string>('');
  const [liveLink, setLiveLink] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadBatch() {
      if (!batchIdParam) {
        setLoadError('No batch identifier specified in the URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      const result = await getBatchById(batchIdParam);
      if (!ignore) {
        if (result.error || !result.data) {
          setLoadError(result.error?.message || 'Batch record not found.');
        } else {
          const b = result.data;
          setBatch(b);
          setStartDate(b.start_date || '');
          setEndDate(b.end_date || '');
          setGracePeriod(b.grace_period || 0);
          setRegistrations(b.registrations || 'open');
          setLanguage(b.language || 'english');
          setFromTime(b.from_time || '');
          setToTime(b.to_time || '');
          setLiveLink(b.live_link || '');
          setNotes(b.notes || '');
        }
        setLoading(false);
      }
    }

    loadBatch();

    return () => {
      ignore = true;
    };
  }, [batchIdParam]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!batch) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (gracePeriod < 0) {
      setErrorMessage('Grace period cannot be negative.');
      return;
    }

    setSaving(true);

    try {
      const result = await updateBatch(batch.id, {
        start_date: startDate || null,
        end_date: endDate || null,
        grace_period: Number(gracePeriod || 0),
        registrations,
        language,
        from_time: fromTime || null,
        to_time: toTime || null,
        live_link: liveLink.trim() || null,
        notes: notes.trim() || null,
      });

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || 'Failed to update batch details.');
      } else {
        setBatch(result.data);
        setSuccessMessage('Batch details updated successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          Loading batch configuration...
        </span>
      </div>
    );
  }

  if (loadError || !batch) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card p-8 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-danger-subtle)] text-[var(--color-danger)] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Batch Not Found</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loadError || 'The requested batch could not be found.'}
          </p>
          <div className="pt-2">
            <Link
              href="/admin/batches/dashboard"
              className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Batches</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & ID badge */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD3]">
        <Link
          href="/admin/batches/dashboard"
          className="btn btn-outline inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Batches</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Batch:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-mono font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
            {batch.batch_id}
          </span>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-soft-orange)]/60 text-[var(--color-text-primary)] font-bold text-xl flex items-center justify-center shrink-0">
            <Layers className="w-7 h-7 text-[var(--color-tangerine)]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                Batch {batch.batch_id}
              </h1>
              <span
                className={`badge text-[11px] font-semibold ${
                  batch.registrations === 'open'
                    ? 'badge-success'
                    : 'badge-neutral'
                }`}
              >
                {batch.registrations === 'open' ? 'Open for Registrations' : 'Closed'}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-2">
              <span>{batch.course_identifier} • {batch.course_title}</span>
            </p>
          </div>
        </div>

        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 bg-[var(--color-soft-cream)] px-3 py-2 rounded-[var(--radius-md)] self-start md:self-auto">
          <GraduationCap className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
          <span>Mentor: <strong className="text-[var(--color-text-primary)]">{batch.mentor_name}</strong></span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-[var(--color-success-subtle)] border border-[var(--color-success)]/30 rounded-[var(--radius-md)] text-xs text-[var(--color-success)] font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-[var(--radius-md)] text-xs text-[var(--color-danger)] font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form with all batch fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Immutable Identity Fields (Locked: batch_id, course_id, mentor_id) */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Locked Identifiers (Read-Only)
              </h2>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Fixed system associations</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Batch ID (Locked) */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)]">
                  Batch ID
                </label>
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <input
                type="text"
                value={batch.batch_id}
                disabled
                readOnly
                className="input-base bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] font-mono font-semibold cursor-not-allowed border-[#E5DFD3]"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Unique batch code cannot be edited.
              </p>
            </div>

            {/* Course ID (Locked) */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)]">
                  Course ID
                </label>
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <input
                type="text"
                value={`[${batch.course_identifier}] ${batch.course_title}`}
                disabled
                readOnly
                className="input-base bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] font-medium cursor-not-allowed border-[#E5DFD3]"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Parent course association is fixed.
              </p>
            </div>

            {/* Mentor ID (Locked) */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)]">
                  Mentor
                </label>
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <input
                type="text"
                value={`${batch.mentor_identifier ? `[${batch.mentor_identifier}] ` : ''}${batch.mentor_name}`}
                disabled
                readOnly
                className="input-base bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] font-medium cursor-not-allowed border-[#E5DFD3]"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Assigned course faculty cannot be changed here.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Editable Batch Configuration */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-tangerine)]" />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Schedule & Settings (Editable)
              </h2>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Update parameters</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Start Date */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-base border-[#E5DFD3]"
              />
            </div>

            {/* End Date */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-base border-[#E5DFD3]"
              />
            </div>

            {/* From Time */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                From Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="input-base pl-9 border-[#E5DFD3]"
                />
              </div>
            </div>

            {/* To Time */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                To Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                <input
                  type="time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="input-base pl-9 border-[#E5DFD3]"
                />
              </div>
            </div>

            {/* Registrations Status */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Registrations Status
              </label>
              <select
                value={registrations}
                onChange={(e) => setRegistrations(e.target.value as BatchRegistrationStatus)}
                className="select-base border-[#E5DFD3]"
              >
                <option value="open">Open (Active - accepting registrations)</option>
                <option value="closed">Closed (Enrollment halted)</option>
              </select>
            </div>

            {/* Instruction Language */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Instruction Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as BatchLanguage)}
                className="select-base border-[#E5DFD3]"
              >
                <option value="english">English</option>
                <option value="telugu">Telugu</option>
              </select>
            </div>

            {/* Grace Period (Days) */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Grace Period (Days)
              </label>
              <input
                type="number"
                min="0"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="input-base border-[#E5DFD3]"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Allowed trial / orientation days before enrollment closes.
              </p>
            </div>

            {/* Live Link */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Live Classroom Link
              </label>
              <input
                type="url"
                value={liveLink}
                onChange={(e) => setLiveLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="input-base border-[#E5DFD3]"
              />
            </div>

            {/* Notes */}
            <div className="form-group md:col-span-2">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Batch Notes & Guidelines
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session guidelines, batch requirements..."
                className="textarea-base border-[#E5DFD3]"
              />
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="p-4 px-6 border-t border-[#E5DFD3] bg-[var(--color-soft-cream)] flex items-center justify-end gap-3">
            <Link
              href="/admin/batches/dashboard"
              className="btn btn-outline text-xs px-4 py-2 rounded-[var(--radius-md)] cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs px-6 py-2 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 anim-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Batch Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function OpenBatchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                <span className="text-sm text-[var(--color-text-muted)]">Loading batch details...</span>
              </div>
            }
          >
            <OpenBatchContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
