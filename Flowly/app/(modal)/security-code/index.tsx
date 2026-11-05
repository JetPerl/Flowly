import React, { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SECURITY_CODE_LENGTH, sanitizeSecurityCode } from '../../../src/securityCode';
import { useSecurityCode } from '../../../src/security/SecurityCodeProvider';

const PRIMARY = '#2BAF8C';
const TEXT_MAIN = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER = '#E5E7EB';
const BACKGROUND = require('../../../assets/background.jpg');

export default function SecurityCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<any>(null);
  const { enable } = useSecurityCode();

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (value: string) => {
    setCode(sanitizeSecurityCode(value));
  };

  const handleComplete = async () => {
    if (code.length !== SECURITY_CODE_LENGTH || saving) return;
    setSaving(true);
    try {
      await enable(code);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <Stack.Screen
          options={{
            title: 'Защитный код',
            headerTransparent: true,
            headerShown: true,
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.fill}
        >
          <View style={styles.center}>
            <View style={styles.card}>
              <Text style={styles.title}>Введите защитный код</Text>
              <Text style={styles.subtitle}>
                Придумайте 4-значный код для блокировки приложения. Держите его в секрете.
              </Text>

              <Pressable style={styles.codeWrap} onPress={() => inputRef.current?.focus()}>
                <View style={styles.codeRow}>
                  {Array.from({ length: SECURITY_CODE_LENGTH }).map((_, idx) => {
                    const filled = idx < code.length;
                    const active = idx === code.length;
                    return (
                      <View key={idx} style={[styles.codeCell, active && styles.codeCellActive]}>
                        <Text style={styles.codeCellText}>{filled ? '•' : ''}</Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>

              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={handleChange}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                returnKeyType="done"
                maxLength={SECURITY_CODE_LENGTH}
                secureTextEntry
                autoFocus
                style={styles.hiddenInput}
                onSubmitEditing={handleComplete}
              />

              <View style={styles.actions}>
                <Pressable
                  style={[
                    styles.buttonPrimary,
                    (code.length !== SECURITY_CODE_LENGTH || saving) && styles.buttonDisabled,
                  ]}
                  disabled={code.length !== SECURITY_CODE_LENGTH || saving}
                  onPress={handleComplete}
                >
                  <Text style={styles.buttonPrimaryText}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Text>
                </Pressable>
                <Pressable style={styles.buttonGhost} onPress={() => router.back()}>
                  <Text style={styles.buttonGhostText}>Отмена</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 20,
    borderRadius: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  codeWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeCell: {
    width: 62,
    height: 62,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  codeCellActive: {
    borderColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  codeCellText: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
    padding: 0,
  },
  actions: {
    marginTop: 12,
    gap: 12,
  },
  buttonPrimary: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonGhost: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  buttonGhostText: {
    color: TEXT_MAIN,
    fontSize: 15,
    fontWeight: '600',
  },
});
