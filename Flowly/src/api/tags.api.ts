import { apiRequest } from './client';
import type { TagDto } from '../types';

export async function getTags(): Promise<TagDto[]> {
  return apiRequest<TagDto[]>('/tags');
}

