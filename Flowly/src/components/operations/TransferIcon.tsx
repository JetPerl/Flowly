import React from 'react';
import { StyleSheet, View } from 'react-native';
import CategoryIcon from '../CategoryIcon';
import { useThemeColors } from '../../theme/useThemeColors';

type Props = {
  fromIcon?: string | null;
  toIcon?: string | null;
  fromColor?: string | null;
  toColor?: string | null;
  ringColor?: string;
  size?: number;
  transferSize?: number;
};

export const TransferIcon: React.FC<Props> = ({
  fromIcon = 'wallet',
  toIcon = 'wallet',
  fromColor = '#F8D7B5',
  toColor = '#F3B0B5',
  ringColor,
  size = 44,
  transferSize = 24,
}) => {
  const colors = useThemeColors();
  const resolvedRingColor = ringColor ?? colors.cardSurface;

  const transferIconTop = (size - transferSize) / 2;
  const frontWrapperSize = transferSize + 3; // обводка 1.5px вместо 3px
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
            backgroundColor: resolvedRingColor,
            top: frontWrapperTop + 4,
            right: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

export default TransferIcon;