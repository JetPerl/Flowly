import React from 'react';
import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      id="modal-stack"
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="transactions/new" />
      <Stack.Screen name="security-code" />
    </Stack>
  );
}