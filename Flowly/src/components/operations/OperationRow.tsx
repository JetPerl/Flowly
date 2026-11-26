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
import { useThemeColors } from '../../theme/useThemeColors';

type DateDisplayMode = 'full' | 'time' | 'raw';

type Props = {
  item: HistoryItem;
  onPress?: (item: HistoryItem) => void;
  accountsById?: Record<number, any>;
  showDivider?: boolean;
  dateDisplay?: DateDisplayMode;
};

const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const parseItemDate = (item: HistoryItem): Date | null => {
  if (typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)) {
    const d = new Date(item.timestamp);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (item.dateTime) {
    const d = new Date(item.dateTime);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const formatOperationMetaDate = (
  item: HistoryItem,
  mode: DateDisplayMode,
): string => {
  if (mode === 'raw') return item.dateTime || '';

  const date = parseItemDate(item);
  if (!date) return item.dateTime || '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (mode === 'time') {
    return `${hours}:${minutes}`;
  }

  const weekday = WEEKDAYS_SHORT[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_GENITIVE[date.getMonth()];
  const year = date.getFullYear();

  return `${weekday}, ${day} ${month} ${year} г., ${hours}:${minutes}`;
};

export const OperationRow: React.FC<Props> = ({
  item,
  onPress,
  accountsById = {},
  showDivider = false,
  dateDisplay = 'full',
}) => {
  const colors = useThemeColors();
  const subtitle = getOperationSubtitle(item);
  const isTransfer = item.type === 'transfer' || Boolean(item.transferId);
  const transferFromLabel = item.transferFromLabel || item.amountLabel;
  const transferToLabel = item.transferToLabel || '';
  const hasFlags = Boolean(item.photoUrl || item.isPinned);
  const metaDateLabel = formatOperationMetaDate(item, dateDisplay);

  return (
    <View>
      <TouchableOpacity
        style={styles.historyRow}
        activeOpacity={0.7}
        onPress={() => onPress?.(item)}
      >
        <View style={styles.iconWrapper}>
          <OperationIcon item={item} accountsById={accountsById} />
        </View>

        <View style={styles.historyContent}>
          <View style={styles.historyTitleRow}>
            <View style={styles.historyTitleLeft}>
              <Text
                style={[styles.historyTitle, { color: colors.textMain }]}
                numberOfLines={1}
              >
                {getOperationTitle(item)}
              </Text>
              {hasFlags ? (
                <View style={styles.historyFlags}>
                  {item.photoUrl ? (
                    <Ionicons
                      name="camera"
                      size={14}
                      color={colors.textSecondary}
                    />
                  ) : null}
                  {item.isPinned ? (
                    <MaterialCommunityIcons
                      name="pin"
                      size={14}
                      color={colors.textSecondary}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>

            <Text
              style={[
                styles.historyTitleAmount,
                {
                  color:
                    item.type === 'income' ? colors.income : colors.expense,
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
              {metaDateLabel}
            </Text>
            {isTransfer && transferToLabel ? (
              <Text
                style={[styles.historyMetaAmount, { color: colors.income }]}
                numberOfLines={1}
              >
                {transferToLabel}
              </Text>
            ) : null}
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

      {showDivider ? (
        <View
          style={[
            styles.historyItemDivider,
            { backgroundColor: colors.divider },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrapper: {
    marginTop: 0,
  },
  historyContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minWidth: 0,
  },
  historyTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  historyFlags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
    flexShrink: 0,
  },
  historyTitleAmount: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    flexShrink: 0,
    maxWidth: '45%',
    textAlign: 'right',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyMeta: {
    fontSize: 14,
    lineHeight: 19,
    flex: 1,
    minWidth: 0,
    fontVariant: ['tabular-nums'],
  },
  historyMetaAmount: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
    marginTop: -1,
    flexShrink: 0,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  historySubtitle: {
    fontSize: 14,
    lineHeight: 19,
    maxWidth: '70%',
  },
  historyItemDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 74,
    marginRight: 16,
  },
});

export default OperationRow;