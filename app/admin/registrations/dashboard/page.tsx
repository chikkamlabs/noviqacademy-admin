'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getRegistrations,
  getTodayRegistrationsCount,
  getTotalRegistrationsCount,
  getFilterOptions,
  RegistrationSummary,
  RegistrationStatus,
  PaymentStatus,
} from '@/lib/registrationsStore';
import {
  Search,
  ClipboardList,
  ExternalLink,
  Loader2,
  Calendar,
  Layers,
  BookOpen,
  User,
  CreditCard,
  Filter,
} from 'lucide-react';

export default function RegistrationsDashboardPage() {
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  // Filter Dropdown Options
  const [courses, setCourses] = useState<{ id: string; course_id: string; title: string }[]>([]);
  const [batches, setBatches] = useState<{ id: string; batch_id: string; course_id: string }[]>([]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const [todayCnt, totCnt, filterOpts, listRes] = await Promise.all([
        getTodayRegistrationsCount(),
        getTotalRegistrationsCount(),
        getFilterOptions(),
        getRegistrations(),
      ]);

      if (!ignore) {
        setTodayCount(todayCnt);
        setTotalCount(totCnt);
        setCourses(filterOpts.courses);
        setBatches(filterOpts.batches);
        if (listRes.data) {
          setRegistrations(listRes.data);
        }
        setLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleFilterChange = async (
    newSearch: string,
    newCourse: string,
    newBatch: string
  ) => {
    setLoading(true);
    const result = await getRegistrations({
      searchQuery: newSearch,
      courseId: newCourse,
      batchId: newBatch,
    });
    if (result.data) {
      setRegistrations(result.data);
    }
    setLoading(false);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    handleFilterChange(val, selectedCourse, selectedBatch);
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedBatch('all'); // Reset batch when course changes
    handleFilterChange(searchQuery, courseId, 'all');
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    handleFilterChange(searchQuery, selectedCourse, batchId);
  };

  // Filter batches dropdown according to selected course
  const availableBatches = selectedCourse === 'all'
    ? batches
    : batches.filter((b) => b.course_id === selectedCourse);

  const getStatusBadgeClass = (status: RegistrationStatus) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'completed':
        return 'badge-primary';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  };

  const getPaymentBadgeClass = (status: PaymentStatus | 'unpaid') => {
    switch (status) {
      case 'success':
        return 'badge-success';
      case 'failed':
      case 'cancelled':
        return 'badge-danger';
      case 'refunded':
        return 'badge-neutral';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header section with Title and Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Registrations & Enrollments
                </h1>
                <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Track course admissions, batch seats, payment statuses, and transaction details.
                </p>
              </div>
            </div>

            {/* Metrics & Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Registrations Today Metric Card */}
              <div className="card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                    Total Registrations (Today)
                  </div>
                  <div className="metric-value text-3xl font-bold text-[var(--color-text-primary)] mt-1">
                    {loading && todayCount === 0 ? '...' : todayCount}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    New enrollments today ({totalCount} all-time)
                  </div>
                </div>
                <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-primary-subtle)] flex items-center justify-center text-[var(--color-tangerine)]">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              {/* Search Bar (registration_id) */}
              <div className="card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex flex-col justify-center">
                <label className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-2">
                  Search by registration_id
                </label>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="e.g. REG_101..."
                    className="input-base pl-9 pr-3 py-2 text-sm border-[#E5DFD3]"
                  />
                </div>
              </div>

              {/* Course Filter Dropdown */}
              <div className="card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex flex-col justify-center">
                <label className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                  <span>Filter by Course</span>
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="select-base text-sm border-[#E5DFD3] py-2"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.course_id}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Filter Dropdown */}
              <div className="card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex flex-col justify-center">
                <label className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                  <span>Filter by Batch</span>
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="select-base text-sm border-[#E5DFD3] py-2"
                >
                  <option value="all">All Batches</option>
                  {availableBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Registrations List Table */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
                    List of Registrations
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {registrations.length} {registrations.length === 1 ? 'record' : 'records'} found
                  </p>
                </div>
              </div>

              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table-base">
                  <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                    <tr>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Registration ID
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Learner Details
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Course Details
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Batch Details
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Amount
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Status
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Payments Status
                      </th>
                      <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body divide-y divide-[#E5DFD3]">
                    {loading && registrations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[var(--color-text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                            <span className="text-sm">Loading registrations...</span>
                          </div>
                        </td>
                      </tr>
                    ) : registrations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <ClipboardList className="w-10 h-10 text-[var(--color-text-muted)]" />
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              No registration records found
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                              {searchQuery || selectedCourse !== 'all' || selectedBatch !== 'all'
                                ? 'No registration matches the selected filters.'
                                : 'Registrations will appear here as learners enroll in courses.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      registrations.map((reg) => (
                        <tr
                          key={reg.id}
                          className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                        >
                          {/* registration_id */}
                          <td className="table-data-cell py-3.5 px-4 font-mono font-semibold text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                              {reg.registration_id}
                            </span>
                          </td>

                          {/* learner details */}
                          <td className="table-data-cell py-3.5 px-4">
                            <div>
                              <span className="font-semibold text-sm text-[var(--color-text-primary)] block">
                                {reg.learner_name}
                              </span>
                              <span className="text-xs text-[var(--color-text-secondary)] block">
                                {reg.learner_email}
                              </span>
                              {reg.learner_mobile && (
                                <span className="text-[11px] text-[var(--color-text-muted)] block">
                                  {reg.learner_mobile}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* course details */}
                          <td className="table-data-cell py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
                              <div>
                                <span className="font-semibold text-xs font-mono text-[var(--color-text-primary)] block">
                                  {reg.course_identifier}
                                </span>
                                <span className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
                                  {reg.course_title}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* batch details */}
                          <td className="table-data-cell py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                              <div>
                                <span className="font-semibold text-xs text-[var(--color-text-primary)] block">
                                  {reg.batch_identifier}
                                </span>
                                {reg.batch_language && (
                                  <span className="text-[11px] text-[var(--color-text-muted)] capitalize block">
                                    {reg.batch_language}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* amount */}
                          <td className="table-data-cell py-3.5 px-4 font-semibold text-sm text-[var(--color-text-primary)]">
                            ₹{reg.amount.toFixed(2)}
                          </td>

                          {/* status */}
                          <td className="table-data-cell py-3.5 px-4">
                            <span
                              className={`badge text-xs capitalize ${getStatusBadgeClass(
                                reg.status
                              )}`}
                            >
                              {reg.status}
                            </span>
                          </td>

                          {/* payments.status */}
                          <td className="table-data-cell py-3.5 px-4">
                            <span
                              className={`badge text-xs capitalize ${getPaymentBadgeClass(
                                reg.payment_status
                              )}`}
                            >
                              {reg.payment_status === 'unpaid' ? 'Unpaid' : reg.payment_status}
                            </span>
                          </td>

                          {/* open action */}
                          <td className="table-data-cell py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/registrations/openregistration?id=${reg.id}`}
                              className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] transition cursor-pointer"
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
