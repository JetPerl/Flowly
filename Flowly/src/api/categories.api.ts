import { apiRequest } from './client';
import type { CategoryDto, CategoryType } from '../types';

export async function getCategories(type?: CategoryType): Promise<CategoryDto[]> {
  const query = type ? `?type=${type}` : '';
  return apiRequest<CategoryDto[]>(`/categories${query}`);
}

