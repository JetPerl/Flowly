import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export type AccountGroupSummaryItem = {
  key: string;
  label: string;
  hint?: string;
  total: number;
  color: string;
  icon: string;
};

type AccountGroupsSummaryProps = {
  totalBalance: number | null;
  currency: string;
  currencySymbol: string;
  groups: AccountGroupSummaryItem[];
  formatCurrency: (value: number, withSymbol?: boolean, currency?: string) => string;
};

export const AccountGroupsSummary: React.FC<AccountGroupsSummaryProps> = ({
  totalBalance,
  currency,
  currencySymbol,
  groups,
  formatCurrency,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Общее состояние</Text>
      <Text style={styles.value}>
        {totalBalance !== null
          ? formatCurrency(totalBalance, true, currency)
          : `— ${currencySymbol}`}
      </Text>
      <View style={styles.groups}>
        {groups.map(group => (
          <View key={group.key} style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: group.color }]}>
              <Ionicons name={group.icon as any} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              {group.hint ? (
                <Text style={styles.groupHint} numberOfLines={1}>
                  {group.hint}
                </Text>
              ) : null}
            </View>
            <Text style={styles.groupValue}>
              {formatCurrency(group.total, true, currency)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  label: { fontSize: 14, color: '#757575', marginBottom: 4 },
  value: { fontSize: 26, fontWeight: '700', color: '#212121', marginBottom: 12 },
  groups: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textBlock: { flex: 1, marginRight: 12 },
  groupTitle: { fontSize: 16, fontWeight: '600', color: '#212121' },
  groupHint: { fontSize: 13, color: '#757575', marginTop: 2 },
  groupValue: { fontSize: 15, fontWeight: '600', color: '#212121' },
});