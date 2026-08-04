'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';

export function useProtectedPage() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (auth.status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.status, pathname, router]);

  const retryVerification = async () => {
    setIsRetrying(true);

    try {
      await auth.revalidate();
    } catch {
      // The auth context retains the retryable verification message.
    } finally {
      setIsRetrying(false);
    }
  };

  return {
    isLoading: auth.status === 'loading',
    isRedirecting: auth.status === 'anonymous',
    isReady:
      auth.status === 'authenticated' && !auth.sessionVerificationError,
    isRetrying,
    sessionVerificationError: auth.sessionVerificationError,
    retryVerification,
    user: auth.user,
  };
}
