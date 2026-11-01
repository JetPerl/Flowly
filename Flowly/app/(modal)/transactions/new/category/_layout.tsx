import React from 'react';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerLargeTitle: false,
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerSearchBarOptions: {
          placeholder: 'Поиск',
          placement: 'stacked',
          hideWhenScrolling: false,
        },
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
        headerRight: () => (
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 6,
            }}
          >
            <Pressable
              onPress={() => router.push('/transactions/new/category-new')}
              style={{
                width: 42,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 20,
              }}
            >
              <Ionicons
                name="add-outline"
                size={32}
                color="black"
              />
            </Pressable>

            <Pressable
              onPress={() => router.push('/transactions/new/account')}
              style={{
                width: 22,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="pencil-outline"
                size={22}
                color="black"
              />
            </Pressable>
            
          </Pressable>
          
        ),
      }}
      initialRouteName="index"
    />
  );
}
