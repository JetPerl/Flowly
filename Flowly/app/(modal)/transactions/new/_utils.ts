export type TransactionType = 'income' | 'expense' | 'transfer';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  BYN: 'Br',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: '₣',
  JPY: '¥',
  CNY: '¥',
  KZT: '₸',
  UAH: '₴',
  CAD: 'CA$',
  AUD: 'A$',
};

export const DEFAULT_MAIN_CURRENCY = 'BYN';
  // export const API_BASE_URL = 'http://192.168.100.96:8000';

  // дом
  export const API_BASE_URL = 'http://192.168.0.135:8000';

  // телефон
  // export const API_BASE_URL = 'http://172.20.10.2:8000';

  // соня
  // export const API_BASE_URL = 'http://172.20.10.3:8000';

  // мой t2
  // export const API_BASE_URL = 'http://172.20.10.2:8000';

const TIME_PICKER_LOCALE = 'en-US';
export const HEADER_SAVE_EVENT = 'transactions:new:save';

export const formatCurrency = (
  value: number,
  withSymbol = true,
  currency: string = DEFAULT_MAIN_CURRENCY,
): string => {
  const formatted = value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!withSymbol) return formatted;
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  return `${formatted} ${symbol}`;
};

export const getCurrencySymbol = (code?: string | null) => {
  if (!code) return '₽';
  const upper = code.toUpperCase();
  return CURRENCY_SYMBOLS[upper] || code;
};

export const sanitizeNumericInput = (input: string) => {
  if (!input) return '';
  let s = input.replace(/,/g, '.');
  s = s.replace(/[^0-9.]/g, '');

  const stripLeadingZeros = (value: string) => {
    const trimmed = value.replace(/^0+(?!$)/, '');
    return trimmed === '' ? '0' : trimmed;
  };

  const firstDot = s.indexOf('.');
  if (firstDot === -1) {
    const normalizedInt = stripLeadingZeros(s);
    return normalizedInt;
  }

  const intPart = stripLeadingZeros(s.slice(0, firstDot) || '0');
  const decimalsRaw = s.slice(firstDot + 1).replace(/\./g, '');
  const decimals = decimalsRaw.slice(0, 2);

  if (decimals.length === 0 && s.endsWith('.')) {
    return `${intPart}.`;
  }

  return decimals.length ? `${intPart}.${decimals}` : intPart;
};

export const formatAmountLabel = (
  rawAmount: string,
  type: TransactionType,
  currencyCode: string,
) => {
  const sanitized = sanitizeNumericInput(rawAmount);
  const sign = type === 'income' ? '+ ' : '− ';
  const normalized = sanitized || '0';
  const symbol = getCurrencySymbol(currencyCode);
  return `${sign} ${normalized} ${symbol}`;
};

export const formatDateTimeRu = (date: Date): string => {
  const shortDate = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const datePart = shortDate.charAt(0).toUpperCase() + shortDate.slice(1);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${datePart} в ${hh}:${mm}`;
};

export const formatLongDateRu = (date: Date): string =>
  date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const formatTimeLabel = (date: Date): string =>
  new Intl.DateTimeFormat(TIME_PICKER_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

export const formatMonthYearRu = (year: number, monthIndex: number): string => {
  const d = new Date(year, monthIndex, 1);
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
  const str = formatter.format(d);
  return str.charAt(0).toUpperCase() + str.slice(1);
};
