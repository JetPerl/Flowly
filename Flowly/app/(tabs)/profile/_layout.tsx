import React from 'react';
import { router, Stack } from 'expo-router';
import { DeviceEventEmitter, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ProfileTabLayout() {
  return (
    <Stack
      id="profile-stack"
      screenOptions={{
        headerTransparent: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerShown: true,
          headerRight: () => (
            <Pressable style={{ paddingHorizontal: 8 }} onPress={() => { }}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#111" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="currency-list"
        options={{
          title: 'Основная валюта',
          headerSearchBarOptions: {
            placeholder: 'Поиск',
            placement: 'stacked',
            hideWhenScrolling: false,
            onChangeText: ({ nativeEvent }) => DeviceEventEmitter.emit('currency-search', nativeEvent.text),
            onCancelButtonPress: () => DeviceEventEmitter.emit('currency-search', ''),
          },
          headerRight: () => (
            <Pressable style={{ paddingHorizontal: 8 }} onPress={() => { }}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#111" />
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable style={{ paddingHorizontal: 3 }} onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color="#111" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="security"
        options={{
          title: 'Безопасность',
        }}
      />
    </Stack>
  );
}