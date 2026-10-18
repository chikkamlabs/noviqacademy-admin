'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function verifyMentorAuth() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace('/login');
          return;
        }

        const userProfile = await getUserProfile(user.id);
        if (!userProfile) {
          router.replace('/login');
          return;
        }

        if (userProfile.role !== 'mentor') {
          if (userProfile.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/login');
          }
          return;
        }

        if (isMounted) {
          setAuthorized(true);
        }
      } catch {
        router.replace('/login');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verifyMentorAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] text-[var(--color-text-primary)]">
        <Loader2 className="w-8 h-8 text-[var(--color-soft-orange)] anim-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
