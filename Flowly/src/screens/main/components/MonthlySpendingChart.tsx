import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { CurveType, LineChart } from 'react-native-gifted-charts';

type TrendPoint = {
    value: number;
    day: number;
};

type MonthlySpendingChartProps = {
    monthLabel: string;
    monthStartMs: number;
    total: number;
    points: TrendPoint[];
    peak: number;
    labelDays: number[];
    currency: string;
    formatCurrency: (value: number, withSymbol?: boolean, currency?: string) => string;
    primaryColor?: string;
    textSecondaryColor?: string;
    textMainColor?: string;
};

export const MonthlySpendingChart: React.FC<MonthlySpendingChartProps> = ({
    monthLabel,
    monthStartMs,
    total,
    points,
    peak,
    labelDays,
    currency,
    formatCurrency,
    primaryColor = '#2BAF8C',
    textSecondaryColor = '#757575',
    textMainColor = '#212121',
}) => {
    const [chartWidth, setChartWidth] = useState(
        Math.max(Dimensions.get('window').width - 32, 260),
    );
    const [pointerIndex, setPointerIndex] = useState(0);

    const yAxisWidth = 20;
    const xLabelWidth = 30;
    const xLabelHalf = xLabelWidth / 2;
    const initialSpacing = 0;
    const endSpacing = 0;
    const rightPadding = 12;
    const innerWidth = Math.max(chartWidth - yAxisWidth - rightPadding, 160);

    const spacing = useMemo(() => {
        if (points.length <= 1) return innerWidth;
        const raw = (innerWidth - initialSpacing - endSpacing) / Math.max(points.length - 1, 1);
        return Math.max(2, raw);
    }, [endSpacing, initialSpacing, innerWidth, points.length]);

    const chartData = useMemo(
        () =>
            points.map((pt, idx, arr) => ({
                ...pt,
                label: '',
                spacing: idx === arr.length - 1 ? 0 : spacing,
                pointerShiftX: idx === 0 ? -4 : 0,
            })),
        [points, spacing],
    );

    const maxValue = useMemo(() => (peak > 0 ? peak * 1.1 : 10), [peak]);

    const xAxisPositions = useMemo(
        () => labelDays.map(day => initialSpacing + (day - 1) * spacing),
        [initialSpacing, labelDays, spacing],
    );

    const handleLayout = useCallback(
        (e: LayoutChangeEvent) => {
            const w = e?.nativeEvent?.layout?.width || 0;
            if (w && Math.abs(w - chartWidth) > 0.5) {
                setChartWidth(w);
            }
        },
        [chartWidth],
    );

    const handlePointer = useCallback(({ pointerIndex: idx }: { pointerIndex?: number }) => {
        if (typeof idx === 'number' && Number.isFinite(idx)) {
            setPointerIndex(idx);
        }
    }, []);

    const renderPointer = useCallback(() => {
        const dotOffsetX = pointerIndex === 0 ? -8 : -1;
        return (
            <View
                style={[
                    styles.pointerDot,
                    { backgroundColor: primaryColor, transform: [{ translateX: dotOffsetX }] },
                ]}
            />
        );
    }, [pointerIndex, primaryColor]);

    const renderPointerLabel = useCallback(
        (items: any) => {
            const item = Array.isArray(items) ? items[0] : items;
            if (!item) return null;

            const val =
                typeof item?.value === 'number'
                    ? item.value
                    : typeof item?.item?.value === 'number'
                        ? item.item.value
                        : 0;
            const day =
                typeof item?.day === 'number'
                    ? item.day
                    : typeof item?.item?.day === 'number'
                        ? item.item.day
                        : typeof item?.index === 'number'
                            ? item.index + 1
                            : null;

            const monthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(
                new Date(monthStartMs),
            );
            const shortClean = monthShort.replace('.', '').trim();
            const label = day ? `${day} ${shortClean}` : monthLabel;

            return (
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipLabel}>{label}</Text>
                    <Text style={styles.tooltipValue}>{formatCurrency(val, true, currency)}</Text>
                </View>
            );
        },
        [currency, formatCurrency, monthLabel, monthStartMs],
    );

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.eyebrow, { color: textSecondaryColor }]}>Расходы за месяц</Text>
                    <Text style={[styles.title, { color: textMainColor }]}>{monthLabel}</Text>
                </View>
                <View style={styles.totalBlock}>
                    <Text style={[styles.totalLabel, { color: textSecondaryColor }]}>Итого</Text>
                    <Text style={[styles.totalValue, { color: textMainColor }]}>
                        {formatCurrency(total, true, currency)}
                    </Text>
                </View>
            </View>

            <View style={styles.graph} onLayout={handleLayout}>
                <LineChart
                    areaChart
                    hideDataPoints
                    curved
                    curveType={CurveType.QUADRATIC}
                    curvature={0.22}
                    data={chartData}
                    getPointerProps={handlePointer}
                    height={220}
                    width={innerWidth}
                    initialSpacing={initialSpacing}
                    endSpacing={endSpacing}
                    spacing={spacing}
                    thickness={2.5}
                    color={primaryColor}
                    startOpacity={0.28}
                    endOpacity={0.02}
                    startFillColor={primaryColor}
                    endFillColor={primaryColor}
                    yAxisLabelWidth={yAxisWidth}
                    yAxisTextStyle={[styles.yAxisText, { color: textSecondaryColor }]}
                    xAxisColor="#EEF0F4"
                    yAxisColor="#EEF0F4"
                    rulesColor="#EEF0F4"
                    rulesType="solid"
                    noOfSections={4}
                    maxValue={maxValue}
                    animateOnDataChange
                    disableScroll
                    pointerConfig={{
                        pointerStripHeight: 220,
                        pointerStripColor: 'rgba(43,175,140,0.25)',
                        pointerStripWidth: 2,
                        pointerColor: primaryColor,
                        radius: 5,
                        persistPointer: false,
                        pointerVanishDelay: 0,
                        resetPointerOnDataChange: true,
                        autoAdjustPointerLabelPosition: true,
                        pointerStripUptoDataPoint: true,
                        pointerLabelWidth: 140,
                        pointerLabelHeight: 50,
                        shiftPointerLabelY: -14,
                        pointerLabelComponent: renderPointerLabel,
                        pointerComponent: renderPointer,
                    }}
                    xAxisLabelTextStyle={[styles.xAxisText, { color: textSecondaryColor }]}
                    yAxisTextNumberOfLines={1}
                    xAxisTextNumberOfLines={1}
                    formatYLabel={val => {
                        const num = Number(val);
                        if (!Number.isFinite(num)) return '0';
                        return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
                    }}
                />
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: yAxisWidth,
                        width: innerWidth,
                        bottom: -5,
                        height: 18,
                        overflow: 'visible',
                        zIndex: 2,
                    }}
                >
                    {labelDays.map((day, idx) => {
                        const x = xAxisPositions[idx] ?? 0;
                        return (
                            <Text
                                key={`${day}-${idx}`}
                                style={[
                                    styles.xAxisText,
                                    {
                                        color: textSecondaryColor,
                                        position: 'absolute',
                                        left: x - xLabelHalf,
                                        width: xLabelWidth,
                                    },
                                ]}
                            >
                                {day}
                            </Text>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    eyebrow: { fontSize: 14, fontWeight: '600' },
    title: { fontSize: 20, fontWeight: '700', marginTop: 4 },
    totalBlock: { alignItems: 'flex-end' },
    totalLabel: { fontSize: 13 },
    totalValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
    graph: { marginTop: 4, position: 'relative', overflow: 'visible' },
    yAxisText: { fontSize: 11, marginLeft: -4 },
    xAxisText: { fontSize: 11, textAlign: 'center', minWidth: 22 },
    tooltip: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    tooltipLabel: { color: '#4B5563', fontSize: 11, opacity: 0.9 },
    tooltipValue: { color: '#111827', fontSize: 14, fontWeight: '700', marginTop: 2 },
    pointerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
});