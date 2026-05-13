'use client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchProfile, setInitialized } from '@/store/slices/authSlice';
import { fetchCart } from '@/store/slices/cartSlice';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<any>();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
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
