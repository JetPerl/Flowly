import { apiRequest } from './client';
import type {
  OperationCreateRequest,
  OperationPageResponse,
  OperationPatchRequest,
  OperationResponse,
} from '../types';

export interface GetOperationsParams {
  accountId?: number;
  limit?: number;
  cursor?: string | null;
}

export async function getOperations(
  params: GetOperationsParams = {},
): Promise<OperationPageResponse> {
  const query = new URLSearchParams();
  if (params.accountId != null) {
    query.append('accountId', String(params.accountId));
  }
  if (params.limit != null) {
    query.append('limit', String(params.limit));
  }
  if (params.cursor) {
    query.append('cursor', params.cursor);
  }

  const qs = query.toString();
  const endpoint = `/operations${qs ? `?${qs}` : ''}`;
  return apiRequest<OperationPageResponse>(endpoint);
}

export async function getOperationById(id: number): Promise<OperationResponse> {
  return apiRequest<OperationResponse>(`/operations/${id}`);
}

export async function createOperation(
  data: OperationCreateRequest,
): Promise<OperationResponse> {
  return apiRequest<OperationResponse>('/operations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchOperation(
  id: number,
  data: OperationPatchRequest,
): Promise<OperationResponse> {
  return apiRequest<OperationResponse>(`/operations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteOperation(id: number): Promise<void> {
  return apiRequest<void>(`/operations/${id}`, {
    method: 'DELETE',
  });
}

