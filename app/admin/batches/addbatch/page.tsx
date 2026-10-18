'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  generateNextBatchId,
  getCoursesForBatchDropdown,
  createBatch,
  CourseOptionForBatch,
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
} from 'lucide-react';

export default function AddBatchPage() {
  const router = useRouter();

  // Form Fields
  const [batchId, setBatchId] = useState<string>('batch_101');
  const [courses, setCourses] = useState<CourseOptionForBatch[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [mentorId, setMentorId] = useState<string>('');
  const [mentorDisplayName, setMentorDisplayName] = useState<string>('Select a course to auto-fill mentor');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [gracePeriod, setGracePeriod] = useState<number>(0);
  const [registrations, setRegistrations] = useState<BatchRegistrationStatus>('open');
  const [language, setLanguage] = useState<BatchLanguage>('english');
  const [fromTime, setFromTime] = useState<string>('');
  const [toTime, setToTime] = useState<string>('');
  const [liveLink, setLiveLink] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Status Helpers
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [nextId, coursesList] = await Promise.all([
          generateNextBatchId(),
          getCoursesForBatchDropdown(),
        ]);

        if (!ignore) {
          setBatchId(nextId);
          setCourses(coursesList);

          if (coursesList.length > 0) {
            const first = coursesList[0];
            setSelectedCourseId(first.id);
            setMentorId(first.mentor_id || '');
            setMentorDisplayName(
              first.mentor_name
                ? `${first.mentor_identifier ? `[${first.mentor_identifier}] ` : ''}${first.mentor_name}`
                : 'No mentor assigned to this course'
            );
          }
          setLoadingInitial(false);
        }
      } catch (err) {
        console.error('Error during batch initialization:', err);
        if (!ignore) {
          setLoadingInitial(false);
        }
      }
    }

    init();

    return () => {
      ignore = true;
    };
  }, []);

  // When selected course changes: update default mentor_id
  const handleCourseChange = (courseUuid: string) => {
    setSelectedCourseId(courseUuid);
    const found = courses.find((c) => c.id === courseUuid);
    if (found) {
      setMentorId(found.mentor_id || '');
      setMentorDisplayName(
        found.mentor_name
          ? `${found.mentor_identifier ? `[${found.mentor_identifier}] ` : ''}${found.mentor_name}`
          : 'No mentor assigned to this course'
      );
    } else {
      setMentorId('');
      setMentorDisplayName('No mentor assigned');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCourseId) {
      setErrorMessage('Please select a course for this batch.');
      return;
    }

    if (gracePeriod < 0) {
      setErrorMessage('Grace period cannot be negative.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await createBatch({
        course_id: selectedCourseId,
        batch_id: batchId,
        mentor_id: mentorId || null,
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
        setErrorMessage(result.error?.message || 'Failed to create batch record.');
        setSubmitting(false);
        return;
      }

      // Success: redirect to batches dashboard
      router.push('/admin/batches/dashboard');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header & Back Action */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD3]">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/batches/dashboard"
                  className="btn btn-outline inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Batches</span>
                </Link>
                <h1 className="page-title text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                  Add New Batch
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">Auto ID:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-mono font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                  {batchId}
                </span>
              </div>
            </div>

            {loadingInitial ? (
              <div className="card p-12 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                <span className="text-sm text-[var(--color-text-muted)]">Loading batch configuration...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMessage && (
                  <div className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-[var(--radius-md)] flex items-start gap-2.5 text-xs text-[var(--color-danger)] font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">{errorMessage}</div>
                  </div>
                )}

                {/* Section 1: Core Allocation (Course, Batch ID, Mentor) */}
                <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
                  <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--color-tangerine)]" />
                    <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                      Batch Assignment & Course
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Batch ID (Locked) */}
                    <div className="form-group">
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label text-xs font-semibold text-[var(--color-text-primary)]">
                          Batch ID <span className="text-[var(--color-text-muted)] font-normal">(Auto-generated)</span>
                        </label>
                        <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[var(--color-text-muted)]" /> Locked
                        </span>
                      </div>
                      <input
                        type="text"
                        value={batchId}
                        disabled
                        readOnly
                        className="input-base bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] font-mono font-semibold cursor-not-allowed border-[#E5DFD3]"
                      />
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Auto-filled sequentially (batch_101+1). Cannot be modified.
                      </p>
                    </div>

                    {/* Course Selection */}
                    <div className="form-group">
                      <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                        Select Course <span className="text-[var(--color-tangerine)]">*</span>
                      </label>
                      <select
                        required
                        value={selectedCourseId}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className="select-base border-[#E5DFD3]"
                      >
                        {courses.length === 0 ? (
                          <option value="">No courses available</option>
                        ) : (
                          courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              [{c.course_id}] {c.title}
                            </option>
                          ))
                        )}
                      </select>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        The batch curriculum and pricing are governed by this course.
                      </p>
                    </div>

                    {/* Mentor ID (Locked to Course Mentor) */}
                    <div className="form-group md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label text-xs font-semibold text-[var(--color-text-primary)]">
                          Assigned Mentor <span className="text-[var(--color-text-muted)] font-normal">(Default from Course)</span>
                        </label>
                        <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[var(--color-text-muted)]" /> Locked
                        </span>
                      </div>
                      <input
                        type="text"
                        value={mentorDisplayName}
                        disabled
                        readOnly
                        className="input-base bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] font-medium cursor-not-allowed border-[#E5DFD3]"
                      />
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Automatically assigned from the selected course&apos;s faculty mentor. Cannot be modified directly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Schedule & Registration Settings */}
                <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
                  <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--color-tangerine)]" />
                    <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                      Schedule & Parameters
                    </h2>
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
                        <option value="open">Open (Active - accepting learners)</option>
                        <option value="closed">Closed (Enrollment halted)</option>
                      </select>
                    </div>

                    {/* Language */}
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
                        placeholder="0"
                      />
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Days learners can access live sessions before mandatory confirmation.
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
                        placeholder="https://meet.google.com/xyz-abc-def"
                        className="input-base border-[#E5DFD3]"
                      />
                    </div>

                    {/* Notes */}
                    <div className="form-group md:col-span-2">
                      <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                        Batch Notes & Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add batch schedule notes, prerequisites, or guidelines..."
                        className="textarea-base border-[#E5DFD3]"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Link
                    href="/admin/batches/dashboard"
                    className="btn btn-outline text-xs px-5 py-2.5 rounded-[var(--radius-md)] cursor-pointer"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-xs px-6 py-2.5 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 anim-spin" />
                        <span>Creating Batch...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Create Batch</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
