import React from 'react';
import { StyleSheet, View } from 'react-native';
import CategoryIcon from '../CategoryIcon';
import TransferIcon from './TransferIcon';
import type { HistoryItem } from '../../utils/operationHelpers';
import { useThemeColors } from '../../theme/useThemeColors';

type Props = {
  item: HistoryItem;
  accountsById?: Record<number, any>;
  size?: number;
  transferSize?: number;
};

export const OperationIcon: React.FC<Props> = ({
  item,
  accountsById = {},
  size = 44,
  transferSize = 24,
}) => {
  const colors = useThemeColors();
  const isTransfer = item.type === 'transfer' || item.transferId;

  if (isTransfer) {
    const fromIcon =
      (item.accountId ? accountsById[item.accountId]?.icon : null) ||
      item.transferFromAccountIcon ||
      'wallet';
    const toIcon =
      item.transferToAccountIcon ||
      (item.relatedAccountId ? accountsById[item.relatedAccountId]?.icon : null) ||
      'wallet';
    const fromColor =
      item.transferFromAccountColor || item.accountColor || '#F8D7B5';
    const toColor = item.transferToAccountColor || '#F3B0B5';

    return (
      <TransferIcon
        fromIcon={fromIcon}
        toIcon={toIcon}
        fromColor={fromColor}
        toColor={toColor}
        size={size}
        transferSize={transferSize}
      />
    );
  }

  return (
    <View
      style={[
        styles.iconWrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.iconSurface,
        },
      ]}
    >
      <CategoryIcon
        name={item.categoryIcon || 'wallet'}
        color={colors.iconPrimary}
        backgroundColor="transparent"
        fallbackColor="transparent"
        size={size - 10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OperationIcon;