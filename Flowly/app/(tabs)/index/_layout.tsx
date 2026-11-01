import React from 'react';
import { Stack } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function HomeTabLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerBackground: undefined,
        headerRight: () => (
          <Pressable style={{ paddingHorizontal: 8 }} onPress={() => { }}>
            <Ionicons name="filter" size={20} color="#111" />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
