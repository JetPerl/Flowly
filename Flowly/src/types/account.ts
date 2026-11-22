export type AccountType =
  | 'REGULAR'
  | 'CARD'
  | 'CASH'
  | 'SAVINGS'
  | 'CRYPTO'
  | 'INVESTMENT';

export interface AccountResponse {
  id: number;
  name: string;
  currency: string;
  balance: number;
  type: AccountType;
  color: string | null;
  icon: string | null;
}

