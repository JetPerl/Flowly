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
import { getAccounts, getOperations, getRates } from './api';
import { useMainCurrency } from './currency/CurrencyContext';
import {
  OperationIcon,
} from './components/operations';
import {
  DEFAULT_MAIN_CURRENCY,
  computeSectionTotalLabel,
  getCurrencySymbol,
  getOperationSubtitle,
  getOperationTitle,
  itemMatchesQuery,
  mapApiOperationToHistoryItem,
  mergeTransferItems,
  type HistoryItem,
  type HistorySection,
} from './utils';
import type { AccountResponse } from './types';
import { useThemeColors } from './theme/useThemeColors';

const DEFAULT_ACCENT = '#2BAF8C';

const formatSectionDateRu = (date: Date): string => {
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatDateTimeCommaRu = (date: Date): string => {
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

const AllAccountsScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { mainCurrency } = useMainCurrency();
  const MAIN_CURRENCY = (mainCurrency || DEFAULT_MAIN_CURRENCY).toUpperCase();
  const mainCurrencySymbol = getCurrencySymbol(MAIN_CURRENCY);

  const [accountsById, setAccountsById] = useState<Record<number, AccountResponse>>({});
  const [ratesMap, setRatesMap] = useState<Record<string, number>>({ [MAIN_CURRENCY]: 1 });
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sections = useMemo<HistorySection[]>(() => {
    if (!rawItems.length) return [];

    const groups: Record<string, any[]> = {};
    rawItems.forEach(op => {
      const rawDate: string | undefined = op?.dateTime || op?.date_time || op?.date;
      const dateKey = rawDate ? rawDate.split('T')[0] : 'unknown';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(op);
    });

    return Object.entries(groups)
      .sort(([dateA], [dateB]) => (dateA < dateB ? 1 : -1))
      .map(([dateKey, groupOps]) => {
        const parsedDate = dateKey !== 'unknown' ? new Date(dateKey) : new Date();
        const mappedItems = groupOps.map(op => {
          const item = mapApiOperationToHistoryItem(op, accountsById, DEFAULT_ACCENT);
          const rawDate: string | undefined =
            op?.dateTime || op?.date_time || op?.date || op?.created_at;
          const d = rawDate ? new Date(rawDate) : null;
          return {
            ...item,
            dateTime: d && !Number.isNaN(d.getTime()) ? formatDateTimeCommaRu(d) : item.dateTime,
          };
        });

        const mergedItems = mergeTransferItems(mappedItems, DEFAULT_ACCENT).sort((x, y) => {
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

        return {
          id: dateKey,
          dateLabel: formatSectionDateRu(parsedDate),
          totalLabel: computeSectionTotalLabel(
            mergedItems,
            ratesMap,
            MAIN_CURRENCY,
            mainCurrencySymbol,
          ),
          items: mergedItems,
        };
      })
      .filter(sec => sec.items.length > 0);
  }, [accountsById, MAIN_CURRENCY, mainCurrencySymbol, ratesMap, rawItems]);

  const loadMeta = useCallback(async () => {
    try {
      const [accounts, rates] = await Promise.all([
        getAccounts(),
        getRates().catch(() => ({ [MAIN_CURRENCY]: 1 })),
      ]);

      const map: Record<number, AccountResponse> = {};
      (Array.isArray(accounts) ? accounts : []).forEach(acc => {
        if (typeof acc?.id === 'number') {
          map[acc.id] = acc;
        }
      });
      setAccountsById(map);

      if (rates && typeof rates === 'object') {
        setRatesMap(prev => ({ ...prev, ...rates }));
      }
    } catch (e) {
      console.warn('Ошибка загрузки счетов или курсов', e);
    }
  }, [MAIN_CURRENCY]);

  const loadHistory = useCallback(async (cursor?: string | null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const data = await getOperations({ limit: 20, cursor });
      const items = Array.isArray(data?.items) ? data.items : [];
      setNextCursor(data?.pageInfo?.hasNext ? data.pageInfo.nextCursor : null);

      setRawItems(prev => {
        const base = cursor ? prev : [];
        const dedup = new Map<string, any>();
        [...base, ...items].forEach(op => {
          if (op?.id !== undefined && op?.id !== null) {
            dedup.set(String(op.id), op);
          }
        });
        return Array.from(dedup.values());
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
  }, [loadHistory, loadMeta]);

  useEffect(() => {
    navigation.setOptions({
      headerTintColor: colors.textMain,
      headerTitleStyle: { color: colors.textMain },
      headerSearchBarOptions: {
        placeholder: 'Поиск',
        placement: 'stacked',
        hideWhenScrolling: true,
        textColor: colors.textMain,
        headerIconColor: colors.textSecondary,
        hintTextColor: colors.textSecondary,
        onChangeText: ({ nativeEvent }: any) => setSearchQuery(nativeEvent.text),
        onCancelButtonPress: () => setSearchQuery(''),
      },
    });
  }, [navigation, colors.textMain, colors.textSecondary]);

  const hasQuery = searchQuery.trim().length > 0;

  const sectionsForList = useMemo(() => {
    const list = hasQuery
      ? sections
        .map(sec => ({
          ...sec,
          items: sec.items.filter(item => itemMatchesQuery(item, searchQuery)),
        }))
        .filter(sec => sec.items.length > 0)
      : sections;
    return list.map(sec => ({ ...sec, data: sec.items }));
  }, [hasQuery, searchQuery, sections]);

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
      const parsedAmount = Number(item.amountLabel?.replace(/[^\d.-]/g, ''));
      const normalizedAmount =
        item.amountValue ?? (Number.isFinite(parsedAmount) ? parsedAmount : 0);

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
            name: item.category,
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

  const pillBg = colors.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(33, 33, 33, 0.06)';

  const renderSectionHeader = ({ section }: { section: HistorySection & { data: HistoryItem[] } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.baseSurface }]}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderContent}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
            {section.dateLabel}
          </Text>
        </View>
        {section.totalLabel ? (
          <View style={[styles.sectionTotalPill, { backgroundColor: pillBg }]}>
            <Text style={[styles.sectionTotalText, { color: colors.textSecondary }]}>
              {section.totalLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.sectionHeaderDivider, { backgroundColor: colors.divider }]} />
    </View>
  );

  const renderHistoryRow = ({ item }: { item: HistoryItem }) => {
    const isTransfer = item.type === 'transfer' || Boolean(item.transferId);
    const title = isTransfer
      ? `${item.transferFromAccountName || item.account || 'Счёт'} → ${item.transferToAccountName || 'Счёт'}`
      : getOperationTitle(item);
    const subtitle = getOperationSubtitle(item);
    const transferFromLabel = item.transferFromLabel || item.amountLabel;
    const transferToLabel = item.transferToLabel || '';

    return (
      <TouchableOpacity
        style={styles.historyRow}
        activeOpacity={0.7}
        onPress={() => openOperationInModal(item)}
      >
        <OperationIcon item={item} accountsById={accountsById} />
        <View style={[styles.historyContent, { borderBottomColor: colors.divider }]}>
          <View style={styles.historyTitleRow}>
            <View style={styles.historyTitleLeft}>
              <Text
                style={[styles.historyTitle, { color: colors.textMain }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <View style={styles.historyFlags}>
                {item.photoUrl ? (
                  <Ionicons
                    name="camera"
                    size={14}
                    color={colors.textSecondary}
                    style={styles.historyFlagIcon}
                  />
                ) : null}
                {item.isPinned ? (
                  <MaterialCommunityIcons
                    name="pin"
                    size={14}
                    color={colors.textSecondary}
                    style={styles.historyFlagIcon}
                  />
                ) : null}
              </View>
            </View>
            <Text
              style={[
                styles.historyTitleAmount,
                {
                  color: item.type === 'income' ? colors.income : colors.expense,
                },
              ]}
              numberOfLines={1}
            >
              {isTransfer ? transferFromLabel : item.amountLabel}
            </Text>
          </View>
          <View style={styles.historyMetaRow}>
            <Text
              style={[styles.historyMeta, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.dateTime || ''}
            </Text>
            {isTransfer && transferToLabel ? (
              <Text
                style={[
                  styles.historyMetaAmount,
                  styles.historyMetaAmountBold,
                  { color: colors.income },
                ]}
                numberOfLines={1}
              >
                {transferToLabel}
              </Text>
            ) : (
              <Text
                style={[styles.historyMetaAmount, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.account}
              </Text>
            )}
          </View>
          {subtitle ? (
            <Text
              style={[styles.historySubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
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
          <ActivityIndicator size="small" color={colors.income} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Загружаем историю...
          </Text>
        </View>
      );
    }
    if (hasQuery) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={28} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Ничего не найдено
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <View
          style={[
            styles.historyEmptyRowIcon,
            { backgroundColor: colors.iconSurface },
          ]}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.textSecondary} />
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Операции отсутствуют
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.baseSurface }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
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
            tintColor={colors.income}
            colors={[colors.income]}
          />
        }
        ListEmptyComponent={renderListEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingTop: 10,
    paddingBottom: 4,
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
  },
  sectionTotalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  sectionTotalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeaderDivider: {
    height: StyleSheet.hairlineWidth,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  historyMeta: {
    fontSize: 13,
    flex: 1,
  },
  historyMetaAmount: {
    fontSize: 13,
    marginLeft: 10,
    flexShrink: 0,
  },
  historyMetaAmountBold: {
    fontWeight: '700',
  },
  historySubtitle: {
    fontSize: 13,
    marginTop: 8,
  },
  historyEmptyRowIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});

export default AllAccountsScreen;