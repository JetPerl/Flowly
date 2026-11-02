import React, { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import CategoryIcon from '../../../../../src/components/CategoryIcon';
import { useTransactionDraft } from '../_TransactionDraftContext';
import { apiRequest } from '../../../../../src/api/client';
import { API_BASE_URL } from '../_utils';

type Account = {
  id: number;
  name?: string;
  full_name?: string;
  short_name?: string;
  currency?: string;
  balance?: number | string | null;
  icon?: string | null;
  color?: string | null;
};

const COLORS = {
  textMain: '#212121',
  textSecondary: '#6B7280',
  purple: '#2BAF8C',
  border: '#ECEFF1',
};

const formatBalance = (value: number | string | null | undefined, currency?: string) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return { label: '—', value: null as number | null };
  }
  const absFormatted = Math.abs(num).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const code = currency ? currency.toUpperCase() : '';
  const sign = num < 0 ? '− ' : '';
  const label = code ? `${sign}${absFormatted} ${code}` : `${sign}${absFormatted}`;
  return { label, value: num as number };
};

export default function TransactionAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isTarget = params?.target === '1';
  const { draft, setAccount, setTargetAccount } = useTransactionDraft();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest<Account[]>('/accounts');
        if (Array.isArray(data)) {
          setAccounts(data);
        }
      } catch (e) {
        console.warn('Load accounts error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Счёт',
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <Animated.ScrollView
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior="automatic"
        >
          {accounts.map(acc => {
            const label = acc.name || acc.full_name || acc.short_name || 'Счёт';
            const isSelected = isTarget
              ? draft.targetAccount?.id === acc.id
              : draft.account?.id === acc.id;
            return (
              <Animated.View
                key={acc.id}
                layout={Layout.springify().damping(14).stiffness(160)}
                entering={FadeInDown.duration(160)}
                exiting={FadeOutUp.duration(140)}
              >
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected]}
                  activeOpacity={0.7}
                  onPress={() => {
                    const next = {
                      id: acc.id,
                      name: label,
                      currency: acc.currency,
                      icon: acc.icon || undefined,
                      color: acc.color || undefined,
                      balance: typeof acc.balance === 'number' ? acc.balance : Number(acc.balance) || null,
                    };
                    if (isTarget) {
                      setTargetAccount(next);
                    } else {
                      setAccount(next);
                    }
                    router.back();
                  }}
                >
                  <CategoryIcon
                    name={acc.icon || 'wallet'}
                    color={acc.color || undefined}
                    backgroundColor="transparent"
                    size={28}
                  />
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle}>{label}</Text>
                    {acc.currency ? (
                      <Text style={styles.rowSubtitle}>{acc.currency}</Text>
                    ) : null}
                  </View>
                  <View style={styles.rowRight}>
                    {(() => {
                      const balance = formatBalance(acc.balance, acc.currency);
                      const balanceColor =
                        typeof balance.value === 'number' && balance.value < 0
                          ? COLORS.textMain
                          : COLORS.purple;
                      return (
                        <Text style={[styles.rowBalance, { color: balanceColor }]}>
                          {balance.label}
                        </Text>
                      );
                    })()}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  list: {
    paddingBottom: 24,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowSelected: {
    marginHorizontal: 10,
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 10,
  },
  rowTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowBalance: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.purple,
  },
});
