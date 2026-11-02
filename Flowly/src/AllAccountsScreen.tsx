import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useRouter } from 'expo-router';
import {
  apiRequest,
  groupOperationsIntoSections,
  type OperationPageResponse,
} from './api/client';

import { useMainCurrency } from './currency/CurrencyContext';
import CategoryIcon from './components/CategoryIcon';

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  textMain: '#212121',
  textSecondary: '#757575',
  primary: '#2BAF8C',
  border: '#D5D8DF',
  muted: '#F3F4F6',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  BYN: 'Br',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: '₣',
  JPY: '¥',
  CNY: '¥',
  KZT: '₸',
  UAH: '₴',
  CAD: 'CA$',
  AUD: 'A$',
};

const DEFAULT_MAIN_CURRENCY = 'BYN';

// const API_BASE_URL = 'http://192.168.100.96:8080';

  // дом
  // const API_BASE_URL = 'http://192.168.0.135:8080';

  // симулятор iOS на этом же Mac (если запускаете не на физическом телефоне)
  const API_BASE_URL = 'http://localhost:8080';

  // телефон
  // const API_BASE_URL = 'http://172.20.10.2:8080';

  // соня
  // const API_BASE_URL = 'http://172.20.10.3:8080';

  // мой t2
  // const API_BASE_URL = 'http://172.20.10.2:8080';

const HISTORY_ICON_SIZE = 44;
const TRANSFER_ICON_SIZE = 24;

interface HistoryItem {
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

interface HistorySection {
  id: string;
  dateLabel: string;
  totalLabel: string;
  items: HistoryItem[];
}

type AccountDto = {
  id: number;
  name?: string | null;
  currency?: string | null;
  color?: string | null;
  balance?: number | null;
  full_name?: string | null;
  short_name?: string | null;
  icon?: string | null;
  account_type?: string | null;
  account_group?: string | null;
};

type TagDto = {
  id: number;
  name: string;
  color?: string | null;
};

const formatLongDateRu = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const str = formatter.format(date);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatDateTimeRu = (date: Date): string => {
  const shortDate = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const datePart = shortDate.charAt(0).toUpperCase() + shortDate.slice(1);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${datePart}, ${hh}:${mm}`;
};

const sanitizeNumericInput = (input: string) => {
  if (!input) return '';
  let s = input.replace(/,/g, '.');
  s = s.replace(/[^0-9.]/g, '');

  const stripLeadingZeros = (value: string) => {
    const trimmed = value.replace(/^0+(?!$)/, '');
    return trimmed === '' ? '0' : trimmed;
  };

  const firstDot = s.indexOf('.');
  if (firstDot === -1) {
    const normalizedInt = stripLeadingZeros(s);
    return normalizedInt;
  }

  const intPart = stripLeadingZeros(s.slice(0, firstDot) || '0');
  const decimalsRaw = s
    .slice(firstDot + 1)
    .replace(/\./g, '');
  const decimals = decimalsRaw.slice(0, 2);

  if (decimals.length === 0 && s.endsWith('.')) {
    return `${intPart}.`;
  }

  return decimals.length ? `${intPart}.${decimals}` : intPart;
};

const extractCurrencyFromLabel = (label: string) => {
  const trimmed = (label || '').trim();
  const match = trimmed.match(/([A-Za-zА-Яа-я₽$€£¥₮₸₴₹฿]+)$/u);
  return match ? match[1] : '₽';
};

const inferCurrencyCodeFromLabel = (label: string): string | null => {
  const cur = extractCurrencyFromLabel(label);
  const map: Record<string, string> = {
    '₽': 'RUB',
    'Br': 'BYN',
    BYN: 'BYN',
    RUB: 'RUB',
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    CHF: 'CHF',
    JPY: 'JPY',
    CNY: 'CNY',
    KZT: 'KZT',
    UAH: 'UAH',
    CAD: 'CAD',
    'CA$': 'CAD',
    AUD: 'AUD',
    'A$': 'AUD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₸': 'KZT',
    '₴': 'UAH',
    '$': 'USD',
  };
  return map[cur] || null;
};

const getCurrencySymbol = (code?: string | null) => {
  if (!code) return '₽';
  const upper = code.toUpperCase();
  return CURRENCY_SYMBOLS[upper] || code;
};

const getOperationTitle = (item: HistoryItem) => {
  if (item.type === 'transfer' || item.transferId) {
    const from = item.transferFromAccountName || item.account || 'Счёт';
    const to = item.transferToAccountName || 'Счёт';
    return `${from} → ${to}`;
  }
  const trimmed = (item.category || '').trim();
  return trimmed.length > 0 ? trimmed : 'Категория';
};

const getOperationSubtitle = (item: HistoryItem) => {
  const normalize = (value?: string | null) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    if (['—', '-', '_', '–'].includes(trimmed)) return '';
    return trimmed;
  };

  const recipientPart = normalize(item.recipient) || normalize(item.merchant);
  const notePart = normalize(item.note);

  if (!recipientPart && !notePart) return '';
  return notePart ? (recipientPart ? `${recipientPart} – ${notePart}` : notePart) : recipientPart;
};

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const itemMatchesQuery = (item: HistoryItem, query: string) => {
  if (!query) return true;
  const haystack = [
    getOperationTitle(item),
    getOperationSubtitle(item),
    item.account,
    item.amountLabel,
    item.transferFromLabel,
    item.transferToLabel,
    item.note,
    item.recipient,
    item.merchant,
  ]
    .filter(Boolean)
    .map(v => normalizeSearch(String(v)));
  const needle = normalizeSearch(query);
  return haystack.some(text => text.includes(needle));
};

const renderOperationIcon = (
  item: HistoryItem,
  accountsById: Record<number, AccountDto>,
) => {
  const pickColor = (value?: string | null, fallback = '#F3F4F6') => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return fallback;
  };

  if (item.type === 'transfer' || item.transferId) {
    const fromColor = pickColor(item.transferFromAccountColor || item.accountColor, '#F8D7B5');
    const toColor = pickColor(item.transferToAccountColor, '#F3B0B5');
    const transferIconTop = (HISTORY_ICON_SIZE - TRANSFER_ICON_SIZE) / 2;
    const frontWrapperSize = TRANSFER_ICON_SIZE + 6;
    const frontWrapperTop = (HISTORY_ICON_SIZE - frontWrapperSize) / 2;

    const fromIcon =
      (item.accountId ? accountsById[item.accountId]?.icon : null) ||
      item.transferFromAccountIcon ||
      'wallet';
    const toIcon =
      item.transferToAccountIcon ||
      (item.relatedAccountId ? accountsById[item.relatedAccountId]?.icon : null) ||
      'wallet';

    return (
      <View style={styles.transferIconStack}>
        <CategoryIcon
          name={fromIcon}
          color="#FFFFFF"
          backgroundColor={fromColor}
          fallbackColor={fromColor}
          size={TRANSFER_ICON_SIZE}
          style={[
            styles.transferIcon,
            { left: 2, top: transferIconTop - 4, zIndex: 1 },
          ]}
        />
        <View
          style={[
            styles.transferIconFrontWrapper,
            {
              width: frontWrapperSize,
              height: frontWrapperSize,
              borderRadius: frontWrapperSize / 2,
              top: frontWrapperTop + 4,
              right: 0,
              zIndex: 2,
            },
          ]}
        >
          <CategoryIcon
            name={toIcon}
            color="#FFFFFF"
            backgroundColor={toColor}
            fallbackColor={toColor}
            size={TRANSFER_ICON_SIZE}
          />
        </View>
      </View>
    );
  }

  const NEUTRAL_ICON_BG = '#F3F4F6';
  const categoryColor = NEUTRAL_ICON_BG;

  return (
    <View style={styles.historyIconWrapper}>
      <CategoryIcon
        name={item.categoryIcon || 'wallet'}
        color={COLORS.textMain}
        backgroundColor={categoryColor}
        fallbackColor={categoryColor}
        size={HISTORY_ICON_SIZE - 10}
      />
    </View>
  );
};

const AllAccountsScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { mainCurrency } = useMainCurrency();
  const MAIN_CURRENCY = (mainCurrency || DEFAULT_MAIN_CURRENCY).toUpperCase();
  const mainCurrencySymbol = getCurrencySymbol(MAIN_CURRENCY);

  const [accountsById, setAccountsById] = useState<Record<number, AccountDto>>({});
  const [ratesMap, setRatesMap] = useState<Record<string, number>>({ [MAIN_CURRENCY]: 1 });
  const [sections, setSections] = useState<HistorySection[]>([]);
  const [rawSections, setRawSections] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const getRateToMain = useCallback(
    (currency?: string | null) => {
      if (!currency) return 1;
      const upper = currency.toUpperCase();
      if (upper === MAIN_CURRENCY) return 1;

      const mainRate = ratesMap[MAIN_CURRENCY];
      const curRate = ratesMap[upper];
      const mainVal =
        typeof mainRate === 'number' && mainRate > 0 && Number.isFinite(mainRate)
          ? mainRate
          : 1;
      const curVal =
        typeof curRate === 'number' && curRate > 0 && Number.isFinite(curRate)
          ? curRate
          : mainVal;

      if (mainVal === 0) return 1;
      return curVal / mainVal;
    },
    [ratesMap, MAIN_CURRENCY],
  );

  const computeSectionTotalLabel = useCallback(
    (items: HistoryItem[]) => {
      if (!items.length) return '';

      let hasNonTransfer = false;
      const sumInMain = items.reduce((acc, item) => {
        if (item.transferId || item.type === 'transfer') return acc;
        hasNonTransfer = true;
        const numeric = Number(sanitizeNumericInput(item.amountLabel));
        if (Number.isNaN(numeric)) return acc;

        const currencyCode =
          item.currency || inferCurrencyCodeFromLabel(item.amountLabel) || MAIN_CURRENCY;
        const rate = getRateToMain(currencyCode);
        const valueInMain = numeric * rate;
        return acc + (item.type === 'income' ? valueInMain : -valueInMain);
      }, 0);

      if (!hasNonTransfer) {
        return '';
      }

      if (Math.abs(sumInMain) < 0.005) {
        return '';
      }

      const sign = sumInMain >= 0 ? '+ ' : '− ';
      const formatted = Math.abs(sumInMain).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${sign}${formatted} ${mainCurrencySymbol}`;
    },
    [MAIN_CURRENCY, getRateToMain, mainCurrencySymbol],
  );

  const applySectionTotals = useCallback(
    (list: HistorySection[]): HistorySection[] =>
      list.map(section => ({
        ...section,
        totalLabel: computeSectionTotalLabel(section.items),
      })),
    [computeSectionTotalLabel],
  );

const mapApiOperationToHistoryItem = useCallback(
    (op: any): HistoryItem => {
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

      // Поддержка и camelCase (наш новый бэкенд), и snake_case
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
        COLORS.primary;

      const recipient =
        op?.recipient ||
        op?.merchant ||
        op?.counterparty ||
        '';

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
        id: String(op?.id ?? `op-${Date.now()}`),
        category: categoryName,
        categoryId,
        categoryIcon,
        merchant: op?.merchant || '',
        amountLabel,
        amountValue: amountNumber,
        currency: op?.currency || inferCurrencyCodeFromLabel(amountLabel) || null,
        color: categoryColor,
        account: accountTitle,
        accountId,
        accountIcon,
        accountColor,
        dateTime:
          parsedDate && !Number.isNaN(parsedDate.getTime())
            ? formatDateTimeRu(parsedDate)
            : typeof op?.dateTime === 'string'
              ? op.dateTime
              : '',
        timestamp,
        type,
        recipient,
        place: op?.place || '',
        note: op?.note || '',
        tags,
        transferId,
        relatedAccountId,
        transferOperationIds: transferId
          ? [op?.id].filter((id: any) => id !== undefined && id !== null).map(String)
          : undefined,
        photoUrl,
        isPinned,
      };
    },
    [accountsById],
  );

  const mergeTransferItems = useCallback(
    (items: HistoryItem[]): HistoryItem[] => {
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
        const expense =
          group.find(g => g.type === 'expense') || group[0];
        const income =
          group.find(g => g.type === 'income') ||
          group.find(g => g !== expense) ||
          group[0];

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
          color: COLORS.primary,
          tags: [],
          note: from.note || to.note || '',
          place: from.place || to.place || '',
          transferFromLabel: fromLabel,
          transferToLabel: toLabel,
          transferFromAccountName: from.account,
          transferToAccountName: to.account,
          transferFromAccountIcon: from.accountIcon || 'wallet',
          transferFromAccountColor: from.accountColor || COLORS.textMain,
          transferToAccountIcon: to.accountIcon || 'wallet',
          transferToAccountColor: to.accountColor || COLORS.primary,
          type: 'transfer',
          timestamp: mergedTimestamp,
          transferOperationIds: [from.id, to.id].filter(Boolean).map(String),
          isPinned: mergedPinned,
        });
      });

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
          const mergedPinned = Boolean(exp.isPinned || match.isPinned);

          merged.push({
            ...exp,
            id: `transfer-paired-${exp.id}-${match.id}`,
            amountLabel: `${fromLabel} → ${toLabel}`,
            transferFromLabel: fromLabel,
            transferToLabel: toLabel,
            transferFromAccountName: exp.account,
            transferToAccountName: match.account,
            transferToAccountIcon: match.accountIcon || 'wallet',
            transferToAccountColor: match.accountColor || COLORS.primary,
            relatedAccountId: match.accountId ?? null,
            transferId: exp.transferId || match.transferId || `pair-${exp.id}-${match.id}`,
            type: 'transfer',
            timestamp:
              typeof exp.timestamp === 'number' && !Number.isNaN(exp.timestamp)
                ? exp.timestamp
                : typeof match.timestamp === 'number' && !Number.isNaN(match.timestamp)
                  ? match.timestamp
                  : new Date(exp.dateTime || match.dateTime || Date.now()).getTime(),
            transferOperationIds: [exp.id, match.id].filter(Boolean).map(String),
            isPinned: mergedPinned,
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

      return [...standalone, ...merged].sort((x, y) => {
        const ax =
          typeof x.timestamp === 'number' && !Number.isNaN(x.timestamp)
            ? x.timestamp
            : new Date(x.dateTime).getTime();
        const ay =
          typeof y.timestamp === 'number' && !Number.isNaN(y.timestamp)
            ? y.timestamp
            : new Date(y.dateTime).getTime();
        return (Number.isFinite(ay) ? ay : 0) - (Number.isFinite(ax) ? ax : 0);
      });
    },
    [],
  );

  const mapSectionsFromApi = useCallback(
    (apiSections: any[]): HistorySection[] => {
      const mapped = apiSections
        .map(section => {
          const id = section?.id || section?.dateLabel || `section-${Math.random()}`;

          let label = section?.dateLabel || '';
          if (section?.id) {
            const d = new Date(section.id);
            if (!Number.isNaN(d.getTime())) {
              label = formatLongDateRu(d);
            }
          }

          const itemsRaw: HistoryItem[] = Array.isArray(section?.items)
            ? section.items.map(mapApiOperationToHistoryItem)
            : [];
          const items = mergeTransferItems(itemsRaw);

          return {
            id,
            dateLabel: label,
            totalLabel: '',
            items,
          };
        })
        .filter(section => section.items.length > 0);

      return applySectionTotals(mapped);
    },
    [applySectionTotals, mapApiOperationToHistoryItem, mergeTransferItems],
  );

const loadMeta = useCallback(async () => {
  try {
    const [accounts, rates] = await Promise.all([
      apiRequest<AccountDto[]>('/accounts'),
      apiRequest<Record<string, number>>('/rates').catch(() => ({ [MAIN_CURRENCY]: 1 })),
    ]);

    const normalized: AccountDto[] = Array.isArray(accounts) ? accounts : [];
    const map: Record<number, AccountDto> = {};
    normalized.forEach(acc => {
      if (typeof acc?.id !== 'number') return;
      map[acc.id] = acc;
    });
    setAccountsById(map);

    if (rates && typeof rates === 'object') {
      setRatesMap((prev: Record<string, number>) => ({ ...prev, ...rates }));
    }
  } catch (e) {
    console.warn('Ошибка загрузки счетов или курсов', e);
  }
}, [MAIN_CURRENCY]);

const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadHistory = useCallback(async (cursor?: string | null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const query = new URLSearchParams();
      query.set('limit', '20');
      if (cursor) {
        query.set('cursor', cursor);
      }

      const data = await apiRequest<OperationPageResponse>(`/operations?${query.toString()}`);
      const items = Array.isArray(data?.items) ? data.items : [];
      setNextCursor(data?.pageInfo?.hasNext ? data.pageInfo.nextCursor : null);

      setRawSections(prev => {
        // Достаем старые сырые элементы
        const prevItems = cursor ? prev.flatMap(s => s.items || []) : [];
        
        // Объединяем и убираем дубликаты по id на случай повторного срабатывания курсора
        const map = new Map();
        [...prevItems, ...items].forEach(op => {
          if (op?.id !== undefined && op?.id !== null) {
            map.set(String(op.id), op);
          }
        });

        return groupOperationsIntoSections(Array.from(map.values()));
      });
    } catch (e) {
      console.warn('Ошибка загрузки операций', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([loadMeta(), loadHistory(null)]);
    setRefreshing(false);
  }, [loadHistory, loadMeta, refreshing]);

  useEffect(() => {
    const savedSub = DeviceEventEmitter.addListener('operation:saved', handleRefresh);
    const deletedSub = DeviceEventEmitter.addListener('operation:deleted', handleRefresh);
    return () => {
      savedSub.remove();
      deletedSub.remove();
    };
  }, [handleRefresh]);

useEffect(() => {
    loadMeta();
    loadHistory(null);
  }, [loadHistory, loadMeta])

  useEffect(() => {
    if (!rawSections || rawSections.length === 0) {
      setSections([]);
      return;
    }
    setSections(mapSectionsFromApi(rawSections));
  }, [mapSectionsFromApi, rawSections]);

  useEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Поиск',
        placement: 'stacked',
        hideWhenScrolling: true,
        onChangeText: ({ nativeEvent }) => setSearchQuery(nativeEvent.text),
        onCancelButtonPress: () => setSearchQuery(''),
      },
    });
  }, [navigation]);

  const hasQuery = searchQuery.trim().length > 0;

  const filteredSections = useMemo(() => {
    if (!hasQuery) return sections;
    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => itemMatchesQuery(item, searchQuery)),
      }))
      .filter(section => section.items.length > 0);
  }, [hasQuery, searchQuery, sections]);

  const openOperationInModal = (item: HistoryItem) => {
    const accountMeta = item.accountId ? accountsById[item.accountId] : undefined;
    const categoryPayload = item.categoryId
      ? {
        id: item.categoryId,
        name: item.category,
        icon: item.categoryIcon || null,
        color: item.color || null,
      }
      : null;

    const accountPayload = accountMeta
      ? {
        id: accountMeta.id,
        name: accountMeta.name || item.account || 'Счёт',
        currency: accountMeta.currency || item.currency,
        icon: accountMeta.icon || item.accountIcon || null,
        color: accountMeta.color || item.accountColor || null,
      }
      : null;

    const targetMeta = item.relatedAccountId ? accountsById[item.relatedAccountId] : undefined;
    const targetAccountPayload =
      item.type === 'transfer'
        ? {
          id: targetMeta?.id ?? item.relatedAccountId ?? null,
          name: targetMeta?.name || item.transferToAccountName || 'Счёт',
          currency: targetMeta?.currency || item.currency,
          icon: targetMeta?.icon || item.transferToAccountIcon || 'wallet',
          color: targetMeta?.color || item.transferToAccountColor || item.accountColor || null,
        }
        : null;

    const parsedDate =
      typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)
        ? new Date(item.timestamp)
        : item.dateTime
          ? new Date(item.dateTime)
          : null;

    const parsedAmountFromLabel = Number(item.amountLabel?.replace(/[^\d.-]/g, ''));
    const normalizedAmount =
      item.amountValue ?? (Number.isFinite(parsedAmountFromLabel) ? parsedAmountFromLabel : 0);

    const payload: Record<string, any> = {
      id: item.id,
      type: item.type,
      amount: normalizedAmount,
      amountLabel: item.amountLabel,
      currency: item.currency,
      recipient: item.recipient || item.merchant || '',
      place: item.place || '',
      note: item.note || '',
      tags: item.tags || [],
      transferOperationIds: item.transferOperationIds,
      transferId: item.transferId,
      date_time:
        parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined,
      category: categoryPayload,
      account: accountPayload,
      targetAccount: targetAccountPayload,
      photo_url: item.photoUrl || null,
      is_pinned: item.isPinned ?? false,
    };

    const serialized = encodeURIComponent(JSON.stringify(payload));
    router.push({
      pathname: '/transactions/new',
      params: { operation: serialized, edit: '1' },
    });
  };

  const sectionsForList = useMemo(
    () => filteredSections.map(section => ({ ...section, data: section.items })),
    [filteredSections],
  );

  const renderSectionHeader = ({ section }: { section: HistorySection & { data: HistoryItem[] } }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>{section.dateLabel}</Text>
        </View>
        {section.totalLabel ? (
          <View style={styles.sectionTotalPill}>
            <Text style={styles.sectionTotalText}>{section.totalLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.sectionHeaderDivider} />
    </View>
  );

  const renderHistoryRow = ({ item }: { item: HistoryItem }) => {
    const subtitle = getOperationSubtitle(item);
    const transferFromLabel = item.transferFromLabel || item.amountLabel;
    const transferToLabel = item.transferToLabel || '';

    return (
      <TouchableOpacity
        style={styles.historyRow}
        activeOpacity={0.7}
        onPress={() => openOperationInModal(item)}
      >
        {renderOperationIcon(item, accountsById)}
        <View style={styles.historyContent}>
          <View style={styles.historyTitleRow}>
            <View style={styles.historyTitleLeft}>
              <Text style={styles.historyTitle} numberOfLines={1}>
                {getOperationTitle(item)}
              </Text>
              <View style={styles.historyFlags}>
                {item.photoUrl ? (
                  <Ionicons
                    name="camera"
                    size={14}
                    color={COLORS.textSecondary}
                    style={styles.historyFlagIcon}
                  />
                ) : null}
                {item.isPinned ? (
                  <MaterialCommunityIcons
                    name="pin"
                    size={14}
                    color={COLORS.textSecondary}
                    style={styles.historyFlagIcon}
                  />
                ) : null}
              </View>
            </View>
            <Text
              style={[
                item.type === 'income'
                  ? styles.historyAmountIncome
                  : styles.historyAmountNegative,
                styles.historyTitleAmount,
              ]}
              numberOfLines={1}
            >
              {item.type === 'transfer' || item.transferId ? transferFromLabel : item.amountLabel}
            </Text>
          </View>
          <View style={styles.historyMetaRow}>
            <Text style={styles.historyMeta} numberOfLines={1}>
              {item.dateTime || ''}
            </Text>
            {transferToLabel && (item.type === 'transfer' || item.transferId) ? (
              <Text
                style={[
                  styles.historyMetaAmount,
                  styles.historyMetaAmountBold,
                  styles.historyAmountIncome,
                ]}
                numberOfLines={1}
              >
                {transferToLabel}
              </Text>
            ) : (
              <Text style={styles.historyMetaAmount} numberOfLines={1}>
                {item.account}
              </Text>
            )}
          </View>
          {subtitle ? (
            <Text style={styles.historySubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderListEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.emptyText}>Загружаем историю...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <View style={[styles.historyIconWrapper, styles.historyEmptyRowIcon]}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.textSecondary} />
        </View>
        <Text style={styles.emptyText}>Операции отсутствуют</Text>
      </View>
    );
  };

  const renderSearchEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={28} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>Ничего не найдено</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SectionList
        sections={sectionsForList}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderHistoryRow}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        SectionSeparatorComponent={() => <View style={styles.sectionDivider} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore && !loading) {
            loadHistory(nextCursor);
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={hasQuery ? renderSearchEmpty : renderListEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: COLORS.bg,
    flexDirection: 'column',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  sectionTotalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(33, 33, 33, 0.06)',
  },
  sectionTotalText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  sectionHeaderDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  sectionDivider: {
    height: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  historyContent: {
    flex: 1,
    marginLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  historyTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingRight: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    flexShrink: 1,
    minWidth: 0,
  },
  historyFlags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    flexShrink: 0,
  },
  historyFlagIcon: {
    marginLeft: 6,
  },
  historyTitleAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
    flexShrink: 0,
    maxWidth: '42%',
    textAlign: 'right',
  },
  historyAmountIncome: {
    color: COLORS.primary,
  },
  historyAmountNegative: {
    color: COLORS.textMain,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // между категорией и датой
  },
  historyMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  historyMetaAmount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 10,
    flexShrink: 0,
  },
  historyMetaAmountBold: {
    fontWeight: '700',
  },
  historySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8, // между датой и комментариеем
  },
  historyIconWrapper: {
    width: HISTORY_ICON_SIZE,
    height: HISTORY_ICON_SIZE,
    borderRadius: HISTORY_ICON_SIZE / 2,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmptyRowIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  transferIconStack: {
    width: HISTORY_ICON_SIZE,
    height: HISTORY_ICON_SIZE,
    position: 'relative',
  },
  transferIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  transferIconFrontWrapper: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});

export default AllAccountsScreen;
