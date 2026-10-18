'use client';

import { useState, useEffect } from 'react';
import { generateNextMentorId, createMentor, Mentor } from '@/lib/mentorsStore';
import { X, Lock, Eye, EyeOff, AlertCircle, Loader2, Check } from 'lucide-react';

interface AddMentorProps {
  isOpen: boolean;
  onClose: () => void;
  onMentorAdded: (newMentor: Mentor) => void;
}

export default function AddMentor({ isOpen, onClose, onMentorAdded }: AddMentorProps) {
  const [mentorId, setMentorId] = useState<string>('mentor_101');
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loadingId, setLoadingId] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill next mentor_id whenever modal opens
  useEffect(() => {
    let ignore = false;
    async function initMentorId() {
      try {
        const nextId = await generateNextMentorId();
        if (!ignore) {
          setMentorId(nextId);
          setLoadingId(false);
        }
      } catch {
        if (!ignore) {
          setLoadingId(false);
        }
      }
    }

    if (isOpen) {
      initMentorId();
    }

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter the mentor full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await createMentor({
        mentor_id: mentorId,
        name: name.trim(),
        mobile: mobile.trim() || null,
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || 'Failed to create mentor record.');
        setSubmitting(false);
        return;
      }

      // Success: Reset form fields and trigger callback
      setName('');
      setMobile('');
      setEmail('');
      setPassword('');
      onMentorAdded(result.data);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dialog-overlay p-4">
      <div className="dialog-content max-w-lg w-full bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="dialog-header flex items-center justify-between p-5 border-b border-[#E5DFD3]">
          <div>
            <h2 className="dialog-title text-xl font-bold text-[var(--color-text-primary)]">
              Add New Mentor
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Create mentor credentials and profile in Noviq Academy.
            </p>
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
            {errorMessage && (
              <div className="p-3.5 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-[var(--radius-md)] flex items-start gap-2.5 text-xs text-[var(--color-danger)] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Mentor ID (Read-only, auto filled) */}
            <div className="form-group">
              <div className="flex items-center justify-between">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Mentor ID <span className="text-[var(--color-text-muted)] font-normal">(Auto-generated)</span>
                </label>
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[var(--color-text-muted)]" /> System Locked
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={loadingId ? 'Loading...' : mentorId}
                  readOnly
                  disabled
                  className="input-base bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] font-mono font-semibold cursor-not-allowed border-[#E5DFD3]"
                />
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Auto-assigned sequentially (mentor_101+1). Cannot be edited.
              </p>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Full Name <span className="text-[var(--color-tangerine)]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="input-base border-[#E5DFD3]"
              />
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="input-base border-[#E5DFD3]"
              />
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Email Address <span className="text-[var(--color-tangerine)]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mentor@noviqacademy.com"
                className="input-base border-[#E5DFD3]"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Creates the Supabase auth.user login account.
              </p>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Initial Password <span className="text-[var(--color-tangerine)]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input-base pr-10 border-[#E5DFD3]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                The mentor can log into the staff portal with this password.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={submitting || loadingId}
              className="btn btn-primary text-xs px-5 py-2 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Creating Mentor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Add Mentor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
