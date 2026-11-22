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

export function getCurrencySymbol(code?: string | null): string {
  if (!code) return '₽';
  const upper = code.toUpperCase();
  return CURRENCY_SYMBOLS[upper] || code;
}

export function formatCurrency(
  value: number,
  withSymbol = true,
  currency: string = DEFAULT_MAIN_CURRENCY,
): string {
  const formatted = value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!withSymbol) return formatted;
  const symbol = getCurrencySymbol(currency);
  return `${formatted} ${symbol}`;
}

export function extractCurrencyFromLabel(label: string): string | null {
  const trimmed = (label || '').trim();
  const match = trimmed.match(/([A-Za-zА-Яа-я₽$€£¥₮₸₴₹฿]+)$/u);
  return match ? match[1] : null;
}

export function inferCurrencyCodeFromLabel(label: string): string | null {
  const cur = extractCurrencyFromLabel(label);
  if (!cur) return null;
  const upper = cur.toUpperCase();
  const found = Object.entries(CURRENCY_SYMBOLS).find(
    ([code, symbol]) => code === upper || symbol.toUpperCase() === upper,
  );
  return found ? found[0] : null;
}

export function getRateToMain(
  currency: string,
  ratesMap: Record<string, number>,
  mainCurrency: string = DEFAULT_MAIN_CURRENCY,
): number {
  if (!currency) return 1;
  const upper = currency.toUpperCase();
  const mainUpper = mainCurrency.toUpperCase();
  if (upper === mainUpper) return 1;

  const mainRate = ratesMap[mainUpper];
  const curRate = ratesMap[upper];

  const mainVal =
    typeof mainRate === 'number' && !Number.isNaN(mainRate) && mainRate > 0
      ? mainRate
      : 1;

  const curVal =
    typeof curRate === 'number' && !Number.isNaN(curRate) && curRate > 0
      ? curRate
      : mainVal;

  if (mainVal === 0) return 1;
  return curVal / mainVal;
}

export function convertCurrency(
  value: number,
  from: string | null | undefined,
  to: string | null | undefined,
  ratesMap: Record<string, number>,
  mainCurrency: string = DEFAULT_MAIN_CURRENCY,
): number {
  if (!from || !to || from.toUpperCase() === to.toUpperCase()) return value;
  const fromRate = getRateToMain(from, ratesMap, mainCurrency);
  const toRate = getRateToMain(to, ratesMap, mainCurrency);
  if (!fromRate || !toRate) return value;
  return value * (fromRate / toRate);
}

