import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useMainCurrency } from '../currency/CurrencyContext';
import {
  DEFAULT_MAIN_CURRENCY,
  formatAmountLabel,
  formatDateTimeRu,
  getCurrencySymbol,
  sanitizeNumericInput,
  type TransactionType,
} from '../utils/_utils';

export type DraftCategory = {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  parentName?: string | null;
};

export type DraftAccount = {
  id: number;
  name: string;
  currency?: string | null;
  color?: string | null;
  icon?: string | null;
  balance?: number | null;
};

export type DraftTag = {
  id: number;
  name: string;
  color?: string | null;
};

export type TransactionDraft = {
  type: TransactionType;
  amount: string;
  currency: string;
  category?: DraftCategory;
  account?: DraftAccount;
  targetAccount?: DraftAccount;
  date: Date;
  tags: DraftTag[];
  recipient?: string;
  place?: string;
  placeLat?: number | null;
  placeLng?: number | null;
  note?: string;
};

type TransactionDraftContextValue = {
  draft: TransactionDraft;
  amountLabel: string;
  amountCurrencySymbol: string;
  formattedDateLabel: string;
  setType: (type: TransactionType) => void;
  setAmount: (amount: string) => void;
  setCategory: (category?: DraftCategory) => void;
  setAccount: (account?: DraftAccount) => void;
  setTargetAccount: (account?: DraftAccount) => void;
  setDate: (date: Date) => void;
  setTags: (tags: DraftTag[]) => void;
  toggleTag: (tag: DraftTag) => void;
  setRecipient: (recipient: string) => void;
  setPlace: (place?: string, lat?: number | null, lng?: number | null) => void;
  setNote: (note: string) => void;
  resetDraft: () => void;
  saveDraft: () => Promise<TransactionDraft>;
};

const TransactionDraftContext = createContext<TransactionDraftContextValue | undefined>(undefined);

const buildInitialDraft = (currencyCode: string): TransactionDraft => ({
  type: 'expense',
  amount: '',
  currency: currencyCode,
  date: new Date(),
  tags: [],
  recipient: '',
  place: '',
  placeLat: null,
  placeLng: null,
  note: '',
  targetAccount: undefined,
});

export const TransactionDraftProvider = ({ children }: { children: React.ReactNode }) => {
  const { mainCurrency } = useMainCurrency();
  const defaultCurrency = useMemo(
    () => (mainCurrency || DEFAULT_MAIN_CURRENCY).toUpperCase(),
    [mainCurrency],
  );

  const [draft, setDraft] = useState<TransactionDraft>(buildInitialDraft(defaultCurrency));

  const resetDraft = useCallback(() => {
    setDraft(buildInitialDraft(defaultCurrency));
  }, [defaultCurrency]);

  const setType = useCallback((type: TransactionType) => {
    setDraft(prev => ({ ...prev, type }));
  }, []);

  const setAmount = useCallback((amount: string) => {
    setDraft(prev => ({
      ...prev,
      amount: sanitizeNumericInput(amount),
    }));
  }, []);

  const setCategory = useCallback((category?: DraftCategory) => {
    setDraft(prev => ({ ...prev, category }));
  }, []);

  const setAccount = useCallback((account?: DraftAccount) => {
    setDraft(prev => ({
      ...prev,
      account,
      currency: account?.currency ? account.currency.toUpperCase() : prev.currency,
    }));
  }, []);

  const setTargetAccount = useCallback((account?: DraftAccount) => {
    setDraft(prev => ({
      ...prev,
      targetAccount: account,
    }));
  }, []);

  const setDate = useCallback((date: Date) => {
    setDraft(prev => ({ ...prev, date }));
  }, []);

  const setTags = useCallback((tags: DraftTag[]) => {
    setDraft(prev => ({ ...prev, tags }));
  }, []);

  const toggleTag = useCallback((tag: DraftTag) => {
    setDraft(prev => {
      const exists = prev.tags.some(t => t.id === tag.id);
      return {
        ...prev,
        tags: exists ? prev.tags.filter(t => t.id !== tag.id) : [...prev.tags, tag],
      };
    });
  }, []);

  const setRecipient = useCallback((recipient: string) => {
    setDraft(prev => ({ ...prev, recipient }));
  }, []);

  const setPlace = useCallback((place?: string, lat?: number | null, lng?: number | null) => {
    setDraft(prev => ({
      ...prev,
      place: place || '',
      placeLat: lat ?? null,
      placeLng: lng ?? null,
    }));
  }, []);

  const setNote = useCallback((note: string) => {
    setDraft(prev => ({ ...prev, note }));
  }, []);

  const amountLabel = useMemo(
    () => formatAmountLabel(draft.amount, draft.type, draft.currency),
    [draft.amount, draft.type, draft.currency],
  );

  const amountCurrencySymbol = useMemo(
    () => getCurrencySymbol(draft.currency),
    [draft.currency],
  );

  const formattedDateLabel = useMemo(
    () => formatDateTimeRu(draft.date),
    [draft.date],
  );

  const saveDraft = useCallback(async () => {
    return draft;
  }, [draft]);

  const value: TransactionDraftContextValue = useMemo(
    () => ({
      draft,
      amountLabel,
      amountCurrencySymbol,
      formattedDateLabel,
      setType,
      setAmount,
      setCategory,
      setAccount,
      setTargetAccount,
      setDate,
      setTags,
      toggleTag,
      setRecipient,
      setPlace,
      setNote,
      resetDraft,
      saveDraft,
    }),
    [
      amountCurrencySymbol,
      amountLabel,
      draft,
      formattedDateLabel,
      resetDraft,
      saveDraft,
      setAccount,
      setTargetAccount,
      setAmount,
      setCategory,
      setDate,
      setTags,
      toggleTag,
      setRecipient,
      setPlace,
      setNote,
      setType,
    ],
  );

  return (
    <TransactionDraftContext.Provider value={value}>
      {children}
    </TransactionDraftContext.Provider>
  );
};

export const useTransactionDraft = () => {
  const ctx = useContext(TransactionDraftContext);
  if (!ctx) {
    throw new Error('useTransactionDraft must be used within TransactionDraftProvider');
  }
  return ctx;
};
