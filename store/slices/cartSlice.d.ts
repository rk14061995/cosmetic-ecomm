import type { AsyncThunk } from '@reduxjs/toolkit';
import type { CartItem, CartSummary } from '@/types/api';

type CartResponse = { items: CartItem[]; summary: CartSummary; cartCount: number; discount?: number };
type RejectValue = { rejectValue: string };

export declare const fetchCart: AsyncThunk<CartResponse, void, RejectValue>;
export declare const addToCart: AsyncThunk<CartResponse, { itemId: string; itemType: string; quantity: number; variantId?: string }, RejectValue>;
export declare const removeFromCart: AsyncThunk<CartResponse, string, RejectValue>;
export declare const updateCartItem: AsyncThunk<CartResponse, { itemId: string; quantity: number }, RejectValue>;
export declare const applyCoupon: AsyncThunk<CartResponse, string, RejectValue>;
export declare const clearCartError: () => { type: string };
