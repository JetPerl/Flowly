import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  DeviceEventEmitter,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMainCurrency } from './currency/CurrencyContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';

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
const PRIMARY_COLOR = '#2BAF8C';

const CurrencyListScreen = () => {
  const router = useRouter();
  const { mainCurrency, setMainCurrency } = useMainCurrency();
  const [query, setQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState(mainCurrency || 'USD');
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(['EUR', 'USD']));
  const FAVORITES_KEY = 'flowly:currencyFavorites';

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
  }, [FAVORITES_KEY]);

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
  }, [favorites, FAVORITES_KEY]);

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

  const renderCurrencyRow = (item: Currency) => {
    const isFavorite = favorites.has(item.code);
    const isSelected = selectedCode === item.code;

    return (
      <TouchableOpacity
        key={item.code}
        style={styles.row}
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
            style={[styles.star, isFavorite && styles.starActive]}
          />
        </TouchableOpacity>
        <Text style={styles.code}>{item.code}</Text>
        <View style={styles.nameWrapper}>
          <Text style={styles.name}>
            {item.name} ({item.symbol})
          </Text>
        </View>
        {isSelected ? (
          <Ionicons name="checkmark-circle-sharp" size={24} color={PRIMARY_COLOR} />
        ) : (
          <View style={styles.checkmarkPlaceholder} />
        )}
      </TouchableOpacity>
    );
  };

  return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {favoriteList.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Избранные</Text>
            <View style={styles.sectionCard}>{favoriteList.map(renderCurrencyRow)}</View>
            <Text style={[styles.sectionTitle, styles.sectionTitleOffset]}>Все валюты</Text>
          </>
        )}
        {favoriteList.length === 0 && otherList.length > 0 && (
          <Text style={styles.sectionTitle}>Все валюты</Text>
        )}
        {otherList.length > 0 && (
          <View style={styles.sectionCard}>{otherList.map(renderCurrencyRow)}</View>
        )}
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingTop: 18,
    paddingBottom: 44,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6f7685',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitleOffset: {
    marginTop: 24,
  },
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f4',
  },
  starHit: {
    width: 28,
    marginRight: 12,
    alignItems: 'center',
  },
  star: {
    color: '#c9ced6',
  },
  starActive: {
    color: PRIMARY_COLOR,
  },
  code: {
    width: 52,
    fontSize: 16,
    fontWeight: '600',
    color: '#646464ff',
  },
  nameWrapper: {
    flex: 1,
    marginRight: 6,
  },
  name: {
    fontSize: 16,
    color: '#1a1c26',
  },
  checkmarkPlaceholder: {
    width: 28,
    height: 28,
  },
});

export default CurrencyListScreen;
