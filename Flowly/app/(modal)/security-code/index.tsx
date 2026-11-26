import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  LinearGradient,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { SECURITY_CODE_LENGTH, sanitizeSecurityCode } from '../../../src/securityCode';
import { useSecurityCode } from '../../../src/security/SecurityCodeProvider';
import { buildFlowlyPalette } from '../../../src/theme/backdropPalette';
import { useThemeColors } from '../../../src/theme/useThemeColors';

const LINEAR_POSITIONS = [0, 0.26, 0.54, 0.8, 1];
const RADIAL_POSITIONS = [0, 0.48, 1];

export default function SecurityCodeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const palette = useMemo(() => buildFlowlyPalette('emerald', colorScheme), [colorScheme]);
  const { width, height } = useWindowDimensions();

  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<any>(null);
  const { enable } = useSecurityCode();

  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);

  useEffect(() => {
    driftA.value = withRepeat(
      withTiming(1, { duration: 7500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    driftB.value = withRepeat(
      withTiming(1, { duration: 10500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(driftA);
      cancelAnimation(driftB);
    };
  }, [driftA, driftB]);

  const glow1Center = useDerivedValue(() =>
    vec(width * 0.84 - driftA.value * 36, -height * 0.03 + driftB.value * 26),
  );
  const glow2Center = useDerivedValue(() =>
    vec(width * 0.1 + driftB.value * 34, height * 0.16 - driftA.value * 22),
  );
  const glow3Center = useDerivedValue(() =>
    vec(
      width * 0.5 + (driftA.value - 0.5) * 44,
      height * 0.34 + (driftB.value - 0.5) * 28,
    ),
  );

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback((value: string) => {
    setCode(sanitizeSecurityCode(value));
  }, []);

  const handleComplete = useCallback(async () => {
    if (code.length !== SECURITY_CODE_LENGTH || saving) return;
    setSaving(true);
    try {
      await enable(code);
      router.back();
    } finally {
      setSaving(false);
    }
  }, [code, enable, router, saving]);

  const cardBg = colors.isDark
    ? 'rgba(21, 26, 32, 0.92)'
    : 'rgba(255, 255, 255, 0.94)';
  const cellBg = colors.isDark ? colors.elevatedSurface : '#FFFFFF';
  const primaryColor = colors.income;

  return (
    <View style={[styles.bg, { backgroundColor: palette.baseSurface }]}>
      <StatusBar barStyle={palette.isDark ? 'light-content' : 'dark-content'} />

      <Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height }]}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(width * 0.12, 0)}
            end={vec(width * 0.88, height)}
            colors={palette.gradientColors}
            positions={LINEAR_POSITIONS}
          />
        </Rect>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={glow1Center}
            r={width * 1.12}
            colors={palette.glowPrimaryColors}
            positions={RADIAL_POSITIONS}
          />
        </Rect>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={glow2Center}
            r={width * 0.92}
            colors={palette.glowSecondaryColors}
            positions={RADIAL_POSITIONS}
          />
        </Rect>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={glow3Center}
            r={width * 0.78}
            colors={palette.glowAccentColors}
            positions={RADIAL_POSITIONS}
          />
        </Rect>
      </Canvas>

      <SafeAreaView style={styles.safe}>
        <Stack.Screen
          options={{
            title: 'Защитный код',
            headerTransparent: true,
            headerShown: true,
            headerTintColor: palette.heroTextMain,
            headerTitleStyle: { color: palette.heroTextMain },
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.fill}
        >
          <View style={styles.center}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: colors.border,
                  shadowOpacity: colors.isDark ? 0 : 0.08,
                  elevation: colors.isDark ? 0 : 4,
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.textMain }]}>
                Введите защитный код
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Придумайте 4-значный код для блокировки приложения. Держите его в секрете.
              </Text>

              <Pressable style={styles.codeWrap} onPress={() => inputRef.current?.focus()}>
                <View style={styles.codeRow}>
                  {Array.from({ length: SECURITY_CODE_LENGTH }).map((_, idx) => {
                    const filled = idx < code.length;
                    const active = idx === code.length;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.codeCell,
                          {
                            backgroundColor: cellBg,
                            borderColor: active ? primaryColor : colors.border,
                          },
                          active && {
                            shadowColor: primaryColor,
                            shadowOpacity: colors.isDark ? 0 : 0.14,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: colors.isDark ? 0 : 3,
                          },
                        ]}
                      >
                        <Text style={[styles.codeCellText, { color: colors.textMain }]}>
                          {filled ? '•' : ''}
                        </Text>
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
                keyboardAppearance={colors.isDark ? 'dark' : 'light'}
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
                    { backgroundColor: primaryColor },
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
                  <Text style={[styles.buttonGhostText, { color: colors.textMain }]}>
                    Отмена
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    borderRadius: 18,
    gap: 16,
    shadowColor: '#000',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellText: {
    fontSize: 26,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '600',
  },
});