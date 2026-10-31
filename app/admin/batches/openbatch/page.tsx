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
  BatchRegion,
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
  GraduationCap,
  Globe,
  Video,
  FileText,
} from 'lucide-react';

function OpenBatchContent() {
  const searchParams = useSearchParams();
  const batchIdParam = searchParams.get('id') || '';

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable Form fields (including batch_region)
  const [region, setRegion] = useState<BatchRegion>('india');
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
          setRegion(b.region || 'india');
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
        region,
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
        <div className="card p-8 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-xl)] shadow-sm text-center space-y-4">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
        <Link
          href="/admin/batches/dashboard"
          className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] border border-[#D5CDBD] transition self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Batches</span>
        </Link>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">Batch:</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-mono font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/30">
            {batch.batch_id}
          </span>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="card p-6 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-full bg-[var(--color-soft-orange)]/40 text-[var(--color-text-primary)] font-bold text-xl flex items-center justify-center shrink-0 border border-[var(--color-tangerine)]/20">
            <Layers className="w-6 h-6 text-[var(--color-tangerine)]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                Batch {batch.batch_id}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  batch.registrations === 'open'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {batch.registrations === 'open' ? 'Open for Registrations' : 'Closed'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-soft-cream)] text-[var(--color-text-secondary)] border border-[#D5CDBD] flex items-center gap-1">
                <Globe className="w-3 h-3 text-[var(--color-tangerine)]" />
                {batch.region === 'uk' ? 'UK Batch (GBP)' : 'India Batch (INR)'}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-2">
              <span className="font-semibold text-[var(--color-tangerine)]">[{batch.course_identifier}]</span>
              <span>{batch.course_title}</span>
            </p>
          </div>
        </div>

        <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2 bg-[var(--color-soft-cream)] px-3.5 py-2 rounded-[var(--radius-md)] border border-[#D5CDBD] self-start md:self-auto shadow-2xs">
          <GraduationCap className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
          <span>Faculty: <strong className="text-[var(--color-text-primary)]">{batch.mentor_name}</strong></span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-[var(--color-success-subtle)] border border-[var(--color-success)] rounded-[var(--radius-md)] text-xs text-[var(--color-success)] font-medium flex items-center gap-2 anim-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] rounded-[var(--radius-md)] text-xs text-[var(--color-danger)] font-medium flex items-center gap-2 anim-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form with all batch fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Immutable Identity Fields (Locked: batch_id, course_id, mentor_id) */}
        <div className="card bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--color-danger)]" />
              <h2 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                1. Locked Identifiers (Read-Only)
              </h2>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Fixed system associations</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Batch ID (Locked) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Batch ID
                </label>
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-[var(--color-danger)]" /> Locked
                </span>
              </div>
              <div className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-soft-cream)] px-3 py-2 text-sm font-mono font-bold text-[var(--color-tangerine)] cursor-not-allowed">
                {batch.batch_id}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Unique identifier assigned at creation.
              </p>
            </div>

            {/* Course ID (Locked) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Assigned Course
                </label>
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-[var(--color-danger)]" /> Locked
                </span>
              </div>
              <div className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-soft-cream)] px-3 py-2 text-xs md:text-sm text-[var(--color-text-primary)] font-medium cursor-not-allowed truncate">
                [{batch.course_identifier}] {batch.course_title}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Parent course curriculum association is fixed.
              </p>
            </div>

            {/* Mentor ID (Locked) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Faculty Mentor
                </label>
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-[var(--color-danger)]" /> Locked
                </span>
              </div>
              <div className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-soft-cream)] px-3 py-2 text-xs md:text-sm text-[var(--color-text-primary)] font-medium cursor-not-allowed truncate">
                {batch.mentor_identifier ? `[${batch.mentor_identifier}] ` : ''}{batch.mentor_name}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Inherited from course mentor assignment.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Editable Batch Configuration (including batch_region) */}
        <div className="card bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-tangerine)]" />
              <h2 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                2. Region, Schedule &amp; Settings (Editable)
              </h2>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Update parameters below</span>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {/* Batch Region (batch_region) */}
            <div className="sm:col-span-2 md:col-span-1">
              <label htmlFor="editBatchRegion" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                <span>Batch Region (batch_region) <span className="text-[var(--color-tangerine)]">*</span></span>
              </label>
              <select
                id="editBatchRegion"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value as BatchRegion)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs cursor-pointer"
              >
                <option value="india">India (INR Currency)</option>
                <option value="uk">United Kingdom (UK / GBP Currency)</option>
              </select>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Target learner region and billing currency for this batch.
              </p>
            </div>

            {/* Registrations Status */}
            <div>
              <label htmlFor="editRegistrations" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 block">
                Registration Status
              </label>
              <select
                id="editRegistrations"
                value={registrations}
                onChange={(e) => setRegistrations(e.target.value as BatchRegistrationStatus)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs cursor-pointer"
              >
                <option value="open">Open (Active - accepting registrations)</option>
                <option value="closed">Closed (Enrollment halted)</option>
              </select>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Whether learners can sign up for this batch.
              </p>
            </div>

            {/* Instruction Language */}
            <div>
              <label htmlFor="editLanguage" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 block">
                Instruction Language
              </label>
              <select
                id="editLanguage"
                value={language}
                onChange={(e) => setLanguage(e.target.value as BatchLanguage)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs cursor-pointer"
              >
                <option value="english">English</option>
                <option value="telugu">Telugu</option>
              </select>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Primary language used in lectures.
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="editStartDate" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                <span>Start Date</span>
              </label>
              <input
                id="editStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="editEndDate" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                <span>End Date</span>
              </label>
              <input
                id="editEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
              />
            </div>

            {/* Grace Period (Days) */}
            <div>
              <label htmlFor="editGracePeriod" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 block">
                Grace Period (Days)
              </label>
              <input
                id="editGracePeriod"
                type="number"
                min="0"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Orientation days allowed before confirmation.
              </p>
            </div>

            {/* From Time (Clean layout without icon collision) */}
            <div>
              <label htmlFor="editFromTime" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                <span>Daily From Time</span>
              </label>
              <input
                id="editFromTime"
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
              />
            </div>

            {/* To Time (Clean layout without icon collision) */}
            <div>
              <label htmlFor="editToTime" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                <span>Daily To Time</span>
              </label>
              <input
                id="editToTime"
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
              />
            </div>

            {/* Live Link */}
            <div className="sm:col-span-2 md:col-span-1">
              <label htmlFor="editLiveLink" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                <span>Live Meeting Link</span>
              </label>
              <input
                id="editLiveLink"
                type="url"
                value={liveLink}
                onChange={(e) => setLiveLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 md:col-span-3">
              <label htmlFor="editNotes" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                <span>Batch Notes &amp; Guidelines</span>
              </label>
              <textarea
                id="editNotes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session guidelines, prerequisites, instructions..."
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none resize-y shadow-xs"
              />
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="p-4 px-6 border-t border-[#E5DFD3] bg-[var(--color-soft-cream)]/70 flex items-center justify-end gap-3">
            <Link
              href="/admin/batches/dashboard"
              className="btn btn-outline text-xs px-4 py-2 rounded-[var(--radius-md)] border border-[#D5CDBD] cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs px-6 py-2.5 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold shadow-sm disabled:opacity-50"
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
