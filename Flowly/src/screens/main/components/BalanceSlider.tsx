import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Reanimated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    type SharedValue,
} from 'react-native-reanimated';
import AntDesign from '@expo/vector-icons/AntDesign';
import type { FlowlyThemePalette } from '../../../theme/backdropPalette';
import { useThemeColors } from '../../../theme/useThemeColors';

export type BalanceSlide = {
    key: string;
    title: string;
    currency: string;
    balance: number | null;
    accountId: number | null;
    color?: string | null;
    isAdd?: boolean;
};

type Totals = {
    income: number;
    expense: number;
    currency: string;
};

type BalanceSliderProps = {
    slides: BalanceSlide[];
    activeIndex: number;
    slideProgress: SharedValue<number>;
    onSelectSlide: (index: number, accountId: number | null) => void;
    onAddAccountPress: () => void;
    historyTotals: {
        all: Totals;
        perAccount: Record<number, Totals>;
    };
    formatCurrency: (value: number, withSymbol?: boolean, currency?: string) => string;
    getCurrencySymbol: (code?: string | null) => string;
    palette: FlowlyThemePalette;
};

const IndicatorDot: React.FC<{
    index: number;
    slideProgress: SharedValue<number>;
    accentColor: string;
    onPress: () => void;
}> = ({ index, slideProgress, accentColor, onPress }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            slideProgress.value,
            [index - 1, index, index + 1],
            [0.3, 1, 0.3],
            Extrapolation.CLAMP,
        );
        const scale = interpolate(
            slideProgress.value,
            [index - 1, index, index + 1],
            [0.9, 1.15, 0.9],
            Extrapolation.CLAMP,
        );
        return {
            opacity,
            transform: [{ scale }],
        };
    });

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Reanimated.View
                style={[styles.dot, { backgroundColor: accentColor }, animatedStyle]}
            />
        </TouchableOpacity>
    );
};

export const BalanceSlider: React.FC<BalanceSliderProps> = ({
    slides,
    activeIndex,
    slideProgress,
    onSelectSlide,
    onAddAccountPress,
    historyTotals,
    formatCurrency,
    getCurrencySymbol,
    palette,
}) => {
    const colors = useThemeColors();
    const [sliderWidth, setSliderWidth] = useState(Dimensions.get('window').width);
    const sliderRef = useRef<FlatList<BalanceSlide>>(null);

    const itemWidth = useMemo(() => Math.max(sliderWidth, 1), [sliderWidth]);
    const itemWidthShared = useSharedValue(itemWidth);

    useEffect(() => {
        itemWidthShared.value = itemWidth;
    }, [itemWidth, itemWidthShared]);

    const maxSliderOffset = useMemo(
        () => Math.max((slides.length - 1) * itemWidth, 0),
        [itemWidth, slides.length],
    );

    // Рефы для стабильного onViewableItemsChanged (требование FlatList)
    const slidesRef = useRef(slides);
    slidesRef.current = slides;
    const activeIndexRef = useRef(activeIndex);
    activeIndexRef.current = activeIndex;
    const onSelectSlideRef = useRef(onSelectSlide);
    onSelectSlideRef.current = onSelectSlide;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 55,
    }).current;

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
            const first = viewableItems[0];
            if (first?.index === null || first?.index === undefined) return;
            const nextIdx = first.index;
            if (nextIdx !== activeIndexRef.current) {
                const target = slidesRef.current[nextIdx];
                if (target) {
                    onSelectSlideRef.current(nextIdx, target.accountId ?? null);
                }
            }
        },
    ).current;

    useEffect(() => {
        if (!slides.length) return;
        if (activeIndex > slides.length - 1) {
            onSelectSlide(0, slides[0]?.accountId ?? null);
            slideProgress.value = 0;
        }
    }, [activeIndex, onSelectSlide, slideProgress, slides]);

    const handleLayout = useCallback(
        (e: LayoutChangeEvent) => {
            const layoutWidth = e?.nativeEvent?.layout?.width || 0;
            const screenWidth = Dimensions.get('window').width || 0;
            const width = Math.max(layoutWidth, screenWidth);
            if (width && width !== sliderWidth) {
                setSliderWidth(width);
            }
        },
        [sliderWidth],
    );

    const scrollToSlide = useCallback(
        (index: number) => {
            const bounded = Math.max(0, Math.min(index, slides.length - 1));
            const clamped = Math.max(0, Math.min(bounded * itemWidth, maxSliderOffset));
            onSelectSlide(bounded, slides[bounded]?.accountId ?? null);
            sliderRef.current?.scrollToOffset({ offset: clamped, animated: true });
        },
        [itemWidth, maxSliderOffset, onSelectSlide, slides],
    );

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            const w = itemWidthShared.value;
            if (w > 0) {
                slideProgress.value = event.contentOffset.x / w;
            }
        },
    });

    const handleMomentumScrollEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { contentOffset, layoutMeasurement } = e.nativeEvent;
            const width = layoutMeasurement?.width || itemWidth;
            const nextIndex = Math.round(contentOffset.x / width);
            const bounded = Math.max(0, Math.min(nextIndex, slides.length - 1));
            if (bounded !== activeIndex) {
                onSelectSlide(bounded, slides[bounded]?.accountId ?? null);
            }
        },
        [activeIndex, itemWidth, onSelectSlide, slides],
    );

    const renderSlide = useCallback(
        ({ item }: { item: BalanceSlide }) => {
            if (item.isAdd) {
                return (
                    <View style={{ width: itemWidth }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                                styles.addCard,
                                {
                                    backgroundColor: palette.glassSurface,
                                },
                            ]}
                            onPress={onAddAccountPress}
                        >
                            <AntDesign name="plus-circle" size={48} color={palette.textMain} />
                        </TouchableOpacity>
                    </View>
                );
            }

            const balanceLabel =
                item.balance === null || item.balance === undefined
                    ? `— ${getCurrencySymbol(item.currency)}`
                    : formatCurrency(item.balance, true, item.currency);

            const totals =
                item.accountId === null
                    ? historyTotals.all
                    : historyTotals.perAccount[item.accountId] || null;

            const incomeLabel = totals
                ? `+ ${formatCurrency(Math.abs(totals.income), true, totals.currency)}`
                : '—';
            const expenseLabel = totals
                ? `− ${formatCurrency(Math.abs(totals.expense), true, totals.currency)}`
                : '—';

            return (
                <View style={{ width: itemWidth }}>
                    <View
                        style={[
                            styles.balanceCardInner,
                            {
                                backgroundColor: palette.glassSurface,
                            },
                        ]}
                    >
                        <View style={styles.balanceCardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.balanceTitle, { color: palette.textMain }]}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.balanceValue, { color: palette.primary }]}>
                                    {balanceLabel}
                                </Text>
                                <Text
                                    style={[
                                        styles.balanceCurrencyHint,
                                        { color: palette.textSecondary },
                                    ]}
                                >
                                    Валюта: {getCurrencySymbol(item.currency)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.balanceBottomRow}>
                            <View style={styles.balanceStat}>
                                <Text
                                    style={[
                                        styles.balanceStatLabel,
                                        { color: palette.textSecondary },
                                    ]}
                                >
                                    Доходы
                                </Text>
                                <Text
                                    style={[styles.balanceStatValue, { color: palette.textMain }]}
                                >
                                    {incomeLabel}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.balanceDivider,
                                    { backgroundColor: palette.cardBorder },
                                ]}
                            />
                            <View style={styles.balanceStat}>
                                <Text
                                    style={[
                                        styles.balanceStatLabel,
                                        { color: palette.textSecondary },
                                    ]}
                                >
                                    Расходы
                                </Text>
                                <Text
                                    style={[styles.balanceStatValue, { color: palette.textMain }]}
                                >
                                    {expenseLabel}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            );
        },
        [formatCurrency, getCurrencySymbol, historyTotals, itemWidth, onAddAccountPress, palette],
    );

    return (
        <View style={styles.wrapper} onLayout={handleLayout}>
            <Reanimated.FlatList
                ref={sliderRef}
                data={slides}
                extraData={palette}
                horizontal
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.key}
                renderItem={renderSlide}
                snapToInterval={itemWidth}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum
                initialNumToRender={slides.length}
                maxToRenderPerBatch={slides.length}
                windowSize={Math.max(slides.length * 2, 5)}
                removeClippedSubviews={false}
                onScroll={scrollHandler}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
            />

            <View style={styles.indicators}>
                {slides.map((slide, idx) => (
                    <IndicatorDot
                        key={slide.key}
                        index={idx}
                        slideProgress={slideProgress}
                        accentColor={colors.sliderDot}
                        onPress={() => scrollToSlide(idx)}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { paddingVertical: 4 },
    addCard: {
        height: 220,
        marginHorizontal: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceCardInner: {
        marginHorizontal: 16,
        borderRadius: 32,
        paddingHorizontal: 22,
        paddingVertical: 20,
    },
    balanceCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    balanceTitle: { fontSize: 16 },
    balanceValue: { fontSize: 26, fontWeight: '700', marginTop: 6 },
    balanceCurrencyHint: { fontSize: 13, marginTop: 4 },
    balanceBottomRow: {
        flexDirection: 'row',
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    balanceStat: { flex: 1 },
    balanceStatLabel: { fontSize: 14 },
    balanceStatValue: { fontSize: 17, fontWeight: '600', marginTop: 4 },
    balanceDivider: {
        width: 1,
        height: '100%',
        marginHorizontal: 14,
    },
    indicators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
    },
    dot: { width: 6, height: 6, borderRadius: 4 },
});