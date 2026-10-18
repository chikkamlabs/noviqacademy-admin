'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAuth() {
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

        if (userProfile.role !== 'admin') {
          if (userProfile.role === 'mentor') {
            router.replace('/mentor/dashboard');
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

    verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] text-[var(--color-text-primary)]">
        <Loader2 className="w-8 h-8 text-[var(--color-tangerine)] anim-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
