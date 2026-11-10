'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import {
  getMentorCourses,
  getMentorCoursesCount,
  MentorCourseItem,
} from '@/lib/courseresourcesStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  Search,
  BookOpen,
  FolderOpen,
  Loader2,
  FileText,
} from 'lucide-react';

export default function MentorCoursesDashboardPage() {
  const [mentorName, setMentorName] = useState<string>('Mentor Name');
  const [courses, setCourses] = useState<MentorCourseItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
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

        const [count, listRes] = await Promise.all([
          getMentorCoursesCount(),
          getMentorCourses(),
        ]);

        if (!ignore) {
          setTotalCount(count);
          if (listRes.data) {
            setCourses(listRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load mentor courses:', err);
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
    const result = await getMentorCourses(undefined, val);
    if (result.data) {
      setCourses(result.data);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await getMentorCourses(undefined, searchQuery);
    if (result.data) {
      setCourses(result.data);
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
                Assigned Courses
              </h1>
              <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                View courses you mentor, attach learning materials, presentations, and manage drive links.
              </p>
            </div>

            {/* Total Courses & Search Bar Section */}
            <div className="card px-3.5 py-2.5 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              {/* Total Courses count for this mentor */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] shrink-0 self-start sm:self-auto">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-[var(--color-text-primary)]">
                  Total Courses :{' '}
                  <span className="font-bold text-[var(--color-tangerine)] text-xs sm:text-sm md:text-base">
                    {loading && totalCount === 0 ? '...' : totalCount}
                  </span>
                </span>
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-tangerine)] shrink-0" />
              </div>

              {/* Search Bar for course_id */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:max-w-md w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by course_id (e.g. course_101)..."
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

            {/* List of Courses Table */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
                    List of Courses
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {courses.length} {courses.length === 1 ? 'course' : 'courses'} listed
                  </p>
                </div>
              </div>

              <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
                <table className="table-base w-full">
                  <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                    <tr>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                        Course ID
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Name
                      </th>
                      <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-32">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body divide-y divide-[#E5DFD3]">
                    {loading && courses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-[var(--color-text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                            <span className="text-sm">Loading courses...</span>
                          </div>
                        </td>
                      </tr>
                    ) : courses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2.5">
                            <BookOpen className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              No courses assigned yet
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                              {searchQuery
                                ? `No course matches "${searchQuery}". Try a different search.`
                                : 'You currently do not have any courses assigned to you.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => (
                        <tr
                          key={course.id}
                          className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                        >
                          {/* Course ID */}
                          <td className="table-data-cell py-3.5 px-4 font-mono font-bold text-xs text-[var(--color-tangerine)]">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-mono font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                              {course.course_id}
                            </span>
                          </td>

                          {/* Name / Title */}
                          <td className="table-data-cell py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                            <div>
                              <span className="font-semibold text-xs sm:text-sm block">
                                {course.title}
                              </span>
                              {course.sub_heading && (
                                <span className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                                  {course.sub_heading}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action: Resources & Exams Buttons */}
                          <td className="table-data-cell py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/mentor/courses/resources?course_id=${course.id}`}
                                className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-soft-cream)] text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
                                title="Manage course resources"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                                <span>Resources</span>
                              </Link>

                              <Link
                                href={`/mentor/courses/exams?course_id=${course.id}`}
                                className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-soft-cream)] text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
                                title="View course exams"
                              >
                                <FileText className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                                <span>Exams</span>
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
