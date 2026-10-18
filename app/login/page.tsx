'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { signIn, getCurrentUser, getUserProfile } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user is already logged in with active role
  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          const role = profile?.role;
          if (role === 'admin') {
            router.replace('/admin/dashboard');
            return;
          } else if (role === 'mentor') {
            router.replace('/mentor/dashboard');
            return;
          }
        }
      } catch {
        // Continue to show login form
      } finally {
        setCheckingAuth(false);
      }
    }

    checkExistingAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email.trim(), password);

      if (result.error) {
        setErrorMessage(result.error.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      const role = result.role;

      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'mentor') {
        router.push('/mentor/dashboard');
      } else if (role === 'learner') {
        setErrorMessage('Access restricted: Learner accounts cannot access the admin or mentor portal.');
        setLoading(false);
      } else {
        setErrorMessage('User role not recognized. Please contact academy administrators.');
        setLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during login.';
      setErrorMessage(message);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] text-[var(--color-text-primary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--color-tangerine)] anim-spin" />
          <p className="small-text text-[var(--color-text-secondary)]">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-main)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-lg">
          {/* Logo and Heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative w-24 h-24 mb-4 rounded-[var(--radius-lg)] overflow-hidden flex items-center justify-center bg-[var(--color-soft-orange)] p-1">
              <Image
                src="/noviqacademy_logo.png"
                alt="Noviq Academy"
                width={88}
                height={88}
                priority
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="page-title mb-1">
              Noviq Academy
            </h1>
            <p className="subheading-text">
              Sign in to your Staff & Mentor Portal
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] flex items-start gap-2.5 text-[var(--color-danger)] text-sm anim-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug text-xs font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="form-group mb-0">
              <label htmlFor="email" className="form-label mb-1.5">
                Email Address
              </label>
              {/* Flex wrapper ensuring icon and input never overlap */}
              <div className="flex items-center w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] focus-within:border-[var(--color-tangerine)] focus-within:ring-2 focus-within:ring-[var(--color-primary-subtle)] transition">
                <div className="pl-3.5 pr-2.5 text-[var(--color-text-muted)] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@noviqacademy.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  disabled={loading}
                  className="w-full bg-transparent py-2.5 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none border-none"
                />
              </div>
            </div>

            {/* Password Field with View/Hide toggle */}
            <div className="form-group mb-0">
              <label htmlFor="password" className="form-label mb-1.5">
                Password
              </label>
              {/* Flex wrapper ensuring icon, input, and view button never overlap */}
              <div className="flex items-center w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] focus-within:border-[var(--color-tangerine)] focus-within:ring-2 focus-within:ring-[var(--color-primary-subtle)] transition">
                <div className="pl-3.5 pr-2.5 text-[var(--color-text-muted)] flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full bg-transparent py-2.5 px-1 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none border-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                  className="px-3.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition flex items-center justify-center cursor-pointer shrink-0"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[var(--color-tangerine)]" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 text-sm font-semibold rounded-[var(--radius-md)] transition mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-[var(--color-soft-cream)] text-center small-text">
            Noviq Academy Portal • Authorized Access Only
          </div>
        </div>
      </div>
    </div>
  );
}
