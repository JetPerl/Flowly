import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';

type Props = {
  dateLabel: string;
  totalLabel?: string | null;
  showDivider?: boolean;
  variant?: 'screen' | 'card';
  isFirst?: boolean;
};

export const HistorySectionHeader: React.FC<Props> = ({
  dateLabel,
  totalLabel,
  showDivider,
  variant = 'screen',
  isFirst = false,
}) => {
  const colors = useThemeColors();
  const isCard = variant === 'card';
  const shouldShowDivider = showDivider ?? !isCard;

  const pillBg = colors.isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(33, 33, 33, 0.06)';

  return (
    <View
      style={[
        isCard ? styles.cardHeader : styles.screenHeader,
        isCard && isFirst && styles.cardHeaderFirst,
        { backgroundColor: isCard ? 'transparent' : colors.baseSurface },
      ]}
    >
      {isCard && !isFirst ? (
        <View
          style={[
            styles.cardGroupSeparator,
            { backgroundColor: colors.divider },
          ]}
        />
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderContent}>
          <Text
            style={[
              isCard ? styles.cardTitle : styles.screenTitle,
              { color: isCard ? colors.textSecondary : colors.textMain },
            ]}
            numberOfLines={1}
          >
            {dateLabel}
          </Text>
        </View>

        {totalLabel ? (
          <View
            style={[
              isCard ? styles.cardTotalPill : styles.screenTotalPill,
              { backgroundColor: pillBg },
            ]}
          >
            <Text
              style={[
                isCard ? styles.cardTotalText : styles.screenTotalText,
                { color: colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {totalLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {shouldShowDivider ? (
        <View
          style={[
            styles.sectionHeaderDivider,
            { backgroundColor: colors.divider },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screenHeader: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  cardHeader: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  cardHeaderFirst: {
    paddingTop: 4,
  },
  cardGroupSeparator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionHeaderContent: {
    flex: 1,
    minWidth: 0,
  },
  screenTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  screenTotalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  cardTotalPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  screenTotalText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  cardTotalText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sectionHeaderDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 8,
    marginHorizontal: 16,
  },
});

export default HistorySectionHeader;