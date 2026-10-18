'use client';

import { useState } from 'react';
import { updateCoupon, CouponCode, isCouponActive } from '@/lib/couponsStore';
import { X, Tag, AlertCircle, Loader2, Check, Clock, Users } from 'lucide-react';

interface OpenCouponProps {
  isOpen: boolean;
  coupon: CouponCode | null;
  onClose: () => void;
  onCouponUpdated: (updated: CouponCode) => void;
}

interface CouponEditFormProps {
  coupon: CouponCode;
  onClose: () => void;
  onCouponUpdated: (updated: CouponCode) => void;
}

function CouponEditForm({
  coupon,
  onClose,
  onCouponUpdated,
}: CouponEditFormProps) {
  const [code, setCode] = useState<string>(coupon.code);
  const [discountValue, setDiscountValue] = useState<number | ''>(coupon.discount_value);
  const [validTill, setValidTill] = useState<string>(
    coupon.valid_till
      ? new Date(coupon.valid_till).toISOString().slice(0, 16)
      : ''
  );
  const [count, setCount] = useState<number>(coupon.count);
  const [thersold, setThersold] = useState<number | ''>(coupon.thersold);
  const [isPublic, setIsPublic] = useState<boolean>(coupon.is_public);

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isActive = isCouponActive(coupon);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMessage('Coupon code cannot be empty.');
      return;
    }

    if (discountValue === '' || Number(discountValue) < 0) {
      setErrorMessage('Discount value cannot be negative.');
      return;
    }

    if (thersold === '' || Number(thersold) < 0) {
      setErrorMessage('Threshold limit must be 0 or greater.');
      return;
    }

    setSaving(true);

    try {
      const result = await updateCoupon(coupon.id, {
        code: cleanCode,
        discount_value: Number(discountValue),
        valid_till: validTill ? new Date(validTill).toISOString() : null,
        count: Number(count || 0),
        thersold: Number(thersold),
        is_public: isPublic,
      });

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || 'Failed to update coupon details.');
      } else {
        setSuccessMessage('Coupon updated successfully.');
        onCouponUpdated(result.data);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="dialog-header flex items-center justify-between p-5 border-b border-[#E5DFD3]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] flex items-center justify-center text-[var(--color-tangerine)]">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="dialog-title text-xl font-bold text-[var(--color-text-primary)] font-mono">
                {coupon.code}
              </h2>
              <span
                className={`badge text-[10px] font-semibold ${
                  isActive ? 'badge-success' : 'badge-neutral'
                }`}
              >
                {isActive ? 'Active' : 'Inactive / Expired'}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Edit promotional discount voucher parameters.
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

      {/* Form Body */}
      <form onSubmit={handleSubmit}>
        <div className="dialog-body p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {successMessage && (
            <div className="p-3 bg-[var(--color-success-subtle)] border border-[var(--color-success)]/30 rounded-[var(--radius-md)] text-xs text-[var(--color-success)] font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

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
              placeholder="e.g. NOVIQ50"
              className="input-base font-mono font-bold tracking-wider uppercase border-[#E5DFD3]"
            />
          </div>

          {/* Discount Value */}
          <div className="form-group">
            <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Discount Value (Amount / ₹) <span className="text-[var(--color-tangerine)]">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="input-base border-[#E5DFD3]"
            />
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
              className="input-base border-[#E5DFD3]"
            />
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Leave empty for permanent validity (no expiration).
            </p>
          </div>

          {/* Usage Count & Threshold Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Usage Count */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span>Times Used (Count)</span>
              </label>
              <input
                type="number"
                min="0"
                value={count}
                onChange={(e) => setCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="input-base border-[#E5DFD3]"
              />
            </div>

            {/* Threshold */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Usage Limit (Threshold) <span className="text-[var(--color-tangerine)]">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={thersold}
                onChange={(e) => setThersold(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="input-base border-[#E5DFD3]"
              />
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] -mt-2">
            Threshold 0 = unlimited usages. Currently used {count} time(s).
          </p>

          {/* Is Public Toggle */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 bg-[var(--color-soft-cream)]/70 border border-[#E5DFD3] rounded-[var(--radius-lg)] cursor-pointer hover:bg-[var(--color-soft-cream)] transition">
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
                  Allow all learners to view and apply this coupon on checkout.
                </div>
              </div>
            </label>
          </div>

          {/* Creation metadata */}
          {coupon.created_at && (
            <div className="pt-2 text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5 border-t border-[#E5DFD3]">
              <Clock className="w-3.5 h-3.5" />
              <span>Created on {new Date(coupon.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="dialog-footer p-4 border-t border-[#E5DFD3] flex items-center justify-end gap-3 bg-[var(--color-soft-cream)]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-outline text-xs px-4 py-2 rounded-[var(--radius-md)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary text-xs px-5 py-2 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 anim-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}

export default function OpenCoupon({
  isOpen,
  coupon,
  onClose,
  onCouponUpdated,
}: OpenCouponProps) {
  if (!isOpen || !coupon) return null;

  return (
    <div className="dialog-overlay p-4">
      <div className="dialog-content max-w-lg w-full bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-xl overflow-hidden">
        <CouponEditForm
          key={coupon.id}
          coupon={coupon}
          onClose={onClose}
          onCouponUpdated={onCouponUpdated}
        />
      </div>
    </div>
  );
}
