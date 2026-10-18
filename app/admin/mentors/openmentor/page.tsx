'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getMentorById,
  updateMentorProfile,
  updateMentorPassword,
  Mentor,
} from '@/lib/mentorsStore';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  UserCheck,
  GraduationCap,
} from 'lucide-react';

function OpenMentorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mentorIdParam = searchParams.get('id') || '';

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable Profile fields
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password fields
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMentor() {
      if (!mentorIdParam) {
        setLoadError('No mentor ID specified.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      const result = await getMentorById(mentorIdParam);
      if (result.error || !result.data) {
        setLoadError(result.error?.message || 'Mentor not found.');
      } else {
        setMentor(result.data);
        setName(result.data.name || '');
        setMobile(result.data.mobile || '');
      }
      setLoading(false);
    }

    loadMentor();
  }, [mentorIdParam]);

  // Handle Profile Update (Name & Mobile)
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mentor) return;

    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }

    setProfileSaving(true);
    const result = await updateMentorProfile(mentor.id, {
      name: name.trim(),
      mobile: mobile.trim() || null,
    });

    if (result.error || !result.data) {
      setProfileError(result.error?.message || 'Failed to update mentor profile.');
    } else {
      setMentor(result.data);
      setName(result.data.name);
      setMobile(result.data.mobile || '');
      setProfileSuccess('Mentor details updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    }
    setProfileSaving(false);
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mentor) return;

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
    const result = await updateMentorPassword(mentor.id, newPassword);

    if (result.error) {
      setPasswordError(result.error.message);
    } else {
      setPasswordSuccess('Mentor password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    }
    setPasswordSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          Loading mentor profile...
        </span>
      </div>
    );
  }

  if (loadError || !mentor) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card p-8 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-danger-subtle)] text-[var(--color-danger)] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Mentor Not Found</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loadError || 'The requested mentor profile could not be loaded.'}
          </p>
          <div className="pt-2">
            <Link
              href="/admin/mentors/dashboard"
              className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Mentors</span>
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
          href="/admin/mentors/dashboard"
          className="btn btn-outline inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Mentors</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Mentor ID:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-mono font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
            {mentor.mentor_id}
          </span>
        </div>
      </div>

      {/* Main Mentor Card Banner */}
      <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-soft-orange)]/60 text-[var(--color-text-primary)] font-bold text-xl flex items-center justify-center shrink-0">
            {mentor.name ? mentor.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                {mentor.name}
              </h1>
              <span className="badge badge-secondary text-[11px] font-semibold">Faculty Mentor</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{mentor.email}</p>
          </div>
        </div>

        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 bg-[var(--color-soft-cream)] px-3 py-2 rounded-[var(--radius-md)] self-start md:self-auto">
          <UserCheck className="w-4 h-4 text-[var(--color-success)] shrink-0" />
          <span>Role: Mentor • Full Profile Access</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Mentor Details & Edit */}
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#E5DFD3] flex items-center justify-between bg-[var(--color-soft-cream)]/50">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[var(--color-tangerine)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Mentor Information
              </h2>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Edit profile</span>
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

              {/* Mentor ID (Not Editable) */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label text-xs font-semibold text-[var(--color-text-primary)]">
                    Mentor ID
                  </label>
                  <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                </div>
                <input
                  type="text"
                  value={mentor.mentor_id}
                  disabled
                  readOnly
                  className="input-base bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] font-mono font-semibold cursor-not-allowed border-[#E5DFD3]"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Mentor ID is a unique system identifier and cannot be changed.
                </p>
              </div>

              {/* Email (Not Editable) */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label text-xs font-semibold text-[var(--color-text-primary)]">
                    Email Address
                  </label>
                  <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                </div>
                <input
                  type="email"
                  value={mentor.email}
                  disabled
                  readOnly
                  className="input-base bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] cursor-not-allowed border-[#E5DFD3]"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Email is linked to the authentication identity and cannot be edited.
                </p>
              </div>

              {/* Name (Editable) */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Full Name <span className="text-[var(--color-tangerine)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mentor full name"
                  className="input-base border-[#E5DFD3]"
                />
              </div>

              {/* Mobile Number (Editable) */}
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
                    <span>Save Profile Changes</span>
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
            <span className="text-[11px] text-[var(--color-text-muted)]">Credentials</span>
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex-1 flex flex-col justify-between">
            <div className="p-6 space-y-4">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Update the mentor&apos;s login password directly. They will use the new password on their next sign-in.
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

export default function OpenMentorPage() {
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
                <span className="text-sm text-[var(--color-text-muted)]">Loading mentor details...</span>
              </div>
            }
          >
            <OpenMentorContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
