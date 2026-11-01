import { DynamicColorIOS } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      // For the selected icon color
      //role="search"
      tintColor={DynamicColorIOS({
        dark: 'white',
        light: '#2BAF8C',
      })}>
        
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" />
        <Label>Операции</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Report">
        <Icon sf="chart.pie.fill" />
        <Label>Отчет</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile"> 
        <Icon sf="person.fill" />
        <Label>Настройки</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}