import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type ExchangeRatesCardProps = {
    ratesMap: Record<string, number>;
    primaryColor?: string;
    textMainColor?: string;
    textSecondaryColor?: string;
};

type RateRowItem = {
    code: string;
    label: string;
    symbol: string;
    valuePerUsd: number | null;
};

const TARGET_CURRENCIES: { code: string; label: string; symbol: string }[] = [
    { code: 'BYN', label: 'Белорусский рубль', symbol: 'Br' },
    { code: 'EUR', label: 'Евро', symbol: '€' },
    { code: 'PLN', label: 'Польский злотый', symbol: 'zł' },
];

export const ExchangeRatesCard: React.FC<ExchangeRatesCardProps> = ({
    ratesMap,
    primaryColor = '#2BAF8C',
    textMainColor = '#212121',
    textSecondaryColor = '#757575',
}) => {
    const rows = useMemo<RateRowItem[]>(() => {
        const usdRate = ratesMap?.USD;
        const hasValidUsd = typeof usdRate === 'number' && Number.isFinite(usdRate) && usdRate > 0;

        return TARGET_CURRENCIES.map(({ code, label, symbol }) => {
            if (code === 'USD') {
                return { code, label, symbol, valuePerUsd: 1 };
            }

            const curRate = ratesMap?.[code];
            const hasValidCur =
                typeof curRate === 'number' && Number.isFinite(curRate) && curRate > 0;

            // Если ratesMap хранит курс относительно единой базы (например, 1 база = X единиц валюты),
            // то 1 USD = (rate[code] / rate[USD]) единиц валюты `code`.
            const valuePerUsd =
                hasValidUsd && hasValidCur ? curRate / usdRate : null;

            return { code, label, symbol, valuePerUsd };
        });
    }, [ratesMap]);

    const formatRateValue = (val: number | null, symbol: string) => {
        if (val === null || !Number.isFinite(val)) {
            return `— ${symbol}`;
        }
        const formatted = val.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        });
        return `${formatted} ${symbol}`;
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: textSecondaryColor }]}>Курсы валют</Text>
                <Text style={[styles.baseHint, { color: textSecondaryColor }]}>База: 1 USD</Text>
            </View>

            <View style={styles.list}>
                {rows.map((item, idx) => (
                    <React.Fragment key={item.code}>
                        {idx > 0 ? <View style={styles.divider} /> : null}
                        <View style={styles.row}>
                            <View style={[styles.badge, { backgroundColor: `${primaryColor}18` }]}>
                                <Ionicons name="cash-outline" size={18} color={primaryColor} />
                            </View>

                            <View style={styles.info}>
                                <Text style={[styles.code, { color: textMainColor }]}>{item.code}</Text>
                                <Text style={[styles.label, { color: textSecondaryColor }]} numberOfLines={1}>
                                    {item.label}
                                </Text>
                            </View>

                            <View style={styles.valueBlock}>
                                <Text style={[styles.pairHint, { color: textSecondaryColor }]}>
                                    1 USD =
                                </Text>
                                <Text style={[styles.value, { color: textMainColor }]}>
                                    {formatRateValue(item.valuePerUsd, item.symbol)}
                                </Text>
                            </View>
                        </View>
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    baseHint: {
        fontSize: 13,
        fontWeight: '500',
    },
    list: {
        gap: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#ECEFF1',
        marginLeft: 52,
    },
    badge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
        marginRight: 10,
    },
    code: {
        fontSize: 16,
        fontWeight: '700',
    },
    label: {
        fontSize: 13,
        marginTop: 2,
    },
    valueBlock: {
        alignItems: 'flex-end',
    },
    pairHint: {
        fontSize: 11,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 1,
    },
});

export default ExchangeRatesCard;