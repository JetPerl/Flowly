import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type MainCurrencyContext = {
  mainCurrency: string;
  setMainCurrency: (code: string) => void;
};

const Context = createContext<MainCurrencyContext | undefined>(undefined);
const DEFAULT_MAIN_CURRENCY = 'BYN';

export const MainCurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [mainCurrency, setMainCurrency] = useState<string>(DEFAULT_MAIN_CURRENCY);

  const value = useMemo(
    () => ({
      mainCurrency,
      setMainCurrency,
    }),
    [mainCurrency],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useMainCurrency = (): MainCurrencyContext => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('useMainCurrency must be used within MainCurrencyProvider');
  }
  return ctx;
};
