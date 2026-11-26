import React from 'react';
import { Pressable } from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AllAccountsScreen from '../src/AllAccountsScreen';
import { useThemeColors } from '../src/theme/useThemeColors';

export default function AllAccountsRoute() {
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.baseSurface },
          headerTintColor: colors.textMain,
          headerTitle: '',
          headerRight: () => (
            <Pressable
              style={{ paddingHorizontal: 7 }}
              hitSlop={8}
              onPress={() => { }}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={22}
                color={colors.textMain}
              />
            </Pressable>
          ),
        }}
      />
      <AllAccountsScreen />
    </>
  );
}