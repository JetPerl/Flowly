import React from 'react';
import { Stack } from 'expo-router';
import { TransactionDraftProvider } from './_TransactionDraftContext';

export default function NewTransactionLayout() {
  return (
    <TransactionDraftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
        }}
        initialRouteName="index"
      />
    </TransactionDraftProvider>
  );
}
