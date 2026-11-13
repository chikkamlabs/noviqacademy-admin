'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getWorkshops,
  getActiveWorkshopsCount,
  Workshop,
} from '@/lib/workshopsStore';
import {
  Plus,
  Search,
  Presentation,
  ExternalLink,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react';

function formatWorkshopDate(dateStr?: string | null): string {
  if (!dateStr) return 'Date not set';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function WorkshopsDashboardPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      const [actCount, listRes] = await Promise.all([
        getActiveWorkshopsCount(),
        getWorkshops(),
      ]);

      if (!ignore) {
        setActiveCount(actCount);
        if (listRes.data) {
          setWorkshops(listRes.data);
        }
        setLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    const result = await getWorkshops(val);
    if (result.data) {
      setWorkshops(result.data);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await getWorkshops(searchQuery);
    if (result.data) {
      setWorkshops(result.data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section with Title, Subtitle, and Add Workshop CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Workshops Management
                </h1>
                <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Manage live and offline workshops, schedules, registration links, and active status.
                </p>
              </div>

              <Link
                href="/admin/workshops/addworkshop"
                className="btn btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Workshop</span>
              </Link>
            </div>

            {/* Compact Stat & Search Bar Section */}
            <div className="card px-3.5 py-2 md:py-2.5 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              {/* Total Workshops (status = true / active count) */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] shrink-0 self-start sm:self-auto">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-[var(--color-text-primary)]">
                  Total Workshops :{' '}
                  <span className="font-bold text-[var(--color-tangerine)] text-xs sm:text-sm md:text-base">
                    {loading && activeCount === 0 ? '...' : activeCount}
                  </span>
                </span>
                <Presentation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-tangerine)] shrink-0" />
              </div>

              {/* Search Bar (Workshop Title) */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 flex-1 sm:max-w-md w-full"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by Workshop Title..."
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-14 py-1 sm:py-1.5 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
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
                  className="btn btn-primary px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer shrink-0"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Workshops Table / List Display */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    List of Workshops
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {workshops.length} {workshops.length === 1 ? 'workshop' : 'workshops'} found
                  </p>
                </div>
              </div>

              {loading && workshops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
                  <Loader2 className="w-7 h-7 text-[var(--color-tangerine)] anim-spin" />
                  <span className="text-sm">Loading workshops...</span>
                </div>
              ) : workshops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Presentation className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-60" />
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                    No workshops found
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-sm mt-1 mb-4">
                    {searchQuery
                      ? `No workshop matches "${searchQuery}". Try a different title.`
                      : 'No workshops have been created yet. Click "Add Workshop" to get started.'}
                  </p>
                  <Link
                    href="/admin/workshops/addworkshop"
                    className="btn btn-primary text-xs font-semibold px-4 py-2 rounded-[var(--radius-md)]"
                  >
                    Add First Workshop
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-soft-cream)] border-b border-[#E5DFD3] text-[var(--color-text-primary)]">
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                          Workshop Title
                        </th>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                          Date and Time
                        </th>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DFD3]">
                      {workshops.map((workshop) => (
                        <tr
                          key={workshop.id}
                          className="hover:bg-[var(--color-soft-cream)] transition-colors"
                        >
                          {/* Workshop Title */}
                          <td className="py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                                {workshop.title}
                              </span>
                              {workshop.tag && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)]">
                                  {workshop.tag}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date and Time */}
                          <td className="py-3.5 px-4 text-xs text-[var(--color-text-secondary)]">
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                                <Calendar className="w-3.5 h-3.5 text-[var(--color-tangerine)] shrink-0" />
                                {formatWorkshopDate(workshop.date)}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                                <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                                {workshop.time || 'Time not set'}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] text-xs font-semibold ${
                                workshop.status
                                  ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]/30'
                                  : 'bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] border border-[#E5DFD3]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  workshop.status
                                    ? 'bg-[var(--color-success)]'
                                    : 'bg-[var(--color-text-muted)]'
                                }`}
                              />
                              {workshop.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Action: Open */}
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/workshops/openworkshop?id=${workshop.id}`}
                              className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
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
