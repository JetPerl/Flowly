import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  DeviceEventEmitter,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMainCurrency } from './currency/CurrencyContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import { useThemeColors } from './theme/useThemeColors';

type Currency = {
  code: string;
  name: string;
  symbol: string;
};

const BASE_CURRENCIES: Currency[] = [
  { code: 'BYN', name: 'Белорусский рубль', symbol: 'Br' },
  { code: 'EUR', name: 'Евро', symbol: '€' },
  { code: 'USD', name: 'Доллар США', symbol: '$' },
  { code: 'AED', name: 'Дирхам ОАЭ', symbol: 'د.إ' },
  { code: 'AFN', name: 'Афгани', symbol: '؋' },
  { code: 'ALL', name: 'Албанский лек', symbol: 'L' },
  { code: 'AMD', name: 'Армянский драм', symbol: '֏' },
  { code: 'ANG', name: 'Нидерландский антильский гульден', symbol: 'ƒ' },
  { code: 'AOA', name: 'Ангольская кванза', symbol: 'Kz' },
  { code: 'ARS', name: 'Аргентинский песо', symbol: '$' },
  { code: 'AUD', name: 'Австралийский доллар', symbol: '$' },
  { code: 'AZN', name: 'Азербайджанский манат', symbol: '₼' },
  { code: 'BGN', name: 'Болгарский лев', symbol: 'лв' },
  { code: 'BRL', name: 'Бразильский реал', symbol: 'R$' },
  { code: 'CAD', name: 'Канадский доллар', symbol: '$' },
  { code: 'CHF', name: 'Швейцарский франк', symbol: '₣' },
  { code: 'CNY', name: 'Юань', symbol: '¥' },
  { code: 'CZK', name: 'Чешская крона', symbol: 'Kč' },
  { code: 'DKK', name: 'Датская крона', symbol: 'kr' },
  { code: 'EGP', name: 'Египетский фунт', symbol: '£' },
  { code: 'GBP', name: 'Фунт стерлингов', symbol: '£' },
  { code: 'HKD', name: 'Гонконгский доллар', symbol: '$' },
  { code: 'HUF', name: 'Венгерский форинт', symbol: 'Ft' },
  { code: 'ILS', name: 'Новый израильский шекель', symbol: '₪' },
  { code: 'INR', name: 'Индийская рупия', symbol: '₹' },
  { code: 'JPY', name: 'Японская иена', symbol: '¥' },
  { code: 'KZT', name: 'Казахстанский тенге', symbol: '₸' },
  { code: 'MXN', name: 'Мексиканский песо', symbol: '$' },
  { code: 'NOK', name: 'Норвежская крона', symbol: 'kr' },
  { code: 'PLN', name: 'Польский злотый', symbol: 'zł' },
  { code: 'RON', name: 'Румынский лей', symbol: 'lei' },
  { code: 'RUB', name: 'Российский рубль', symbol: '₽' },
  { code: 'SEK', name: 'Шведская крона', symbol: 'kr' },
  { code: 'SGD', name: 'Сингапурский доллар', symbol: '$' },
  { code: 'TRY', name: 'Турецкая лира', symbol: '₺' },
  { code: 'UAH', name: 'Украинская гривна', symbol: '₴' },
  { code: 'ZAR', name: 'Южноафриканский рэнд', symbol: 'R' },
  { code: 'NZD', name: 'Новозеландский доллар', symbol: '$' },
  { code: 'IDR', name: 'Индонезийская рупия', symbol: 'Rp' },
  { code: 'PHP', name: 'Филиппинское песо', symbol: '₱' },
  { code: 'THB', name: 'Таиландский бат', symbol: '฿' },
  { code: 'KRW', name: 'Южнокорейская вона', symbol: '₩' },
  { code: 'MAD', name: 'Марокканский дирхам', symbol: 'د.م.' },
  { code: 'MYR', name: 'Малайзийский ринггит', symbol: 'RM' },
  { code: 'COP', name: 'Колумбийское песо', symbol: '$' },
  { code: 'CLP', name: 'Чилийское песо', symbol: '$' },
  { code: 'PEN', name: 'Перуанский соль', symbol: 'S/' },
  { code: 'SAR', name: 'Саудовский риял', symbol: 'ر.س' },
  { code: 'BHD', name: 'Бахрейнский динар', symbol: '.د.ب' },
  { code: 'TWD', name: 'Новый тайваньский доллар', symbol: 'NT$' },
  { code: 'VND', name: 'Вьетнамский донг', symbol: '₫' },
  { code: 'RSD', name: 'Сербский динар', symbol: 'дин.' },
  { code: 'HRK', name: 'Хорватская куна', symbol: 'kn' },
  { code: 'XOF', name: 'Западноафриканский франк CFA', symbol: 'CFA' },
];

const FAVORITES_KEY = 'flowly:currencyFavorites';

const CurrencyListScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { mainCurrency, setMainCurrency } = useMainCurrency();
  const [query, setQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState(mainCurrency || 'USD');
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(['EUR', 'USD']));

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('currency-search', (text: string) => {
      setQuery((text ?? '').toString());
    });
    return () => {
      sub.remove();
    };
  }, []);

  // Load favorites on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const next = new Set(parsed.map((v: any) => String(v).toUpperCase()));
            if (!cancelled) setFavorites(next);
          }
        }
      } catch (e) {
        console.warn('Не удалось загрузить избранные валюты', e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist favorites when changed
  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
      } catch (e) {
        console.warn('Не удалось сохранить избранные валюты', e);
      }
    };
    save();
  }, [favorites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BASE_CURRENCIES;
    return BASE_CURRENCIES.filter(
      item =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.symbol.toLowerCase().includes(q),
    );
  }, [query]);

  const favoriteList = useMemo(
    () => filtered.filter(item => favorites.has(item.code)),
    [filtered, favorites],
  );

  const otherList = useMemo(
    () => filtered.filter(item => !favorites.has(item.code)),
    [filtered, favorites],
  );

  const toggleFavorite = (code: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const starInactiveColor = colors.isDark ? 'rgba(255, 255, 255, 0.25)' : '#c9ced6';
  const accentColor = colors.income;

  const renderCurrencyRow = (item: Currency, index: number, list: Currency[]) => {
    const isFavorite = favorites.has(item.code);
    const isSelected = selectedCode === item.code;
    const isLast = index === list.length - 1;

    return (
      <TouchableOpacity
        key={item.code}
        style={[
          styles.row,
          {
            borderBottomColor: colors.divider,
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => {
          setSelectedCode(item.code);
          setMainCurrency(item.code);
          router.back();
        }}
      >
        <TouchableOpacity
          style={styles.starHit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => toggleFavorite(item.code)}
        >
          <Octicons
            name={isFavorite ? 'star-fill' : 'star'}
            size={20}
            color={isFavorite ? accentColor : starInactiveColor}
          />
        </TouchableOpacity>
        <Text style={[styles.code, { color: colors.textSecondary }]}>{item.code}</Text>
        <View style={styles.nameWrapper}>
          <Text style={[styles.name, { color: colors.textMain }]}>
            {item.name} ({item.symbol})
          </Text>
        </View>
        {isSelected ? (
          <Ionicons name="checkmark-circle-sharp" size={24} color={accentColor} />
        ) : (
          <View style={styles.checkmarkPlaceholder} />
        )}
      </TouchableOpacity>
    );
  };

  const sectionCardThemeStyle = {
    backgroundColor: colors.cardSurface,
    borderColor: colors.border,
  };

  return (
    <>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.baseSurface }]}
        contentContainerStyle={[styles.contentContainer, { backgroundColor: colors.baseSurface }]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {favoriteList.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Избранные</Text>
            <View style={[styles.sectionCard, sectionCardThemeStyle]}>
              {favoriteList.map((item, idx) => renderCurrencyRow(item, idx, favoriteList))}
            </View>
            <Text
              style={[
                styles.sectionTitle,
                styles.sectionTitleOffset,
                { color: colors.textSecondary },
              ]}
            >
              Все валюты
            </Text>
          </>
        )}
        {favoriteList.length === 0 && otherList.length > 0 && (
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Все валюты</Text>
        )}
        {otherList.length > 0 && (
          <View style={[styles.sectionCard, sectionCardThemeStyle]}>
            {otherList.map((item, idx) => renderCurrencyRow(item, idx, otherList))}
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 18,
    paddingBottom: 44,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitleOffset: {
    marginTop: 24,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingVertical: 12,
  },
  starHit: {
    width: 28,
    marginRight: 12,
    alignItems: 'center',
  },
  code: {
    width: 52,
    fontSize: 16,
    fontWeight: '600',
  },
  nameWrapper: {
    flex: 1,
    marginRight: 6,
  },
  name: {
    fontSize: 16,
  },
  checkmarkPlaceholder: {
    width: 28,
    height: 28,
  },
});

export default CurrencyListScreen;