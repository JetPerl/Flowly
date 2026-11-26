import React from 'react';
import { Stack } from 'expo-router';
import { useThemeColors } from '../../src/theme/useThemeColors';

export default function ModalLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      id="modal-stack"
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        headerTintColor: colors.textMain,
        headerTitleStyle: { color: colors.textMain },
        headerStyle: { backgroundColor: 'transparent' },
        contentStyle: { backgroundColor: colors.baseSurface },
      }}
    >
      <Stack.Screen name="transactions/new" />
      <Stack.Screen name="security-code" />
    </Stack>
  );
}