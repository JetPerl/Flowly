import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';

import {
  categoryIcons,
  resolveCategoryIcon,
  type CategoryIconName,
  sanitizeCategoryIconName,
} from '../icons/categoryIcons';

type Props = {
  name?: string | null;
  size?: number;
  color?: string | null;
  backgroundColor?: string | null;
  fallbackColor?: string | null;
  style?: StyleProp<ViewStyle>;
};

const FILL_ONLY_ICONS = new Set<CategoryIconName>([
  'animal-food',
  'auto-chemical-goods',
  'beauty-salons',
  'force-majeure',
  'household-chemicals',
  'household-goods',
  'museums',
  'other-1',
  'present',
  'tickets',
  'unconsidered-spending',
]);

// 1. Допустимые иконки счетов
const ACCOUNT_ICONS = new Set<string>(['wallet', 'card', 'crypto', 'target']);

// 2. Синонимы иконок из базы данных к именам в приложении
const ICON_NAME_MAP: Record<string, string> = {
  'credit-card': 'card',
};

const normalizeColor = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const CategoryIcon: React.FC<Props> = ({
  name,
  size = 22,
  color,
  backgroundColor,
  fallbackColor = '#ffffffff',
  style,
}) => {
  // Подменяем имя, если для него есть синоним (например, credit-card -> card)
  const mappedName = name && ICON_NAME_MAP[name] ? ICON_NAME_MAP[name] : name;
  const normalizedName = sanitizeCategoryIconName(mappedName);

  const tintColor = normalizeColor(color);
  const isFillOnlyIcon = normalizedName ? FILL_ONLY_ICONS.has(normalizedName as CategoryIconName) : false;
  const isAccountIcon = normalizedName ? ACCOUNT_ICONS.has(normalizedName) : false;
  const shouldApplyFill = isFillOnlyIcon;
  const IconComponent = normalizedName ? resolveCategoryIcon(normalizedName) : undefined;
  const iconModule = normalizedName
    ? (categoryIcons as Record<string, any>)[normalizedName]
    : undefined;

  const containerBackground = backgroundColor ?? undefined;
  const fallbackBackground = fallbackColor ?? backgroundColor ?? undefined;

  let iconUri: string | null = null;
  if (iconModule) {
    try {
      const resolved = Image.resolveAssetSource(iconModule);
      iconUri = resolved?.uri || null;
    } catch {
      // ignore resolution errors and fall back to a plain square
    }
  }

  const innerSize = Math.round(size * 0.72);

  if (!IconComponent && !iconUri) {
    if (__DEV__ && normalizedName) {
      console.warn(
        '[CategoryIcon] Fallback',
        normalizedName,
        'mod type',
        typeof iconModule,
        'keys',
        iconModule ? Object.keys(iconModule) : [],
      );
    }
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fallbackBackground,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: containerBackground,
        },
        style,
      ]}
    >
      {IconComponent ? (
        <IconComponent
          width={innerSize}
          height={innerSize}
          color={isAccountIcon ? tintColor : undefined}
          stroke={tintColor}
          fill={shouldApplyFill ? tintColor : 'none'}
        />
      ) : iconUri ? (
        <SvgUri
          uri={iconUri}
          width={innerSize}
          height={innerSize}
          color={isAccountIcon ? tintColor : undefined}
          stroke={tintColor}
          fill={shouldApplyFill ? tintColor : 'none'}
          onError={(err: any) => {
            if (__DEV__) {
              const nativeEvent = err?.nativeEvent;
              console.warn('[CategoryIcon] SvgUri error for', normalizedName, iconUri, nativeEvent || err);
            }
          }}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: '#E5E7EB',
  },
});

export default CategoryIcon;