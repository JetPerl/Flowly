import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import OperationIcon from './OperationIcon';
import {
  getOperationSubtitle,
  getOperationTitle,
  type HistoryItem,
} from '../../utils/operationHelpers';

type Props = {
  item: HistoryItem;
  onPress?: (item: HistoryItem) => void;
  accountsById?: Record<number, any>;
  showDivider?: boolean;
};

export const OperationRow: React.FC<Props> = ({
  item,
  onPress,
  accountsById = {},
  showDivider = false,
}) => {
  const subtitle = getOperationSubtitle(item);
  const isTransfer = item.type === 'transfer' || item.transferId;
  const transferFromLabel = item.transferFromLabel || item.amountLabel;
  const transferToLabel = item.transferToLabel || '';

  return (
    <>
      <TouchableOpacity
        style={styles.historyRow}
        activeOpacity={0.7}
        onPress={() => onPress?.(item)}
      >
        <OperationIcon item={item} accountsById={accountsById} />

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
                    color="#757575"
                    style={styles.historyFlagIcon}
                  />
                ) : null}
                {item.isPinned ? (
                  <MaterialCommunityIcons
                    name="pin"
                    size={14}
                    color="#757575"
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
              {isTransfer ? transferFromLabel : item.amountLabel}
            </Text>
          </View>

          <View style={styles.historyMetaRow}>
            <Text style={styles.historyMeta} numberOfLines={1}>
              {item.dateTime || ''}
            </Text>
            {isTransfer && transferToLabel ? (
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
      {showDivider ? <View style={styles.historyItemDivider} /> : null}
    </>
  );
};

const styles = StyleSheet.create({
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  historyContent: {
    flex: 1,
    marginLeft: 12,
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
    color: '#212121',
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
    marginLeft: 4,
  },
  historyTitleAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
    flexShrink: 0,
    maxWidth: '45%',
    textAlign: 'right',
  },
  historyAmountIncome: {
    color: '#2BAF8C',
  },
  historyAmountNegative: {
    color: '#212121',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  historyMeta: {
    fontSize: 13,
    color: '#757575',
    flex: 1,
  },
  historyMetaAmount: {
    fontSize: 13,
    color: '#757575',
    marginLeft: 10,
    flexShrink: 0,
  },
  historySubtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },
  historyItemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ECEFF1',
    marginLeft: 72,
    marginRight: 16,
  },
});

export default OperationRow;
