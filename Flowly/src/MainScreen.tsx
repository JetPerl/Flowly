import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  apiRequest,
  groupOperationsIntoSections,
  type OperationPageResponse,
} from './api/client';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
  DeviceEventEmitter,
  FlatList,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CurveType, LineChart } from 'react-native-gifted-charts';

import { useRouter } from 'expo-router';
import { useMainCurrency } from './currency/CurrencyContext';
import CategoryIcon from './components/CategoryIcon';

const COLORS = {
  bg: '#FFFFFF',        // нейтральный светлый фон
  card: '#FFFFFF',      // белые карточки
  textMain: '#212121',  // тёмно‑графитовый текст
  textSecondary: '#757575', // вторичный серый текст
  primary: '#2BAF8C',   // основной зелёно‑бирюзовый
  border: '#ECEFF1',    // светло‑серые разделители
  navIcon: '#A0A4A8',   // нейтральные иконки навигации
  purple: '#2BAF8C',    // сохраняем фиолетовый для спец. элементов
  headerMint: '#CFEFE1',
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
const SCREEN_HEIGHT = Dimensions.get('window').height;
const REFRESH_OFFSET = Platform.OS === 'ios' ? 64 : 0;

const formatCurrency = (
  value: number,
  withSymbol = true,
  currency: string = 'RUB',
): string => {
  const formatted = value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!withSymbol) return formatted;
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  return `${formatted} ${symbol}`;
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

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0;
// Локальное изображение для размытого фона.
// Положи свой файл в папку "assets" рядом с App.tsx (например: Flowly/assets/background.jpg)
// и обязательно назови его "background.jpg" или поправь путь ниже.
const GRADIENT_IMAGE = require('../assets/backgroundd.gif');
const BACKGROUND_EXTRA = 0;

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

const HERO_HEIGHT = 500;

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

type Totals = {
  income: number;
  expense: number;
  currency: string;
};

type BalanceSlide = {
  key: string;
  title: string;
  currency: string;
  balance: number | null;
  accountId: number | null;
  color?: string | null;
  isAdd?: boolean;
};

type HistoryFilterMode = 'pinned' | 'period' | 'all';
type PeriodFilterOption = 'custom' | 'today' | 'yesterday' | 'this_week' | 'last_week';

const PERIOD_FILTER_DAYS = 30;
const PERIOD_FILTER_MS = PERIOD_FILTER_DAYS * 24 * 60 * 60 * 1000;

type UpcomingPayment = {
  id: string;
  title: string;
  subtitle: string;
  amountLabel?: string;
  accentColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  muted?: boolean;
  onPress?: () => void;
};

const PERIOD_FILTERS: { key: PeriodFilterOption; label: string; showDotAfter?: boolean }[] = [
  { key: 'custom', label: 'Период' },
  { key: 'today', label: 'Сегодня' },
  { key: 'yesterday', label: 'Вчера', showDotAfter: true },
  { key: 'this_week', label: 'Эта неделя' },
  { key: 'last_week', label: 'Прошлая' },
];

const HISTORY_ICON_SIZE = 44;
const TRANSFER_ICON_SIZE = 26;
const TRANSFER_ICON_OFFSET = 0;
const UPCOMING_PAYMENTS_LIMIT = 3;

const MainScreen = () => {
  const router = useRouter();
  const { mainCurrency } = useMainCurrency();
  const MAIN_CURRENCY = (mainCurrency || DEFAULT_MAIN_CURRENCY).toUpperCase();
  const mainCurrencySymbol = CURRENCY_SYMBOLS[MAIN_CURRENCY] || MAIN_CURRENCY;

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [accountsById, setAccountsById] = useState<Record<number, AccountDto>>({});
  const [accountsList, setAccountsList] = useState<AccountDto[]>([]);
  const [ratesMap, setRatesMap] = useState<Record<string, number>>({ [MAIN_CURRENCY]: 1 });
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

  const [historySectionsState, setHistorySectionsState] = useState<HistorySection[]>([]);
  const [rawHistorySections, setRawHistorySections] = useState<any[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [sliderWidth, setSliderWidth] = useState(Dimensions.get('window').width);
  const [monthlyChartWidth, setMonthlyChartWidth] = useState(
    Math.max(Dimensions.get('window').width - 32, 260),
  );
  const [monthlyPointerIndex, setMonthlyPointerIndex] = useState(0);
  const sliderScrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList<BalanceSlide>>(null);
  const [historyFilterMode, setHistoryFilterMode] = useState<HistoryFilterMode>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterOption>('custom');
  const [refreshing, setRefreshing] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [accountGroups, setAccountGroups] = useState<
    { key: string; label: string; hint?: string; total: number; color: string; icon: string }[]
  >([]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerWhiteOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 250, 320],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

const loadBalance = useCallback(async () => {
    try {
      const accounts = await apiRequest<AccountDto[]>('/accounts');
      const rates = await apiRequest<Record<string, number>>('/rates').catch(() => ({ [MAIN_CURRENCY]: 1 }));

      if (rates && typeof rates === 'object') {
        setRatesMap(prev => ({ ...prev, ...rates }));
      }

      const mainRate =
        typeof rates?.[MAIN_CURRENCY] === 'number' && rates[MAIN_CURRENCY] > 0
          ? rates[MAIN_CURRENCY]
          : 1;

      const normalizedAccounts: AccountDto[] = Array.isArray(accounts) ? accounts : [];
      setAccountsList(normalizedAccounts);

      if (normalizedAccounts.length > 0) {
        const map: Record<number, AccountDto> = {};
        let total = 0;
        normalizedAccounts.forEach(acc => {
          if (typeof acc?.id !== 'number') return;
          map[acc.id] = acc;
          const balanceValue =
            typeof acc.balance === 'number' ? acc.balance : Number(acc.balance);
          const currencyCode =
            typeof acc.currency === 'string' ? acc.currency.toUpperCase() : MAIN_CURRENCY;
          const rate = typeof rates?.[currencyCode] === 'number' ? rates[currencyCode] : mainRate;
          const rateToMain =
            currencyCode === MAIN_CURRENCY || !rate || !mainRate ? 1 : rate / mainRate;
          if (!Number.isNaN(balanceValue) && Number.isFinite(rateToMain)) {
            total += balanceValue * rateToMain;
          }
        });
        setAccountsById(map);
        setWalletBalance(total);
      } else {
        setAccountsById({});
        setWalletBalance(null);
      }
    } catch (e) {
      console.warn('Ошибка загрузки баланса', e);
    }
  }, [MAIN_CURRENCY]);

  const sanitizeNumericInput = useCallback((input: string) => {
    if (!input) return '';
    // нормализуем запятую в точку
    let s = input.replace(/,/g, '.');
    // оставляем только цифры и точку
    s = s.replace(/[^0-9.]/g, '');

    const stripLeadingZeros = (value: string) => {
      const trimmed = value.replace(/^0+(?!$)/, '');
      return trimmed === '' ? '0' : trimmed;
    };

    const firstDot = s.indexOf('.');
    if (firstDot === -1) {
      // только цифры: убираем ведущие нули, но оставляем одиночный "0"
      const normalizedInt = stripLeadingZeros(s);
      return normalizedInt;
    }

    const intPart = stripLeadingZeros(s.slice(0, firstDot) || '0');
    // убираем все лишние точки справа от первой и режем до 2 знаков
    const decimalsRaw = s
      .slice(firstDot + 1)
      .replace(/\./g, '');
    const decimals = decimalsRaw.slice(0, 2);

    // разрешаем промежуточное состояние "0." пока пользователь вводит копейки
    if (decimals.length === 0 && s.endsWith('.')) {
      return `${intPart}.`;
    }

    return decimals.length ? `${intPart}.${decimals}` : intPart;
  }, []);

  const extractCurrencyFromLabel = (label: string) => {
    const trimmed = (label || '').trim();
    const match = trimmed.match(/([A-Za-zА-Яа-я₽$€£¥₮₸₴₹฿]+)$/u);
    return match ? match[1] : '₽';
  };

  const getCurrencySymbol = useCallback((code?: string | null) => {
    if (!code) return '₽';
    const upper = code.toUpperCase();
    return CURRENCY_SYMBOLS[upper] || code;
  }, []);

  const inferCurrencyCodeFromLabel = useCallback((label: string): string | null => {
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
  }, []);

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

  const convertCurrency = useCallback(
    (value: number, from?: string | null, to?: string | null) => {
      if (!from || !to || from.toUpperCase() === to.toUpperCase()) return value;
      const fromRate = getRateToMain(from);
      const toRate = getRateToMain(to);
      if (!fromRate || !toRate) return value;
      return value * (fromRate / toRate);
    },
    [getRateToMain],
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
    [getRateToMain, sanitizeNumericInput, mainCurrencySymbol],
  );

  const applySectionTotals = useCallback(
    (sections: HistorySection[]): HistorySection[] =>
      sections.map(section => ({
        ...section,
        totalLabel: computeSectionTotalLabel(section.items),
      })),
    [computeSectionTotalLabel],
  );

  // Приводим объект операции от API к формату карточек на экране
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
        const expense = group.find(g => g.type === 'expense') || group[0];
        const income = group.find(g => g.type === 'income') || group.find(g => g !== expense) || group[0];

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

      // Хитрый случай: перевод без transfer_id/related_account_id, но две операции (expense+income) с одинаковой датой
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
    [getCurrencySymbol, sanitizeNumericInput],
  );

  // Собираем секции истории из "сырых" данных бэка
  const mapSectionsFromApi = useCallback(
    (sections: any[], accountFilter: number | null = null): HistorySection[] => {
      const mapped = sections
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
            ? section.items
              .map(mapApiOperationToHistoryItem)
              .filter(item => {
                if (accountFilter === null) return true;
                return item.accountId === accountFilter || item.relatedAccountId === accountFilter;
              })
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
    [mapApiOperationToHistoryItem, applySectionTotals, mergeTransferItems],
  );

const loadHistory = useCallback(async () => {
    try {
      const endpoint = activeAccountId
        ? `/operations?accountId=${activeAccountId}&limit=50`
        : '/operations?limit=50';

      const data = await apiRequest<OperationPageResponse>(endpoint);
      const items = Array.isArray(data?.items) ? data.items : [];
      const sections = groupOperationsIntoSections(items);

      setRawHistorySections(sections);
      const normalized = mapSectionsFromApi(sections, activeAccountId);
      setHistorySectionsState(normalized);
    } catch (e) {
      console.warn('Ошибка загрузки операций', e);
    }
  }, [activeAccountId, mapSectionsFromApi]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);

    // fail-safe таймер, чтобы не зависать, если сеть не отвечает
    const timeoutId = setTimeout(() => {
      setRefreshing(false);
    }, 7000);

    try {
      await Promise.allSettled([loadBalance(), loadHistory()]);
    } catch (e) {
      console.warn('Ошибка обновления данных', e);
    } finally {
      clearTimeout(timeoutId);
      setRefreshing(false);
    }
  }, [refreshing, loadBalance, loadHistory]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!rawHistorySections || rawHistorySections.length === 0) {
      return;
    }
    setHistorySectionsState(mapSectionsFromApi(rawHistorySections, activeAccountId));
  }, [rawHistorySections, activeAccountId, mapSectionsFromApi]);

  const cardMargin = 10;
  const sliderData: BalanceSlide[] = useMemo(() => {
    const accountSlides = accountsList.map(acc => ({
      key: `acc-${acc.id}`,
      title: acc.name || acc.full_name || acc.short_name || 'Счёт',
      currency: (acc.currency || MAIN_CURRENCY).toUpperCase(),
      balance:
        typeof acc.balance === 'number'
          ? acc.balance
          : typeof acc.balance === 'string'
            ? Number(acc.balance)
            : null,
      accountId: typeof acc.id === 'number' ? acc.id : null,
      color: acc.color || null,
    }));

    return [
      {
        key: 'all',
        title: 'Все счета',
        currency: MAIN_CURRENCY,
        balance: walletBalance,
        accountId: null,
        color: null,
      },
      ...accountSlides,
      {
        key: 'add-account',
        title: '',
        currency: MAIN_CURRENCY,
        balance: null,
        accountId: null,
        color: null,
        isAdd: true,
      },
    ];
  }, [accountsList, walletBalance, MAIN_CURRENCY]);

  const cardWidth = useMemo(
    () => Math.max(sliderWidth - 32, sliderWidth * 0.9),
    [sliderWidth],
  );
  const itemWidth = cardWidth + cardMargin * 2;
  const listSidePadding = Math.max((sliderWidth - itemWidth) / 2, 0);
  const maxSliderOffset = useMemo(
    () => Math.max((sliderData.length - 1) * itemWidth, 0),
    [itemWidth, sliderData.length],
  );

  // Totals for all accounts and per-account, based on full history (not just active)
  const historyTotals = useMemo(() => {
    const perAccount: Record<number, Totals> = {};
    let allIncome = 0;
    let allExpense = 0;

    const sections = mapSectionsFromApi(rawHistorySections, null);

    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.transferId || item.type === 'transfer') return;

        const rawAmount = Number(sanitizeNumericInput(item.amountLabel));
        if (!Number.isFinite(rawAmount)) return;

        const currency = (item.currency || MAIN_CURRENCY).toUpperCase();
        const accountId = item.accountId ?? null;
        const amountInMain = convertCurrency(rawAmount, currency, MAIN_CURRENCY);

        if (accountId !== null) {
          if (!perAccount[accountId]) {
            perAccount[accountId] = { income: 0, expense: 0, currency: MAIN_CURRENCY };
          }
          if (item.type === 'income') {
            perAccount[accountId].income += amountInMain;
          } else {
            perAccount[accountId].expense += amountInMain;
          }
        }

        if (item.type === 'income') {
          allIncome += amountInMain;
        } else {
          allExpense += amountInMain;
        }
      });
    });

    return {
      perAccount,
      all: { income: allIncome, expense: allExpense, currency: MAIN_CURRENCY },
    };
  }, [MAIN_CURRENCY, convertCurrency, mapSectionsFromApi, rawHistorySections, sanitizeNumericInput]);

  const getHistoryCategoryTitle = useCallback(
    (category?: string | null) =>
      category && category.trim().length > 0 ? category : 'Категория',
    [],
  );

  const monthMeta = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const labelRaw = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(now);
    const label = labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1);
    return { startMs: start.getTime(), endMs: end.getTime(), label };
  }, []);

  const monthlyExpenseChart = useMemo(() => {
    const sections = mapSectionsFromApi(rawHistorySections, null);
    const palette = ['#2BAF8C', '#4D62FF', '#FF7F57', '#9A59F6', '#5AA7F7', '#6BC5D8', '#5A63E7', '#FFB74D'];
    const categories: Record<string, { title: string; value: number; color: string }> = {};
    let total = 0;

    const pickColor = (index: number) => palette[index % palette.length];

    const getTimestamp = (item: HistoryItem) => {
      if (typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)) return item.timestamp;
      const parsed = new Date(item.dateTime).getTime();
      return Number.isFinite(parsed) ? parsed : null;
    };

    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.type !== 'expense' || item.transferId) return;

        const ts = getTimestamp(item);
        if (ts === null || ts < monthMeta.startMs || ts > monthMeta.endMs) return;

        const rawAmount = Math.abs(Number(sanitizeNumericInput(item.amountLabel)));
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) return;

        const currencyCode = (item.currency || MAIN_CURRENCY).toUpperCase();
        const amountInMain = convertCurrency(rawAmount, currencyCode, MAIN_CURRENCY);
        if (!Number.isFinite(amountInMain) || amountInMain <= 0) return;

        total += amountInMain;
        const key = getHistoryCategoryTitle(item.category);
        if (!categories[key]) {
          const nextColor = pickColor(Object.keys(categories).length);
          categories[key] = { title: key, value: 0, color: nextColor };
        }
        categories[key].value += amountInMain;
      });
    });

    let ordered = Object.values(categories).sort((a, b) => b.value - a.value);
    if (ordered.length > 6) {
      const top = ordered.slice(0, 5);
      const otherValue = ordered.slice(5).reduce((acc, cur) => acc + cur.value, 0);
      if (otherValue > 0) {
        top.push({
          title: 'Прочее',
          value: otherValue,
          color: '#E3E6EA',
        });
      }
      ordered = top;
    }

    const pieData = ordered.map(entry => ({
      value: entry.value,
      color: entry.color,
      text: total > 0 ? `${Math.round((entry.value / total) * 100)}%` : '',
    }));

    const legend = ordered.map(entry => ({
      title: entry.title,
      valueLabel: formatCurrency(entry.value, true, MAIN_CURRENCY),
      color: entry.color,
    }));

    return {
      total,
      pieData,
      legend,
    };
  }, [
    MAIN_CURRENCY,
    convertCurrency,
    getHistoryCategoryTitle,
    mapSectionsFromApi,
    monthMeta.endMs,
    monthMeta.startMs,
    rawHistorySections,
    sanitizeNumericInput,
  ]);

  const monthlyExpenseTrend = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const perDay = Array.from({ length: daysInMonth }, () => 0);

    const sections = mapSectionsFromApi(rawHistorySections, activeAccountId);

    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.type !== 'expense' || item.transferId) return;

        const ts =
          typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)
            ? item.timestamp
            : new Date(item.dateTime).getTime();
        if (!Number.isFinite(ts) || ts < monthMeta.startMs || ts > monthMeta.endMs) {
          return;
        }

        const dayIndex = new Date(ts).getDate() - 1;
        if (dayIndex < 0 || dayIndex >= daysInMonth) return;

        const rawAmount =
          typeof item.amountValue === 'number' && Number.isFinite(item.amountValue)
            ? Math.abs(item.amountValue)
            : Math.abs(Number(sanitizeNumericInput(item.amountLabel)));
        if (!Number.isFinite(rawAmount)) return;

        const currencyCode = (item.currency || MAIN_CURRENCY).toUpperCase();
        const amountInMain = convertCurrency(rawAmount, currencyCode, MAIN_CURRENCY);
        if (!Number.isFinite(amountInMain)) return;

        perDay[dayIndex] += amountInMain;
      });
    });

    const peak = perDay.reduce((max, value) => (value > max ? value : max), 0);
    const total = perDay.reduce((acc, value) => acc + value, 0);

    const targetLabels = 7;
    const labelDays: number[] = [];
    for (let i = 0; i < targetLabels; i++) {
      const raw = 1 + (i * (daysInMonth - 1)) / (targetLabels - 1);
      let day = Math.round(raw);
      if (day < 1) day = 1;
      if (day > daysInMonth) day = daysInMonth;
      while (labelDays.includes(day) && day < daysInMonth) {
        day += 1;
      }
      labelDays.push(day);
    }

    const data = perDay.map((value, idx) => {
      const day = idx + 1;
      return {
        value: Number(value.toFixed(2)),
        label: '',
        day,
      };
    });

    return { data, peak, total, daysInMonth, labelDays };
  }, [
    MAIN_CURRENCY,
    activeAccountId,
    convertCurrency,
    mapSectionsFromApi,
    monthMeta.endMs,
    monthMeta.startMs,
    rawHistorySections,
    sanitizeNumericInput,
  ]);

  const monthlyChartYAxisWidth = 20; // длинна графика
  const monthlyXAxisLabelWidth = 30;
  const monthlyXAxisLabelHalf = monthlyXAxisLabelWidth / 2;
  const monthlyChartInitialSpacing = 0;
  const monthlyChartEndSpacing = 0;
  const monthlyChartRightPadding = 12;
  const monthlyChartInnerWidth = Math.max(
    monthlyChartWidth - monthlyChartYAxisWidth - monthlyChartRightPadding,
    160,
  );

  const monthlyChartSpacing = useMemo(() => {
    const pointsCount = monthlyExpenseTrend.data.length;
    if (pointsCount <= 1) return monthlyChartInnerWidth;

    const rawSpacing =
      (monthlyChartInnerWidth - monthlyChartInitialSpacing - monthlyChartEndSpacing) /
      Math.max(pointsCount - 1, 1);
    return Math.max(2, rawSpacing);
  }, [
    monthlyChartEndSpacing,
    monthlyChartInitialSpacing,
    monthlyChartInnerWidth,
    monthlyExpenseTrend.data.length,
  ]);

  const monthlyChartData = useMemo(
    () =>
      monthlyExpenseTrend.data.map((point, idx, arr) => ({
        ...point,
        spacing: idx === arr.length - 1 ? 0 : monthlyChartSpacing,
        pointerShiftX: idx === 0 ? -4 : 0, // slight left shift: stronger for the first point
      })),
    [monthlyChartSpacing, monthlyExpenseTrend.data],
  );

  const monthlyChartMaxValue = useMemo(
    () => (monthlyExpenseTrend.peak > 0 ? monthlyExpenseTrend.peak * 1.1 : 10),
    [monthlyExpenseTrend.peak],
  );

  const monthlyXAxisPositions = useMemo(
    () =>
      monthlyExpenseTrend.labelDays.map(day =>
        monthlyChartInitialSpacing + (day - 1) * monthlyChartSpacing,
      ),
    [monthlyChartInitialSpacing, monthlyChartSpacing, monthlyExpenseTrend.labelDays],
  );

  const handleMonthlyPointer = useCallback(({ pointerIndex }: { pointerIndex?: number }) => {
    if (typeof pointerIndex === 'number' && Number.isFinite(pointerIndex)) {
      setMonthlyPointerIndex(pointerIndex);
    }
  }, []);

  const renderMonthlyPointer = useCallback(() => {
    const dotOffsetX = monthlyPointerIndex === 0 ? -8 : -1; // shift only the first point left

    return (
      <View
        style={[
          styles.chartPointerDot,
          { transform: [{ translateX: dotOffsetX }] },
        ]}
      />
    );
  }, [monthlyPointerIndex]);

  const renderMonthlyPointerLabel = useCallback(
    (items: any) => {
      const item = Array.isArray(items) ? items[0] : items;
      if (!item) return null;

      const value =
        typeof item?.value === 'number'
          ? item.value
          : typeof item?.item?.value === 'number'
            ? item.item.value
            : 0;

      const day =
        typeof item?.day === 'number'
          ? item.day
          : typeof item?.item?.day === 'number'
            ? item.item.day
            : typeof item?.index === 'number'
              ? item.index + 1
              : null;

      const monthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(
        new Date(monthMeta.startMs),
      );
      const monthLabel = monthShort.replace('.', '').trim();
      const label = day ? `${day} ${monthLabel}` : monthMeta.label;

      return (
        <View style={styles.chartTooltip}>
          <Text style={styles.chartTooltipLabel}>{label}</Text>
          <Text style={styles.chartTooltipValue}>
            {formatCurrency(value, true, MAIN_CURRENCY)}
          </Text>
        </View>
      );
    },
    [MAIN_CURRENCY, monthMeta.label, monthMeta.startMs],
  );

  const filteredHistorySections = useMemo(() => {
    if (!historySectionsState.length) return [];
    if (historyFilterMode === 'all') return historySectionsState;

    if (historyFilterMode === 'pinned') {
      return historySectionsState
        .map(section => ({
          ...section,
          items: section.items.filter(item => item.isPinned),
        }))
        .filter(section => section.items.length > 0);
    }

    const now = Date.now();
    const startOfDay = (timestamp: number) => {
      const d = new Date(timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const endOfDay = (timestamp: number) => {
      const d = new Date(timestamp);
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    };

    const dayOfWeek = ((new Date(now).getDay() + 6) % 7); // 0 = Monday

    const periodRange = (() => {
      switch (periodFilter) {
        case 'today': {
          return { from: startOfDay(now), to: endOfDay(now) };
        }
        case 'yesterday': {
          const y = now - 24 * 60 * 60 * 1000;
          return { from: startOfDay(y), to: endOfDay(y) };
        }
        case 'this_week': {
          const weekStart = startOfDay(now - dayOfWeek * 24 * 60 * 60 * 1000);
          return { from: weekStart, to: endOfDay(now) };
        }
        case 'last_week': {
          const weekStart = startOfDay(now - (dayOfWeek + 7) * 24 * 60 * 60 * 1000);
          const weekEnd = endOfDay(weekStart + 6 * 24 * 60 * 60 * 1000);
          return { from: weekStart, to: weekEnd };
        }
        case 'custom':
        default: {
          const cutoff = now - PERIOD_FILTER_MS;
          return { from: cutoff, to: endOfDay(now) };
        }
      }
    })();

    return historySectionsState
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          const ts =
            typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)
              ? item.timestamp
              : new Date(item.dateTime).getTime();
          if (!Number.isFinite(ts)) return false;
          return ts >= periodRange.from && ts <= periodRange.to;
        }),
      }))
      .filter(section => section.items.length > 0);
  }, [historyFilterMode, historySectionsState, periodFilter]);

  const latestOperations = useMemo(() => {
    const flat = filteredHistorySections.flatMap(section => section.items);
    if (!flat.length) return [];

    const getTimestamp = (item: HistoryItem) => {
      if (typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)) {
        return item.timestamp;
      }
      const parsed = new Date(item.dateTime).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return [...flat]
      .sort((a, b) => getTimestamp(b) - getTimestamp(a))
      .slice(0, 5);
  }, [filteredHistorySections]);

  const hasHistory = latestOperations.length > 0;
  const showHistoryMoreButton = latestOperations.length >= 5;
  const handleFindSubscriptionPress = useCallback(() => {
    router.push('/subscription/Subscription');
  }, [router]);
  const rawUpcomingPayments = useMemo<UpcomingPayment[]>(
    () => [
      {
        id: '1',
        title: 'Apple Music',
        subtitle: 'Ежемесячный',
        amountLabel: '11.99 Br',
        accentColor: '#4D62FF',
        icon: 'musical-notes',
        iconColor: '#FFFFFF',
      },
      {
        id: '2',
        title: 'Apple Music',
        subtitle: 'Ежемесячный',
        amountLabel: '11.99 Br',
        accentColor: '#4D62FF',
        icon: 'musical-notes',
        iconColor: '#FFFFFF',
      },
    ],
    [],
  );
  const shouldShowFindSubscription = useMemo(
    () => rawUpcomingPayments.length < UPCOMING_PAYMENTS_LIMIT,
    [rawUpcomingPayments],
  );
  const upcomingPayments = useMemo<UpcomingPayment[]>(
    () => {
      const list = [...rawUpcomingPayments];
      if (shouldShowFindSubscription) {
        list.push({
          id: 'find-subscription',
          title: 'Найти подписку',
          subtitle: 'Из списка операций',
          accentColor: '#E3E6EA',
          icon: 'refresh',
          iconColor: '#FFFFFF',
          muted: true,
          onPress: handleFindSubscriptionPress,
        });
      }
      return list;
    },
    [handleFindSubscriptionPress, rawUpcomingPayments, shouldShowFindSubscription],
  );
  const showUpcomingMoreButton = useMemo(
    () => !shouldShowFindSubscription && rawUpcomingPayments.length >= UPCOMING_PAYMENTS_LIMIT,
    [rawUpcomingPayments, shouldShowFindSubscription],
  );

  const totalBalanceInMain = useMemo(() => walletBalance ?? null, [walletBalance]);

  const computeAccountGroups = useCallback(() => {
    const descriptors: Record<
      string,
      { label: string; color: string; icon: string; hint?: string; order: number }
    > = {
      bank: {
        label: 'Банковские счета',
        color: '#6BC5D8',
        icon: 'link-outline',
        order: 1,
      },
      cash: {
        label: 'Наличные',
        color: '#5A63E7',
        icon: 'cash-outline',
        order: 2,
      },
      goal: {
        label: 'Цели',
        color: '#5AA7F7',
        icon: 'trending-up-outline',
        order: 3,
      },
      crypto: {
        label: 'Криптовалюта',
        color: '#9A59F6',
        icon: 'logo-bitcoin',
        order: 4,
      },
      other: {
        label: 'Другие',
        color: '#A0A4A8',
        icon: 'ellipsis-horizontal',
        order: 99,
      },
    };

    const groupsMap: Record<
      string,
      { key: string; label: string; hint?: string; total: number; color: string; icon: string; order: number }
    > = {};

    const normalizeGroup = (value?: string | null): keyof typeof descriptors => {
      const norm = (value || '').toLowerCase();
      if (norm === 'cash') return 'cash';
      if (norm === 'bank') return 'bank';
      if (norm === 'goal') return 'goal';
      if (norm === 'crypto') return 'crypto';
      return 'other';
    };

    accountsList.forEach(acc => {
      const balanceRaw =
        typeof acc.balance === 'number'
          ? acc.balance
          : typeof acc.balance === 'string'
            ? Number(acc.balance)
            : null;
      if (balanceRaw === null || Number.isNaN(balanceRaw)) return;

      const currencyCode = (acc.currency || MAIN_CURRENCY).toUpperCase();
      const converted = convertCurrency(balanceRaw, currencyCode, MAIN_CURRENCY);

      const groupKey = normalizeGroup(acc.account_type || acc.account_group);
      if (!groupsMap[groupKey]) {
        const desc = descriptors[groupKey] || descriptors.other;
        groupsMap[groupKey] = {
          key: groupKey,
          label: desc.label,
          hint: desc.hint,
          total: 0,
          color: desc.color,
          icon: desc.icon,
          order: desc.order,
        };
      }
      groupsMap[groupKey].total += converted;
    });

    const result = Object.values(groupsMap).filter(g => Math.abs(g.total) > 0.0001);
    result.sort((a, b) => a.order - b.order);
    setAccountGroups(result);
  }, [MAIN_CURRENCY, accountsList, convertCurrency]);

  useEffect(() => {
    computeAccountGroups();
  }, [computeAccountGroups]);

  useEffect(() => {
    if (!sliderData.length) return;
    if (activeSlideIndex > sliderData.length - 1) {
      setActiveSlideIndex(0);
      setActiveAccountId(sliderData[0]?.accountId ?? null);
    }
  }, [activeSlideIndex, sliderData]);

  const activeSlide =
    sliderData[Math.min(activeSlideIndex, Math.max(sliderData.length - 1, 0))] ||
    sliderData[0];
  const activeCurrency = activeSlide?.currency || MAIN_CURRENCY;

  const activeTotals = useMemo(() => {
    if (activeAccountId === null) {
      return historyTotals.all;
    }
    return (
      historyTotals.perAccount[activeAccountId] || {
        income: 0,
        expense: 0,
        currency: activeCurrency,
      }
    );
  }, [activeAccountId, activeCurrency, historyTotals]);

  // Instant switch without animation
  const animateHistorySwitch = useCallback((nextAccountId: number | null) => {
    setActiveAccountId(nextAccountId);
  }, []);

  const handleSliderLayout = useCallback((e: LayoutChangeEvent) => {
    const layoutWidth = e?.nativeEvent?.layout?.width || 0;
    const screenWidth = Dimensions.get('window').width || 0;
    const width = Math.max(layoutWidth, screenWidth);
    if (width && width !== sliderWidth) {
      setSliderWidth(width);
    }
  }, [sliderWidth]);

  const handleMonthlyChartLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e?.nativeEvent?.layout?.width || 0;
    if (width && Math.abs(width - monthlyChartWidth) > 0.5) {
      setMonthlyChartWidth(width);
    }
  }, [monthlyChartWidth]);

  const applyOffset = useCallback(
    (offset: number, animated: boolean) => {
      const clamped = Math.max(0, Math.min(offset, maxSliderOffset));
      const idx = Math.round(clamped / itemWidth);
      if (idx !== activeSlideIndex) {
        setActiveSlideIndex(idx);
        animateHistorySwitch(sliderData[idx]?.accountId ?? null);
      }
      sliderRef.current?.scrollToOffset({
        offset: clamped,
        animated,
      });
    },
    [activeSlideIndex, animateHistorySwitch, itemWidth, maxSliderOffset, sliderData],
  );

  const scrollToSlide = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(index, sliderData.length - 1));
      const offset = bounded * itemWidth;
      applyOffset(offset, true);
    },
    [applyOffset, itemWidth, sliderData.length],
  );

  // Scrub by ratio across the indicator width, scrolling list proportionally
  const handleSliderSnap = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = e.nativeEvent;
      const width = layoutMeasurement?.width || sliderWidth || 1;
      const nextIndex = Math.round(contentOffset.x / width);
      const bounded = Math.max(0, Math.min(nextIndex, sliderData.length - 1));
      if (bounded !== activeSlideIndex) {
        setActiveSlideIndex(bounded);
        const nextSlide = sliderData[bounded];
        animateHistorySwitch(nextSlide?.accountId ?? null);
      }
    },
    [activeSlideIndex, animateHistorySwitch, sliderData, sliderWidth],
  );

  const renderBalanceSlide = useCallback(
    ({ item, index }: { item: BalanceSlide; index: number }) => {
      if (item.isAdd) {
        return (
          <View style={{ width: cardWidth, alignSelf: 'center', marginHorizontal: cardMargin }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.addCard}
              onPress={() => router.push('/transactions/new/account-new')}
            >
              <AntDesign name="plus-circle" size={48} color={COLORS.textMain} />
            </TouchableOpacity>
          </View>
        );
      }

      const balanceLabel =
        item.balance === null || item.balance === undefined
          ? `— ${getCurrencySymbol(item.currency)}`
          : formatCurrency(item.balance, true, item.currency);
      const totals =
        item.accountId === null
          ? historyTotals.all
          : historyTotals.perAccount[item.accountId] || null;

      const incomeLabel = totals
        ? `+ ${formatCurrency(Math.abs(totals.income), true, totals.currency)}`
        : '—';
      const expenseLabel = totals
        ? `− ${formatCurrency(Math.abs(totals.expense), true, totals.currency)}`
        : '—';

      return (
        <View style={{ width: cardWidth, alignSelf: 'center', marginHorizontal: cardMargin }}>
          <View style={styles.balanceCardInner}>
            <View style={styles.balanceCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceTitle}>{item.title}</Text>
                <Text style={styles.balanceValue}>{balanceLabel}</Text>
                <Text style={styles.balanceCurrencyHint}>
                  Валюта: {getCurrencySymbol(item.currency)}
                </Text>
              </View>
            </View>

            <View style={styles.balanceBottomRow}>
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatLabel}>Доходы</Text>
                <Text style={styles.balanceStatValue}>{incomeLabel}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatLabel}>Расходы</Text>
                <Text style={styles.balanceStatValue}>{expenseLabel}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [
      getCurrencySymbol,
      historyTotals.all,
      historyTotals.perAccount,
      router,
      sliderWidth,
    ],
  );

  const openNewTransaction = useCallback(
    (type?: 'income' | 'expense' | 'transfer') => {
      if (type) {
        router.push({ pathname: '/transactions/new', params: { type } });
        return;
      }
      router.push('/transactions/new');
    },
    [router],
  );

  const handleTopUpPress = useCallback(() => {
    openNewTransaction('income');
  }, [openNewTransaction]);

  const handleTransferPress = useCallback(() => {
    openNewTransaction('transfer');
  }, [openNewTransaction]);

  const handleRequisitesPress = useCallback(() => {
    router.push('/all-accounts');
  }, [router]);

  const handleMorePress = useCallback(() => {
    router.push('/all-accounts');
  }, [router]);

  const quickActions = useMemo(
    () => [
      {
        key: 'topup',
        label: 'Пополнить',
        icon: <Ionicons name="add" size={24} color={COLORS.purple} />,
        onPress: handleTopUpPress,
      },
      {
        key: 'transfer',
        label: 'Перевод',
        icon: <Ionicons name="swap-horizontal" size={24} color={COLORS.purple} />,
        onPress: handleTransferPress,
      },
      {
        key: 'requisites',
        label: 'Реквизиты',
        icon: <Ionicons name="business-outline" size={22} color={COLORS.purple} />,
        onPress: handleRequisitesPress,
      },
      {
        key: 'more',
        label: 'Еще',
        icon: <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.purple} />,
        onPress: handleMorePress,
      },
    ],
    [handleMorePress, handleRequisitesPress, handleTopUpPress, handleTransferPress],
  );

  const handleAddOperation = () => {
    openNewTransaction();
  };

  const openOperationInModal = (item: HistoryItem) => {
    const accountMeta = item.accountId ? accountsById[item.accountId] : undefined;
    const categoryPayload = item.categoryId
      ? {
        id: item.categoryId,
        name: getHistoryCategoryTitle(item.category),
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

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('operation:duplicate', (payload: any) => {
      try {
        const serialized = encodeURIComponent(JSON.stringify(payload || {}));
        router.push({
          pathname: '/transactions/new',
          params: { operation: serialized, duplicate: '1' },
        });
      } catch (e) {
        console.warn('Failed to open duplicate operation', e);
      }
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    const refresh = () => {
      loadHistory();
      loadBalance();
    };
    const savedSub = DeviceEventEmitter.addListener('operation:saved', refresh);
    const deletedSub = DeviceEventEmitter.addListener('operation:deleted', refresh);
    return () => {
      savedSub.remove();
      deletedSub.remove();
    };
  }, [loadHistory, loadBalance]);

  const getOperationTitle = (item: HistoryItem) => {
    if (item.type === 'transfer' || item.transferId) {
      const from = item.transferFromAccountName || item.account || 'Счёт';
      const to = item.transferToAccountName || 'Счёт';
      return `${from} → ${to}`;
    }
    return getHistoryCategoryTitle(item.category);
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

  const renderOperationIcon = (item: HistoryItem) => {
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
      const frontWrapperSize = TRANSFER_ICON_SIZE + 6; // белая окантовка вокруг передней иконки
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={{ flex: 1 }}>
          <View style={styles.root}>
            <Animated.ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
              alwaysBounceVertical
              bounces
              overScrollMode="always"
              contentInsetAdjustmentBehavior="never"
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={1}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={COLORS.primary}
                  colors={[COLORS.primary]}
                  progressViewOffset={REFRESH_OFFSET}
                />
              }
            >
              {/* Hero block с картинкой */}
              <View style={styles.heroWrapper}>
                <Animated.Image
                  source={GRADIENT_IMAGE}
                  style={[
                    styles.heroImage,
                    {
                      transform: [
                        {
                          translateY: scrollY.interpolate({
                            inputRange: [-HERO_HEIGHT, 0],
                            outputRange: [-HERO_HEIGHT / 2, 0],
                            extrapolateLeft: 'extend',
                            extrapolateRight: 'clamp',
                          }),
                        },
                        {
                          scale: scrollY.interpolate({
                            inputRange: [-HERO_HEIGHT, 0],
                            outputRange: [2, 1],
                            extrapolateLeft: 'extend',
                            extrapolateRight: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                  resizeMode="cover"
                />

                {/* <LinearGradient //плавный переход
                  colors={['transparent', COLORS.bg]}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -2, // небольшой нахлест, чтобы не было щели
                    height: 350, // Длинный плавный переход
                  }}
                  pointerEvents="none"
                /> */}

                <View style={[styles.headerContainer, { paddingTop: 120 }]}>
                  <View
                    style={styles.balanceSliderWrapper}
                    onLayout={handleSliderLayout}
                  >
                    <Animated.FlatList
                      ref={sliderRef}
                      data={sliderData}
                      horizontal
                      pagingEnabled
                      scrollEventThrottle={16}
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={item => item.key}
                      renderItem={renderBalanceSlide}
                      snapToInterval={Math.max(itemWidth, 1)}
                      snapToAlignment="start"
                      decelerationRate="fast"
                      disableIntervalMomentum
                      contentContainerStyle={[
                        styles.balanceListContent,
                        { paddingHorizontal: listSidePadding },
                      ]}
                      initialNumToRender={sliderData.length}
                      maxToRenderPerBatch={sliderData.length}
                      windowSize={Math.max(sliderData.length * 2, 5)}
                      removeClippedSubviews={false}
                      onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: sliderScrollX } } }],
                        { useNativeDriver: false },
                      )}
                      onMomentumScrollEnd={handleSliderSnap}
                    />
                    <View style={styles.sliderIndicators}>
                      {sliderData.map((_, idx) => {
                        const inputRange = [
                          (idx - 1) * sliderWidth,
                          idx * sliderWidth,
                          (idx + 1) * sliderWidth,
                        ];
                        const dotOpacity = sliderScrollX.interpolate({
                          inputRange,
                          outputRange: [0.3, 1, 0.3],
                          extrapolate: 'clamp',
                        });
                        const dotScale = sliderScrollX.interpolate({
                          inputRange,
                          outputRange: [0.9, 1.1, 0.9],
                          extrapolate: 'clamp',
                        });
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => scrollToSlide(idx)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Animated.View
                              style={[
                                styles.sliderDot,
                                {
                                  opacity: dotOpacity,
                                  transform: [{ scale: dotScale }],
                                },
                              ]}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.quickActionsRow}>
                    {quickActions.map(action => (
                      <TouchableOpacity
                        key={action.key}
                        style={styles.quickActionItem}
                        activeOpacity={0.85}
                        onPress={action.onPress}
                      >
                        <View style={styles.quickActionIcon}>
                          {action.icon}
                        </View>
                        <Text style={styles.quickActionLabel} numberOfLines={1}>
                          {action.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.contentWrapper}>
                {/* История */}
                <Animated.View style={[styles.historyContainer]}>
                  <View style={styles.historyCard}>
                    {hasHistory ? (
                      <>
                        {latestOperations.map((item, idx) => {
                          const subtitle = getOperationSubtitle(item);
                          const transferFromLabel = item.transferFromLabel || item.amountLabel;
                          const transferToLabel = item.transferToLabel || '';
                          return (
                            <React.Fragment key={item.id}>
                              <TouchableOpacity
                                style={styles.historyRow}
                                activeOpacity={0.7}
                                onPress={() => openOperationInModal(item)}
                              >
                                {renderOperationIcon(item)}
                                <View style={styles.historyContent}>
                                  <View style={styles.historyTitleRow}>
                                    <View style={styles.historyTitleLeft}>
                                      <Text style={styles.historyTitle} numberOfLines={1}>
                                        {getOperationTitle(item)}
                                      </Text>
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
                                    <Text
                                      style={[
                                        item.type === 'income'
                                          ? styles.historyAmountIncome
                                          : styles.historyAmountNegative,
                                        styles.historyTitleAmount,
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {item.type === 'transfer' || item.transferId
                                        ? transferFromLabel
                                        : item.amountLabel}
                                    </Text>
                                  </View>
                                  <View style={styles.historyMetaRow}>
                                    <Text style={styles.historyMeta} numberOfLines={1}>
                                      {item.dateTime || ''}
                                    </Text>
                                    {transferToLabel && (item.type === 'transfer' || item.transferId) ? (
                                      <Text style={styles.historyMetaAmount} numberOfLines={1}>
                                        {transferToLabel}
                                      </Text>
                                    ) : null}
                                  </View>
                                  {subtitle ? (
                                    <Text style={styles.historySubtitle} numberOfLines={1}>
                                      {subtitle}
                                    </Text>
                                  ) : null}
                                </View>
                              </TouchableOpacity>
                              {idx < latestOperations.length - 1 ? (
                                <View style={styles.historyItemDivider} />
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                        {showHistoryMoreButton ? (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.viewAllButton}
                            onPress={handleMorePress}
                          >
                            <Text style={styles.viewAllText}>Еще</Text>
                          </TouchableOpacity>
                        ) : null}
                      </>
                    ) : (
                      <View style={styles.historyRow}>
                        <View style={[styles.historyIconWrapper, styles.historyEmptyRowIcon]}>
                          <Ionicons name="calendar-outline" size={24} color={COLORS.textSecondary} />
                        </View>
                        <View style={styles.historyContent}>
                          <Text style={styles.historyTitle} numberOfLines={1}>
                            Операции отсутствуют
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </Animated.View>

                <View style={styles.monthlyChartCard}>
                  <View style={styles.monthlyChartHeader}>
                    <View>
                      <Text style={styles.monthlyChartEyebrow}>Расходы за месяц</Text>
                      <Text style={styles.monthlyChartTitle}>{monthMeta.label}</Text>
                    </View>
                    <View style={styles.monthlyChartTotalBlock}>
                      <Text style={styles.monthlyChartTotalLabel}>Итого</Text>
                      <Text style={styles.monthlyChartTotalValue}>
                        {formatCurrency(monthlyExpenseTrend.total, true, MAIN_CURRENCY)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.monthlyChartGraph} onLayout={handleMonthlyChartLayout}>
                    <LineChart
                      areaChart
                      hideDataPoints
                      curved
                      curveType={CurveType.QUADRATIC}
                      curvature={0.22}
                      data={monthlyChartData}
                      getPointerProps={handleMonthlyPointer}
                      height={220}
                      width={monthlyChartInnerWidth}
                      initialSpacing={monthlyChartInitialSpacing}
                      endSpacing={monthlyChartEndSpacing}
                      spacing={monthlyChartSpacing}
                      thickness={2.5}
                      color={COLORS.primary}
                      startOpacity={0.28}
                      endOpacity={0.02}
                      startFillColor={COLORS.primary}
                      endFillColor={COLORS.primary}
                      yAxisLabelWidth={monthlyChartYAxisWidth}
                      yAxisTextStyle={styles.chartYAxisText}
                      xAxisColor="#EEF0F4"
                      yAxisColor="#EEF0F4"
                      rulesColor="#EEF0F4"
                      rulesType="solid"
                      noOfSections={4}
                      maxValue={monthlyChartMaxValue}
                      animateOnDataChange
                      disableScroll
                      pointerConfig={{
                        pointerStripHeight: 220,
                        pointerStripColor: 'rgba(43,175,140,0.25)',
                        pointerStripWidth: 2,
                        pointerColor: COLORS.primary,
                        radius: 5,
                        persistPointer: false,
                        pointerVanishDelay: 0,
                        resetPointerOnDataChange: true,
                        autoAdjustPointerLabelPosition: true,
                        pointerStripUptoDataPoint: true,
                        pointerLabelWidth: 140,
                        pointerLabelHeight: 50,
                        shiftPointerLabelY: -14,
                        pointerLabelComponent: renderMonthlyPointerLabel,
                        pointerComponent: renderMonthlyPointer,
                      }}
                      xAxisLabelTextStyle={styles.chartXAxisText}
                      yAxisTextNumberOfLines={1}
                      xAxisTextNumberOfLines={1}
                      formatYLabel={val => {
                        const num = Number(val);
                        if (!Number.isFinite(num)) return '0';
                        return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
                      }}
                    />
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: monthlyChartYAxisWidth,
                        width: monthlyChartInnerWidth,
                        bottom: -5,
                        height: 18,
                        overflow: 'visible',
                        zIndex: 2,
                      }}
                    >
                      {monthlyExpenseTrend.labelDays.map((day, idx) => {
                        const x = monthlyXAxisPositions[idx] ?? 0;
                        return (
                          <Text
                            key={`${day}-${idx}`}
                            style={[
                              styles.chartXAxisText,
                              {
                                position: 'absolute',
                                left: x - monthlyXAxisLabelHalf,
                                width: monthlyXAxisLabelWidth,
                              },
                            ]}
                          >
                            {day}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={styles.upcomingCard}>
                  <Text style={styles.upcomingTitle}>Предстоящие платежи</Text>
                  {upcomingPayments.map((payment, idx) => (
                    <React.Fragment key={payment.id}>
                      {idx > 0 ? <View style={styles.upcomingDivider} /> : null}
                      <TouchableOpacity
                        style={styles.upcomingRow}
                        activeOpacity={payment.onPress ? 0.75 : 1}
                        onPress={payment.onPress}
                        disabled={!payment.onPress}
                      >
                        <View
                          style={[
                            styles.upcomingIcon,
                            { backgroundColor: payment.accentColor },
                          ]}
                        >
                          <Ionicons
                            name={payment.icon}
                            size={26}
                            color={payment.iconColor || '#FFFFFF'}
                          />
                        </View>
                        <View style={styles.upcomingTextBlock}>
                          <View style={styles.upcomingTitleRow}>
                            <Text
                              style={[
                                styles.upcomingPaymentTitle,
                                payment.muted && styles.upcomingPaymentTitleMuted,
                              ]}
                              numberOfLines={1}
                            >
                              {payment.title}
                            </Text>
                            {payment.amountLabel ? (
                              <Text
                                style={[
                                  styles.upcomingAmount,
                                  payment.muted && styles.upcomingPaymentSubtitleMuted,
                                ]}
                                numberOfLines={1}
                              >
                                {payment.amountLabel}
                              </Text>
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.upcomingPaymentSubtitle,
                              payment.muted && styles.upcomingPaymentSubtitleMuted,
                            ]}
                            numberOfLines={1}
                          >
                            {payment.subtitle}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                  {showUpcomingMoreButton ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.viewAllButton}
                      onPress={handleMorePress}
                    >
                      <Text style={styles.viewAllText}>Еще</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Общий баланс по группам счетов */}
                <View style={styles.totalCard}>
                  <Text style={styles.totalCardLabel}>Общее состояние</Text>
                  <Text style={styles.totalCardValue}>
                    {totalBalanceInMain !== null
                      ? formatCurrency(totalBalanceInMain, true, MAIN_CURRENCY)
                      : `— ${mainCurrencySymbol}`}
                  </Text>
                  <View style={styles.totalGroups}>
                    {accountGroups.map(group => (
                      <View key={group.key} style={styles.totalGroupRow}>
                        <View
                          style={[
                            styles.totalGroupIcon,
                            { backgroundColor: group.color },
                          ]}
                        >
                          <Ionicons name={group.icon as any} size={20} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text style={styles.totalGroupTitle}>{group.label}</Text>
                          {group.hint ? (
                            <Text style={styles.totalGroupHint} numberOfLines={1}>
                              {group.hint}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.totalGroupValue}>
                          {formatCurrency(group.total, true, MAIN_CURRENCY)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

            </Animated.ScrollView>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.fab}
              onPress={handleAddOperation}>
              <Text style={styles.fabPlus}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  root: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 84,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    marginTop: -24,
    minHeight: SCREEN_HEIGHT,
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  heroWrapper: {
    height: HERO_HEIGHT,
    marginHorizontal: -16,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    height: HERO_HEIGHT,
    width: '100%',
  },
  headerContainer: {
    flex: 1,
    paddingBottom: 5,
    marginBottom: 0,
  },
  addCard: {
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSliderWrapper: {
    paddingVertical: 4,
  },
  balanceListContent: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  balanceCard: {
    borderRadius: 32,
    marginHorizontal: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  balanceCardInner: {
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderRadius: 32,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.62)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  balanceTitle: {
    fontSize: 16,
    color: '#252A32',
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2BAF8C',
    marginTop: 6,
  },
  balanceCurrencyHint: {
    fontSize: 13,
    color: '#5F6670',
    marginTop: 4,
  },
  balanceBottomRow: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    fontSize: 14,
    color: '#5F6670',
  },
  balanceStatValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1D2025',
    marginTop: 4,
  },
  balanceDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 14,
  },
  sliderIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  sliderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.purple,
    opacity: 0.3,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 6,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  quickActionLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffffc7',
    textAlign: 'center',
  },
  monthlyChartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  monthlyChartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthlyChartEyebrow: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  monthlyChartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
    marginTop: 4,
  },
  monthlyChartTotalBlock: {
    alignItems: 'flex-end',
  },
  monthlyChartTotalLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  monthlyChartTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginTop: 4,
  },
  monthlyChartGraph: {
    marginTop: 4,
    position: 'relative',
    overflow: 'visible',
  },
  chartYAxisText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: -4, // tuck Y-axis labels slightly left
  },
  chartXAxisText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    minWidth: 22,
  },
  chartTooltip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chartTooltipLabel: {
    color: '#4B5563',
    fontSize: 11,
    opacity: 0.9,
  },
  chartTooltipValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  chartPointerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 0,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  upcomingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: HISTORY_ICON_SIZE + 12,
  },
  upcomingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upcomingTextBlock: {
    flex: 1,
  },
  upcomingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  upcomingPaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  upcomingPaymentTitleMuted: {
    color: COLORS.textSecondary,
  },
  upcomingPaymentSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  upcomingPaymentSubtitleMuted: {
    color: '#B0B5BB',
  },
  upcomingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  historyContainer: {
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  historyEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 12,
  },
  historyEmptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  historyItemDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginLeft: HISTORY_ICON_SIZE + 12,
  },
  historyIconWrapper: {
    width: HISTORY_ICON_SIZE,
    height: HISTORY_ICON_SIZE,
    borderRadius: HISTORY_ICON_SIZE / 2,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferIconStack: {
    width: HISTORY_ICON_SIZE,
    height: HISTORY_ICON_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferIcon: {
    position: 'absolute',
  },
  transferIconFrontWrapper: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContent: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 1,
    gap: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    flexShrink: 1,
  },
  historyTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  historyMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  historyEmptyRowIcon: {
    backgroundColor: '#F4F6F8',
  },
  historyMetaAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  historySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyFlagIcon: {
    marginLeft: 6,
  },
  historyTitleAmount: {
    marginLeft: 12,
    flexShrink: 0,
    textAlign: 'right',
  },
  historyAmountNegative: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  historyAmountIncome: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  historyAmountPositive: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 6,
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E6DFF',
  },
  totalCard: {
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  totalCardLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  totalCardValue: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 12,
  },
  totalGroups: {
    gap: 12,
  },
  totalGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  totalGroupIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  totalGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  totalGroupHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  totalGroupValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  fab: {
    position: 'absolute',
    marginBottom: 64,
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabPlus: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '600',
  },
});

export default MainScreen;
