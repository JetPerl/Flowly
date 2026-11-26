import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { CurveType, LineChart } from 'react-native-gifted-charts';
import { useThemeColors } from '../../../theme/useThemeColors';
import { SurfaceCard } from '../../../components/SurfaceCard';

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

function toTranslucent(color: string, alpha: number): string {
    const rgbaMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbaMatch) {
        return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
    }
    const hex = color.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
}

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
    textSecondaryColor,
    textMainColor,
}) => {
    const colors = useThemeColors();
    const resolvedTextMain = textMainColor ?? colors.textMain;
    const resolvedTextSecondary = textSecondaryColor ?? colors.textSecondary;

    const [chartWidth, setChartWidth] = useState(
        Math.max(Dimensions.get('window').width - 64, 240),
    );
    const [pointerIndex, setPointerIndex] = useState(0);

    const yAxisWidth = 20;
    const xLabelWidth = 30;
    const xLabelHalf = xLabelWidth / 2;
    const initialSpacing = 0;
    const endSpacing = 0;
    const rightPadding = 12;
    const innerWidth = Math.max(chartWidth - yAxisWidth - rightPadding, 160);

    const gridColor = colors.isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(15, 23, 42, 0.07)';

    const verticalLinesCount = Math.max(labelDays.length - 1, 1);
    const verticalLinesSpacing = innerWidth / verticalLinesCount;

    const spacing = useMemo(() => {
        if (points.length <= 1) return innerWidth;
        const raw =
            (innerWidth - initialSpacing - endSpacing) / Math.max(points.length - 1, 1);
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
        () => labelDays.map((day) => initialSpacing + (day - 1) * spacing),
        [initialSpacing, labelDays, spacing],
    );

    const pointerStripColor = useMemo(
        () => toTranslucent(primaryColor, colors.isDark ? 0.35 : 0.25),
        [primaryColor, colors.isDark],
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

    const handlePointer = useCallback(
        ({ pointerIndex: idx }: { pointerIndex?: number }) => {
            if (typeof idx === 'number' && Number.isFinite(idx)) {
                setPointerIndex(idx);
            }
        },
        [],
    );

    const renderPointer = useCallback(() => {
        const dotOffsetX = pointerIndex === 0 ? -8 : -1;
        return (
            <View
                style={[
                    styles.pointerDot,
                    {
                        backgroundColor: primaryColor,
                        borderColor: colors.isDark ? '#181C26' : '#FFFFFF',
                        transform: [{ translateX: dotOffsetX }],
                    },
                ]}
            />
        );
    }, [pointerIndex, primaryColor, colors.isDark]);

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
                <View
                    style={[
                        styles.tooltip,
                        {
                            backgroundColor: colors.isDark
                                ? 'rgba(24, 28, 38, 0.94)'
                                : colors.elevatedSurface,
                            borderColor: colors.isDark
                                ? 'rgba(255, 255, 255, 0.12)'
                                : colors.border,
                        },
                    ]}
                >
                    <Text style={[styles.tooltipLabel, { color: colors.textSecondary }]}>
                        {label}
                    </Text>
                    <Text style={[styles.tooltipValue, { color: colors.textMain }]}>
                        {formatCurrency(val, true, currency)}
                    </Text>
                </View>
            );
        },
        [
            currency,
            formatCurrency,
            monthLabel,
            monthStartMs,
            colors.isDark,
            colors.elevatedSurface,
            colors.border,
            colors.textSecondary,
            colors.textMain,
        ],
    );

    return (
        <SurfaceCard style={styles.card} contentStyle={styles.cardContent}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.eyebrow, { color: resolvedTextSecondary }]}>
                        Расходы за месяц
                    </Text>
                    <Text
                        style={[styles.title, { color: resolvedTextMain }]}
                        numberOfLines={1}
                    >
                        {monthLabel}
                    </Text>
                </View>
                <View style={styles.totalBlock}>
                    <Text style={[styles.totalLabel, { color: resolvedTextSecondary }]}>
                        Итого
                    </Text>
                    <Text
                        style={[styles.totalValue, { color: resolvedTextMain }]}
                        numberOfLines={1}
                    >
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
                    height={210}
                    width={innerWidth}
                    initialSpacing={initialSpacing}
                    endSpacing={endSpacing}
                    spacing={spacing}
                    thickness={2.5}
                    color={primaryColor}
                    startOpacity={colors.isDark ? 0.34 : 0.26}
                    endOpacity={0.02}
                    startFillColor={primaryColor}
                    endFillColor={primaryColor}
                    yAxisLabelWidth={yAxisWidth}
                    yAxisTextStyle={[styles.yAxisText, { color: resolvedTextSecondary }]}
                    xAxisColor={gridColor}
                    xAxisLength={innerWidth}
                    yAxisColor={gridColor}
                    rulesColor={gridColor}
                    rulesLength={innerWidth}
                    rulesThickness={1}
                    rulesType="solid"
                    showVerticalLines
                    verticalLinesColor={gridColor}
                    verticalLinesThickness={1}
                    noOfVerticalLines={verticalLinesCount}
                    verticalLinesSpacing={verticalLinesSpacing}
                    noOfSections={4}
                    maxValue={maxValue}
                    animateOnDataChange
                    disableScroll
                    pointerConfig={{
                        pointerStripHeight: 210,
                        pointerStripColor,
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
                    xAxisLabelTextStyle={[styles.xAxisText, { color: resolvedTextSecondary }]}
                    yAxisTextNumberOfLines={1}
                    xAxisTextNumberOfLines={1}
                    formatYLabel={(val) => {
                        const num = Number(val);
                        if (!Number.isFinite(num)) return '0';
                        return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
                    }}
                />
                <View
                    pointerEvents="none"
                    style={[
                        styles.xAxisOverlay,
                        { left: yAxisWidth, width: innerWidth },
                    ]}
                >
                    {labelDays.map((day, idx) => {
                        const x = xAxisPositions[idx] ?? 0;
                        return (
                            <Text
                                key={`${day}-${idx}`}
                                style={[
                                    styles.xAxisText,
                                    {
                                        color: resolvedTextSecondary,
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
        </SurfaceCard>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 14,
    },
    cardContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
        minWidth: 0,
    },
    eyebrow: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    title: {
        fontSize: 19,
        lineHeight: 24,
        fontWeight: '700',
        marginTop: 3,
    },
    totalBlock: {
        alignItems: 'flex-end',
        flexShrink: 0,
    },
    totalLabel: {
        fontSize: 13,
        lineHeight: 18,
    },
    totalValue: {
        fontSize: 21,
        lineHeight: 26,
        fontWeight: '700',
        marginTop: 3,
        fontVariant: ['tabular-nums'],
    },
    graph: {
        marginTop: 4,
        position: 'relative',
        overflow: 'visible',
    },
    xAxisOverlay: {
        position: 'absolute',
        bottom: -5,
        height: 18,
        overflow: 'visible',
        zIndex: 2,
    },
    yAxisText: {
        fontSize: 11,
        marginLeft: -4,
        fontVariant: ['tabular-nums'],
    },
    xAxisText: {
        fontSize: 11,
        textAlign: 'center',
        minWidth: 22,
        fontVariant: ['tabular-nums'],
    },
    tooltip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    tooltipLabel: {
        fontSize: 11,
        opacity: 0.9,
    },
    tooltipValue: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
        fontVariant: ['tabular-nums'],
    },
    pointerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
    },
});