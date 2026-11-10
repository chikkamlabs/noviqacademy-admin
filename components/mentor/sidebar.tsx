'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Layers,
  BookOpen,
  GraduationCap,
  Users,
  X,
} from 'lucide-react';

interface MentorSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { label: 'Home', href: '/mentor/dashboard', icon: Home },
  { label: 'Batches', href: '/mentor/batches/dashboard', icon: Layers },
  { label: 'Courses', href: '/mentor/courses', icon: BookOpen },
  { label: 'Profile', href: '/mentor/profile', icon: GraduationCap },
  { label: 'Learners', href: '/mentor/dashboard', icon: Users },
];

export default function MentorSidebar({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: MentorSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const pathname = usePathname();

  const isSidebarOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    const handleToggle = () => setInternalOpen((prev) => !prev);
    const handleForceClose = () => setInternalOpen(false);

    window.addEventListener('toggle-mentor-sidebar', handleToggle);
    window.addEventListener('close-mentor-sidebar', handleForceClose);

    return () => {
      window.removeEventListener('toggle-mentor-sidebar', handleToggle);
      window.removeEventListener('close-mentor-sidebar', handleForceClose);
    };
  }, []);

  return (
    <>
      {/* Mobile Backdrop Overlay - closes sidebar on tap */}
      {isSidebarOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 top-16 bg-[#0A0A0A]/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* Sidebar Container: sticks to the left on desktop, slide drawer on mobile */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 lg:z-30 h-[calc(100vh-4rem)] w-64 bg-[var(--color-surface)] border-r border-[#E5DFD3] flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="flex lg:hidden items-center justify-between p-4 border-b border-[#E5DFD3]">
          <span className="font-bold text-base text-[var(--color-text-primary)]">
            Mentor Menu
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isBatchesNav = item.label === 'Batches';
            const isCoursesNav = item.label === 'Courses';
            const isProfileNav = item.label === 'Profile';
            const isHomeNav = item.label === 'Home';
            const isActive = isBatchesNav
              ? pathname.startsWith('/mentor/batches')
              : isCoursesNav
              ? pathname.startsWith('/mentor/courses')
              : isProfileNav
              ? pathname.startsWith('/mentor/profile')
              : isHomeNav
              ? pathname === '/mentor/dashboard'
              : pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[var(--color-tangerine)]' : 'text-[var(--color-text-muted)]'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-[#E5DFD3] text-xs text-[var(--color-text-muted)]">
          Noviq Academy • Mentor Portal
        </div>
      </aside>
    </>
  );
}
