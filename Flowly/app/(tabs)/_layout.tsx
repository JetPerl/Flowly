import { Platform, StyleSheet, View } from 'react-native';
import { DynamicColorIOS } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { useThemeColors } from '../../src/theme/useThemeColors';

export default function TabLayout() {
  const colors = useThemeColors();

  const tabTintColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
        dark: '#FFFFFF',
        light: '#2BAF8C',
      })
      : colors.isDark
        ? '#FFFFFF'
        : colors.income;

  return (
    <View style={[styles.container, { backgroundColor: colors.baseSurface }]}>
      <NativeTabs
        tintColor={tabTintColor}
        backgroundColor={colors.isDark ? colors.elevatedSurface : colors.cardSurface}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="house.fill" />
          <NativeTabs.Trigger.Label>Операции</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="Report">
          <NativeTabs.Trigger.Icon sf="chart.pie.fill" />
          <NativeTabs.Trigger.Label>Отчет</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf="person.fill" />
          <NativeTabs.Trigger.Label>Настройки</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});