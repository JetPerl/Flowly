import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  dateLabel: string;
  totalLabel?: string | null;
  showDivider?: boolean;
};

export const HistorySectionHeader: React.FC<Props> = ({
  dateLabel,
  totalLabel,
  showDivider = true,
}) => {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>{dateLabel}</Text>
        </View>
        {totalLabel ? (
          <View style={styles.sectionTotalPill}>
            <Text style={styles.sectionTotalText}>{totalLabel}</Text>
          </View>
        ) : null}
      </View>
      {showDivider ? <View style={styles.sectionHeaderDivider} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
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
    color: '#757575',
  },
  sectionHeaderDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ECEFF1',
    marginTop: 8,
    marginHorizontal: 16,
  },
});

export default HistorySectionHeader;

