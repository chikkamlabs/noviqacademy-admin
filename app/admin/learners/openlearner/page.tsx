'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getLearnerById,
  updateLearner,
  updateLearnerPassword,
  Learner,
  LearnerRegion,
} from '@/lib/learnersStore';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';

function OpenLearnerContent() {
  const searchParams = useSearchParams();
  const learnerId = searchParams.get('id') || '';

  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable Profile Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [region, setRegion] = useState<LearnerRegion>('india');
  const [referralCode, setReferralCode] = useState<string>('');

  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Fields
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadLearner() {
      if (!learnerId) {
        setLoadError('No learner ID specified.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      const result = await getLearnerById(learnerId);

      if (!ignore) {
        if (result.error || !result.data) {
          setLoadError(result.error?.message || 'Learner record not found.');
        } else {
          const l = result.data;
          setLearner(l);
          setName(l.name || '');
          setEmail(l.email || '');
          setMobile(l.mobile || '');
          setRegion(l.region || 'india');
          setReferralCode(l.referral_code || '');
        }
        setLoading(false);
      }
    }

    loadLearner();

    return () => {
      ignore = true;
    };
  }, [learnerId]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!learner) return;

    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError('Learner name cannot be empty.');
      return;
    }

    if (!email.trim()) {
      setProfileError('Email address cannot be empty.');
      return;
    }

    setProfileSaving(true);

    try {
      const result = await updateLearner(learner.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim() || null,
        region,
        referral_code: referralCode.trim() || null,
      });

      if (result.error || !result.data) {
        setProfileError(result.error?.message || 'Failed to update learner details.');
      } else {
        setLearner(result.data);
        setName(result.data.name);
        setEmail(result.data.email);
        setMobile(result.data.mobile || '');
        setRegion(result.data.region);
        setReferralCode(result.data.referral_code || '');
        setProfileSuccess('Learner profile updated successfully.');
        setTimeout(() => setProfileSuccess(null), 4000);
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!learner) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    setPasswordSaving(true);

    try {
      const result = await updateLearnerPassword(learner.id, newPassword);

      if (result.error) {
        setPasswordError(result.error.message);
      } else {
        setPasswordSuccess('Learner password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          Loading learner profile...
        </span>
      </div>
    );
  }

  if (loadError || !learner) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card p-8 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-danger-subtle)] text-[var(--color-danger)] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Learner Not Found</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loadError || 'The requested learner profile could not be loaded.'}
          </p>
          <div className="pt-2">
            <Link
              href="/admin/learners/dashboard"
              className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Learners</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD3]">
        <Link
          href="/admin/learners/dashboard"
          className="btn btn-outline inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Learners</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-full)] text-xs font-semibold uppercase tracking-wider bg-[var(--color-secondary-subtle)] text-[var(--color-text-primary)] border border-[var(--color-soft-orange)]">
          <MapPin className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
          <span>Region: {learner.region}</span>
        </span>
      </div>

      {/* Main Learner Banner Card */}
      <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-soft-orange)]/60 text-[var(--color-text-primary)] font-bold text-xl flex items-center justify-center shrink-0">
            {learner.name ? learner.name.charAt(0).toUpperCase() : 'L'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                {learner.name}
              </h1>
              <span className="badge badge-secondary text-[11px] font-semibold">Student Learner</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{learner.email}</p>
          </div>
        </div>

        {learner.created_at && (
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 bg-[var(--color-soft-cream)] px-3 py-2 rounded-[var(--radius-md)] self-start md:self-auto">
            <Calendar className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
            <span>Enrolled {new Date(learner.created_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Learner Details & Edit */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#E5DFD3] flex items-center justify-between bg-[var(--color-soft-cream)]/50">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--color-tangerine)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Learner Information
              </h2>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Editable fields</span>
          </div>

          <form onSubmit={handleProfileSubmit} className="flex-1 flex flex-col justify-between">
            <div className="p-6 space-y-4">
              {profileSuccess && (
                <div className="p-3 bg-[var(--color-success-subtle)] border border-[var(--color-success)]/30 rounded-[var(--radius-md)] text-xs text-[var(--color-success)] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-[var(--radius-md)] text-xs text-[var(--color-danger)] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Full Name <span className="text-[var(--color-tangerine)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Student name"
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
                  placeholder="student@example.com"
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
                  placeholder="+91 9876543210"
                  className="input-base border-[#E5DFD3]"
                />
              </div>

              {/* Region */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Learner Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as LearnerRegion)}
                  className="select-base border-[#E5DFD3]"
                >
                  <option value="india">India (INR Currency)</option>
                  <option value="uk">United Kingdom (GBP Currency)</option>
                </select>
              </div>

              {/* Referral Code */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Referral Code
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. REF_INDIA_101"
                  className="input-base font-mono border-[#E5DFD3]"
                />
              </div>
            </div>

            {/* Profile Action Footer */}
            <div className="p-4 border-t border-[#E5DFD3] bg-[var(--color-soft-cream)] flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="btn btn-primary text-xs px-5 py-2 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold"
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 anim-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Learner Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Change Password */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#E5DFD3] flex items-center justify-between bg-[var(--color-soft-cream)]/50">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[var(--color-tangerine)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Change Password
              </h2>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Security credentials</span>
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex-1 flex flex-col justify-between">
            <div className="p-6 space-y-4">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Update the learner&apos;s portal login password directly. They will use the new password on their next sign-in.
              </p>

              {passwordSuccess && (
                <div className="p-3 bg-[var(--color-success-subtle)] border border-[var(--color-success)]/30 rounded-[var(--radius-md)] text-xs text-[var(--color-success)] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-[var(--radius-md)] text-xs text-[var(--color-danger)] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* New Password */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  New Password <span className="text-[var(--color-tangerine)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
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
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Confirm New Password <span className="text-[var(--color-tangerine)]">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input-base border-[#E5DFD3]"
                />
              </div>
            </div>

            {/* Password Action Footer */}
            <div className="p-4 border-t border-[#E5DFD3] bg-[var(--color-soft-cream)] flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="btn btn-primary text-xs px-5 py-2 rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer font-semibold"
              >
                {passwordSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 anim-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OpenLearnerPage() {
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
                <span className="text-sm text-[var(--color-text-muted)]">Loading learner details...</span>
              </div>
            }
          >
            <OpenLearnerContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
