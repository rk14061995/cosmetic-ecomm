import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { User, CartItem, CartSummary } from '@/types/api';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface CartState {
  items: CartItem[];
  summary: CartSummary;
  couponCode: string | null;
  loading: boolean;
  error: string | null;
  cartCount: number;
}

export interface RootState {
  auth: AuthState;
  cart: CartState;
}

export type AppDispatch = ThunkDispatch<RootState, undefined, UnknownAction>;
