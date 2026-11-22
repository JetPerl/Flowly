import React from 'react';
import { StyleSheet, View } from 'react-native';
import CategoryIcon from '../CategoryIcon';

type Props = {
  fromIcon?: string | null;
  toIcon?: string | null;
  fromColor?: string | null;
  toColor?: string | null;
  size?: number;
  transferSize?: number;
};

export const TransferIcon: React.FC<Props> = ({
  fromIcon = 'wallet',
  toIcon = 'wallet',
  fromColor = '#F8D7B5',
  toColor = '#F3B0B5',
  size = 44,
  transferSize = 24,
}) => {
  const transferIconTop = (size - transferSize) / 2;
  const frontWrapperSize = transferSize + 6;
  const frontWrapperTop = (size - frontWrapperSize) / 2;

  return (
    <View style={[styles.transferIconStack, { width: size, height: size }]}>
      <CategoryIcon
        name={fromIcon}
        color="#FFFFFF"
        backgroundColor={fromColor || '#F8D7B5'}
        fallbackColor={fromColor || '#F8D7B5'}
        size={transferSize}
        style={[
          styles.transferIcon,
          { left: 2, top: transferIconTop - 4, zIndex: 1 },
        ]}
      />
      <View
        style={[
          styles.transferIconFrontWrapper,
          {
            width: frontWrapperSize,
            height: frontWrapperSize,
            borderRadius: frontWrapperSize / 2,
            top: frontWrapperTop + 4,
            right: 0,
            zIndex: 2,
          },
        ]}
      >
        <CategoryIcon
          name={toIcon}
          color="#FFFFFF"
          backgroundColor={toColor || '#F3B0B5'}
          fallbackColor={toColor || '#F3B0B5'}
          size={transferSize}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  transferIconStack: {
    position: 'relative',
  },
  transferIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  transferIconFrontWrapper: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

export default TransferIcon;

