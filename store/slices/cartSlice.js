import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk('cart/add', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/add', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue, dispatch }) => {
  try {
    await api.delete(`/cart/items/${itemId}`);
    dispatch(fetchCart());
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue, dispatch }) => {
  try {
    await api.put(`/cart/items/${itemId}`, { quantity });
    dispatch(fetchCart());
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update cart');
  }
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async (code, { rejectWithValue, dispatch }) => {
  try {
    const { data } = await api.post('/cart/coupon', { code });
    dispatch(fetchCart());
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid coupon');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    summary: { subtotal: 0, shipping: 0, discount: 0, total: 0 },
    couponCode: null,
    loading: false,
    error: null,
    cartCount: 0,
  },
  reducers: {
    clearCartError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.cart?.items || [];
        state.summary = action.payload.summary || state.summary;
        state.couponCode = action.payload.cart?.couponCode || null;
        state.cartCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cartCount = action.payload.cartCount || state.cartCount + 1;
      });
  },
});

export const { clearCartError } = cartSlice.actions;
export default cartSlice.reducer;
