import { TagDto } from './tag';

export type OperationType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface OperationResponse {
  id: number;
  type: OperationType;
  amount: number;
  currency: string;
  category: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  categoryId: number | null;
  account: string;
  accountId: number;
  accountIcon: string | null;
  accountColor: string | null;
  relatedAccountId: number | null;
  transferId: number | null;
  note: string | null;
  recipient: string | null;
  place: string | null;
  tags: TagDto[];
  merchant: string | null;
  photoUrl: string | null;
  isPinned: boolean;
  dateTime: string;
}

export interface PageInfoResponse {
  displayed: number;
  hasNext: boolean;
  nextCursor: string | null;
}

export interface OperationPageResponse {
  items: OperationResponse[];
  pageInfo: PageInfoResponse;
}

export interface OperationCreateRequest {
  type: OperationType;
  amount: number;
  currency: string;
  accountId: number;
  categoryId?: number | null;
  relatedAccountId?: number | null;
  targetAmount?: number | null;
  dateTime: string;
  merchant?: string | null;
  place?: string | null;
  recipient?: string | null;
  note?: string | null;
  photoUrl?: string | null;
  isPinned?: boolean;
  tagIds?: number[];
}

export interface OperationPatchRequest {
  type?: OperationType;
  amount?: number;
  currency?: string;
  accountId?: number;
  categoryId?: number | null;
  relatedAccountId?: number | null;
  dateTime?: string;
  merchant?: string | null;
  place?: string | null;
  recipient?: string | null;
  note?: string | null;
  photoUrl?: string | null;
  isPinned?: boolean;
  tagIds?: number[];
}
