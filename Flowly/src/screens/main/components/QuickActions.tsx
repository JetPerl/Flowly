import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../../../theme/useThemeColors';

export type QuickActionItem = {
  key: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type QuickActionsProps = {
  actions: QuickActionItem[];
  iconColor?: string;
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  iconColor,
}) => {
  const colors = useThemeColors();
  const resolvedIconColor = iconColor ?? colors.quickActionIcon;

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={styles.item}
          activeOpacity={0.85}
          onPress={action.onPress}
        >
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                shadowOpacity: colors.isDark ? 0 : 0.08,
                elevation: colors.isDark ? 0 : 4,
              },
            ]}
          >
            <Ionicons name={action.iconName} size={24} color={resolvedIconColor} />
          </View>
          <Text
            style={[styles.label, { color: colors.heroTextMain }]}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  item: { flex: 1, alignItems: 'center' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  label: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});