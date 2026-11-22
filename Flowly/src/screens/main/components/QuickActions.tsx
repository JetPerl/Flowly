import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

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
  iconColor = '#2BAF8C',
}) => {
  return (
    <View style={styles.row}>
      {actions.map(action => (
        <TouchableOpacity
          key={action.key}
          style={styles.item}
          activeOpacity={0.85}
          onPress={action.onPress}
        >
          <View style={styles.iconBox}>
            <Ionicons name={action.iconName} size={24} color={iconColor} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
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
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 6,
  },
  item: { flex: 1, alignItems: 'center' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  label: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffffc7',
    textAlign: 'center',
  },
});