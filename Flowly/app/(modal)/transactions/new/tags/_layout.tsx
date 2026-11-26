import React from 'react';
import { router, Stack } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../../../src/theme/useThemeColors';

export default function TagsLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      id="tags-stack"
      screenOptions={{
        presentation: 'modal',
        headerLargeTitle: false,
        headerShown: true,
        headerTransparent: true,
        headerTintColor: colors.textMain,
        headerTitleStyle: { color: colors.textMain },
        contentStyle: { backgroundColor: colors.baseSurface },
        headerSearchBarOptions: {
          placeholder: 'Поиск',
          placement: 'stacked',
          hideWhenScrolling: false,
          textColor: colors.textMain,
          headerIconColor: colors.textSecondary,
          hintTextColor: colors.textSecondary,
        },

        headerLeft: () => (
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: 32,
              height: 33,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 2,
            }}
          >
            <Ionicons
              name="close-outline"
              size={33}
              color={colors.textMain}
            />
          </Pressable>
        ),
        headerRight: () => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 6,
            }}
          >
            <Pressable
              onPress={() => router.push('/transactions/new/category-new')}
              hitSlop={8}
              style={{
                width: 42,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 20,
              }}
            >
              <Ionicons
                name="add-outline"
                size={32}
                color={colors.textMain}
              />
            </Pressable>

            <Pressable
              onPress={() => router.push('/transactions/new/account')}
              hitSlop={8}
              style={{
                width: 22,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="pencil-outline"
                size={22}
                color={colors.textMain}
              />
            </Pressable>
          </View>
        ),
      }}
    />
  );
}