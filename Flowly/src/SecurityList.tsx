import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSecurityCode } from './security/SecurityCodeProvider';

const PRIMARY = '#2BAF8C';
const BORDER = '#E5E7EB';
const TEXT_MAIN = '#111827';

const SecurityList = () => {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: 'Безопасность',
          headerTransparent: true,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.listCard}>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.label}>Защитный код</Text>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              disabled={loading}
              trackColor={{ false: '#C8CDD3', true: PRIMARY }}
              thumbColor="#fff"
              ios_backgroundColor="#C8CDD3"
            />
          </View>

          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.label}>Face ID</Text>
            <Switch
              value={faceIdEnabled}
              onValueChange={handleFaceToggle}
              disabled={!enabled || loading || !biometricsAvailable}
              trackColor={{ false: '#C8CDD3', true: PRIMARY }}
              thumbColor="#fff"
              ios_backgroundColor="#C8CDD3"
            />
          </View>
          {!biometricsAvailable ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>{biometricsReason || 'Биометрия недоступна.'}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={styles.label}>Разрешить виджеты</Text>
            <Switch
              value={widgetsEnabled}
              onValueChange={setWidgetsEnabled}
              trackColor={{ false: '#C8CDD3', true: PRIMARY }}
              thumbColor="#fff"
              ios_backgroundColor="#C8CDD3"
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
    backgroundColor: '#fff',
  },
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  listCard: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  label: {
    fontSize: 16,
    color: TEXT_MAIN,
  },
  infoRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default SecurityList;
