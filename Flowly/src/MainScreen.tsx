import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  apiRequest,
  groupOperationsIntoSections as groupRawOperationsIntoSections,
  type OperationPageResponse,
} from './api/client';
import { useMainCurrency } from './currency/CurrencyContext';
import { BalanceSlider, type BalanceSlide } from './screens/main/components/BalanceSlider';
import { HeroParallaxHeader } from './screens/main/components/HeroParallaxHeader';
import { QuickActions, type QuickActionItem } from './screens/main/components/QuickActions';
import { MonthlySpendingChart } from './screens/main/components/MonthlySpendingChart';
import {
  AccountGroupsSummary,
  type AccountGroupSummaryItem,
} from './screens/main/components/AccountGroupsSummary';
import { OperationRow } from './components/operations';
import {
  computeSectionTotalLabel,
  getOperationTitle,
  mapApiOperationToHistoryItem,
  mergeTransferItems,
  type HistoryItem,
  type HistorySection,
} from './utils/operationHelpers';
import {
  convertCurrency,
  formatCurrency,
  getCurrencySymbol,
  getRateToMain,
  inferCurrencyCodeFromLabel,
} from './utils/currency';
import { sanitizeNumericInput } from './utils/formatters';

const COLORS = {
  bg: '#FFFFFF',
  textMain: '#212121',
  textSecondary: '#757575',
  primary: '#2BAF8C',
};

const DEFAULT_MAIN_CURRENCY = 'BYN';
const HERO_HEIGHT = 500;
const REFRESH_OFFSET = Platform.OS === 'ios' ? 64 : 0;
const GRADIENT_IMAGE = require('../assets/backgroundd.gif');

type Totals = {
  income: number;
  expense: number;
  currency: string;
};

const MainScreen = () => {
  const router = useRouter();
  const { mainCurrency } = useMainCurrency();
  const MAIN_CURRENCY = (mainCurrency || DEFAULT_MAIN_CURRENCY).toUpperCase();
  const mainCurrencySymbol = getCurrencySymbol(MAIN_CURRENCY);

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [accountsById, setAccountsById] = useState<Record<number, any>>({});
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [ratesMap, setRatesMap] = useState<Record<string, number>>({ [MAIN_CURRENCY]: 1 });

  const [historySectionsState, setHistorySectionsState] = useState<HistorySection[]>([]);
  const [rawHistorySections, setRawHistorySections] = useState<any[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const loadBalance = useCallback(async () => {
    try {
      const [accounts, rates] = await Promise.all([
        apiRequest<any[]>('/accounts'),
        apiRequest<Record<string, number>>('/rates').catch(() => ({ [MAIN_CURRENCY]: 1 })),
      ]);

      if (rates && typeof rates === 'object') {
        setRatesMap(prev => ({ ...prev, ...rates }));
      }

      const mainRate =
        typeof rates?.[MAIN_CURRENCY] === 'number' && rates[MAIN_CURRENCY] > 0
          ? rates[MAIN_CURRENCY]
          : 1;

      const normalizedAccounts = Array.isArray(accounts) ? accounts : [];
      setAccountsList(normalizedAccounts);

      if (normalizedAccounts.length > 0) {
        const map: Record<number, any> = {};
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

  const mapSectionsFromApi = useCallback(
    (sections: any[], accountFilter: number | null = null): HistorySection[] => {
      return sections
        .map((section, idx) => {
          const id = section?.id || section?.dateLabel || `section-${idx}`;
          const label = section?.dateLabel || id;

          const itemsRaw: HistoryItem[] = Array.isArray(section?.items)
            ? section.items.map((op: any) =>
              mapApiOperationToHistoryItem(op, accountsById, COLORS.primary),
            )
            : [];

          const mergedItems = mergeTransferItems(itemsRaw, COLORS.primary);

          const filteredItems = mergedItems.filter(item => {
            if (accountFilter === null) return true;
            return item.accountId === accountFilter || item.relatedAccountId === accountFilter;
          });

          return {
            id,
            dateLabel: label,
            totalLabel: computeSectionTotalLabel(
              filteredItems,
              ratesMap,
              MAIN_CURRENCY,
              mainCurrencySymbol,
            ),
            items: filteredItems,
          };
        })
        .filter(section => section.items.length > 0);
    },
    [accountsById, MAIN_CURRENCY, mainCurrencySymbol, ratesMap],
  );

  const loadHistory = useCallback(async () => {
    try {
      const data = await apiRequest<OperationPageResponse>('/operations?limit=100');
      const items = Array.isArray(data?.items) ? data.items : [];
      const sections = groupRawOperationsIntoSections(items);

      setRawHistorySections(sections);
      setHistorySectionsState(mapSectionsFromApi(sections, activeAccountId));
    } catch (e) {
      console.warn('Ошибка загрузки операций', e);
    }
  }, [activeAccountId, mapSectionsFromApi]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);

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
    if (!rawHistorySections || rawHistorySections.length === 0) return;
    setHistorySectionsState(mapSectionsFromApi(rawHistorySections, activeAccountId));
  }, [rawHistorySections, activeAccountId, mapSectionsFromApi]);

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

  const historyTotals = useMemo(() => {
    const perAccount: Record<number, Totals> = {};
    let allIncome = 0;
    let allExpense = 0;

    const sections = mapSectionsFromApi(rawHistorySections, null);

    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.transferId || item.type === 'transfer') return;

        const rawAmount =
          typeof item.amountValue === 'number'
            ? item.amountValue
            : Number(sanitizeNumericInput(item.amountLabel));
        if (!Number.isFinite(rawAmount)) return;

        const currency = (
          item.currency ||
          inferCurrencyCodeFromLabel(item.amountLabel) ||
          MAIN_CURRENCY
        ).toUpperCase();
        const accountId = item.accountId ?? null;
        const amountInMain = convertCurrency(rawAmount, currency, MAIN_CURRENCY, ratesMap, MAIN_CURRENCY);

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
  }, [MAIN_CURRENCY, mapSectionsFromApi, ratesMap, rawHistorySections]);

  const monthMeta = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const labelRaw = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(now);
    const label = labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1);
    return { startMs: start.getTime(), endMs: end.getTime(), label };
  }, []);

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

        const currencyCode = (
          item.currency ||
          inferCurrencyCodeFromLabel(item.amountLabel) ||
          MAIN_CURRENCY
        ).toUpperCase();
        const amountInMain = convertCurrency(
          rawAmount,
          currencyCode,
          MAIN_CURRENCY,
          ratesMap,
          MAIN_CURRENCY,
        );
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

    const data = perDay.map((value, idx) => ({
      value: Number(value.toFixed(2)),
      day: idx + 1,
    }));

    return { data, peak, total, daysInMonth, labelDays };
  }, [
    MAIN_CURRENCY,
    activeAccountId,
    mapSectionsFromApi,
    monthMeta.endMs,
    monthMeta.startMs,
    ratesMap,
    rawHistorySections,
  ]);

  const accountGroups = useMemo<AccountGroupSummaryItem[]>(() => {
    const descriptors: Record<
      string,
      { label: string; color: string; icon: string; hint?: string; order: number }
    > = {
      bank: { label: 'Банковские счета', color: '#6BC5D8', icon: 'link-outline', order: 1 },
      cash: { label: 'Наличные', color: '#5A63E7', icon: 'cash-outline', order: 2 },
      goal: { label: 'Цели', color: '#5AA7F7', icon: 'trending-up-outline', order: 3 },
      crypto: { label: 'Криптовалюта', color: '#9A59F6', icon: 'logo-bitcoin', order: 4 },
      other: { label: 'Другие', color: '#A0A4A8', icon: 'ellipsis-horizontal', order: 99 },
    };

    const groupsMap: Record<string, AccountGroupSummaryItem & { order: number }> = {};

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
      const rate = getRateToMain(currencyCode, ratesMap, MAIN_CURRENCY);
      const converted = balanceRaw * rate;

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

    return Object.values(groupsMap)
      .filter(g => Math.abs(g.total) > 0.0001)
      .sort((a, b) => a.order - b.order);
  }, [MAIN_CURRENCY, accountsList, ratesMap]);

  const latestOperations = useMemo(() => {
    const flat = historySectionsState.flatMap(section => section.items);
    if (!flat.length) return [];

    const getTimestamp = (item: HistoryItem) => {
      if (typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)) {
        return item.timestamp;
      }
      const parsed = new Date(item.dateTime).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return [...flat].sort((a, b) => getTimestamp(b) - getTimestamp(a)).slice(0, 5);
  }, [historySectionsState]);

  const openOperationInModal = useCallback(
    (item: HistoryItem) => {
      const accountMeta = item.accountId ? accountsById[item.accountId] : undefined;
      const targetMeta = item.relatedAccountId ? accountsById[item.relatedAccountId] : undefined;

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
        category: item.categoryId
          ? {
            id: item.categoryId,
            name: getOperationTitle(item),
            icon: item.categoryIcon || null,
            color: item.color || null,
          }
          : null,
        account: accountMeta
          ? {
            id: accountMeta.id,
            name: accountMeta.name || item.account || 'Счёт',
            currency: accountMeta.currency || item.currency,
            icon: accountMeta.icon || item.accountIcon || null,
            color: accountMeta.color || item.accountColor || null,
          }
          : null,
        targetAccount:
          item.type === 'transfer'
            ? {
              id: targetMeta?.id ?? item.relatedAccountId ?? null,
              name: targetMeta?.name || item.transferToAccountName || 'Счёт',
              currency: targetMeta?.currency || item.currency,
              icon: targetMeta?.icon || item.transferToAccountIcon || 'wallet',
              color:
                targetMeta?.color || item.transferToAccountColor || item.accountColor || null,
            }
            : null,
        photo_url: item.photoUrl || null,
        is_pinned: item.isPinned ?? false,
      };

      router.push({
        pathname: '/transactions/new',
        params: { operation: encodeURIComponent(JSON.stringify(payload)), edit: '1' },
      });
    },
    [accountsById, router],
  );

  const quickActions = useMemo<QuickActionItem[]>(
    () => [
      {
        key: 'topup',
        label: 'Пополнить',
        iconName: 'add',
        onPress: () => router.push({ pathname: '/transactions/new', params: { type: 'income' } }),
      },
      {
        key: 'transfer',
        label: 'Перевод',
        iconName: 'swap-horizontal',
        onPress: () => router.push({ pathname: '/transactions/new', params: { type: 'transfer' } }),
      },
      {
        key: 'requisites',
        label: 'Реквизиты',
        iconName: 'business-outline',
        onPress: () => router.push('/all-accounts'),
      },
      {
        key: 'more',
        label: 'Еще',
        iconName: 'ellipsis-horizontal',
        onPress: () => router.push('/all-accounts'),
      },
    ],
    [router],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.safe}>
        <StatusBar barStyle="dark-content" />

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
            <HeroParallaxHeader
              scrollY={scrollY}
              imageSource={GRADIENT_IMAGE}
              height={HERO_HEIGHT}
            >
              <BalanceSlider
                slides={sliderData}
                activeIndex={activeSlideIndex}
                onSelectSlide={(idx, accId) => {
                  setActiveSlideIndex(idx);
                  setActiveAccountId(accId);
                }}
                onAddAccountPress={() => router.push('/transactions/new/account-new')}
                historyTotals={historyTotals}
                formatCurrency={formatCurrency}
                getCurrencySymbol={getCurrencySymbol}
                accentColor={COLORS.primary}
              />
              <QuickActions actions={quickActions} iconColor={COLORS.primary} />
            </HeroParallaxHeader>

            <View style={styles.contentWrapper}>
              <View style={styles.historyCard}>
                {latestOperations.length > 0 ? (
                  <>
                    {latestOperations.map((item, idx) => (
                      <OperationRow
                        key={item.id}
                        item={item}
                        accountsById={accountsById}
                        onPress={openOperationInModal}
                        showDivider={idx < latestOperations.length - 1}
                      />
                    ))}
                    {latestOperations.length >= 5 ? (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.viewAllButton}
                        onPress={() => router.push('/all-accounts')}
                      >
                        <Text style={styles.viewAllText}>Еще</Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.emptyRow}>
                    <Ionicons name="calendar-outline" size={24} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>Операции отсутствуют</Text>
                  </View>
                )}
              </View>

              <MonthlySpendingChart
                monthLabel={monthMeta.label}
                monthStartMs={monthMeta.startMs}
                total={monthlyExpenseTrend.total}
                points={monthlyExpenseTrend.data}
                peak={monthlyExpenseTrend.peak}
                labelDays={monthlyExpenseTrend.labelDays}
                currency={MAIN_CURRENCY}
                formatCurrency={formatCurrency}
                primaryColor={COLORS.primary}
                textSecondaryColor={COLORS.textSecondary}
                textMainColor={COLORS.textMain}
              />

              <AccountGroupsSummary
                totalBalance={walletBalance}
                currency={MAIN_CURRENCY}
                currencySymbol={mainCurrencySymbol}
                groups={accountGroups}
                formatCurrency={formatCurrency}
              />
            </View>
          </Animated.ScrollView>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fab}
            onPress={() => router.push('/transactions/new')}
          >
            <Text style={styles.fabPlus}>＋</Text>
          </TouchableOpacity>
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
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 84,
  },
  contentWrapper: {
    marginTop: -24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
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
  fab: {
    position: 'absolute',
    marginBottom: 64,
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
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