'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getCourseExams,
  getCourseExamsCount,
  deleteCourseExam,
  CourseExam,
} from '@/lib/courseexamsStore';
import { getCourseById, Course } from '@/lib/coursesStore';
import {
  FileText,
  Plus,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Trash2,
  HelpCircle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

function CourseExamsContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id') || searchParams.get('id') || '';

  const [course, setCourse] = useState<Course | null>(null);
  const [exams, setExams] = useState<CourseExam[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!courseId) {
        if (!ignore) {
          setErrorMsg('No course ID was specified in the URL.');
          setLoading(false);
        }
        return;
      }

      try {
        const [courseRes, countRes, examsRes] = await Promise.all([
          getCourseById(courseId),
          getCourseExamsCount(courseId),
          getCourseExams(courseId),
        ]);

        if (!ignore) {
          if (courseRes.data) {
            setCourse(courseRes.data);
          } else if (courseRes.error) {
            setErrorMsg(courseRes.error.message);
          }

          setTotalCount(countRes);

          if (examsRes.data) {
            setExams(examsRes.data);
          } else if (examsRes.error) {
            setErrorMsg(examsRes.error.message);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load exams');
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
  }, [courseId]);

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete exam "${examTitle}" and all its questions?`)) {
      return;
    }

    setDeletingId(examId);
    try {
      const { error } = await deleteCourseExam(examId);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setExams((prev) => prev.filter((e) => e.id !== examId));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setActionSuccess(`Exam "${examTitle}" was deleted successfully.`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete exam');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5DFD3]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses/dashboard"
            className="p-2 rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
            title="Back to Courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-tangerine)]">
                Course Exams
              </span>
              {course?.course_id && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-soft-orange)]/40 border border-[#E5DFD3] text-[var(--color-text-primary)]">
                  {course.course_id}
                </span>
              )}
            </div>
            <h1 className="page-title text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              {course?.title || 'Manage Exams'}
            </h1>
          </div>
        </div>

        {/* Add Exam Button */}
        <Link
          href={`/admin/courses/addexam?course_id=${courseId}`}
          className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </Link>
      </div>

      {/* Success / Error notification alerts */}
      {actionSuccess && (
        <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Overview Stat: Total Exams */}
      <div className="card px-4 py-3 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--color-tangerine)]" />
          <span className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)]">
            Total Exams :{' '}
            <span className="font-bold text-[var(--color-tangerine)]">
              {loading ? '...' : totalCount}
            </span>
          </span>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          {exams.length} {exams.length === 1 ? 'record' : 'records'} loaded
        </span>
      </div>

      {/* Exams Table */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
          <h2 className="card-title text-base font-bold text-[var(--color-text-primary)]">
            Exams List
          </h2>
        </div>

        <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
          <table className="table-base w-full">
            <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
              <tr>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                  Exam Title
                </th>
                <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                  Total Questions (total_q)
                </th>
                <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="table-body divide-y divide-[#E5DFD3]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                      <span className="text-sm">Loading course exams...</span>
                    </div>
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <FileText className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        No exams found for this course
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                        Create exams with multiple choice questions, hints, and correct answers.
                      </p>
                      <Link
                        href={`/admin/courses/addexam?course_id=${courseId}`}
                        className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] mt-2 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Exam</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                  >
                    {/* Exam Title & Description */}
                    <td className="table-data-cell py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                      <div>
                        <span className="font-semibold text-xs sm:text-sm block">
                          {exam.title}
                        </span>
                        {exam.description && (
                          <span className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                            {exam.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Questions Count (total_q) */}
                    <td className="table-data-cell py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold font-mono bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                        <HelpCircle className="w-3 h-3" />
                        {exam.total_q}
                      </span>
                    </td>

                    {/* Action Column: Open button */}
                    <td className="table-data-cell py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/courses/openexam?exam_id=${exam.id}&course_id=${courseId}`}
                          className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
                          title="Open and edit exam details"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          disabled={deletingId === exam.id}
                          className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                          title="Delete Exam"
                          aria-label="Delete Exam"
                        >
                          {deletingId === exam.id ? (
                            <Loader2 className="w-4 h-4 anim-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
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
  );
}

export default function CourseExamsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Suspense
              fallback={
                <div className="p-12 text-center text-[var(--color-text-muted)]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                    <span>Loading exam workspace...</span>
                  </div>
                </div>
              }
            >
              <CourseExamsContent />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
