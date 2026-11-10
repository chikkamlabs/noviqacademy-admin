'use client';

import { useState, useEffect } from 'react';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import {
  getCurrentMentorProfile,
  changeOwnMentorPassword,
  Mentor,
} from '@/lib/mentorsStore';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function MentorProfilePage() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const { data, error } = await getCurrentMentorProfile();
        if (!ignore) {
          if (error) {
            console.error('Failed to load mentor profile:', error);
          }
          if (data) {
            setMentor(data);
          }
        }
      } catch (err) {
        console.error('Error fetching mentor profile:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (trimmedNew.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await changeOwnMentorPassword(trimmedNew);
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('Password has been successfully updated.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const mentorName = mentor?.name || 'Mentor Name';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <MentorHeader
        mentorName={mentorName}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 relative">
        <MentorSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header section */}
            <div className="pb-3 border-b border-[#E5DFD3]">
              <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                Mentor Profile
              </h1>
              <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                View your personal account information and update your security credentials.
              </p>
            </div>

            {loading ? (
              <div className="card p-12 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                <span className="text-sm text-[var(--color-text-muted)]">Loading profile details...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Mentor Details */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xs space-y-5">
                    <div className="flex items-center gap-3.5 pb-4 border-b border-[#E5DFD3]">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-subtle)] border border-[var(--color-tangerine)]/30 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-[var(--color-tangerine)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] truncate">
                          {mentor?.name || 'Mentor'}
                        </h2>
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-[var(--radius-sm)] text-xs font-mono font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                          {mentor?.mentor_id || 'mentor_id'}
                        </span>
                      </div>
                    </div>

                    {/* Mentor Details Field List */}
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)]/50 border border-[#E5DFD3]/80">
                        <User className="w-4 h-4 text-[var(--color-tangerine)] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                            Full Name
                          </span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)] break-words">
                            {mentor?.name || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Mentor ID */}
                      <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)]/50 border border-[#E5DFD3]/80">
                        <Shield className="w-4 h-4 text-[var(--color-tangerine)] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                            Mentor ID
                          </span>
                          <span className="text-sm font-mono font-semibold text-[var(--color-text-primary)]">
                            {mentor?.mentor_id || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)]/50 border border-[#E5DFD3]/80">
                        <Mail className="w-4 h-4 text-[var(--color-tangerine)] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                            Email Address
                          </span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)] break-all">
                            {mentor?.email || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)]/50 border border-[#E5DFD3]/80">
                        <Phone className="w-4 h-4 text-[var(--color-tangerine)] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                            Mobile Number
                          </span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {mentor?.mobile || 'Not provided'}
                          </span>
                        </div>
                      </div>

                      {/* System Role */}
                      <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)]/50 border border-[#E5DFD3]/80">
                        <Shield className="w-4 h-4 text-[var(--color-tangerine)] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                            Platform Role
                          </span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">
                            Mentor
                          </span>
                        </div>
                      </div>

                      {/* Account Created Date */}
                      <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)]/50 border border-[#E5DFD3]/80">
                        <Calendar className="w-4 h-4 text-[var(--color-tangerine)] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                            Account Created
                          </span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {mentor?.created_at
                              ? new Date(mentor.created_at).toLocaleString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Change Password */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xs space-y-5">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-[#E5DFD3]">
                      <KeyRound className="w-5 h-5 text-[var(--color-tangerine)] shrink-0" />
                      <h2 className="text-base md:text-lg font-bold text-[var(--color-text-primary)]">
                        Change Password
                      </h2>
                    </div>

                    <p className="text-xs text-[var(--color-text-muted)]">
                      Enter a new secure password for your mentor account. It must be at least 6 characters long.
                    </p>

                    {passwordError && (
                      <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="flex-1">{passwordError}</span>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        <span className="flex-1">{passwordSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      {/* New Password */}
                      <div>
                        <label
                          htmlFor="new_password"
                          className="block text-xs font-medium text-[var(--color-text-primary)] mb-1"
                        >
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                          <input
                            id="new_password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={6}
                            className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-10 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label
                          htmlFor="confirm_password"
                          className="block text-xs font-medium text-[var(--color-text-primary)] mb-1"
                        >
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                          <input
                            id="confirm_password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                            minLength={6}
                            className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-10 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="btn btn-primary w-full py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {passwordLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 anim-spin" />
                              <span>Saving Password...</span>
                            </>
                          ) : (
                            <>
                              <KeyRound className="w-4 h-4" />
                              <span>Save Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
