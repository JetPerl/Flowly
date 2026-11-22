import { apiRequest } from './client';
import type { AccountResponse } from '../types';

export async function getAccounts(): Promise<AccountResponse[]> {
  return apiRequest<AccountResponse[]>('/accounts');
}

