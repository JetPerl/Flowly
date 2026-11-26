import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../../../theme/useThemeColors';
import { SurfaceCard } from '../../../components/SurfaceCard';

export type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export type AccountGroupSummaryItem = {
  key: string;
  label: string;
  hint?: string;
  total: number;
  color: string;
  icon: IoniconsName;
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
  const colors = useThemeColors();
  const hasValidBalance =
    typeof totalBalance === 'number' && Number.isFinite(totalBalance);
  const hasGroups = groups.length > 0;
  const dividerColor = colors.isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : colors.divider;

  return (
    <SurfaceCard contentStyle={styles.cardContent}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Общее состояние
      </Text>
      <Text
        style={[
          styles.value,
          !hasGroups && styles.valueNoGroups,
          { color: colors.textMain },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {hasValidBalance
          ? formatCurrency(totalBalance, true, currency)
          : `— ${currencySymbol}`}
      </Text>

      {hasGroups ? (
        <View style={[styles.groups, { borderTopColor: dividerColor }]}>
          {groups.map((group) => (
            <View key={group.key} style={styles.row}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: colors.isDark
                      ? `${group.color}24`
                      : `${group.color}1A`,
                  },
                ]}
              >
                <Ionicons name={group.icon} size={20} color={group.color} />
              </View>

              <View style={styles.textBlock}>
                <Text
                  style={[styles.groupTitle, { color: colors.textMain }]}
                  numberOfLines={1}
                >
                  {group.label}
                </Text>
                {group.hint ? (
                  <Text
                    style={[styles.groupHint, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {group.hint}
                  </Text>
                ) : null}
              </View>

              <Text
                style={[styles.groupValue, { color: colors.textMain }]}
                numberOfLines={1}
              >
                {formatCurrency(group.total, true, currency)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  valueNoGroups: {
    marginBottom: 0,
  },
  groups: {
    gap: 12,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  groupTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  groupHint: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: 2,
  },
  groupValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    flexShrink: 0,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});