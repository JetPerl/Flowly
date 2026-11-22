import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MainCurrencyProvider } from '../src/currency/CurrencyContext';
import { AvatarProvider } from '../src/avatar/AvatarContext';
import { SecurityCodeProvider } from '../src/security/SecurityCodeProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AvatarProvider>
          <MainCurrencyProvider>
            <SecurityCodeProvider>
              <BottomSheetModalProvider>
                <Stack
                  id="root-stack"
                  screenOptions={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: '',
                  }}
                >
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(modal)"
                    options={{ presentation: 'modal', headerShown: false }}
                  />
                </Stack>
              </BottomSheetModalProvider>
            </SecurityCodeProvider>
          </MainCurrencyProvider>
        </AvatarProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}