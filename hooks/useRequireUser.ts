'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

/**
 * Redirects to login only after auth has finished hydrating (token → /auth/me).
 * Avoids false redirects while `user` is still null during fetchProfile.
 */
export function useRequireUser(loginPath = '/auth/login') {
  const router = useRouter();
  const { user, initialized } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace(loginPath);
  }, [initialized, user, router, loginPath]);

  return {
    user,
    authReady: initialized,
    isAuthed: Boolean(initialized && user),
  };
}
