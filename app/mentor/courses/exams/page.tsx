'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import {
  getCourseExams,
  getCourseExamsCount,
  CourseExam,
} from '@/lib/courseexamsStore';
import { getCourseById, Course } from '@/lib/coursesStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  FileText,
  ArrowLeft,
  ExternalLink,
  Loader2,
  HelpCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

function MentorCourseExamsContent({ mentorName }: { mentorName: string }) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id') || searchParams.get('id') || '';

  const [course, setCourse] = useState<Course | null>(null);
  const [exams, setExams] = useState<CourseExam[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load course exams');
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
            {/* Breadcrumb & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
              <div className="flex items-center gap-3">
                <Link
                  href="/mentor/courses/dashboard"
                  className="p-2 rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] transition cursor-pointer"
                  title="Back to Courses"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-tangerine)]">
                      Mentor Portal • Course Exams
                    </span>
                    {course?.course_id && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-soft-orange)]/40 border border-[#E5DFD3] text-[var(--color-text-primary)]">
                        {course.course_id}
                      </span>
                    )}
                  </div>
                  <h1 className="page-title text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                    {course?.title || 'Course Examinations'}
                  </h1>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Total Exams Stat Card */}
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
                {exams.length} {exams.length === 1 ? 'exam' : 'exams'} available
              </span>
            </div>

            {/* Exams Table */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h2 className="card-title text-base font-bold text-[var(--color-text-primary)]">
                    Exams List
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Official curriculum exams and assessments for this course.
                  </p>
                </div>
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
                      <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-32">
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
                            <span className="text-sm">Loading exams...</span>
                          </div>
                        </td>
                      </tr>
                    ) : exams.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2.5">
                            <BookOpen className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              No exams created for this course yet
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                              Exams created by the administration will appear here for review and batch assignment.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      exams.map((exam) => (
                        <tr
                          key={exam.id}
                          className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                        >
                          {/* Exam Title */}
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

                          {/* Total Questions (total_q) */}
                          <td className="table-data-cell py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold font-mono bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                              <HelpCircle className="w-3 h-3" />
                              {exam.total_q}
                            </span>
                          </td>

                          {/* Action: Open */}
                          <td className="table-data-cell py-3.5 px-4 text-right">
                            <Link
                              href={`/mentor/courses/openexam?exam_id=${exam.id}&course_id=${courseId}`}
                              className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
                              title="View exam questions and answers"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
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

export default function MentorCourseExamsPage() {
  const [mentorName, setMentorName] = useState('Mentor Name');

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
      } catch (err) {
        console.error('Failed to load mentor name:', err);
      }
    }
    loadMentor();
  }, []);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
            <span className="text-sm text-[var(--color-text-muted)]">Loading exams workspace...</span>
          </div>
        </div>
      }
    >
      <MentorCourseExamsContent mentorName={mentorName} />
    </Suspense>
  );
}
