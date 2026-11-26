import React, { useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MainCurrencyProvider } from '../src/currency/CurrencyContext';
import { AvatarProvider } from '../src/avatar/AvatarContext';
import { SecurityCodeProvider } from '../src/security/SecurityCodeProvider';
import { useThemeColors } from '../src/theme/useThemeColors';

export default function RootLayout() {
  const colors = useThemeColors();

  const navTheme = useMemo(() => {
    const base = colors.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: colors.isDark,
      colors: {
        ...base.colors,
        primary: colors.income || base.colors.primary,
        background: colors.baseSurface,
        card: colors.cardSurface,
        text: colors.textMain,
        border: colors.border,
      },
    };
  }, [colors]);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.baseSurface }}
    >
      <SafeAreaProvider>
        <AvatarProvider>
          <MainCurrencyProvider>
            <SecurityCodeProvider>
              <BottomSheetModalProvider>
                <ThemeProvider value={navTheme}>
                  <Stack
                    id="root-stack"
                    screenOptions={{
                      headerShown: true,
                      headerTransparent: true,
                      headerTitle: '',
                      headerTintColor: colors.textMain,
                      headerTitleStyle: { color: colors.textMain },
                      headerStyle: { backgroundColor: 'transparent' },
                      headerUserInterfaceStyle: colors.isDark ? 'dark' : 'light',
                      contentStyle: { backgroundColor: colors.baseSurface },
                    }}
                  >
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(modal)"
                      options={{
                        presentation: 'modal',
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.baseSurface },
                      }}
                    />
                  </Stack>
                </ThemeProvider>
              </BottomSheetModalProvider>
            </SecurityCodeProvider>
          </MainCurrencyProvider>
        </AvatarProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}