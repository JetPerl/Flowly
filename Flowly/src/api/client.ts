import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Для симулятора iOS на Mac используется localhost, для физического iPhone — IP Mac в Wi-Fi сети
export const API_BASE_URL = Platform.OS === 'ios'
  ? 'http://localhost:8080'
  : 'http://192.168.0.135:8080';

const TOKEN_KEY = 'flowly:jwt_token';

// Токен разработчика, полученный при регистрации
const HARDCODED_DEV_TOKEN =
  'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJpbHlhYnVybmFzQGdtYWlsLmNvbSIsImlhdCI6MTc5Mzc5OTc1OCwiZXhwIjoxNzkzODg2MTU4fQ.yt-yEMTWxmfazv5cxgPaNIKCThx8wOeQx2Pf4hVG56jHnM0UeEsAFtvGwAJ5_tPj';

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string> {
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  // Пока нет экрана логина в приложении, можно временно отдавать приоритет свежему HARDCODED_DEV_TOKEN:
  return HARDCODED_DEV_TOKEN || stored || '';
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
    if (response.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    const errorText = await response.text().catch(() => '');
    throw new Error(`API Error [${response.status}]: ${errorText}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export interface OperationPageResponse {
  items: any[];
  pageInfo: {
    displayed: number;
    hasNext: boolean;
    nextCursor: string | null;
  };
}

/**
 * Превращает плоский список операций от бэкенда (/api/v1/operations)
 * в массив секций, сгруппированных по дням (YYYY-MM-DD), который ожидает фронтенд.
 */
export function groupOperationsIntoSections(items: any[]): { id: string; items: any[] }[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const groups: Record<string, any[]> = {};

  items.forEach(op => {
    const rawDate: string | undefined = op?.dateTime || op?.date_time || op?.date;
    // Берем дату в формате YYYY-MM-DD
    const dateKey = rawDate ? rawDate.split('T')[0] : 'unknown';
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(op);
  });

  return Object.entries(groups)
    .sort(([dateA], [dateB]) => (dateA < dateB ? 1 : -1))
    .map(([dateKey, groupItems]) => ({
      id: dateKey,
      items: groupItems,
    }));
}

export async function uploadImageFile(fileUri: string): Promise<{ url: string }> {
  const token = await getAuthToken();
  const formData = new FormData();

  const filename = fileUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: fileUri,
    name: filename,
    type,
  } as any);

  const cleanEndpoint = '/api/v1/files/upload';
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // 'Content-Type' указывать НЕ нужно — fetch сам выставит boundary для multipart/form-data
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Ошибка загрузки фото [${response.status}]: ${errorText}`);
  }

  return response.json();
}