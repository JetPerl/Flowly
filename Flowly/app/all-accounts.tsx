import React from 'react';
import { Pressable } from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AllAccountsScreen from '../src/AllAccountsScreen';

export default function AllAccountsRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: false,
          headerShadowVisible: false, 
          headerTitle: '',
          headerRight: () => (
            <Pressable style={{ paddingHorizontal: 7 }} onPress={() => {}}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#111" />
            </Pressable>
          ),
        }}
      />
      <AllAccountsScreen />
    </>
  );
}
