import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_PREFIX } from './config';
import type { OperationPageResponse } from '../types/operation';

export { API_BASE_URL };

const TOKEN_KEY = 'flowly:jwt_token';

// Токен разработчика для локальной отладки до создания экрана логина
const HARDCODED_DEV_TOKEN =
  'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJFR3dSWTNpN1FFbXBET3cySHNTN2E2azR2cUN6WU1qdU5LMkpRMzA5Ul9nIn0.eyJleHAiOjE3OTUzODk4MTEsImlhdCI6MTc5NTM4OTUxMSwianRpIjoiZjIyYmRjZjgtNDA1Mi00NDUwLTg3MGQtNTZjZjA3NTYyZGM1IiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MTgwL3JlYWxtcy9mbG93bHkiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiN2Y4Y2QxMDUtMGU1ZS00YzQ1LWIwOWYtNjAxZGUzNGI0MDk0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxvd2x5LWJhY2tlbmQiLCJzaWQiOiJiZDdmMDMzNi0wYmFkLTRjYWMtOTJhZi1iMmNiOWE5NjU3ZTQiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCIsIi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLWZsb3dseSIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJVU0VSIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInVzZXJfaWQiOiIxNiIsInJvbGVzIjpbImRlZmF1bHQtcm9sZXMtZmxvd2x5Iiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIlVTRVIiXSwibmFtZSI6ImlseWFidXJuYXMgVXNlciIsInByZWZlcnJlZF91c2VybmFtZSI6ImlseWFidXJuYXNAZ21haWwuY29tIiwiZ2l2ZW5fbmFtZSI6ImlseWFidXJuYXMiLCJmYW1pbHlfbmFtZSI6IlVzZXIiLCJlbWFpbCI6ImlseWFidXJuYXNAZ21haWwuY29tIn0.eICJnKx0LJRKu8HxqXwhGks-P3uoR-1aeU_5XTXia1mGmpVEBz7K73rxi6674l7CuxgcOHgmWy7vlua0A1i1LHxLo4IKy3JqQj6Cv2v1y58MpIDv1_0dIOR9Bs5NWQREuqyYvslJLaKTVvFPTh905Ys-T-y5dY6kXhGHcxSkUJedXCNec_B3aUtHmb2aXapmg1nKmYnfVbp-2AWmsvXGcjl-q9NqSSvWLE3Eead4meP7FrTSEZ0sLuS9gZycEQ3xO-MFZ0dHYhj8GH3uYoG2Cde6RUcz4q2hk109A9sapcPygKtq-jmmLQE_Wj2_6wWYqK9mLQvmgYwHoFk4Ph_f4g';

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string> {
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  return HARDCODED_DEV_TOKEN || stored || '';
}

export async function removeAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const path = cleanEndpoint.startsWith(API_PREFIX) ? cleanEndpoint : `${API_PREFIX}${cleanEndpoint}`;

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

export { OperationPageResponse };

/**
 * Вспомогательная группировка операций по дням до выноса в utils
 */
export function groupOperationsIntoSections(items: any[]): { id: string; items: any[] }[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const groups: Record<string, any[]> = {};

  items.forEach(op => {
    const rawDate: string | undefined = op?.dateTime || op?.date_time || op?.date;
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

  const cleanEndpoint = `${API_PREFIX}/files/upload`;
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Ошибка загрузки фото [${response.status}]: ${errorText}`);
  }

  return response.json();
}
