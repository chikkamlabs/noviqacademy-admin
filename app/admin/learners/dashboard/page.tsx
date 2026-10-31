'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getLearners, getLearnersCount, Learner } from '@/lib/learnersStore';
import {
  Search,
  Users,
  ExternalLink,
  Loader2,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
} from 'lucide-react';

export default function LearnersDashboardPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const [count, listRes] = await Promise.all([
        getLearnersCount(),
        getLearners(),
      ]);

      if (!ignore) {
        setTotalCount(count);
        if (listRes.data) {
          setLearners(listRes.data);
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
    const result = await getLearners(val);
    if (result.data) {
      setLearners(result.data);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await getLearners(searchQuery);
    if (result.data) {
      setLearners(result.data);
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
            {/* Header section with Title and Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Learners Directory
                </h1>
                <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Manage student profiles, contact details, regional affiliations, and security credentials.
                </p>
              </div>
            </div>

            {/* Compact Metrics & Search Bar Section */}
            <div className="card px-3.5 py-2 md:py-2.5 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              {/* Total learners: count then small icon */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] shrink-0 self-start sm:self-auto">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-[var(--color-text-primary)]">
                  Total learners : <span className="font-bold text-[var(--color-tangerine)] text-xs sm:text-sm md:text-base">{loading && totalCount === 0 ? '...' : totalCount}</span>
                </span>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-tangerine)] shrink-0" />
              </div>

              {/* Search Bar with proper left padding to avoid icon-placeholder overlap */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:max-w-md w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by student name, email, or mobile..."
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

            {/* Learners List Table */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
                    List of Learners
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {learners.length} {learners.length === 1 ? 'student' : 'students'} found
                  </p>
                </div>
              </div>

              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table-base">
                  <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                    <tr>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Name
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Mobile
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Email
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Region
                      </th>
                      <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body divide-y divide-[#E5DFD3]">
                    {loading && learners.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[var(--color-text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                            <span className="text-sm">Loading learners...</span>
                          </div>
                        </td>
                      </tr>
                    ) : learners.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Users className="w-10 h-10 text-[var(--color-text-muted)]" />
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              No learners found
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                              {searchQuery
                                ? `No learner matches "${searchQuery}". Try searching by phone, email, or name.`
                                : 'Learners will automatically appear here once registered.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      learners.map((learner) => (
                        <tr
                          key={learner.id}
                          className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                        >
                          {/* Name */}
                          <td className="table-data-cell py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[var(--color-soft-orange)]/50 flex items-center justify-center text-[var(--color-text-primary)] font-bold text-xs shrink-0">
                                {learner.name ? learner.name.charAt(0).toUpperCase() : 'L'}
                              </div>
                              <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                                {learner.name}
                              </span>
                            </div>
                          </td>

                          {/* Mobile */}
                          <td className="table-data-cell py-3.5 px-4 text-sm text-[var(--color-text-secondary)]">
                            {learner.mobile ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                                <span>{learner.mobile}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--color-text-muted)] italic">
                                Not provided
                              </span>
                            )}
                          </td>

                          {/* Email */}
                          <td className="table-data-cell py-3.5 px-4 text-sm text-[var(--color-text-secondary)]">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                              <span>{learner.email}</span>
                            </div>
                          </td>

                          {/* Region */}
                          <td className="table-data-cell py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold uppercase tracking-wider bg-[var(--color-secondary-subtle)] text-[var(--color-text-primary)] border border-[var(--color-soft-orange)]">
                              <MapPin className="w-3 h-3 text-[var(--color-tangerine)]" />
                              <span>{learner.region}</span>
                            </span>
                          </td>

                          {/* Open Action */}
                          <td className="table-data-cell py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/learners/openlearner?id=${learner.id}`}
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
