'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import { getAdminDashboardStats, AdminDashboardStats } from '@/lib/admindashboard';
import { BookOpen, Layers, ClipboardList, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalCourses: 0,
    totalBatches: 0,
    lastWeekRegistrations: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      setLoading(true);
      try {
        const data = await getAdminDashboardStats();
        if (!ignore) {
          setStats(data);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      ignore = true;
    };
  }, []);

  const cards = [
    {
      label: 'Total Courses',
      value: stats.totalCourses,
      subtitle: 'All courses in catalog',
      icon: BookOpen,
    },
    {
      label: 'Total Batches',
      value: stats.totalBatches,
      subtitle: 'All scheduled & active batches',
      icon: Layers,
    },
    {
      label: 'Total Registrations (Last 1 Week)',
      value: stats.lastWeekRegistrations,
      subtitle: 'New registrations in the past 7 days',
      icon: ClipboardList,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      {/* Admin Top Header */}
      <AdminHeader />

      {/* Main Body with Sticky Sidebar & Dashboard Content */}
      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="pb-2 border-b border-[#E5DFD3]">
              <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                Admin Dashboard
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="card p-6 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                          {card.label}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {card.subtitle}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5DFD3]">
                      {loading ? (
                        <div className="flex items-center gap-2 text-[var(--color-text-muted)] py-1">
                          <Loader2 className="w-5 h-5 anim-spin text-[var(--color-tangerine)]" />
                          <span className="text-sm">Loading...</span>
                        </div>
                      ) : (
                        <span className="metric-value text-3xl md:text-4xl font-bold text-[var(--color-tangerine)] font-mono">
                          {card.value}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
