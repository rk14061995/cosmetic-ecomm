'use client';

import { useAppSelector } from '@/store/hooks';

/**
 * Read auth without redirecting. Use on public pages (e.g. add-to-cart) so we only
 * send users to login after hydration confirms they are a guest.
 */
export function useAuthStatus() {
  const { user, initialized, loading } = useAppSelector((s) => s.auth);
  return {
    user,
    authReady: initialized,
    isLoggedIn: Boolean(user),
    loading: Boolean(loading),
  };
}
