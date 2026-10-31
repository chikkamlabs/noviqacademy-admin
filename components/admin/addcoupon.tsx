'use client';

import { useState } from 'react';
import { createCoupon, CouponCode } from '@/lib/couponsStore';
import { X, Tag, AlertCircle, Loader2, Check } from 'lucide-react';

interface AddCouponProps {
  isOpen: boolean;
  onClose: () => void;
  onCouponAdded: (newCoupon: CouponCode) => void;
}

export default function AddCoupon({ isOpen, onClose, onCouponAdded }: AddCouponProps) {
  const [code, setCode] = useState<string>('');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [ukDiscountValue, setUkDiscountValue] = useState<number | ''>('');
  const [validTill, setValidTill] = useState<string>('');
  const [thersold, setThersold] = useState<number | ''>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMessage('Please enter a coupon code.');
      return;
    }

    if (discountValue === '' || Number(discountValue) < 0) {
      setErrorMessage('Please enter a valid India discount value (greater than or equal to 0).');
      return;
    }

    if (ukDiscountValue !== '' && Number(ukDiscountValue) < 0) {
      setErrorMessage('UK discount value cannot be negative.');
      return;
    }

    if (thersold === '' || Number(thersold) < 0) {
      setErrorMessage('Please enter a valid usage limit (threshold). Use 0 for unlimited.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await createCoupon({
        code: cleanCode,
        discount_value: Number(discountValue),
        uk_discount_value: ukDiscountValue === '' ? 0 : Number(ukDiscountValue),
        valid_till: validTill ? new Date(validTill).toISOString() : null,
        thersold: Number(thersold),
        is_public: isPublic,
      });

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || 'Failed to create coupon code.');
        setSubmitting(false);
        return;
      }

      // Success
      setCode('');
      setDiscountValue('');
      setUkDiscountValue('');
      setValidTill('');
      setThersold('');
      setIsPublic(false);
      onCouponAdded(result.data);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dialog-overlay p-4">
      <div className="dialog-content max-w-lg w-full bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-xl)] shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="dialog-header flex items-center justify-between p-5 border-b border-[#E5DFD3]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] flex items-center justify-center text-[var(--color-tangerine)]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="dialog-title text-xl font-bold text-[var(--color-text-primary)]">
                Add New Coupon
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Create promotional discount voucher for course enrollments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dialog-close p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="dialog-body p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-[var(--radius-md)] flex items-start gap-2.5 text-xs text-[var(--color-danger)] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Code */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Coupon Code <span className="text-[var(--color-tangerine)]">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. NOVIQ50, FESTIVE100"
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-mono font-bold tracking-wider uppercase text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none transition"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Unique uppercase alphanumeric identifier.
              </p>
            </div>

            {/* Discounts Grid (India & UK) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* India Discount Value */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Discount Value (INR / ₹) <span className="text-[var(--color-tangerine)]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 500.00"
                  className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none transition"
                />
              </div>

              {/* UK Discount Value */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  UK Discount Value (GBP / £)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ukDiscountValue}
                  onChange={(e) => setUkDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 10.00"
                  className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none transition"
                />
              </div>
            </div>

            {/* Valid Till (Expiry) */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Valid Till (Expiration Date & Time)
              </label>
              <input
                type="datetime-local"
                value={validTill}
                onChange={(e) => setValidTill(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none transition"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Leave empty for no expiration date.
              </p>
            </div>

            {/* Threshold (Usage Limit) */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Usage Limit Threshold <span className="text-[var(--color-tangerine)]">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={thersold}
                onChange={(e) => setThersold(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="e.g. 100 (enter 0 for unlimited)"
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none transition"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Maximum number of times this coupon can be redeemed.
              </p>
            </div>

            {/* Is Public Toggle */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 bg-[var(--color-soft-cream)]/70 border border-[#D5CDBD] rounded-[var(--radius-lg)] cursor-pointer hover:bg-[var(--color-soft-cream)] transition">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[var(--color-tangerine)] accent-[var(--color-tangerine)]"
                />
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Make Coupon Public
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Allow all learners to view and apply this coupon on the checkout and registration pages.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="dialog-footer p-4 border-t border-[#E5DFD3] flex items-center justify-end gap-3 bg-[var(--color-soft-cream)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-outline text-xs px-4 py-2 rounded-[var(--radius-md)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-xs px-5 py-2 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Creating Coupon...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create Coupon</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
