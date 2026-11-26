import React from 'react';
import { Stack } from 'expo-router';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../../../../../src/theme/useThemeColors';

const cards = [
  {
    key: 'manual',
    title: 'Ручной ввод',
    description: 'Обновите свой счёт вручную.',
    icon: 'create-outline' as const,
  },
  {
    key: 'import',
    title: 'Импорт файла',
    description: 'Импортируйте CSV, Excel или OFX и обновите счёт по данным файла.',
    icon: 'document-text-outline' as const,
  },
];

const noop = () => { };

export default function AccountNewModal() {
  const colors = useThemeColors();
  const accentColor = colors.isDark ? colors.income : '#1E6FE3';

  return (
    <View style={[styles.container, { backgroundColor: colors.baseSurface }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen
        options={{
          title: 'Создать счёт',
          headerTransparent: true,
          headerTintColor: colors.textMain,
          headerTitleStyle: { color: colors.textMain },
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {cards.map((card, index) => {
          const isLast = index === cards.length - 1;
          return (
            <TouchableOpacity
              key={card.key}
              activeOpacity={0.9}
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardSurface,
                  borderColor: colors.border,
                  shadowOpacity: colors.isDark ? 0 : 0.08,
                  elevation: colors.isDark ? 0 : 4,
                },
                !isLast && styles.cardSpacing,
              ]}
              onPress={noop}
            >
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.textMain }]}>
                  {card.title}
                </Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {card.description}
                </Text>
              </View>
              <View style={styles.cardIcon}>
                <Ionicons
                  name={card.icon}
                  size={30}
                  color={accentColor}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 82,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  cardSpacing: {
    marginBottom: 14,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  cardIcon: {
    marginLeft: 14,
  },
});