import { apiRequest, setAuthToken, removeAuthToken } from './client';
import type {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from '../types';

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res?.token) {
    await setAuthToken(res.token);
  }
  return res;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res?.token) {
    await setAuthToken(res.token);
  }
  return res;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res?.token) {
    await setAuthToken(res.token);
  }
  return res;
}

export async function logout(data: LogoutRequest): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } finally {
    await removeAuthToken();
  }
}

