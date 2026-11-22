import React from 'react';
import { Animated, ImageSourcePropType, StyleSheet, View } from 'react-native';

type HeroParallaxHeaderProps = {
    scrollY: Animated.Value;
    imageSource: ImageSourcePropType;
    height: number;
    children?: React.ReactNode;
};

export const HeroParallaxHeader: React.FC<HeroParallaxHeaderProps> = ({
    scrollY,
    imageSource,
    height,
    children,
}) => {
    return (
        <View style={[styles.heroWrapper, { height }]}>
            <Animated.Image
                source={imageSource}
                style={[
                    styles.heroImage,
                    {
                        height,
                        transform: [
                            {
                                translateY: scrollY.interpolate({
                                    inputRange: [-height, 0],
                                    outputRange: [-height / 2, 0],
                                    extrapolateLeft: 'extend',
                                    extrapolateRight: 'clamp',
                                }),
                            },
                            {
                                scale: scrollY.interpolate({
                                    inputRange: [-height, 0],
                                    outputRange: [2, 1],
                                    extrapolateLeft: 'extend',
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ],
                    },
                ]}
                resizeMode="cover"
            />
            <View style={[styles.headerContainer, { paddingTop: 120 }]}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    heroWrapper: {
        marginHorizontal: -16,
        backgroundColor: 'transparent',
        overflow: 'visible',
    },
    heroImage: {
        ...StyleSheet.absoluteFill,
        width: '100%',
    },
    headerContainer: {
        flex: 1,
        paddingBottom: 5,
        marginBottom: 0,
    },
});