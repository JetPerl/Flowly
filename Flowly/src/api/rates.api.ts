import { apiRequest } from './client';
import type { RatesMap } from '../types';

export async function getRates(): Promise<RatesMap> {
  return apiRequest<RatesMap>('/rates');
}

