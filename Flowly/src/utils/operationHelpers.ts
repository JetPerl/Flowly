import type { TagDto } from '../types';
import {
  DEFAULT_MAIN_CURRENCY,
  getCurrencySymbol,
  getRateToMain,
  inferCurrencyCodeFromLabel,
} from './currency';
import { formatLongDateRu, sanitizeNumericInput } from './formatters';

const DEFAULT_PRIMARY_COLOR = '#2BAF8C';

export interface HistoryItem {
  id: string;
  category: string;
  categoryId?: number | null;
  categoryIcon?: string | null;
  merchant: string;
  amountLabel: string;
  amountValue?: number | null;
  currency?: string | null;
  color: string;
  account: string;
  accountId?: number | null;
  accountIcon?: string | null;
  accountColor?: string | null;
  dateTime: string;
  timestamp?: number | null;
  type: 'income' | 'expense' | 'transfer';
  recipient?: string;
  place?: string;
  placeLat?: number | null;
  placeLng?: number | null;
  note?: string;
  tags?: TagDto[];
  transferId?: number | string | null;
  relatedAccountId?: number | null;
  transferOperationIds?: (number | string)[];
  transferFromLabel?: string | null;
  transferToLabel?: string | null;
  transferToAccountName?: string | null;
  transferFromAccountName?: string | null;
  transferFromAccountIcon?: string | null;
  transferFromAccountColor?: string | null;
  transferToAccountIcon?: string | null;
  transferToAccountColor?: string | null;
  photoUrl?: string | null;
  isPinned?: boolean;
}

export interface HistorySection {
  id: string;
  dateLabel: string;
  totalLabel: string;
  items: HistoryItem[];
}

export function getOperationTitle(item: HistoryItem): string {
  if (item.type === 'transfer') {
    return 'Перевод';
  }
  return item.category || 'Без категории';
}

export function getOperationSubtitle(item: HistoryItem): string {
  if (item.type === 'transfer') {
    const fromName = item.transferFromAccountName || item.account || 'Счёт';
    const toName = item.transferToAccountName || item.recipient || 'Счёт';
    return `${fromName} → ${toName}`;
  }
  const recipientPart = (item.recipient || item.merchant || '').trim();
  const notePart = (item.note || '').trim();

  if (!recipientPart && !notePart) return '';
  return notePart ? (recipientPart ? `${recipientPart} – ${notePart}` : notePart) : recipientPart;
}

export function itemMatchesQuery(item: HistoryItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const haystack = [
    getOperationTitle(item),
    getOperationSubtitle(item),
    item.account,
    item.amountLabel,
    item.transferFromLabel,
    item.transferToLabel,
    item.note,
    item.place,
    item.recipient,
    item.merchant,
    ...(item.tags?.map(t => t.name) || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

export function mapApiOperationToHistoryItem(
  op: any,
  accountsById: Record<number, any> = {},
  primaryColor: string = DEFAULT_PRIMARY_COLOR,
): HistoryItem {
  const rawType = typeof op?.type === 'string' ? op.type.toLowerCase() : 'expense';
  const type: 'income' | 'expense' | 'transfer' =
    rawType === 'income' ? 'income' : rawType === 'transfer' ? 'transfer' : 'expense';

  const amountNumber =
    typeof op?.amount === 'number'
      ? op.amount
      : op?.amount
        ? Number(op.amount)
        : 0;

  const currencySymbol = getCurrencySymbol(op?.currency);
  const amountLabel =
    op?.amountLabel ||
    `${type === 'income' ? '+ ' : '− '}${amountNumber.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currencySymbol}`;

  const rawDate: string | undefined =
    op?.dateTime || op?.date_time || op?.date || op?.created_at;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const timestamp =
    parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : null;

  const normalizeId = (val: any) => {
    if (val === null || val === undefined) return null;
    const num = typeof val === 'number' ? val : Number(val);
    return Number.isFinite(num) ? num : null;
  };

  const accountId = normalizeId(op?.accountId ?? op?.account_id);
  const relatedAccountId = normalizeId(op?.relatedAccountId ?? op?.related_account_id);
  const categoryId = normalizeId(op?.categoryId ?? op?.category_id ?? op?.category?.id);
  const transferId = op?.transferId ?? op?.transfer_id ?? null;

  const accountMeta = accountId ? accountsById[accountId] : undefined;
  const accountTitle =
    (typeof op?.account === 'string' ? op.account : op?.account?.name) ||
    accountMeta?.name ||
    'Основной счёт';

  const accountIcon =
    op?.accountIcon ||
    op?.account_icon ||
    (typeof op?.account === 'object' && op?.account?.icon) ||
    accountMeta?.icon ||
    null;

  const accountColorRaw =
    op?.accountColor ||
    op?.account_color ||
    (typeof op?.account === 'object' && op?.account?.color) ||
    accountMeta?.color ||
    null;
  const accountColor =
    typeof accountColorRaw === 'string' && accountColorRaw.trim().length > 0
      ? accountColorRaw.trim()
      : null;

  const categoryName =
    typeof op?.category === 'string' && op.category.trim().length > 0
      ? op.category
      : op?.category?.name || 'Без категории';

  const categoryIcon =
    op?.categoryIcon ||
    op?.category_icon ||
    (typeof op?.category === 'object' && op?.category?.icon) ||
    op?.icon ||
    null;

  const categoryColor =
    op?.categoryColor ||
    op?.category_color ||
    op?.color ||
    op?.category?.color ||
    primaryColor;

  const recipient = op?.recipient || op?.merchant || op?.counterparty || '';

  const tags: TagDto[] = Array.isArray(op?.tags)
    ? op.tags
      .map((t: any): TagDto => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }))
      .filter((t: TagDto) => t.id !== undefined && t.name)
    : [];

  const photoUrl =
    typeof op?.photoUrl === 'string'
      ? op.photoUrl
      : typeof op?.photo_url === 'string'
        ? op.photo_url
        : null;

  const isPinned =
    typeof op?.isPinned === 'boolean'
      ? op.isPinned
      : typeof op?.is_pinned === 'boolean'
        ? op.is_pinned
        : false;

  return {
    id: String(op?.id ?? `${Date.now()}-${Math.random()}`),
    category: categoryName,
    categoryId,
    categoryIcon,
    merchant: op?.merchant || '',
    amountLabel,
    amountValue: amountNumber,
    currency: op?.currency,
    color: categoryColor,
    account: accountTitle,
    accountId,
    accountIcon,
    accountColor,
    dateTime: rawDate || new Date().toISOString(),
    timestamp,
    type,
    recipient,
    place: op?.place || '',
    placeLat: op?.placeLat ?? op?.place_lat ?? null,
    placeLng: op?.placeLng ?? op?.place_lng ?? null,
    note: op?.note || '',
    tags,
    transferId,
    relatedAccountId,
    transferOperationIds: transferId ? [String(op.id)] : undefined,
    photoUrl,
    isPinned,
  };
}

export function mergeTransferItems(
  items: HistoryItem[],
  primaryColor: string = DEFAULT_PRIMARY_COLOR,
  fallbackAccountColor: string | null = null,
): HistoryItem[] {
  const grouped: Record<string, HistoryItem[]> = {};
  const standalone: HistoryItem[] = [];
  const transferlessIncome: HistoryItem[] = [];
  const transferlessExpense: HistoryItem[] = [];

  const makePairKey = (item: HistoryItem): string | null => {
    if (!item.accountId || !item.relatedAccountId) return null;
    const a = String(item.accountId);
    const b = String(item.relatedAccountId);
    const sorted = [a, b].sort().join('-');
    const t = new Date(item.dateTime).getTime();
    return `${sorted}-${Number.isFinite(t) ? t : ''}`;
  };

  items.forEach(item => {
    const tId = item.transferId;
    const pairKey = makePairKey(item);
    if (tId === null || tId === undefined) {
      if (!pairKey) {
        if (item.type === 'income') {
          transferlessIncome.push(item);
        } else if (item.type === 'expense') {
          transferlessExpense.push(item);
        } else {
          standalone.push(item);
        }
        return;
      }
      const key = `pair-${pairKey}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
      return;
    }
    const key = String(tId);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const merged: HistoryItem[] = [];

  Object.entries(grouped).forEach(([key, group]) => {
    if (group.length < 2) {
      merged.push(...group);
      return;
    }
    const expense = group.find(g => g.type === 'expense') || group[0];
    const income =
      group.find(g => g.type === 'income') || group.find(g => g !== expense) || group[0];

    const from = expense;
    const to = income === expense ? group[1] || expense : income;

    const amountFrom =
      typeof from.amountValue === 'number'
        ? from.amountValue
        : Number(sanitizeNumericInput(from.amountLabel)) || 0;
    const amountTo =
      typeof to.amountValue === 'number'
        ? to.amountValue
        : Number(sanitizeNumericInput(to.amountLabel)) || 0;

    const symbolFrom = getCurrencySymbol(from.currency);
    const symbolTo = getCurrencySymbol(to.currency);

    const formatSide = (val: number, symbol: string, incoming: boolean) =>
      `${incoming ? '+ ' : '− '}${Math.abs(val).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${symbol}`;

    const fromLabel = formatSide(amountFrom, symbolFrom, false);
    const toLabel = formatSide(amountTo, symbolTo, true);

    const mergedTimestamp =
      typeof from.timestamp === 'number' && !Number.isNaN(from.timestamp)
        ? from.timestamp
        : typeof to.timestamp === 'number' && !Number.isNaN(to.timestamp)
          ? to.timestamp
          : new Date(from.dateTime || to.dateTime || Date.now()).getTime();
    const mergedPinned = Boolean(from.isPinned || to.isPinned);

    merged.push({
      ...from,
      id: `transfer-${key}`,
      amountLabel: `${fromLabel} → ${toLabel}`,
      account: from.account,
      accountId: from.accountId,
      relatedAccountId: to.accountId ?? null,
      recipient: to.account || to.merchant || '',
      category: 'Перевод',
      categoryIcon: 'transfer',
      color: primaryColor,
      tags: [],
      note: from.note || to.note || '',
      place: from.place || to.place || '',
      transferFromLabel: fromLabel,
      transferToLabel: toLabel,
      transferFromAccountName: from.account,
      transferToAccountName: to.account,
      transferFromAccountIcon: from.accountIcon || 'wallet',
      transferFromAccountColor: from.accountColor || fallbackAccountColor,
      transferToAccountIcon: to.accountIcon || 'wallet',
      transferToAccountColor: to.accountColor || primaryColor,
      type: 'transfer',
      timestamp: mergedTimestamp,
      transferOperationIds: [from.id, to.id].filter(Boolean).map(String),
      isPinned: mergedPinned,
    });
  });

  // Хитрый случай: перевод без transfer_id, но две операции с одинаковой датой
  const incomeUsed = new Set<string>();
  transferlessExpense.forEach(exp => {
    const match = transferlessIncome.find(inc => {
      if (incomeUsed.has(inc.id)) return false;
      return inc.dateTime === exp.dateTime;
    });
    if (match) {
      incomeUsed.add(match.id);
      const amountFrom =
        typeof exp.amountValue === 'number'
          ? exp.amountValue
          : Number(sanitizeNumericInput(exp.amountLabel)) || 0;
      const amountTo =
        typeof match.amountValue === 'number'
          ? match.amountValue
          : Number(sanitizeNumericInput(match.amountLabel)) || 0;

      const symbolFrom = getCurrencySymbol(exp.currency);
      const symbolTo = getCurrencySymbol(match.currency);

      const formatSide = (val: number, symbol: string, incoming: boolean) =>
        `${incoming ? '+ ' : '− '}${Math.abs(val).toLocaleString('ru-RU', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${symbol}`;

      const fromLabel = formatSide(amountFrom, symbolFrom, false);
      const toLabel = formatSide(amountTo, symbolTo, true);

      merged.push({
        ...exp,
        id: `transfer-matched-${exp.id}-${match.id}`,
        amountLabel: `${fromLabel} → ${toLabel}`,
        account: exp.account,
        accountId: exp.accountId,
        relatedAccountId: match.accountId ?? null,
        recipient: match.account || match.merchant || '',
        category: 'Перевод',
        categoryIcon: 'transfer',
        color: primaryColor,
        tags: [],
        note: exp.note || match.note || '',
        place: exp.place || match.place || '',
        transferFromLabel: fromLabel,
        transferToLabel: toLabel,
        transferFromAccountName: exp.account,
        transferToAccountName: match.account,
        transferFromAccountIcon: exp.accountIcon || 'wallet',
        transferFromAccountColor: exp.accountColor || fallbackAccountColor,
        transferToAccountIcon: match.accountIcon || 'wallet',
        transferToAccountColor: match.accountColor || primaryColor,
        type: 'transfer',
        transferOperationIds: [exp.id, match.id].filter(Boolean).map(String),
        isPinned: Boolean(exp.isPinned || match.isPinned),
      });
    } else {
      standalone.push(exp);
    }
  });

  transferlessIncome.forEach(inc => {
    if (!incomeUsed.has(inc.id)) {
      standalone.push(inc);
    }
  });

  return [...merged, ...standalone];
}

export function computeSectionTotalLabel(
  items: HistoryItem[],
  ratesMap: Record<string, number>,
  mainCurrency: string = DEFAULT_MAIN_CURRENCY,
  mainCurrencySymbol: string = 'Br',
): string {
  if (!items.length) return '';

  let hasNonTransfer = false;
  const sumInMain = items.reduce((acc, item) => {
    if (item.transferId || item.type === 'transfer') return acc;
    hasNonTransfer = true;
    const numeric =
      typeof item.amountValue === 'number'
        ? item.amountValue
        : Number(sanitizeNumericInput(item.amountLabel));
    if (Number.isNaN(numeric)) return acc;

    const currencyCode =
      item.currency || inferCurrencyCodeFromLabel(item.amountLabel) || mainCurrency;
    const rate = getRateToMain(currencyCode, ratesMap, mainCurrency);
    const valueInMain = numeric * rate;
    return acc + (item.type === 'income' ? valueInMain : -valueInMain);
  }, 0);

  if (!hasNonTransfer || Math.abs(sumInMain) < 0.005) {
    return '';
  }

  const sign = sumInMain >= 0 ? '+ ' : '− ';
  const formatted = Math.abs(sumInMain).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted} ${mainCurrencySymbol}`;
}

export function groupOperationsIntoSections(items: HistoryItem[]): HistorySection[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const groups: Record<string, HistoryItem[]> = {};

  items.forEach(item => {
    const rawDate = item.dateTime;
    const dateKey = rawDate ? rawDate.split('T')[0] : 'unknown';
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });

  return Object.entries(groups)
    .sort(([dateA], [dateB]) => (dateA < dateB ? 1 : -1))
    .map(([dateKey, groupItems]) => {
      const parsedDate = dateKey !== 'unknown' ? new Date(dateKey) : new Date();
      return {
        id: dateKey,
        dateLabel: formatLongDateRu(parsedDate),
        totalLabel: '',
        items: groupItems,
      };
    });
}