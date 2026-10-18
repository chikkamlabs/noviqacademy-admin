'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Layers,
  GraduationCap,
  Users,
  ClipboardList,
  Tag,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { label: 'Home', href: '/admin/dashboard', icon: Home },
  { label: 'Courses', href: '/admin/courses/dashboard', icon: BookOpen },
  { label: 'Batches', href: '/admin/batches/dashboard', icon: Layers },
  { label: 'Mentors', href: '/admin/mentors/dashboard', icon: GraduationCap },
  { label: 'Learners', href: '/admin/learners/dashboard', icon: Users },
  { label: 'Registrations', href: '/admin/registrations/dashboard', icon: ClipboardList },
  { label: 'Coupons', href: '/admin/coupons/dashboard', icon: Tag },
];

export default function AdminSidebar({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: AdminSidebarProps) {
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

    window.addEventListener('toggle-admin-sidebar', handleToggle);
    window.addEventListener('close-admin-sidebar', handleForceClose);

    return () => {
      window.removeEventListener('toggle-admin-sidebar', handleToggle);
      window.removeEventListener('close-admin-sidebar', handleForceClose);
    };
  }, []);

  return (
    <>
      {/* Mobile Backdrop Overlay - closes sidebar on tap */}
      {isSidebarOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-[#0A0A0A]/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 md:w-64 bg-[var(--color-surface)] border-r border-[#E5DFD3] flex flex-col transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-[#E5DFD3]">
          <span className="font-bold text-base text-[var(--color-text-primary)]">
            Admin Menu
          </span>
          <button
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
            const isCoursesNav = item.label === 'Courses';
            const isMentorsNav = item.label === 'Mentors';
            const isBatchesNav = item.label === 'Batches';
            const isCouponsNav = item.label === 'Coupons';
            const isLearnersNav = item.label === 'Learners';
            const isRegistrationsNav = item.label === 'Registrations';
            const isActive = isCoursesNav
              ? pathname.startsWith('/admin/courses')
              : isMentorsNav
              ? pathname.startsWith('/admin/mentors')
              : isBatchesNav
              ? pathname.startsWith('/admin/batches')
              : isCouponsNav
              ? pathname.startsWith('/admin/coupons')
              : isLearnersNav
              ? pathname.startsWith('/admin/learners')
              : isRegistrationsNav
              ? pathname.startsWith('/admin/registrations')
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
          Noviq Academy • Staff Portal
        </div>
      </aside>
    </>
  );
}
