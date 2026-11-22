export type CategoryType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface CategoryDto {
  id: number;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
}
