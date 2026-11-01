import React from 'react';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SecurityCodeLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerLargeTitle: false,
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        // iOS native navigation style

        headerLeft: () => (
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 33,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 2,
            }}
          >
            <Ionicons
              name="close-outline"
              size={33}
              color="black"
            />
          </Pressable>
        ),
      }}
      initialRouteName="index"
    />
  );
}
