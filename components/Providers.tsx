'use client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchProfile, setInitialized } from '@/store/slices/authSlice';
import { fetchCart } from '@/store/slices/cartSlice';
import { getAccessToken, getRefreshToken, persistAuthTokens } from '@/lib/authTokens';
import { captureFirstTouchAttribution } from '@/lib/attribution';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<any>();

  useEffect(() => {
    captureFirstTouchAttribution();
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Keep accessToken + jwt mirror in sync if an older build only wrote one key
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const jwtOnly = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
      if (!access && jwtOnly) persistAuthTokens(jwtOnly, getRefreshToken() || undefined);
      dispatch(fetchProfile());
      dispatch(fetchCart());
    } else {
      dispatch(setInitialized());
    }
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer>{children}</AppInitializer>
    </Provider>
  );
}
