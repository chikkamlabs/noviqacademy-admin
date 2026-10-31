'use client';

import { useState, useEffect, useRef } from 'react';
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
  Globe,
  Video,
  FileText,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';

export default function AddBatchPage() {
  const router = useRouter();

  // Form Fields
  const [batchId, setBatchId] = useState<string>('batch_101');
  const [courses, setCourses] = useState<CourseOptionForBatch[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [mentorId, setMentorId] = useState<string>('');
  const [mentorDisplayName, setMentorDisplayName] = useState<string>('Select a course to auto-fill mentor');

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

  // Searchable Course Selector Popover State
  const [courseDropdownOpen, setCourseDropdownOpen] = useState<boolean>(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('');
  const courseDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(event.target as Node)
      ) {
        setCourseDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When selected course changes: update default mentor_id
  const handleSelectCourse = (course: CourseOptionForBatch) => {
    setSelectedCourseId(course.id);
    setMentorId(course.mentor_id || '');
    setMentorDisplayName(
      course.mentor_name
        ? `${course.mentor_identifier ? `[${course.mentor_identifier}] ` : ''}${course.mentor_name}`
        : 'No mentor assigned to this course'
    );
    setCourseDropdownOpen(false);
    setCourseSearchQuery('');
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Filter courses by search query (course_id or title)
  const filteredCourses = courses.filter((c) => {
    const q = courseSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.course_id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q)
    );
  });

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/batches/dashboard"
                  className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] border border-[#D5CDBD] transition"
                  title="Back to Batches Dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 className="page-title text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                    Add New Batch
                  </h1>
                  <p className="subheading-text text-xs text-[var(--color-text-muted)]">
                    Create a scheduled batch offering with mentor allocation and regional pricing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">Auto Batch ID:</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-mono font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/30">
                  {batchId}
                </span>
              </div>
            </div>

            {loadingInitial ? (
              <div className="card p-12 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-xl)] flex flex-col items-center justify-center gap-3 shadow-xs">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                <span className="text-sm text-[var(--color-text-muted)]">Loading batch configuration...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMessage && (
                  <div className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] rounded-[var(--radius-md)] flex items-start gap-2.5 text-xs text-[var(--color-danger)] font-medium anim-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">{errorMessage}</div>
                  </div>
                )}

                {/* Section 1: Course Assignment & Core Identifiers */}
                <div className="card bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-sm overflow-visible">
                  <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/60 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--color-tangerine)]" />
                    <h2 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                      1. Course Assignment &amp; Mentor
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Batch ID (Locked) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                          Batch ID (Auto Generated)
                        </label>
                        <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3 text-[var(--color-danger)]" /> Locked
                        </span>
                      </div>
                      <div className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-soft-cream)] px-3 py-2 text-sm font-mono font-bold text-[var(--color-tangerine)] cursor-not-allowed">
                        {batchId}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Auto incremented identifier (e.g. batch_101, batch_102).
                      </p>
                    </div>

                    {/* Searchable Course Selector Popover */}
                    <div className="relative" ref={courseDropdownRef}>
                      <label className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center justify-between">
                        <span>
                          Select Course <span className="text-[var(--color-tangerine)]">*</span>
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)] font-normal">
                          Searchable by course_id
                        </span>
                      </label>

                      {/* Dropdown Trigger Box */}
                      <button
                        type="button"
                        onClick={() => setCourseDropdownOpen((prev) => !prev)}
                        className="w-full text-left rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none flex items-center justify-between shadow-xs cursor-pointer hover:border-[#B8AF9E] transition"
                      >
                        {selectedCourse ? (
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20 shrink-0">
                              {selectedCourse.course_id}
                            </span>
                            <span className="truncate font-medium text-xs md:text-sm text-[var(--color-text-primary)]">
                              {selectedCourse.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Click to select a course...
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] shrink-0 ml-2 transition-transform ${courseDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Clean Search Popover Dropdown (Stays inside boundary, never overflows) */}
                      {courseDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-[var(--radius-md)] border border-[#D5CDBD] bg-white shadow-xl overflow-hidden anim-fade-in">
                          {/* Search Input Box */}
                          <div className="p-2.5 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/70 flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                            <input
                              type="text"
                              autoFocus
                              value={courseSearchQuery}
                              onChange={(e) => setCourseSearchQuery(e.target.value)}
                              placeholder="Search by course_id (e.g. course_101) or title..."
                              className="w-full bg-transparent text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none border-0"
                            />
                            {courseSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setCourseSearchQuery('')}
                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* List of Courses */}
                          <div className="max-h-60 overflow-y-auto divide-y divide-[#F2EDE4]">
                            {filteredCourses.length === 0 ? (
                              <div className="p-4 text-center text-xs text-[var(--color-text-muted)]">
                                No course found matching &quot;{courseSearchQuery}&quot;
                              </div>
                            ) : (
                              filteredCourses.map((c) => {
                                const isSelected = c.id === selectedCourseId;
                                return (
                                  <div
                                    key={c.id}
                                    onClick={() => handleSelectCourse(c)}
                                    className={`p-3 text-left cursor-pointer transition-colors flex items-start justify-between gap-2.5 ${
                                      isSelected
                                        ? 'bg-[var(--color-primary-subtle)] text-[var(--color-text-primary)]'
                                        : 'hover:bg-[var(--color-soft-cream)]/80'
                                    }`}
                                  >
                                    <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-[var(--color-tangerine)]">
                                          {c.course_id}
                                        </span>
                                        <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                                          {c.title}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                                        Faculty: {c.mentor_name ? `${c.mentor_identifier ? `[${c.mentor_identifier}] ` : ''}${c.mentor_name}` : 'None assigned'}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-[var(--color-tangerine)] shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Curriculum and core pricing are linked to this course.
                      </p>
                    </div>

                    {/* Mentor ID (Locked to Course Mentor) */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                          Assigned Mentor (Auto-filled from Course)
                        </label>
                        <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3 text-[var(--color-danger)]" /> Locked
                        </span>
                      </div>
                      <div className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-soft-cream)] px-3 py-2 text-sm text-[var(--color-text-primary)] font-medium cursor-not-allowed">
                        {mentorDisplayName}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Automatically determined by the selected course faculty. Cannot be changed manually.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Regional Setting, Schedule & Parameters */}
                <div className="card bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
                  <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/60 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--color-tangerine)]" />
                    <h2 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                      2. Region, Timing &amp; Enrollment Parameters
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                    {/* Batch Region (batch_region) */}
                    <div className="sm:col-span-2 md:col-span-1">
                      <label htmlFor="batchRegion" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                        <span>Batch Region (batch_region) <span className="text-[var(--color-tangerine)]">*</span></span>
                      </label>
                      <select
                        id="batchRegion"
                        required
                        value={region}
                        onChange={(e) => setRegion(e.target.value as BatchRegion)}
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs cursor-pointer"
                      >
                        <option value="india">India (INR Currency)</option>
                        <option value="uk">United Kingdom (UK / GBP Currency)</option>
                      </select>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Select learner demographic and regional currency.
                      </p>
                    </div>

                    {/* Registrations Status */}
                    <div>
                      <label htmlFor="registrations" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 block">
                        Registration Status
                      </label>
                      <select
                        id="registrations"
                        value={registrations}
                        onChange={(e) => setRegistrations(e.target.value as BatchRegistrationStatus)}
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs cursor-pointer"
                      >
                        <option value="open">Open (Accepting Enrollments)</option>
                        <option value="closed">Closed (Enrollment Halted)</option>
                      </select>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Controls learner checkout availability.
                      </p>
                    </div>

                    {/* Instruction Language */}
                    <div>
                      <label htmlFor="language" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 block">
                        Instruction Language
                      </label>
                      <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as BatchLanguage)}
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs cursor-pointer"
                      >
                        <option value="english">English</option>
                        <option value="telugu">Telugu</option>
                      </select>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Language spoken during live sessions.
                      </p>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label htmlFor="startDate" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                        <span>Start Date</span>
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label htmlFor="endDate" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                        <span>End Date</span>
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
                      />
                    </div>

                    {/* Grace Period (Days) */}
                    <div>
                      <label htmlFor="gracePeriod" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 block">
                        Grace Period (Days)
                      </label>
                      <input
                        id="gracePeriod"
                        type="number"
                        min="0"
                        value={gracePeriod}
                        onChange={(e) => setGracePeriod(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
                        placeholder="0"
                      />
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Days allowed before payment validation.
                      </p>
                    </div>

                    {/* From Time (Clean layout without icon collision) */}
                    <div>
                      <label htmlFor="fromTime" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                        <span>Daily From Time</span>
                      </label>
                      <input
                        id="fromTime"
                        type="time"
                        value={fromTime}
                        onChange={(e) => setFromTime(e.target.value)}
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
                      />
                    </div>

                    {/* To Time (Clean layout without icon collision) */}
                    <div>
                      <label htmlFor="toTime" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                        <span>Daily To Time</span>
                      </label>
                      <input
                        id="toTime"
                        type="time"
                        value={toTime}
                        onChange={(e) => setToTime(e.target.value)}
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
                      />
                    </div>

                    {/* Live Link */}
                    <div className="sm:col-span-2 md:col-span-1">
                      <label htmlFor="liveLink" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                        <span>Live Meeting Link</span>
                      </label>
                      <input
                        id="liveLink"
                        type="url"
                        value={liveLink}
                        onChange={(e) => setLiveLink(e.target.value)}
                        placeholder="https://meet.google.com/xyz-abc-def"
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none shadow-xs"
                      />
                    </div>

                    {/* Notes & Instructions */}
                    <div className="sm:col-span-2 md:col-span-3">
                      <label htmlFor="notes" className="text-xs font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                        <span>Batch Notes &amp; Guidelines</span>
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add batch schedule notes, prerequisites, orientation instructions, or guidelines..."
                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none resize-y shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Link
                    href="/admin/batches/dashboard"
                    className="btn btn-outline text-xs px-5 py-2.5 rounded-[var(--radius-md)] border border-[#D5CDBD] cursor-pointer"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-xs px-6 py-2.5 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold shadow-sm disabled:opacity-50"
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
