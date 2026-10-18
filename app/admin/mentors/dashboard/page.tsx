'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddMentor from '@/components/admin/addmentor';
import { getMentors, getMentorsCount, Mentor } from '@/lib/mentorsStore';
import { Plus, Search, GraduationCap, ExternalLink, Loader2, Phone, Mail, User } from 'lucide-react';

export default function MentorsDashboardPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddMentorOpen, setIsAddMentorOpen] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    async function fetchInitialData() {
      const [count, listRes] = await Promise.all([
        getMentorsCount(),
        getMentors(),
      ]);

      if (!ignore) {
        setTotalCount(count);
        if (listRes.data) {
          setMentors(listRes.data);
        }
        setLoading(false);
      }
    }

    fetchInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    const result = await getMentors(val);
    if (result.data) {
      setMentors(result.data);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await getMentors(searchQuery);
    if (result.data) {
      setMentors(result.data);
    }
    setLoading(false);
  };

  const handleMentorAdded = (newMentor: Mentor) => {
    setMentors((prev) => [newMentor, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section with Title, Subtitle, and Add Mentor button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Mentors Management
                </h1>
                <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Manage mentors, view contact records, credentials, and profile allocations.
                </p>
              </div>

              {/* Add Mentor CTA */}
              <button
                type="button"
                onClick={() => setIsAddMentorOpen(true)}
                className="btn btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Mentor</span>
              </button>
            </div>

            {/* Metrics & Search Bar Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Mentors Metric Card */}
              <div className="card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                    Total Mentors
                  </div>
                  <div className="metric-value text-3xl font-bold text-[var(--color-text-primary)] mt-1">
                    {loading && totalCount === 0 ? '...' : totalCount}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    Registered academy faculty
                  </div>
                </div>
                <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-primary-subtle)] flex items-center justify-center text-[var(--color-tangerine)]">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>

              {/* Search Bar (Spans 2 columns on md) */}
              <div className="md:col-span-2 card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex flex-col justify-center">
                <label className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-2">
                  Search Mentors
                </label>
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by mentor_id, name, or email..."
                    className="input-base pl-9 pr-24 py-2 text-sm border-[#E5DFD3]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="absolute right-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Mentors List Table */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
                    List of Mentors
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {mentors.length} {mentors.length === 1 ? 'mentor' : 'mentors'} found
                  </p>
                </div>
              </div>

              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table-base">
                  <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                    <tr>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Mentor ID
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Name
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Email
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Mobile
                      </th>
                      <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body divide-y divide-[#E5DFD3]">
                    {loading && mentors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[var(--color-text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                            <span className="text-sm">Loading mentors...</span>
                          </div>
                        </td>
                      </tr>
                    ) : mentors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <GraduationCap className="w-10 h-10 text-[var(--color-text-muted)]" />
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              No mentors found
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                              {searchQuery
                                ? `No mentor matches "${searchQuery}". Try searching with another term.`
                                : 'Get started by clicking Add Mentor above to register faculty.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      mentors.map((mentor) => (
                        <tr
                          key={mentor.id}
                          className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                        >
                          {/* Mentor ID */}
                          <td className="table-data-cell py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-mono font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                              {mentor.mentor_id}
                            </span>
                          </td>

                          {/* Name */}
                          <td className="table-data-cell py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[var(--color-soft-orange)]/50 flex items-center justify-center text-[var(--color-text-primary)] font-bold text-xs shrink-0">
                                {mentor.name ? mentor.name.charAt(0).toUpperCase() : 'M'}
                              </div>
                              <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                                {mentor.name}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="table-data-cell py-3.5 px-4 text-sm text-[var(--color-text-secondary)]">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                              <span>{mentor.email}</span>
                            </div>
                          </td>

                          {/* Mobile */}
                          <td className="table-data-cell py-3.5 px-4 text-sm text-[var(--color-text-secondary)]">
                            {mentor.mobile ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                                <span>{mentor.mobile}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--color-text-muted)] italic">
                                Not provided
                              </span>
                            )}
                          </td>

                          {/* Open Action */}
                          <td className="table-data-cell py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/mentors/openmentor?id=${mentor.id}`}
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

      {/* Add Mentor Modal */}
      <AddMentor
        isOpen={isAddMentorOpen}
        onClose={() => setIsAddMentorOpen(false)}
        onMentorAdded={handleMentorAdded}
      />
    </div>
  );
}
