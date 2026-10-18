'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();

  const handleToggle = () => {
    // Button won't work for desktop (as desktop sidebar is sticky)
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return;
    }

    if (onToggleSidebar) {
      onToggleSidebar();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Continue navigation even if signOut encounters error
    } finally {
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[var(--color-surface)] border-b border-[#E5DFD3] px-3 md:px-6 flex items-center justify-between">
      {/* Left Section: Sidebar Toggle Button + Logo + Bold Noviq Academy Heading */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* Toggle Button: functional on mobile, disabled/non-working on desktop */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Toggle sidebar"
          className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] transition md:opacity-40 md:cursor-default cursor-pointer"
          title="Toggle sidebar (Mobile only)"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Noviq Academy Logo */}
        <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center shrink-0">
          <Image
            src="/noviqacademy_logo.png"
            alt="Noviq Academy"
            width={36}
            height={36}
            priority
            className="object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Noviq Academy Bold Heading */}
        <span className="font-bold text-base md:text-xl text-[var(--color-text-primary)] tracking-tight">
          Noviq Academy
        </span>
      </div>

      {/* Center Section: Hello Admin */}
      <div className="text-center font-semibold text-sm md:text-base text-[var(--color-text-primary)]">
        Hello Admin
      </div>

      {/* Right Section: Logout text & Logout button (navigates back to login page) */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs md:text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-tangerine)] hover:bg-[var(--color-soft-cream)] border border-[#E5DFD3] transition cursor-pointer"
          title="Logout and return to login"
        >
          <span>Logout</span>
          <LogOut className="w-4 h-4 text-[var(--color-tangerine)]" />
        </button>
      </div>
    </header>
  );
}
