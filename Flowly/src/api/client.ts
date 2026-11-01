import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Для симулятора iOS на Mac используется localhost, для физического iPhone — IP Mac в Wi-Fi сети
export const API_BASE_URL = Platform.OS === 'ios'
  ? 'http://localhost:8080'
  : 'http://192.168.0.135:8080';

const TOKEN_KEY = 'flowly:jwt_token';

// Токен разработчика, полученный при регистрации
const HARDCODED_DEV_TOKEN =
  'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJpbHlhYnVybmFzQGdtYWlsLmNvbSIsImlhdCI6MTc5MzU0NDI0NywiZXhwIjoxNzkzNjMwNjQ3fQ.CUXmNkTzpIBmMB49TpQCbrGP-hXIyLO_viqGBF9w9FIxESzCNQAaV5VV_QfxwK--';

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string> {
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  return stored || HARDCODED_DEV_TOKEN;
}

export async function removeAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const path = cleanEndpoint.startsWith('/api/v1') ? cleanEndpoint : `/api/v1${cleanEndpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API Error [${response.status}]: ${errorText}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}