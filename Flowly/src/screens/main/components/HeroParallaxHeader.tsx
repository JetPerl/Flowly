import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import {
    cancelAnimation,
    Easing,
    interpolateColor,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import {
    Canvas,
    LinearGradient,
    RadialGradient,
    Rect,
    vec,
} from '@shopify/react-native-skia';
import type { FlowlyThemePalette } from '../../../theme/backdropPalette';

type HeroParallaxHeaderProps = {
    scrollY: Animated.Value;
    palettes: FlowlyThemePalette[];
    slideProgress: SharedValue<number>;
    height: number;
    fadeDistance?: number;
    /** Минимальная непрозрачность градиента внизу скролла (0.04–0.12) */
    minOpacity?: number;
    /** Плавный «живой» перелив световых пятен на GPU (по умолчанию включён) */
    animateShimmer?: boolean;
};

type BackdropStops = {
    grad: [string, string, string, string, string];
    glow1: [string, string, string];
    glow2: [string, string, string];
    glow3: [string, string, string];
};

const LINEAR_POSITIONS = [0, 0.26, 0.54, 0.8, 1];
const RADIAL_POSITIONS = [0, 0.48, 1];

const toBackdropStops = (palettes: FlowlyThemePalette[]): BackdropStops[] =>
    palettes.map((p) => ({
        grad: p.gradientColors,
        glow1: p.glowPrimaryColors,
        glow2: p.glowSecondaryColors,
        glow3: p.glowAccentColors,
    }));

function sampleStops(
    stops: BackdropStops[],
    key: keyof BackdropStops,
    progress: number,
): string[] {
    'worklet';
    const len = stops.length;
    if (len === 0) return [];

    const clamped = Math.max(0, Math.min(progress, len - 1));
    const lo = Math.floor(clamped);
    const hi = Math.min(lo + 1, len - 1);
    const t = clamped - lo;

    const a = stops[lo][key];
    const b = stops[hi][key];
    if (lo === hi || t <= 0.001) return a;
    if (t >= 0.999) return b;

    const out: string[] = [];
    for (let i = 0; i < a.length; i++) {
        out.push(interpolateColor(t, [0, 1], [a[i], b[i]]));
    }
    return out;
}

function blendColorArrays(a: string[], b: string[], t: number): string[] {
    'worklet';
    if (t >= 0.999 || a.length !== b.length) return b;
    if (t <= 0.001) return a;

    const out: string[] = [];
    for (let i = 0; i < a.length; i++) {
        out.push(interpolateColor(t, [0, 1], [a[i], b[i]]));
    }
    return out;
}

export const HeroParallaxHeader: React.FC<HeroParallaxHeaderProps> = ({
    scrollY,
    palettes,
    slideProgress,
    height,
    fadeDistance = 560,
    minOpacity = 0.08,
    animateShimmer = true,
}) => {
    const { width } = useWindowDimensions();

    const stops = useMemo(() => toBackdropStops(palettes), [palettes]);
    const signature = useMemo(
        () => palettes.map((p) => `${p.isDark}:${p.preset}`).join('|'),
        [palettes],
    );

    const fromStops = useSharedValue<BackdropStops[]>(stops);
    const toStops = useSharedValue<BackdropStops[]>(stops);
    const themeProgress = useSharedValue(1);
    const lastSignatureRef = useRef(signature);

    useEffect(() => {
        if (signature === lastSignatureRef.current) return;
        lastSignatureRef.current = signature;

        fromStops.value = toStops.value;
        toStops.value = stops;
        themeProgress.value = 0;
        themeProgress.value = withTiming(1, {
            duration: 240,
            easing: Easing.out(Easing.cubic),
        });
    }, [signature, stops, fromStops, toStops, themeProgress]);

    const driftA = useSharedValue(0);
    const driftB = useSharedValue(0);

    useEffect(() => {
        if (!animateShimmer) {
            cancelAnimation(driftA);
            cancelAnimation(driftB);
            driftA.value = 0;
            driftB.value = 0;
            return;
        }

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
    }, [animateShimmer, driftA, driftB]);

    const glow1Center = useDerivedValue(() =>
        vec(width * 0.84 - driftA.value * 36, -height * 0.03 + driftB.value * 26),
    );

    const glow2Center = useDerivedValue(() =>
        vec(width * 0.1 + driftB.value * 34, height * 0.12 - driftA.value * 22),
    );

    const glow3Center = useDerivedValue(() =>
        vec(
            width * 0.48 + (driftA.value - 0.5) * 44,
            height * 0.24 + (driftB.value - 0.5) * 28,
        ),
    );

    const gradientColors = useDerivedValue<string[]>(() => {
        const target = sampleStops(toStops.value, 'grad', slideProgress.value);
        const tp = themeProgress.value;
        if (tp >= 0.999) return target;
        const prev = sampleStops(fromStops.value, 'grad', slideProgress.value);
        return blendColorArrays(prev, target, tp);
    });

    const glowPrimaryColors = useDerivedValue<string[]>(() => {
        const target = sampleStops(toStops.value, 'glow1', slideProgress.value);
        const tp = themeProgress.value;
        if (tp >= 0.999) return target;
        const prev = sampleStops(fromStops.value, 'glow1', slideProgress.value);
        return blendColorArrays(prev, target, tp);
    });

    const glowSecondaryColors = useDerivedValue<string[]>(() => {
        const target = sampleStops(toStops.value, 'glow2', slideProgress.value);
        const tp = themeProgress.value;
        if (tp >= 0.999) return target;
        const prev = sampleStops(fromStops.value, 'glow2', slideProgress.value);
        return blendColorArrays(prev, target, tp);
    });

    const glowAccentColors = useDerivedValue<string[]>(() => {
        const target = sampleStops(toStops.value, 'glow3', slideProgress.value);
        const tp = themeProgress.value;
        if (tp >= 0.999) return target;
        const prev = sampleStops(fromStops.value, 'glow3', slideProgress.value);
        return blendColorArrays(prev, target, tp);
    });

    // Первые 25% скролла цвет почти не тускнеет, затем плавно уходит до minOpacity
    const scrollOpacity = scrollY.interpolate({
        inputRange: [0, fadeDistance * 0.25, fadeDistance * 0.65, fadeDistance],
        outputRange: [1, 0.92, 0.42, minOpacity],
        extrapolate: 'clamp',
    });

    const scale = scrollY.interpolate({
        inputRange: [-height, 0, fadeDistance],
        outputRange: [1.3, 1, 1],
        extrapolateLeft: 'extend',
        extrapolateRight: 'clamp',
    });

    // Ограничиваем сдвиг вверх (-90 px), чтобы остаточный оттенок не уходил за край экрана
    const translateY = scrollY.interpolate({
        inputRange: [-height, 0, fadeDistance],
        outputRange: [height * 0.15, 0, -90],
        extrapolateLeft: 'extend',
        extrapolateRight: 'clamp',
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.backdrop,
                {
                    height,
                    opacity: scrollOpacity,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            <Canvas style={{ width, height }}>
                <Rect x={0} y={0} width={width} height={height}>
                    <LinearGradient
                        start={vec(width * 0.12, 0)}
                        end={vec(width * 0.88, height)}
                        colors={gradientColors}
                        positions={LINEAR_POSITIONS}
                    />
                </Rect>

                <Rect x={0} y={0} width={width} height={height}>
                    <RadialGradient
                        c={glow1Center}
                        r={width * 1.12}
                        colors={glowPrimaryColors}
                        positions={RADIAL_POSITIONS}
                    />
                </Rect>

                <Rect x={0} y={0} width={width} height={height}>
                    <RadialGradient
                        c={glow2Center}
                        r={width * 0.92}
                        colors={glowSecondaryColors}
                        positions={RADIAL_POSITIONS}
                    />
                </Rect>

                <Rect x={0} y={0} width={width} height={height}>
                    <RadialGradient
                        c={glow3Center}
                        r={width * 0.78}
                        colors={glowAccentColors}
                        positions={RADIAL_POSITIONS}
                    />
                </Rect>
            </Canvas>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
});