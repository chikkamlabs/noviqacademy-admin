'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getCourses, getCoursesCount, Course, getMentorsList, MentorSummary } from '@/lib/coursesStore';
import { Plus, Search, BookOpen, ExternalLink, Loader2, Star } from 'lucide-react';

export default function CoursesDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mentors, setMentors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial stats and list
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [count, mentorsList] = await Promise.all([
        getCoursesCount(),
        getMentorsList(),
      ]);

      setTotalCount(count);

      // Create mentor map id -> name
      const mentorMap: Record<string, string> = {};
      (mentorsList || []).forEach((m: MentorSummary) => {
        mentorMap[m.id] = m.name || m.email;
      });
      setMentors(mentorMap);

      const result = await getCourses();
      if (result.data) {
        setCourses(result.data);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  // Handle Search Query filtering
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await getCourses(searchQuery);
    if (result.data) {
      setCourses(result.data);
    }
    setLoading(false);
  };

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    const result = await getCourses(val);
    if (result.data) {
      setCourses(result.data);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section with Title, Total Count, and Add Course CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Courses Management
                </h1>
                <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Manage all course catalogs, curricula, mentor allocations, and pricing.
                </p>
              </div>

              {/* Add Course Button */}
              <Link
                href="/admin/courses/addcourse"
                className="btn btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Course</span>
              </Link>
            </div>

            {/* Compact Stat & Search Bar Section */}
            <div className="card px-3.5 py-2 md:py-2.5 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              {/* Total courses: count then small icon */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] shrink-0 self-start sm:self-auto">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-[var(--color-text-primary)]">
                  Total courses : <span className="font-bold text-[var(--color-tangerine)] text-xs sm:text-sm md:text-base">{totalCount}</span>
                </span>
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-tangerine)] shrink-0" />
              </div>

              {/* Search Bar for course_id */}
              <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 sm:max-w-md w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by course_id (e.g., course_101)..."
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-3 py-1 sm:py-1.5 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer shrink-0"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Courses Table / List Display */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Course Catalog
                </h2>
                <span className="small-text text-[var(--color-text-muted)]">
                  {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
                  <Loader2 className="w-7 h-7 text-[var(--color-tangerine)] anim-spin" />
                  <span className="text-sm">Loading courses...</span>
                </div>
              ) : courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <BookOpen className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-60" />
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                    No courses found
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-sm mt-1 mb-4">
                    {searchQuery
                      ? `No course matches course_id "${searchQuery}". Try a different search.`
                      : 'No courses have been created yet. Click "Add Course" to get started.'}
                  </p>
                  <Link
                    href="/admin/courses/addcourse"
                    className="btn btn-primary text-xs font-semibold px-4 py-2 rounded-[var(--radius-md)]"
                  >
                    Add First Course
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-soft-cream)] border-b border-[#E5DFD3] text-[var(--color-text-primary)]">
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                          Course ID
                        </th>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                          Title
                        </th>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                          Mentor
                        </th>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                          Featured
                        </th>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                          Selling Price
                        </th>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DFD3]">
                      {courses.map((course) => (
                        <tr
                          key={course.id}
                          className="hover:bg-[var(--color-soft-cream)] transition-colors"
                        >
                          {/* course_id */}
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-[var(--color-tangerine)]">
                            {course.course_id}
                          </td>

                          {/* Title */}
                          <td className="py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                            <div>{course.title}</div>
                            {course.sub_heading && (
                              <div className="text-xs text-[var(--color-text-muted)] truncate max-w-xs">
                                {course.sub_heading}
                              </div>
                            )}
                          </td>

                          {/* mentor_id */}
                          <td className="py-3.5 px-4 text-xs text-[var(--color-text-secondary)]">
                            {course.mentor_id
                              ? mentors[course.mentor_id] || course.mentor_id.slice(0, 8) + '...'
                              : 'Not assigned'}
                          </td>

                          {/* is_featured */}
                          <td className="py-3.5 px-4">
                            {course.is_featured ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)]">
                                <Star className="w-3 h-3 fill-current" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--color-text-muted)]">
                                No
                              </span>
                            )}
                          </td>

                          {/* selling_price */}
                          <td className="py-3.5 px-4 font-semibold text-[var(--color-text-primary)]">
                            ₹{course.selling_price.toLocaleString('en-IN')}
                            {course.price > course.selling_price && (
                              <span className="ml-1.5 text-xs line-through text-[var(--color-text-muted)] font-normal">
                                ₹{course.price.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          {/* Open Button */}
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/courses/opencourse?id=${course.id}`}
                              className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] border border-[#D5CDBD] transition"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
