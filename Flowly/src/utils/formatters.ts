import { getCurrencySymbol } from './currency';

const TIME_PICKER_LOCALE = 'en-US';

export function sanitizeNumericInput(input: string): string {
  if (!input) return '';
  let s = input.replace(/,/g, '.');
  s = s.replace(/[^0-9.]/g, '');

  const stripLeadingZeros = (value: string) => {
    const trimmed = value.replace(/^0+(?!$)/, '');
    return trimmed === '' ? '0' : trimmed;
  };

  const firstDot = s.indexOf('.');
  if (firstDot === -1) {
    return stripLeadingZeros(s);
  }

  const intPart = stripLeadingZeros(s.slice(0, firstDot) || '0');
  const decimalsRaw = s.slice(firstDot + 1).replace(/\./g, '');
  const decimals = decimalsRaw.slice(0, 2);

  if (decimals.length === 0 && s.endsWith('.')) {
    return `${intPart}.`;
  }

  return decimals.length ? `${intPart}.${decimals}` : intPart;
}

export function formatDateTimeRu(date: Date): string {
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
}

export function formatLongDateRu(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat(TIME_PICKER_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatMonthYearRu(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex, 1);
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
  const str = formatter.format(d);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatAmountLabel(
  rawAmount: string,
  type: 'income' | 'expense' | 'transfer',
  currencyCode: string,
): string {
  const sanitized = sanitizeNumericInput(rawAmount);
  const sign = type === 'income' ? '+ ' : '− ';
  const normalized = sanitized || '0';
  const symbol = getCurrencySymbol(currencyCode);
  return `${sign} ${normalized} ${symbol}`;
}

