import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSecurityCode } from './security/SecurityCodeProvider';
import { useThemeColors } from './theme/useThemeColors';

const SecurityList = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const {
    enabled,
    disable,
    loading,
    biometricsEnabled,
    biometricsAvailable,
    biometricsReason,
    setBiometricsEnabled,
  } = useSecurityCode();
  const [pinEnabled, setPinEnabled] = useState(enabled);
  const [faceIdEnabled, setFaceIdEnabled] = useState(biometricsEnabled);
  const [widgetsEnabled, setWidgetsEnabled] = useState(false);

  useEffect(() => {
    setPinEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    setFaceIdEnabled(biometricsEnabled);
  }, [biometricsEnabled]);

  const handlePinToggle = async (next: boolean) => {
    if (next) {
      router.push('/security-code');
      return;
    }
    setPinEnabled(false);
    await disable();
  };

  const handleFaceToggle = async (next: boolean) => {
    if (!biometricsAvailable) return;
    if (!enabled && next) {
      router.push('/security-code');
      return;
    }
    setFaceIdEnabled(next);
    await setBiometricsEnabled(next);
  };

  const trackOffColor = colors.isDark ? 'rgba(255, 255, 255, 0.2)' : '#C8CDD3';
  const trackOnColor = colors.income;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.baseSurface }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen
        options={{
          title: 'Безопасность',
          headerTransparent: true,
          headerTintColor: colors.textMain,
          headerTitleStyle: { color: colors.textMain },
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.listCard,
            {
              backgroundColor: colors.cardSurface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.row, styles.rowDivider, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.label, { color: colors.textMain }]}>Защитный код</Text>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              disabled={loading}
              trackColor={{ false: trackOffColor, true: trackOnColor }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={trackOffColor}
            />
          </View>

          <View style={[styles.row, styles.rowDivider, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.label, { color: colors.textMain }]}>Face ID</Text>
            <Switch
              value={faceIdEnabled}
              onValueChange={handleFaceToggle}
              disabled={!enabled || loading || !biometricsAvailable}
              trackColor={{ false: trackOffColor, true: trackOnColor }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={trackOffColor}
            />
          </View>
          {!biometricsAvailable ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {biometricsReason || 'Биометрия недоступна.'}
              </Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMain }]}>Разрешить виджеты</Text>
            <Switch
              value={widgetsEnabled}
              onValueChange={setWidgetsEnabled}
              trackColor={{ false: trackOffColor, true: trackOnColor }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={trackOffColor}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 16,
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  infoText: {
    fontSize: 13,
  },
});

export default SecurityList;