'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getRegistrationDetails,
  RegistrationDetail,
  RegistrationStatus,
  PaymentStatus,
} from '@/lib/registrationsStore';
import {
  ArrowLeft,
  ClipboardList,
  CreditCard,
  User,
  BookOpen,
  Layers,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

function OpenRegistrationContent() {
  const searchParams = useSearchParams();
  const regId = searchParams.get('id') || '';

  const [detail, setDetail] = useState<RegistrationDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      if (!regId) {
        setLoadError('No registration ID specified in the URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      const result = await getRegistrationDetails(regId);
      if (!ignore) {
        if (result.error || !result.data) {
          setLoadError(result.error?.message || 'Registration details not found.');
        } else {
          setDetail(result.data);
        }
        setLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [regId]);

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success text-xs capitalize">Active</span>;
      case 'completed':
        return <span className="badge badge-primary text-xs capitalize">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-danger text-xs capitalize">Cancelled</span>;
      default:
        return <span className="badge badge-warning text-xs capitalize">Pending</span>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus | 'unpaid') => {
    switch (status) {
      case 'success':
        return <span className="badge badge-success text-xs capitalize">Success</span>;
      case 'failed':
        return <span className="badge badge-danger text-xs capitalize">Failed</span>;
      case 'cancelled':
        return <span className="badge badge-danger text-xs capitalize">Cancelled</span>;
      case 'refunded':
        return <span className="badge badge-neutral text-xs capitalize">Refunded</span>;
      case 'pending':
        return <span className="badge badge-warning text-xs capitalize">Pending</span>;
      default:
        return <span className="badge badge-neutral text-xs capitalize">Unpaid</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          Loading registration and payment details...
        </span>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card p-8 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-danger-subtle)] text-[var(--color-danger)] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Registration Not Found
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loadError || 'The requested registration record could not be loaded.'}
          </p>
          <div className="pt-2">
            <Link
              href="/admin/registrations/dashboard"
              className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Registrations</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & ID */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD3]">
        <Link
          href="/admin/registrations/dashboard"
          className="btn btn-outline inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registrations</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Registration ID:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-mono font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
            {detail.registration_id}
          </span>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-soft-orange)]/60 text-[var(--color-text-primary)] font-bold text-xl flex items-center justify-center shrink-0">
            <ClipboardList className="w-7 h-7 text-[var(--color-tangerine)]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                {detail.registration_id}
              </h1>
              {getStatusBadge(detail.status)}
              {getPaymentStatusBadge(detail.payment_status)}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-2">
              <span>Learner: <strong className="text-[var(--color-text-primary)]">{detail.learner_name}</strong></span>
              <span>•</span>
              <span>Enrolled in <strong className="text-[var(--color-text-primary)]">[{detail.course_identifier}] {detail.course_title}</strong></span>
            </p>
          </div>
        </div>

        <div className="text-right self-start md:self-auto bg-[var(--color-soft-cream)] p-3 px-4 rounded-[var(--radius-lg)] border border-[#E5DFD3]">
          <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
            Registration Fee
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">
            ₹{detail.amount.toFixed(2)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            Currency: {detail.currency}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Learner Details */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--color-tangerine)]" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Learner Details
            </h2>
          </div>
          <div className="p-6 space-y-3.5 text-sm">
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)]">Full Name:</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{detail.learner_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email:
              </span>
              <span className="text-[var(--color-text-secondary)] font-mono text-xs">{detail.learner_email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <Phone className="w-3 h-3" /> Mobile:
              </span>
              <span className="text-[var(--color-text-secondary)]">{detail.learner_mobile || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Region:
              </span>
              <span className="font-semibold uppercase tracking-wider text-xs text-[var(--color-text-primary)]">
                {detail.learner_region || 'India'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-xs text-[var(--color-text-muted)]">Learner Account ID:</span>
              <span className="font-mono text-xs text-[var(--color-text-muted)] truncate max-w-[200px]">
                {detail.learner_id}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Course & Batch Details */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-tangerine)]" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Course & Batch Information
            </h2>
          </div>
          <div className="p-6 space-y-3.5 text-sm">
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)]">Course ID:</span>
              <span className="font-mono font-semibold text-[var(--color-text-primary)]">
                {detail.course_identifier}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)]">Course Title:</span>
              <span className="font-medium text-[var(--color-text-primary)] text-right">
                {detail.course_title}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)]">Assigned Batch:</span>
              <span className="font-mono font-bold text-[var(--color-tangerine)]">
                {detail.batch_identifier}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)]">Language:</span>
              <span className="capitalize text-[var(--color-text-secondary)]">
                {detail.batch_language || 'English'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DFD3]/60">
              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Class Timing:
              </span>
              <span className="text-[var(--color-text-secondary)]">
                {detail.batch_time_range || 'Not specified'}
              </span>
            </div>
            {(detail.batch_start_date || detail.batch_end_date) && (
              <div className="flex justify-between py-1">
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Duration:
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {detail.batch_start_date || 'TBD'} to {detail.batch_end_date || 'TBD'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Registration Record Metadata */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
        <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-tangerine)]" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Registration Record Details
            </h2>
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">System timestamps & identifiers</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[var(--color-soft-cream)]/60 rounded-[var(--radius-md)] border border-[#E5DFD3]">
            <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              Registration ID
            </div>
            <div className="font-mono font-bold text-sm text-[var(--color-text-primary)] mt-1">
              {detail.registration_id}
            </div>
          </div>
          <div className="p-3 bg-[var(--color-soft-cream)]/60 rounded-[var(--radius-md)] border border-[#E5DFD3]">
            <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              Enrollment Status
            </div>
            <div className="mt-1">{getStatusBadge(detail.status)}</div>
          </div>
          <div className="p-3 bg-[var(--color-soft-cream)]/60 rounded-[var(--radius-md)] border border-[#E5DFD3]">
            <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              Registered On
            </div>
            <div className="font-medium text-[var(--color-text-primary)] mt-1">
              {new Date(detail.created_at).toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-[var(--color-soft-cream)]/60 rounded-[var(--radius-md)] border border-[#E5DFD3]">
            <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              Last Updated
            </div>
            <div className="font-medium text-[var(--color-text-primary)] mt-1">
              {new Date(detail.updated_at).toLocaleString()}
            </div>
          </div>
        </div>

        {detail.notes && (
          <div className="px-6 pb-6 text-xs text-[var(--color-text-secondary)]">
            <div className="font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Batch Guidelines & Notes:
            </div>
            <p className="bg-[var(--color-soft-cream)]/40 p-3 rounded-[var(--radius-md)] border border-[#E5DFD3]">
              {detail.notes}
            </p>
          </div>
        )}
      </div>

      {/* Section 4: Payments Details of that Registration ID */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
        <div className="p-4 px-6 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[var(--color-tangerine)]" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Payments Details
            </h2>
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {detail.payments.length} {detail.payments.length === 1 ? 'transaction' : 'transactions'} associated
          </span>
        </div>

        {detail.payments.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            <div className="flex flex-col items-center justify-center gap-2">
              <CreditCard className="w-8 h-8 text-[var(--color-text-muted)]" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                No payment transactions recorded
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                This registration has not yet initiated or completed a payment through Cashfree or Stripe.
              </p>
            </div>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none shadow-none">
            <table className="table-base">
              <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                <tr>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Provider Order ID
                  </th>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Payment Gateway
                  </th>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Gateway Payment ID
                  </th>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Amount
                  </th>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Payment Status
                  </th>
                  <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Paid Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="table-body divide-y divide-[#E5DFD3]">
                {detail.payments.map((p) => (
                  <tr key={p.id} className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60">
                    <td className="table-data-cell py-3.5 px-4 font-mono font-semibold text-xs text-[var(--color-text-primary)]">
                      {p.provider_order_id}
                    </td>
                    <td className="table-data-cell py-3.5 px-4 capitalize font-medium text-xs text-[var(--color-text-secondary)]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]">
                        {p.provider}
                      </span>
                    </td>
                    <td className="table-data-cell py-3.5 px-4 font-mono text-xs text-[var(--color-text-secondary)]">
                      {p.provider_payment_id || <span className="italic text-[var(--color-text-muted)]">—</span>}
                    </td>
                    <td className="table-data-cell py-3.5 px-4 font-bold text-sm text-[var(--color-text-primary)]">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="table-data-cell py-3.5 px-4">
                      {getPaymentStatusBadge(p.status)}
                    </td>
                    <td className="table-data-cell py-3.5 px-4 text-xs text-[var(--color-text-secondary)] text-right">
                      {p.paid_at ? new Date(p.paid_at).toLocaleString() : (
                        <span className="italic text-[var(--color-text-muted)]">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpenRegistrationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                <span className="text-sm text-[var(--color-text-muted)]">Loading registration details...</span>
              </div>
            }
          >
            <OpenRegistrationContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
