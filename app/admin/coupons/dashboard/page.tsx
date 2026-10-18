'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddCoupon from '@/components/admin/addcoupon';
import OpenCoupon from '@/components/opencoupon';
import {
  getCoupons,
  getActiveCouponsCount,
  getTotalCouponsCount,
  isCouponActive,
  CouponCode,
} from '@/lib/couponsStore';
import {
  Plus,
  Search,
  Tag,
  Loader2,
  Calendar,
  Globe,
  Lock,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

export default function CouponsDashboardPage() {
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponCode | null>(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const [actCount, totCount, listRes] = await Promise.all([
        getActiveCouponsCount(),
        getTotalCouponsCount(),
        getCoupons(),
      ]);

      if (!ignore) {
        setActiveCount(actCount);
        setTotalCount(totCount);
        if (listRes.data) {
          setCoupons(listRes.data);
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
    const result = await getCoupons(val);
    if (result.data) {
      setCoupons(result.data);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await getCoupons(searchQuery);
    if (result.data) {
      setCoupons(result.data);
    }
    setLoading(false);
  };

  const handleCouponAdded = (newCoupon: CouponCode) => {
    setCoupons((prev) => [newCoupon, ...prev]);
    setTotalCount((prev) => prev + 1);
    if (isCouponActive(newCoupon)) {
      setActiveCount((prev) => prev + 1);
    }
  };

  const handleCouponUpdated = (updated: CouponCode) => {
    setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    // Refresh active count
    getActiveCouponsCount().then((cnt) => setActiveCount(cnt));
  };

  const handleOpenCoupon = (coupon: CouponCode) => {
    setSelectedCoupon(coupon);
    setIsOpenModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section with Title, Subtitle, and Add Coupon button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Coupons Management
                </h1>
                <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Manage promotional vouchers, discount limits, expiration dates, and checkout visibility.
                </p>
              </div>

              {/* Add Coupon Button */}
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="btn btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Coupon</span>
              </button>
            </div>

            {/* Metrics & Search Bar Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Active Coupons Card */}
              <div className="card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                    Total Active Coupons
                  </div>
                  <div className="metric-value text-3xl font-bold text-[var(--color-text-primary)] mt-1">
                    {loading && activeCount === 0 ? '...' : activeCount}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    Available for student redemptions ({totalCount} total)
                  </div>
                </div>
                <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-primary-subtle)] flex items-center justify-center text-[var(--color-tangerine)]">
                  <Tag className="w-6 h-6" />
                </div>
              </div>

              {/* Search Bar (Spans 2 columns on md) */}
              <div className="md:col-span-2 card p-5 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm flex flex-col justify-center">
                <label className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-2">
                  Search Coupons (code)
                </label>
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by coupon code (e.g. WELCOME50)..."
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

            {/* List of Codes Table */}
            <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
                <div>
                  <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
                    List of Codes
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {coupons.length} {coupons.length === 1 ? 'coupon code' : 'coupon codes'} found
                  </p>
                </div>
              </div>

              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table-base">
                  <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                    <tr>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Code
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Discount Value
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Valid Till
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Usage Count
                      </th>
                      <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Visibility
                      </th>
                      <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body divide-y divide-[#E5DFD3]">
                    {loading && coupons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[var(--color-text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                            <span className="text-sm">Loading coupons...</span>
                          </div>
                        </td>
                      </tr>
                    ) : coupons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Tag className="w-10 h-10 text-[var(--color-text-muted)]" />
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              No coupon codes found
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                              {searchQuery
                                ? `No coupon matches "${searchQuery}". Try a different code.`
                                : 'Get started by clicking Add Coupon above to create promotional vouchers.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      coupons.map((c) => {
                        const active = isCouponActive(c);
                        const hasExpiry = Boolean(c.valid_till);

                        return (
                          <tr
                            key={c.id}
                            className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                          >
                            {/* Code */}
                            <td className="table-data-cell py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-mono font-bold tracking-wider bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                                  {c.code}
                                </span>
                                {active && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
                                )}
                              </div>
                            </td>

                            {/* Discount Value */}
                            <td className="table-data-cell py-3.5 px-4 font-semibold text-sm text-[var(--color-text-primary)]">
                              ₹{c.discount_value.toFixed(2)}
                            </td>

                            {/* Valid Till */}
                            <td className="table-data-cell py-3.5 px-4 text-xs text-[var(--color-text-secondary)]">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                                <span>
                                  {hasExpiry
                                    ? new Date(c.valid_till!).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : 'No Expiration'}
                                </span>
                              </div>
                            </td>

                            {/* Count */}
                            <td className="table-data-cell py-3.5 px-4 text-xs text-[var(--color-text-secondary)]">
                              <div className="font-medium text-[var(--color-text-primary)]">
                                {c.count}{' '}
                                <span className="text-[var(--color-text-muted)] font-normal">
                                  / {c.thersold === 0 ? '∞ (Unlimited)' : c.thersold}
                                </span>
                              </div>
                            </td>

                            {/* Visibility (is_public) */}
                            <td className="table-data-cell py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-medium ${
                                  c.is_public
                                    ? 'bg-[var(--color-secondary-subtle)] text-[var(--color-text-primary)] border border-[var(--color-soft-orange)]'
                                    : 'bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] border border-[#E5DFD3]'
                                }`}
                              >
                                {c.is_public ? (
                                  <>
                                    <Globe className="w-3 h-3 text-[var(--color-tangerine)]" />
                                    <span>Public</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3 text-[var(--color-text-muted)]" />
                                    <span>Private</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Action: Open */}
                            <td className="table-data-cell py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenCoupon(c)}
                                className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Open</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Coupon Modal */}
      <AddCoupon
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCouponAdded={handleCouponAdded}
      />

      {/* Open / Edit Coupon Modal */}
      <OpenCoupon
        isOpen={isOpenModalOpen}
        coupon={selectedCoupon}
        onClose={() => {
          setIsOpenModalOpen(false);
          setSelectedCoupon(null);
        }}
        onCouponUpdated={handleCouponUpdated}
      />
    </div>
  );
}
