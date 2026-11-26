import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../../../src/theme/useThemeColors';

export default function Modal() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.baseSurface }]}>
      <Text style={[styles.title, { color: colors.textMain }]}>Modal screen</Text>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});