import React from 'react';
import {
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../theme/useThemeColors';

type Props = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
};

export const SurfaceCard: React.FC<Props> = ({
    children,
    style,
    contentStyle,
}) => {
    const colors = useThemeColors();

    const gradientColors = colors.isDark
        ? (['rgba(255, 255, 255, 0.085)', 'rgba(255, 255, 255, 0.04)'] as const)
        : (['rgba(255, 255, 255, 0.78)', 'rgba(255, 255, 255, 0.62)'] as const);

    return (
        <View
            style={[
                styles.outer,
                colors.isDark ? styles.outerDark : styles.outerLight,
                style,
            ]}
        >
            <View style={styles.innerClip}>
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />
                <View style={contentStyle}>{children}</View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outer: {
        borderRadius: 24,
        borderWidth: StyleSheet.hairlineWidth,
    },
    outerDark: {
        backgroundColor: 'rgba(18, 22, 32, 0.42)',
        borderColor: 'rgba(255, 255, 255, 0.09)',
    },
    outerLight: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(15, 23, 42, 0.08)',
    },
    innerClip: {
        borderRadius: 24,
        overflow: 'hidden',
    },
});

export default SurfaceCard;