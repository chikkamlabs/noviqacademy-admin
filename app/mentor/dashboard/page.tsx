'use client';

import { useState, useEffect } from 'react';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import { getCurrentUser, getUserProfile } from '@/lib/auth';

export default function MentorDashboardPage() {
  const [mentorName, setMentorName] = useState<string>('Mentor Name');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchMentorInfo() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile?.name) {
            setMentorName(profile.name);
          }
        }
      } catch {
        // Fall back gracefully to 'Mentor Name'
      }
    }

    fetchMentorInfo();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      {/* Mentor Top Header */}
      <MentorHeader
        mentorName={mentorName}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Body with Sticky Sidebar & Dashboard Content */}
      <div className="flex flex-1 relative">
        <MentorSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 flex-center p-4 md:p-8">
          <div className="card p-8 text-center max-w-md w-full">
            <h1 className="page-title">Welcome Mentor</h1>
          </div>
        </main>
      </div>
    </div>
  );
}
