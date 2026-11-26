import React from 'react';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../../../src/theme/useThemeColors';

export default function AccountNewLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      id="account-new-stack"
      screenOptions={{
        presentation: 'modal',
        headerLargeTitle: false,
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerTintColor: colors.textMain,
        headerTitleStyle: { color: colors.textMain },
        contentStyle: { backgroundColor: colors.baseSurface },

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
      }}
    />
  );
}