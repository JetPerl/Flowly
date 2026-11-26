import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AppState,
  AppStateStatus,
  DeviceEventEmitter,
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
import * as LocalAuthentication from 'expo-local-authentication';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppIconSvg from '../../assets/app_icon.svg';
import {
  SECURITY_CODE_LENGTH,
  SECURITY_CODE_STORAGE_KEY,
  SECURITY_BIOMETRY_STORAGE_KEY,
  SECURITY_FORCE_REAUTH_EVENT,
  SECURITY_IDLE_TIMEOUT_MS,
  sanitizeSecurityCode,
} from '../securityCode';
import { buildFlowlyPalette } from '../theme/backdropPalette';

type SecurityCodeContextValue = {
  enabled: boolean;
  locked: boolean;
  loading: boolean;
  enable: (code: string) => Promise<void>;
  disable: () => Promise<void>;
  unlock: (code: string) => Promise<boolean>;
  markActivity: () => void;
  biometricsEnabled: boolean;
  biometricsAvailable: boolean;
  biometricsReason?: string;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  tryBiometricUnlock: (manual?: boolean) => Promise<boolean>;
};

const SecurityCodeContext = createContext<SecurityCodeContextValue | undefined>(undefined);

export const useSecurityCode = (): SecurityCodeContextValue => {
  const ctx = useContext(SecurityCodeContext);
  if (!ctx) {
    throw new Error('useSecurityCode must be used within SecurityCodeProvider');
  }
  return ctx;
};

const LINEAR_POSITIONS = [0, 0.26, 0.54, 0.8, 1];
const RADIAL_POSITIONS = [0, 0.48, 1];

export const SecurityCodeProvider = ({ children }: { children: ReactNode }) => {
  const [storedCode, setStoredCode] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsReason, setBiometricsReason] = useState<string | undefined>(undefined);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const biometricAttemptedRef = useRef(false);
  const backgroundedAtRef = useRef<number | null>(null);
  const autoBiometricAllowedRef = useRef(true);

  const evaluateBiometricsAvailability = useCallback(async () => {
    try {
      const [hw, enrolled, types] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      const faceConst =
        (LocalAuthentication as any).AuthenticationType?.FACIAL_RECOGNITION ??
        (LocalAuthentication as any).AuthenticationType?.FACIAL;
      const hasType =
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) ||
        (faceConst ? types.includes(faceConst) : false);
      const available = hw && enrolled && (hasType || types.length === 0);
      if (!available) {
        let reason = 'Биометрия недоступна';
        if (!hw) reason = 'На устройстве нет Face ID / Touch ID';
        else if (!hasType) reason = 'Тип биометрии не поддерживается';
        else if (!enrolled) reason = 'Биометрия не настроена в системе';
        setBiometricsReason(reason);
      } else {
        setBiometricsReason(undefined);
      }
      setBiometricsAvailable(available);
      return available;
    } catch (e) {
      console.warn('Biometric availability error', e);
      setBiometricsReason('Не найден нативный модуль биометрии. Пересоберите dev‑client.');
      setBiometricsAvailable(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(SECURITY_CODE_STORAGE_KEY);
        const savedBiometry = await AsyncStorage.getItem(SECURITY_BIOMETRY_STORAGE_KEY);
        const available = await evaluateBiometricsAvailability();
        if (saved) {
          setStoredCode(saved);
          setLocked(true);
          lastInteractionRef.current = Date.now();
        }
        if (savedBiometry === '1' && available) {
          setBiometricsEnabled(true);
        }
      } catch (e) {
        console.warn('Security code load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [evaluateBiometricsAvailability]);

  const clearTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  const scheduleInactivityLock = useCallback(() => {
    clearTimer();
    if (!storedCode || locked) return;
    inactivityTimer.current = setTimeout(() => setLocked(true), SECURITY_IDLE_TIMEOUT_MS);
  }, [clearTimer, storedCode, locked]);

  const enable = useCallback(
    async (code: string) => {
      const normalized = sanitizeSecurityCode(code);
      if (normalized.length !== SECURITY_CODE_LENGTH) return;
      try {
        await AsyncStorage.setItem(SECURITY_CODE_STORAGE_KEY, normalized);
        setStoredCode(normalized);
        setLocked(false);
        lastInteractionRef.current = Date.now();
        scheduleInactivityLock();
      } catch (e) {
        console.warn('Security code save error', e);
      }
    },
    [scheduleInactivityLock],
  );

  const disable = useCallback(async () => {
    setLocked(false);
    setStoredCode(null);
    clearTimer();
    setBiometricsEnabled(false);
    try {
      await AsyncStorage.removeItem(SECURITY_BIOMETRY_STORAGE_KEY);
    } catch (e) {
      console.warn('Security biometry clear error', e);
    }
    try {
      await AsyncStorage.removeItem(SECURITY_CODE_STORAGE_KEY);
    } catch (e) {
      console.warn('Security code clear error', e);
    }
  }, [clearTimer]);

  const markActivity = useCallback(() => {
    if (!storedCode || locked) return;
    lastInteractionRef.current = Date.now();
    scheduleInactivityLock();
  }, [locked, scheduleInactivityLock, storedCode]);

  const unlock = useCallback(
    async (value: string) => {
      if (!storedCode) return true;
      const normalized = sanitizeSecurityCode(value);
      const ok = normalized === storedCode;
      if (ok) {
        setLocked(false);
        lastInteractionRef.current = Date.now();
        scheduleInactivityLock();
      }
      return ok;
    },
    [scheduleInactivityLock, storedCode],
  );

  const setBiometry = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const available = await evaluateBiometricsAvailability();
        if (!available) {
          setBiometricsEnabled(false);
          await AsyncStorage.removeItem(SECURITY_BIOMETRY_STORAGE_KEY);
          return;
        }
      }
      setBiometricsEnabled(enabled);
      try {
        if (enabled) {
          await AsyncStorage.setItem(SECURITY_BIOMETRY_STORAGE_KEY, '1');
        } else {
          await AsyncStorage.removeItem(SECURITY_BIOMETRY_STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Security biometry persist error', e);
      }
    },
    [evaluateBiometricsAvailability],
  );

  const tryBiometricUnlock = useCallback(
    async (manual = false) => {
      if (!biometricsEnabled || !biometricsAvailable || !locked || biometricBusy) return false;
      setBiometricBusy(true);
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Вход по биометрии',
          fallbackLabel: 'Использовать код',
          cancelLabel: 'Отмена',
          disableDeviceFallback: true,
          requireConfirmation: false,
        });
        if (result.success) {
          setLocked(false);
          lastInteractionRef.current = Date.now();
          scheduleInactivityLock();
          return true;
        }
        if (!manual) {
          autoBiometricAllowedRef.current = false;
        }
        return false;
      } catch (e) {
        console.warn('Biometric unlock error', e);
        if (!manual) {
          autoBiometricAllowedRef.current = false;
        }
        return false;
      } finally {
        setBiometricBusy(false);
      }
    },
    [
      biometricBusy,
      biometricsAvailable,
      biometricsEnabled,
      locked,
      scheduleInactivityLock,
    ],
  );

  useEffect(() => {
    biometricAttemptedRef.current = false;
  }, [locked]);

  useEffect(() => {
    if (locked && biometricsEnabled && biometricsAvailable && !biometricAttemptedRef.current) {
      if (autoBiometricAllowedRef.current) {
        biometricAttemptedRef.current = true;
        void tryBiometricUnlock();
      }
    }
  }, [biometricsAvailable, biometricsEnabled, locked, tryBiometricUnlock]);

  useEffect(() => {
    scheduleInactivityLock();
    return clearTimer;
  }, [clearTimer, scheduleInactivityLock]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(SECURITY_FORCE_REAUTH_EVENT, () => {
      if (!storedCode) return;
      clearTimer();
      setLocked(true);
      biometricAttemptedRef.current = false;
      autoBiometricAllowedRef.current = true;
    });
    return () => sub.remove();
  }, [clearTimer, storedCode]);

  useEffect(() => {
    const onAppStateChange = (next: AppStateStatus) => {
      if (!storedCode) return;
      const handleActive = async () => {
        const available = await evaluateBiometricsAvailability();
        if (next !== 'active') {
          lastInteractionRef.current = Date.now();
          backgroundedAtRef.current = Date.now();
          clearTimer();
          return;
        }
        const backgroundDuration = backgroundedAtRef.current
          ? Date.now() - backgroundedAtRef.current
          : 0;
        backgroundedAtRef.current = null;
        const idleDuration = Date.now() - lastInteractionRef.current;
        const shouldLock =
          idleDuration >= SECURITY_IDLE_TIMEOUT_MS ||
          backgroundDuration >= SECURITY_IDLE_TIMEOUT_MS;
        if (shouldLock) {
          setLocked(true);
          clearTimer();
          biometricAttemptedRef.current = false;
          autoBiometricAllowedRef.current = true;
        } else if (!locked) {
          lastInteractionRef.current = Date.now();
          scheduleInactivityLock();
        }
        if (
          locked &&
          available &&
          biometricsEnabled &&
          !biometricBusy &&
          autoBiometricAllowedRef.current
        ) {
          biometricAttemptedRef.current = false;
          void tryBiometricUnlock();
        }
      };
      void handleActive();
    };
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, [
    biometricsEnabled,
    biometricBusy,
    clearTimer,
    evaluateBiometricsAvailability,
    locked,
    scheduleInactivityLock,
    storedCode,
    tryBiometricUnlock,
  ]);

  const handleTouch = useCallback(() => {
    markActivity();
    return false;
  }, [markActivity]);

  const ctxValue = useMemo<SecurityCodeContextValue>(
    () => ({
      enabled: Boolean(storedCode),
      locked: Boolean(storedCode) && locked,
      loading,
      enable,
      disable,
      unlock,
      markActivity,
      biometricsEnabled,
      biometricsAvailable,
      biometricsReason,
      setBiometricsEnabled: setBiometry,
      tryBiometricUnlock,
    }),
    [
      biometricsAvailable,
      biometricsEnabled,
      biometricsReason,
      disable,
      enable,
      loading,
      locked,
      markActivity,
      setBiometry,
      storedCode,
      tryBiometricUnlock,
      unlock,
    ],
  );

  return (
    <SecurityCodeContext.Provider value={ctxValue}>
      <View
        style={styles.fill}
        onStartShouldSetResponderCapture={handleTouch}
        onTouchStart={handleTouch}
      >
        {children}
        {!loading && locked && storedCode ? (
          <LockOverlay
            onUnlock={unlock}
            biometricsEnabled={biometricsEnabled && biometricsAvailable}
            onBiometricUnlock={tryBiometricUnlock}
            biometricBusy={biometricBusy}
          />
        ) : null}
      </View>
    </SecurityCodeContext.Provider>
  );
};

const LockOverlay = ({
  onUnlock,
  biometricsEnabled,
  onBiometricUnlock,
  biometricBusy,
}: {
  onUnlock: (code: string) => Promise<boolean>;
  biometricsEnabled: boolean;
  onBiometricUnlock: (manual?: boolean) => Promise<boolean>;
  biometricBusy: boolean;
}) => {
  const colorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const palette = useMemo(() => buildFlowlyPalette('emerald', colorScheme), [colorScheme]);

  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<any>(null);

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
    setError(false);
    setCode(sanitizeSecurityCode(value));
  }, []);

  const handleDigit = useCallback((digit: string) => {
    setError(false);
    setCode((prev) => sanitizeSecurityCode(prev + digit));
  }, []);

  const handleBackspace = useCallback(() => {
    setError(false);
    setCode((prev) => prev.slice(0, -1));
  }, []);

  const handleKeyPress = useCallback(
    ({ nativeEvent }: { nativeEvent: { key: string } }) => {
      if (nativeEvent.key === 'Backspace') {
        handleBackspace();
        return;
      }
      if (/^\d$/.test(nativeEvent.key)) {
        handleDigit(nativeEvent.key);
      }
    },
    [handleBackspace, handleDigit],
  );

  const handleSubmit = useCallback(async () => {
    if (code.length !== SECURITY_CODE_LENGTH) return;
    const ok = await onUnlock(code);
    if (!ok) {
      setError(true);
      setCode('');
      inputRef.current?.focus();
    }
  }, [code, onUnlock]);

  useEffect(() => {
    if (code.length === SECURITY_CODE_LENGTH) {
      handleSubmit();
    }
  }, [code, handleSubmit]);

  const handleBiometric = useCallback(async () => {
    await onBiometricUnlock(true);
  }, [onBiometricUnlock]);

  const errorColor = palette.isDark ? '#F87171' : '#EF4444';
  const keyPressedBg = palette.isDark
    ? 'rgba(255, 255, 255, 0.18)'
    : 'rgba(255, 255, 255, 0.94)';
  const cellActiveBg = palette.isDark
    ? 'rgba(255, 255, 255, 0.16)'
    : 'rgba(255, 255, 255, 0.92)';

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['back', '0', 'face'],
  ];

  return (
    <View style={[styles.overlay, { backgroundColor: palette.baseSurface }]}>
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

      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.fill}
        >
          <View style={styles.lockCenter}>
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.appIcon,
                  {
                    backgroundColor: palette.glassSurface,
                    borderColor: palette.glassBorder,
                  },
                ]}
              >
                <AppIconSvg width={36} height={36} />
              </View>
              <View>
                <Text style={[styles.greeting, { color: palette.heroTextMain }]}>
                  Добрый день, Илья!
                </Text>
                <Text style={[styles.greetingName, { color: palette.heroTextSecondary }]}>
                  Flowly
                </Text>
              </View>
            </View>

            <View style={styles.codeSection}>
              <Text style={[styles.prompt, { color: palette.heroTextSecondary }]}>
                Введите пароль
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
                            backgroundColor: active ? cellActiveBg : palette.glassSurface,
                            borderColor: error
                              ? errorColor
                              : active
                                ? palette.primary
                                : palette.glassBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.codeCellText, { color: palette.heroTextMain }]}
                        >
                          {filled ? '•' : ''}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>
            </View>

            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleChange}
              keyboardType="number-pad"
              onKeyPress={handleKeyPress}
              autoFocus={false}
              textContentType="oneTimeCode"
              returnKeyType="done"
              maxLength={SECURITY_CODE_LENGTH}
              secureTextEntry
              caretHidden
              showSoftInputOnFocus={false}
              editable={false}
              focusable={false}
              style={styles.hiddenInput}
              onSubmitEditing={handleSubmit}
            />

            <View style={styles.keypad}>
              {keypad.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.keypadRow}>
                  {row.map((key) => {
                    if (key === 'back') {
                      return (
                        <Pressable
                          key={key}
                          style={({ pressed }) => [
                            styles.keyBtn,
                            {
                              backgroundColor: pressed ? keyPressedBg : palette.glassSurface,
                              borderColor: palette.glassBorder,
                            },
                          ]}
                          onPress={handleBackspace}
                          disabled={code.length === 0}
                        >
                          <Ionicons
                            name="backspace-outline"
                            size={24}
                            color={palette.heroTextMain}
                            style={{ opacity: code.length === 0 ? 0.35 : 1 }}
                          />
                        </Pressable>
                      );
                    }
                    if (key === 'face') {
                      return (
                        <Pressable
                          key={key}
                          style={({ pressed }) => [
                            styles.keyBtn,
                            {
                              backgroundColor: pressed ? keyPressedBg : palette.glassSurface,
                              borderColor: palette.glassBorder,
                            },
                            biometricBusy && styles.buttonDisabled,
                          ]}
                          onPress={handleBiometric}
                          disabled={!biometricsEnabled || biometricBusy}
                        >
                          <Ionicons
                            name="scan-outline"
                            size={26}
                            color={palette.heroTextMain}
                            style={{ opacity: biometricsEnabled ? 1 : 0.35 }}
                          />
                        </Pressable>
                      );
                    }
                    return (
                      <Pressable
                        key={key}
                        style={({ pressed }) => [
                          styles.keyBtn,
                          {
                            backgroundColor: pressed ? keyPressedBg : palette.glassSurface,
                            borderColor: palette.glassBorder,
                          },
                        ]}
                        onPress={() => handleDigit(key)}
                        disabled={code.length >= SECURITY_CODE_LENGTH}
                      >
                        <Text style={[styles.keyText, { color: palette.heroTextMain }]}>
                          {key}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {biometricsEnabled ? (
              <Pressable
                style={[styles.biometricBtn, biometricBusy && styles.buttonDisabled]}
                onPress={handleBiometric}
                disabled={biometricBusy}
              >
                <Text style={[styles.biometricText, { color: palette.primary }]}>
                  {biometricBusy ? 'Проверяем...' : 'Войти по Face ID / Touch ID'}
                </Text>
              </Pressable>
            ) : null}

            {error ? (
              <Text style={[styles.errorText, { color: errorColor }]}>
                Неверный код. Попробуйте еще раз.
              </Text>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 99,
  },
  lockCenter: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    paddingTop: 48,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
  },
  greetingName: {
    fontSize: 16,
  },
  codeSection: {
    width: '100%',
    gap: 10,
    marginTop: 18,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '600',
  },
  codeWrap: {
    alignItems: 'flex-start',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeCell: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellText: {
    fontSize: 24,
    fontWeight: '700',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.01,
    height: 60,
    width: '100%',
    padding: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  biometricBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
  },
  keypad: {
    width: '100%',
    marginTop: 40,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  keyBtn: {
    flex: 1,
    height: 68,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '700',
  },
});