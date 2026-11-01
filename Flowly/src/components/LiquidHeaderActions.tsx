import React, { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  type StyleProp,
  type Insets,
  type ViewStyle,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

type Props = {
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  onLeftPress: () => void;
  onRightPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export type GlassButtonProps = {
  icon: React.ReactNode;
  onPress: () => void;
  hitSlop?: Insets;
  testID?: string;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BUTTON_SIZE = 44;

const useGlassDrag = (radius: number) => {
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragXAbs = useRef(new Animated.Value(0)).current;
  const dragYAbs = useRef(new Animated.Value(0)).current;

  const setDrag = useCallback(
    (x: number, y: number) => {
      const resistedX = x * 0.35;
      const resistedY = y * 0.35;

      dragX.setValue(resistedX);
      dragY.setValue(resistedY);
      dragXAbs.setValue(Math.abs(resistedX));
      dragYAbs.setValue(Math.abs(resistedY));
    },
    [dragX, dragY, dragXAbs, dragYAbs],
  );

  const bounceTo = useCallback(
    (targetX: number, targetY: number) => {
      Animated.parallel([
        Animated.spring(dragX, {
          toValue: targetX,
          useNativeDriver: true,
          friction: 8,
          tension: 140,
        }),
        Animated.spring(dragY, {
          toValue: targetY,
          useNativeDriver: true,
          friction: 8,
          tension: 140,
        }),
        Animated.spring(dragXAbs, {
          toValue: Math.abs(targetX),
          useNativeDriver: true,
          friction: 8,
          tension: 140,
        }),
        Animated.spring(dragYAbs, {
          toValue: Math.abs(targetY),
          useNativeDriver: true,
          friction: 8,
          tension: 140,
        }),
      ]).start();
    },
    [dragX, dragY, dragXAbs, dragYAbs],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 1.5 || Math.abs(gesture.dx) > 1.5,
        onPanResponderMove: (_, gesture) => {
          setDrag(gesture.dx, gesture.dy);
        },
        onPanResponderRelease: () => bounceTo(0, 0),
        onPanResponderTerminate: () => bounceTo(0, 0),
      }),
    [bounceTo, setDrag],
  );

  const scaleX = Animated.add(
    Animated.add(1, Animated.multiply(dragXAbs, 0.0008)),
    Animated.multiply(Animated.multiply(dragYAbs, 0.0003), -1),
  );
  const scaleY = Animated.add(
    Animated.add(1, Animated.multiply(dragYAbs, 0.0008)),
    Animated.multiply(Animated.multiply(dragXAbs, 0.0003), -1),
  );
  const translateX = Animated.multiply(dragX, 0.12);
  const translateY = Animated.multiply(dragY, 0.12);
  const anchorCompensationX = Animated.multiply(Animated.subtract(scaleX, 1), -radius);
  const anchorCompensationY = Animated.multiply(Animated.subtract(scaleY, 1), -radius);
  const combinedTranslateX = Animated.add(translateX, anchorCompensationX);
  const combinedTranslateY = Animated.add(translateY, anchorCompensationY);
  const iconShiftX = Animated.multiply(Animated.subtract(scaleX, 1), 8);
  const iconShiftY = Animated.multiply(Animated.subtract(scaleY, 1), 8);

  const handlePressIn = () => bounceTo(0, 14);
  const handlePressOut = () => bounceTo(0, 0);

  const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = {
    transform: [
      { translateX: combinedTranslateX },
      { translateY: combinedTranslateY },
      { scaleX },
      { scaleY },
    ],
  };

  return {
    panResponder,
    animatedStyle,
    iconShiftX,
    iconShiftY,
    handlePressIn,
    handlePressOut,
  };
};

export const GlassButton = ({
  icon,
  onPress,
  hitSlop,
  testID,
  size = BUTTON_SIZE,
  disabled = false,
  style,
}: GlassButtonProps) => {
  const radius = size / 2;
  const { panResponder, animatedStyle, iconShiftX, iconShiftY, handlePressIn, handlePressOut } =
    useGlassDrag(radius);
  const glassAvailable = useMemo(() => {
    if (Platform.OS !== 'ios') return false;
    try {
      return !!isLiquidGlassAvailable();
    } catch {
      return false;
    }
  }, []);

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        { width: size, height: size },
        disabled && styles.buttonDisabled,
        animatedStyle,
        style,
      ]}
      {...panResponder.panHandlers}
    >
      {glassAvailable ? (
        <GlassView
          style={[styles.buttonGlass, { borderRadius: radius }]}
          glassEffectStyle="regular"
          tintColor="rgba(255, 255, 255, 0.28)"
          isInteractive={false}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.action,
              { borderRadius: radius },
              disabled && styles.actionDisabled,
            ]}
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            hitSlop={hitSlop}
            onPressIn={disabled ? undefined : handlePressIn}
            onPressOut={disabled ? undefined : handlePressOut}
            testID={testID}
          >
            <Animated.View
              style={{ transform: [{ translateX: iconShiftX }, { translateY: iconShiftY }] }}
            >
              {icon}
            </Animated.View>
          </TouchableOpacity>
        </GlassView>
      ) : (
        <BlurView
          style={[styles.buttonGlass, { borderRadius: radius }]}
          blurType="light"
          blurAmount={16}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.action,
              { borderRadius: radius },
              disabled && styles.actionDisabled,
            ]}
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            hitSlop={hitSlop}
            onPressIn={disabled ? undefined : handlePressIn}
            onPressOut={disabled ? undefined : handlePressOut}
            testID={testID}
          >
            <Animated.View
              style={{ transform: [{ translateX: iconShiftX }, { translateY: iconShiftY }] }}
            >
              {icon}
            </Animated.View>
          </TouchableOpacity>
        </BlurView>
      )}
    </Animated.View>
  );
};

const LiquidHeaderActions = ({ leftIcon, rightIcon, onLeftPress, onRightPress, style }: Props) => {
  return (
    <View style={[styles.actionsRow, style]}>
      <GlassButton icon={leftIcon} onPress={onLeftPress} />
      <View style={styles.buttonSpacer} />
      <GlassButton icon={rightIcon} onPress={onRightPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: { width: 10 },
  buttonContainer: {
    height: BUTTON_SIZE,
    width: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonGlass: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: {
    opacity: 0.85,
  },
});

export default LiquidHeaderActions;
