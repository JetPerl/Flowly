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
        headerRight: () => (
          <Pressable style={{ paddingHorizontal: 8 }} onPress={() => {}}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#111" />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
