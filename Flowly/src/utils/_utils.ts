/**
 * @deprecated Используйте импорт из `../utils` или специализированных модулей:
 * `src/utils/currency`, `src/utils/formatters`, `src/utils/operationHelpers`.
 */
export * from './currency';
export * from './formatters';
export * from './operationHelpers';
export { API_BASE_URL } from '../api/config';

export const HEADER_SAVE_EVENT = 'transactions:new:save';
export type TransactionType = 'income' | 'expense' | 'transfer';
