import React from 'react';
import { Stack } from 'expo-router';
import { TransactionDraftProvider } from '../../../../src/context/_TransactionDraftContext';

export default function NewTransactionLayout() {
  return (
    <TransactionDraftProvider>
      <Stack
        id="new-transaction-stack"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Новая операция',
            headerShown: true,
          }}
        />
        <Stack.Screen name="category" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tags" options={{ presentation: 'modal' }} />
        <Stack.Screen name="location" options={{ presentation: 'modal', headerShown: true, title: 'Место' }} />
        <Stack.Screen name="category-new" options={{ presentation: 'modal' }} />
      </Stack>
    </TransactionDraftProvider>
  );
}