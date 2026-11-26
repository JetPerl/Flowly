import React from 'react';
import { router, Stack } from 'expo-router';
import { DeviceEventEmitter, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../../../src/theme/useThemeColors';

export default function ProfileTabLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      id="profile-stack"
      screenOptions={{
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: colors.textMain,
        headerTitleStyle: { color: colors.textMain },
        contentStyle: { backgroundColor: colors.baseSurface },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerShown: true,
          headerRight: () => (
            <Pressable style={{ paddingHorizontal: 8 }} hitSlop={8} onPress={() => { }}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMain} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="currency-list"
        options={{
          title: 'Основная валюта',
          headerSearchBarOptions: {
            placeholder: 'Поиск',
            placement: 'stacked',
            hideWhenScrolling: false,
            barTintColor: colors.elevatedSurface,
            tintColor: colors.textMain,
            textColor: colors.textMain,
            headerIconColor: colors.textSecondary,
            hintTextColor: colors.textSecondary,
            onChangeText: ({ nativeEvent }) =>
              DeviceEventEmitter.emit('currency-search', nativeEvent.text),
            onCancelButtonPress: () => DeviceEventEmitter.emit('currency-search', ''),
          },
          headerRight: () => (
            <Pressable style={{ paddingHorizontal: 8 }} hitSlop={8} onPress={() => { }}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMain} />
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable style={{ paddingHorizontal: 3 }} hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={colors.textMain} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="security"
        options={{
          title: 'Безопасность',
        }}
      />
    </Stack>
  );
}