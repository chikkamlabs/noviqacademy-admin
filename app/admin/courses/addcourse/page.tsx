'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  generateNextCourseId,
  createCourse,
  getMentorsList,
  MentorSummary,
  CourseStatus,
} from '@/lib/coursesStore';
import { ArrowLeft, Check, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

export default function AddCoursePage() {
  const router = useRouter();

  // Form Fields State
  const [courseId, setCourseId] = useState<string>('course_101');
  const [title, setTitle] = useState<string>('');
  const [subHeading, setSubHeading] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [mentorId, setMentorId] = useState<string>('');
  const [previewMediaId, setPreviewMediaId] = useState<string>('');
  const [status, setStatus] = useState<CourseStatus>('active');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);

  // Dynamic Array Fields
  const [learningItem, setLearningItem] = useState<string>('');
  const [courseLearnings, setCourseLearnings] = useState<string[]>([]);

  const [includeItem, setIncludeItem] = useState<string>('');
  const [courseIncludes, setCourseIncludes] = useState<string[]>([]);

  // Helpers
  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setLoadingInitial(true);
      const [nextId, mentorsList] = await Promise.all([
        generateNextCourseId(),
        getMentorsList(),
      ]);
      setCourseId(nextId);
      setMentors(mentorsList || []);
      setLoadingInitial(false);
    }
    init();
  }, []);

  const addLearning = () => {
    if (learningItem.trim()) {
      setCourseLearnings([...courseLearnings, learningItem.trim()]);
      setLearningItem('');
    }
  };

  const removeLearning = (index: number) => {
    setCourseLearnings(courseLearnings.filter((_, i) => i !== index));
  };

  const addInclude = () => {
    if (includeItem.trim()) {
      setCourseIncludes([...courseIncludes, includeItem.trim()]);
      setIncludeItem('');
    }
  };

  const removeInclude = (index: number) => {
    setCourseIncludes(courseIncludes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Course Title is required.');
      return;
    }

    if (price < 0 || sellingPrice < 0) {
      setErrorMessage('Prices cannot be negative numbers.');
      return;
    }

    setSubmitting(true);

    const result = await createCourse({
      course_id: courseId,
      title: title.trim(),
      sub_heading: subHeading.trim() || null,
      description: description.trim() || null,
      price: Number(price),
      selling_price: Number(sellingPrice),
      duration: Number(duration),
      mentor_id: mentorId || null,
      preview_media_id: previewMediaId.trim() || null,
      course_learnings: courseLearnings,
      course_includes: courseIncludes,
      status,
      is_featured: isFeatured,
    });

    if (result.error) {
      setErrorMessage(result.error.message || 'Failed to create course.');
      setSubmitting(false);
      return;
    }

    // Success -> redirect to courses dashboard
    router.push('/admin/courses/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Back and Heading */}
            <div className="flex items-center gap-3 pb-2 border-b border-[#E5DFD3]">
              <Link
                href="/admin/courses/dashboard"
                className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] border border-[#E5DFD3] transition"
                title="Back to Courses"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Add New Course
                </h1>
                <p className="subheading-text text-xs text-[var(--color-text-muted)]">
                  Fill in all required fields to register a course in the Noviq Academy catalog.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] flex items-start gap-2.5 text-[var(--color-danger)] text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold">{errorMessage}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
                <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2">
                  1. Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* course_id (Auto-created, Readonly) */}
                  <div className="form-group mb-0">
                    <label className="form-label mb-1">
                      Course ID (Auto Generated)
                    </label>
                    <div className="flex items-center rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-soft-cream)] px-3 py-2 text-sm font-mono font-bold text-[var(--color-tangerine)]">
                      {loadingInitial ? (
                        <Loader2 className="w-4 h-4 anim-spin" />
                      ) : (
                        courseId
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--color-text-muted)] mt-1">
                      Auto incremented pattern (e.g. course_101, course_102)
                    </span>
                  </div>

                  {/* Title */}
                  <div className="form-group mb-0">
                    <label htmlFor="title" className="form-label mb-1">
                      Course Title <span className="text-[var(--color-tangerine)]">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Full Stack Web Development Mastery"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Sub Heading */}
                  <div className="form-group md:col-span-2 mb-0">
                    <label htmlFor="subHeading" className="form-label mb-1">
                      Sub Heading / Tagline
                    </label>
                    <input
                      id="subHeading"
                      type="text"
                      value={subHeading}
                      onChange={(e) => setSubHeading(e.target.value)}
                      placeholder="e.g. Master frontend, backend, APIs, and cloud deployments"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group md:col-span-2 mb-0">
                    <label htmlFor="description" className="form-label mb-1">
                      Course Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed description of what learners will study..."
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Duration */}
              <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
                <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2">
                  2. Pricing, Duration & Assignment
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Price */}
                  <div className="form-group mb-0">
                    <label htmlFor="price" className="form-label mb-1">
                      Original Price (₹)
                    </label>
                    <input
                      id="price"
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Selling Price */}
                  <div className="form-group mb-0">
                    <label htmlFor="sellingPrice" className="form-label mb-1">
                      Selling Price (₹)
                    </label>
                    <input
                      id="sellingPrice"
                      type="number"
                      min={0}
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Duration in Days */}
                  <div className="form-group mb-0">
                    <label htmlFor="duration" className="form-label mb-1">
                      Duration (in Days)
                    </label>
                    <input
                      id="duration"
                      type="number"
                      min={1}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Mentor Assignment */}
                  <div className="form-group md:col-span-2 mb-0">
                    <label htmlFor="mentorId" className="form-label mb-1">
                      Assign Mentor
                    </label>
                    <select
                      id="mentorId"
                      value={mentorId}
                      onChange={(e) => setMentorId(e.target.value)}
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                    >
                      <option value="">-- Select Mentor (Optional) --</option>
                      {mentors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preview Media ID */}
                  <div className="form-group mb-0">
                    <label htmlFor="previewMediaId" className="form-label mb-1">
                      Preview Media ID / URL
                    </label>
                    <input
                      id="previewMediaId"
                      type="text"
                      value={previewMediaId}
                      onChange={(e) => setPreviewMediaId(e.target.value)}
                      placeholder="e.g. video_intro_01"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div className="form-group mb-0">
                    <label htmlFor="status" className="form-label mb-1">
                      Course Status
                    </label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CourseStatus)}
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                    >
                      <option value="active">Active (Visible in Catalog)</option>
                      <option value="deactivated">Deactivated (Draft/Archived)</option>
                    </select>
                  </div>

                  {/* Is Featured */}
                  <div className="form-group mb-0 flex items-center pt-6 gap-2">
                    <input
                      id="isFeatured"
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-tangerine)] cursor-pointer"
                    />
                    <label htmlFor="isFeatured" className="text-sm font-semibold text-[var(--color-text-primary)] cursor-pointer">
                      Mark as Featured Course
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Curriculum Learnings & Inclusions */}
              <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
                <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2">
                  3. Learnings & Inclusions (JSON Lists)
                </h2>

                {/* Course Learnings */}
                <div className="space-y-3">
                  <label className="form-label mb-1">
                    What learners will learn (course_learnings)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={learningItem}
                      onChange={(e) => setLearningItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLearning();
                        }
                      }}
                      placeholder="e.g. Master TypeScript and React App Router architecture"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={addLearning}
                      className="btn btn-outline px-3 py-2 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {courseLearnings.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {courseLearnings.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--color-soft-cream)] text-xs text-[var(--color-text-primary)]"
                        >
                          <span>• {item}</span>
                          <button
                            type="button"
                            onClick={() => removeLearning(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Course Includes */}
                <div className="space-y-3 pt-3 border-t border-[#E5DFD3]">
                  <label className="form-label mb-1">
                    What is included (course_includes)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={includeItem}
                      onChange={(e) => setIncludeItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addInclude();
                        }
                      }}
                      placeholder="e.g. 40+ hours live interactive mentorship sessions"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={addInclude}
                      className="btn btn-outline px-3 py-2 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {courseIncludes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {courseIncludes.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--color-soft-cream)] text-xs text-[var(--color-text-primary)]"
                        >
                          <span>• {item}</span>
                          <button
                            type="button"
                            onClick={() => removeInclude(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Done / Submit Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/admin/courses/dashboard"
                  className="btn btn-outline px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 anim-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Done</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
