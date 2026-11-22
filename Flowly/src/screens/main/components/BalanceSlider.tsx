import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
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
import AntDesign from '@expo/vector-icons/AntDesign';

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
    onSelectSlide: (index: number, accountId: number | null) => void;
    onAddAccountPress: () => void;
    historyTotals: {
        all: Totals;
        perAccount: Record<number, Totals>;
    };
    formatCurrency: (value: number, withSymbol?: boolean, currency?: string) => string;
    getCurrencySymbol: (code?: string | null) => string;
    accentColor?: string;
};

const CARD_MARGIN = 10;

export const BalanceSlider: React.FC<BalanceSliderProps> = ({
    slides,
    activeIndex,
    onSelectSlide,
    onAddAccountPress,
    historyTotals,
    formatCurrency,
    getCurrencySymbol,
    accentColor = '#2BAF8C',
}) => {
    const [sliderWidth, setSliderWidth] = useState(Dimensions.get('window').width);
    const sliderScrollX = useRef(new Animated.Value(0)).current;
    const sliderRef = useRef<FlatList<BalanceSlide>>(null);

    const cardWidth = useMemo(
        () => Math.max(sliderWidth - 32, sliderWidth * 0.9),
        [sliderWidth],
    );
    const itemWidth = cardWidth + CARD_MARGIN * 2;
    const listSidePadding = Math.max((sliderWidth - itemWidth) / 2, 0);
    const maxSliderOffset = useMemo(
        () => Math.max((slides.length - 1) * itemWidth, 0),
        [itemWidth, slides.length],
    );

    useEffect(() => {
        if (!slides.length) return;
        if (activeIndex > slides.length - 1) {
            onSelectSlide(0, slides[0]?.accountId ?? null);
        }
    }, [activeIndex, onSelectSlide, slides]);

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

    const handleMomentumScrollEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { contentOffset, layoutMeasurement } = e.nativeEvent;
            const width = layoutMeasurement?.width || sliderWidth || 1;
            const nextIndex = Math.round(contentOffset.x / width);
            const bounded = Math.max(0, Math.min(nextIndex, slides.length - 1));
            if (bounded !== activeIndex) {
                onSelectSlide(bounded, slides[bounded]?.accountId ?? null);
            }
        },
        [activeIndex, onSelectSlide, slides, sliderWidth],
    );

    const renderSlide = useCallback(
        ({ item }: { item: BalanceSlide }) => {
            if (item.isAdd) {
                return (
                    <View style={{ width: cardWidth, alignSelf: 'center', marginHorizontal: CARD_MARGIN }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.addCard}
                            onPress={onAddAccountPress}
                        >
                            <AntDesign name="plus-circle" size={48} color="#212121" />
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
                <View style={{ width: cardWidth, alignSelf: 'center', marginHorizontal: CARD_MARGIN }}>
                    <View style={styles.balanceCardInner}>
                        <View style={styles.balanceCardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.balanceTitle}>{item.title}</Text>
                                <Text style={styles.balanceValue}>{balanceLabel}</Text>
                                <Text style={styles.balanceCurrencyHint}>
                                    Валюта: {getCurrencySymbol(item.currency)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.balanceBottomRow}>
                            <View style={styles.balanceStat}>
                                <Text style={styles.balanceStatLabel}>Доходы</Text>
                                <Text style={styles.balanceStatValue}>{incomeLabel}</Text>
                            </View>
                            <View style={styles.balanceDivider} />
                            <View style={styles.balanceStat}>
                                <Text style={styles.balanceStatLabel}>Расходы</Text>
                                <Text style={styles.balanceStatValue}>{expenseLabel}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            );
        },
        [cardWidth, formatCurrency, getCurrencySymbol, historyTotals, onAddAccountPress],
    );

    return (
        <View style={styles.wrapper} onLayout={handleLayout}>
            <Animated.FlatList
                ref={sliderRef}
                data={slides}
                horizontal
                pagingEnabled
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.key}
                renderItem={renderSlide}
                snapToInterval={Math.max(itemWidth, 1)}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum
                contentContainerStyle={[styles.listContent, { paddingHorizontal: listSidePadding }]}
                initialNumToRender={slides.length}
                maxToRenderPerBatch={slides.length}
                windowSize={Math.max(slides.length * 2, 5)}
                removeClippedSubviews={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: sliderScrollX } } }],
                    { useNativeDriver: false },
                )}
                onMomentumScrollEnd={handleMomentumScrollEnd}
            />

            <View style={styles.indicators}>
                {slides.map((_, idx) => {
                    const inputRange = [
                        (idx - 1) * sliderWidth,
                        idx * sliderWidth,
                        (idx + 1) * sliderWidth,
                    ];
                    const dotOpacity = sliderScrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });
                    const dotScale = sliderScrollX.interpolate({
                        inputRange,
                        outputRange: [0.9, 1.1, 0.9],
                        extrapolate: 'clamp',
                    });
                    return (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => scrollToSlide(idx)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Animated.View
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: accentColor,
                                        opacity: dotOpacity,
                                        transform: [{ scale: dotScale }],
                                    },
                                ]}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { paddingVertical: 4 },
    listContent: { paddingHorizontal: 0, alignItems: 'center' },
    addCard: {
        height: 220,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceCardInner: {
        backgroundColor: 'rgba(255,255,255,0.58)',
        borderRadius: 32,
        paddingHorizontal: 22,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.62)',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    balanceCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    balanceTitle: { fontSize: 16, color: '#252A32' },
    balanceValue: { fontSize: 26, fontWeight: '700', color: '#2BAF8C', marginTop: 6 },
    balanceCurrencyHint: { fontSize: 13, color: '#5F6670', marginTop: 4 },
    balanceBottomRow: {
        flexDirection: 'row',
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    balanceStat: { flex: 1 },
    balanceStatLabel: { fontSize: 14, color: '#5F6670' },
    balanceStatValue: { fontSize: 17, fontWeight: '600', color: '#1D2025', marginTop: 4 },
    balanceDivider: {
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.08)',
        marginHorizontal: 14,
    },
    indicators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
    },
    dot: { width: 8, height: 8, borderRadius: 4, opacity: 0.3 },
});