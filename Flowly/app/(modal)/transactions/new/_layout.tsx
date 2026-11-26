import React from 'react';
import { Stack } from 'expo-router';
import { TransactionDraftProvider } from '../../../../src/context/_TransactionDraftContext';
import { useThemeColors } from '../../../../src/theme/useThemeColors';

export default function NewTransactionLayout() {
  const colors = useThemeColors();

  return (
    <TransactionDraftProvider>
      <Stack
        id="new-transaction-stack"
        screenOptions={{
          headerShown: false,
          headerTintColor: colors.textMain,
          headerTitleStyle: { color: colors.textMain },
          headerStyle: { backgroundColor: 'transparent' },
          contentStyle: { backgroundColor: colors.baseSurface },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Новая операция',
            headerShown: true,
            headerTransparent: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="category" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tags" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="location"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Место',
          }}
        />
        <Stack.Screen name="category-new" options={{ presentation: 'modal' }} />
      </Stack>
    </TransactionDraftProvider>
  );
}