import type { AsyncThunk } from '@reduxjs/toolkit';
import type { User } from '@/types/api';

type AuthResponse = { user: User; accessToken: string; refreshToken: string };
type RejectValue = { rejectValue: string };

export declare const loginUser: AsyncThunk<AuthResponse, { email: string; password: string }, RejectValue>;
export declare const registerUser: AsyncThunk<AuthResponse, { name: string; email: string; password: string; phone?: string; referralCode?: string }, RejectValue>;
export declare const fetchProfile: AsyncThunk<User, void, RejectValue>;
export declare const logoutUser: AsyncThunk<void, void, Record<string, never>>;
export declare const setInitialized: () => { type: string };
export declare const updateUser: (payload: Partial<User>) => { type: string; payload: Partial<User> };
