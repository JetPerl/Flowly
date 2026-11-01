import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  DeviceEventEmitter,
  LayoutAnimation,
  UIManager,
  Image,
  Animated,
  Easing,
  InputAccessoryView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button } from 'heroui-native';
import CategoryIcon from '../../../../../src/components/CategoryIcon';
import { useTransactionDraft } from './../_TransactionDraftContext';
import { API_BASE_URL, DEFAULT_MAIN_CURRENCY, HEADER_SAVE_EVENT, sanitizeNumericInput, getCurrencySymbol } from './../_utils';
import { useMainCurrency } from '../../../../../src/currency/CurrencyContext';

const COLORS = {
  textMain: '#212121',
  textSecondary: '#757575',
  primary: '#2BAF8C',
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function NewTransactionScreen() {
  const router = useRouter();
  const {
    draft,
    setAmount,
    setType,
    setCategory,
    setAccount,
    setTargetAccount,
    setNote,
    setRecipient,
    setPlace,
    setTags,
    setDate,
    amountLabel,
    amountCurrencySymbol,
    formattedDateLabel,
    resetDraft,
    saveDraft,
  } = useTransactionDraft();
  const { mainCurrency } = useMainCurrency();

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [existingOperationId, setExistingOperationId] = useState<number | null>(null);
  const [existingTransferOperationIds, setExistingTransferOperationIds] = useState<string[]>([]);
  const [existingTransferId, setExistingTransferId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [ratesMap, setRatesMap] = useState<Record<string, number> | null>(null);
  const datePickerAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const noteInputRef = useRef<TextInput | null>(null);

  const openDatePicker = useCallback(() => {
    setDatePickerVisible(true);
    Animated.timing(datePickerAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [datePickerAnim]);

  const closeDatePicker = useCallback(() => {
    Animated.timing(datePickerAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setDatePickerVisible(false);
      }
    });
  }, [datePickerAnim]);

  const toggleDatePicker = useCallback(() => {
    if (datePickerVisible) {
      closeDatePicker();
      return;
    }
    openDatePicker();
  }, [closeDatePicker, datePickerVisible, openDatePicker]);

  const params = useLocalSearchParams();
  const prevOperationParam = useRef<string | null>(null);
  const initialTypeFromParams = useMemo(() => {
    const raw = params?.type;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === 'income' || value === 'expense' || value === 'transfer') {
      return value;
    }
    return null;
  }, [params?.type]);

  const isTransfer = draft.type === 'transfer';
  const isEditingExisting = useMemo(
    () => existingOperationId !== null || existingTransferOperationIds.length > 0,
    [existingOperationId, existingTransferOperationIds.length],
  );
  const MAIN_CURRENCY = useMemo(
    () => (mainCurrency || DEFAULT_MAIN_CURRENCY).toUpperCase(),
    [mainCurrency],
  );
  const datePickerAnimatedStyle = useMemo(
    () => ({
      opacity: datePickerAnim,
      maxHeight: datePickerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 620],
      }),
      paddingTop: datePickerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 8],
      }),
      paddingBottom: datePickerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 22],
      }),
      transform: [
        {
          translateY: datePickerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-8, 0],
          }),
        },
      ],
    }),
    [datePickerAnim],
  );

  useEffect(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
  }, [draft.type]);

  useEffect(() => {
    let cancelled = false;
    const loadRates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/rates`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data && typeof data === 'object') {
          setRatesMap(data);
        }
      } catch (e) {
        console.warn('Failed to load rates for preview', e);
      }
    };
    loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isTransfer) {
      setCategory(undefined);
    }
  }, [isTransfer, setCategory]);

  useEffect(() => {
    if (!initialTypeFromParams) return;
    if (params?.operation || params?.operationId) return;
    setType(initialTypeFromParams);
  }, [initialTypeFromParams, params?.operation, params?.operationId, setType]);

  useEffect(() => {
    let cancelled = false;

    const pickFirstCategory = (payload: any) => {
      if (draft.type === 'income' && Array.isArray(payload?.income) && payload.income.length > 0) {
        const cat = payload.income[0];
        return { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, parentName: null };
      }
      if (Array.isArray(payload?.expense) && payload.expense.length > 0) {
        const group = payload.expense[0];
        if (Array.isArray(group.children) && group.children.length > 0) {
          const child = group.children[0];
          return {
            id: child.id,
            name: child.name,
            icon: child.icon,
            color: child.color,
            parentName: group.name ?? null,
          };
        }
        return { id: group.id, name: group.name, icon: group.icon, color: group.color, parentName: null };
      }
      return null;
    };

    const preselect = async () => {
      try {
        if (!draft.account) {
          const res = await fetch(`${API_BASE_URL}/accounts`);
          if (res.ok) {
            const data = await res.json();
            const first = Array.isArray(data) ? data[0] : null;
            if (first && !cancelled) {
              setAccount({
                id: first.id,
                name: first.name || first.full_name || first.short_name || 'Счёт',
                currency: first.currency,
                icon: first.icon || undefined,
                color: first.color || undefined,
              });
            }
          }
        }
        if (!draft.category && !isTransfer) {
          const res = await fetch(`${API_BASE_URL}/categories/tree`);
          if (res.ok) {
            const data = await res.json();
            const firstCategory = pickFirstCategory(data);
            if (firstCategory && !cancelled) {
              setCategory(firstCategory);
            }
          }
        }
      } catch (e) {
        console.warn('Preselect account/category failed', e);
      }
    };

    preselect();
    return () => {
      cancelled = true;
    };
  }, [draft.account, draft.category, draft.type, isTransfer, setAccount, setCategory]);

  useEffect(() => {
    const raw = params?.operation;
    const opParam = typeof raw === 'string' ? raw : null;
    if (prevOperationParam.current === opParam) {
      return;
    }
    prevOperationParam.current = opParam;
    if (!opParam) {
      if (params?.operationId) {
        // ждём загрузку по id
        return;
      }
      // Не трогаем текущий черновик, чтобы не очищать данные при закрытии/возврате
      setExistingOperationId(null);
      setExistingTransferOperationIds([]);
      setExistingTransferId(null);
      setPhotoUri(null);
      setIsPinned(false);
      return;
    }

    // Инициализируем свежий черновик под переданные данные
    resetDraft();
    setExistingOperationId(null);
    setExistingTransferOperationIds([]);
    setExistingTransferId(null);
    try {
      const decoded = decodeURIComponent(opParam);
      const parsed = JSON.parse(decoded);
      const opIdNum = Number(parsed?.id);
      setExistingOperationId(Number.isNaN(opIdNum) ? null : opIdNum);
      if (Array.isArray(parsed?.transferOperationIds)) {
        const ids = parsed.transferOperationIds
          .map((v: any) => String(v))
          .filter((v: string) => v.trim().length > 0);
        setExistingTransferOperationIds(ids);
      }
      if (parsed?.transferId !== undefined && parsed?.transferId !== null) {
        setExistingTransferId(parsed.transferId);
      }

      if (parsed?.type) setType(parsed.type);
      if (parsed?.amount !== undefined) {
        const rawAmount =
          typeof parsed.amount === 'number'
            ? String(parsed.amount)
            : String(parsed.amount || '');
        setAmount(sanitizeNumericInput(rawAmount));
      } else if (parsed?.amountLabel) {
        setAmount(sanitizeNumericInput(String(parsed.amountLabel)));
      }

      if (parsed?.category?.id) {
        setCategory({
          id: parsed.category.id,
          name: parsed.category.name || 'Категория',
          icon: parsed.category.icon || null,
          color: parsed.category.color || null,
          parentName: parsed.category.parentName || null,
        });
      }

      if (parsed?.account?.id) {
        setAccount({
          id: parsed.account.id,
          name: parsed.account.name || 'Счёт',
          currency: parsed.account.currency || parsed.currency,
          icon: parsed.account.icon || null,
          color: parsed.account.color || null,
        });
      }

      if (parsed?.targetAccount?.id) {
        setTargetAccount({
          id: parsed.targetAccount.id,
          name: parsed.targetAccount.name || 'Счёт',
          currency: parsed.targetAccount.currency || parsed.currency,
          icon: parsed.targetAccount.icon || null,
          color: parsed.targetAccount.color || null,
        });
      }

      if (parsed?.date_time || parsed?.dateTime) {
        const d = new Date(parsed.date_time || parsed.dateTime);
        if (!Number.isNaN(d.getTime())) {
          setDate(d);
        }
      }

      if (parsed?.recipient) setRecipient(parsed.recipient);
      if (parsed?.place) setPlace(parsed.place);
      if (parsed?.note) setNote(parsed.note);
      if (parsed?.is_pinned !== undefined) setIsPinned(!!parsed.is_pinned);
      if (parsed?.photo_url || parsed?.photoUrl) {
        const uri = parsed.photo_url || parsed.photoUrl;
        if (typeof uri === 'string' && uri.trim().length > 0) {
          setPhotoUri(uri);
        }
      }
      if (Array.isArray(parsed?.tags)) {
        setTags(
          parsed.tags
            .map((t: any) => ({
              id: t.id,
              name: t.name,
              color: t.color,
            }))
            .filter((t: any) => t.id !== undefined && t.name),
        );
      }
    } catch (e) {
      console.warn('Failed to hydrate draft from params', e);
    }
  }, [
    params?.operation,
    params?.operationId,
    resetDraft,
    setAccount,
    setAmount,
    setCategory,
    setDate,
    setNote,
    setTargetAccount,
    setPlace,
    setRecipient,
    setTags,
    setType,
    setPhotoUri,
    setIsPinned,
  ]);

  useEffect(() => {
    const opId = params?.operationId ? String(params.operationId) : null;
    if (!opId) return;

    let cancelled = false;
    const fetchOp = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/operations/${opId}`);
        if (!res.ok) {
          console.warn('Failed to fetch operation by id', res.status);
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        setExistingOperationId(Number(opId));
        if (data?.type) setType(data.type);
        if (data?.amount !== undefined) {
          setAmount(sanitizeNumericInput(String(data.amount)));
        } else if (data?.amountLabel) {
          setAmount(sanitizeNumericInput(String(data.amountLabel)));
        }

        if (data?.category_id || data?.category) {
          const catObj = data.category || {};
          setCategory({
            id: data.category_id || catObj.id,
            name: catObj.name || 'Категория',
            icon: catObj.icon || catObj?.icon,
            color: catObj.color || catObj?.color,
            parentName: catObj.parentName || null,
          });
        }

        if (data?.account_id || data?.account) {
          const accObj = data.account || {};
          setAccount({
            id: data.account_id || accObj.id,
            name: accObj.name || 'Счёт',
            currency: accObj.currency || data.currency,
            icon: accObj.icon || null,
            color: accObj.color || null,
          });
        }

        if (data?.targetAccount?.id) {
          const t = data.targetAccount;
          setTargetAccount({
            id: t.id,
            name: t.name || 'Счёт',
            currency: t.currency || data.currency,
            icon: t.icon || null,
            color: t.color || null,
          });
        }

        if (data?.date_time || data?.dateTime) {
          const d = new Date(data.date_time || data.dateTime);
          if (!Number.isNaN(d.getTime())) setDate(d);
        }

        if (data?.recipient) setRecipient(data.recipient);
        if (data?.place) setPlace(data.place);
        if (data?.note) setNote(data.note);
        if (data?.is_pinned !== undefined) setIsPinned(!!data.is_pinned);
        if (data?.transfer_id !== undefined && data?.transfer_id !== null) {
          setExistingTransferId(data.transfer_id);
        }
        if (data?.photo_url || data?.photoUrl) {
          const uri = data.photo_url || data.photoUrl;
          if (typeof uri === 'string' && uri.trim().length > 0) {
            setPhotoUri(uri);
          }
        }
        if (Array.isArray(data?.tags)) {
          setTags(
            data.tags
              .map((t: any) => ({
                id: t.id,
                name: t.name,
                color: t.color,
              }))
              .filter((t: any) => t.id !== undefined && t.name),
          );
        }
      } catch (e) {
        console.warn('Failed to fetch operation by id', e);
      }
    };

    fetchOp();
    return () => {
      cancelled = true;
    };
  }, [
    API_BASE_URL,
    params?.operationId,
    sanitizeNumericInput,
    setAccount,
    setAmount,
    setCategory,
    setDate,
    setNote,
    setPlace,
    setRecipient,
    setTags,
    setType,
    setPhotoUri,
    setIsPinned,
  ]);

  useEffect(() => {
    if (params?.duplicate === '1') {
      setDate(new Date());
    }
  }, [params?.duplicate, setDate]);

  const saveOperationToServer = async (amountValue: number) => {
    const amountSafe = Number.isNaN(amountValue) ? 0 : amountValue;

    const buildTagIds = () =>
      Array.isArray(draft.tags) && draft.tags.length > 0
        ? draft.tags
          .map(t => t.id)
          .filter(id => typeof id === 'number' && !Number.isNaN(id))
        : [];

    const photoUrl = photoUri || null;

    // Transfer: создаём две операции, категория = null
    if (isTransfer) {
      if (!draft.account?.id || !draft.targetAccount?.id) {
        Alert.alert('Выберите оба счета', 'Нужен счёт списания и счёт зачисления');
        return false;
      }

      const fromCurrency = (draft.account.currency || draft.currency || DEFAULT_MAIN_CURRENCY).toUpperCase();
      const toCurrency = (draft.targetAccount.currency || DEFAULT_MAIN_CURRENCY).toUpperCase();

      const fetchRatesMap = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/rates`);
          if (!res.ok) return null;
          const data = await res.json();
          return typeof data === 'object' && data !== null ? data : null;
        } catch (e) {
          return null;
        }
      };

      const convertAmount = (value: number, from: string, to: string, rates: any) => {
        if (!rates) return value;
        const rFrom = typeof rates[from] === 'number' ? rates[from] : null;
        const rTo = typeof rates[to] === 'number' ? rates[to] : null;
        if (!rFrom || !rTo) return value;
        // rates храним как USD per unit (или аналогичный базовый), поэтому переводим через отношение from/to
        return value * (rFrom / rTo);
      };

      const rates = await fetchRatesMap();
      const incomingAmountRaw = convertAmount(amountSafe, fromCurrency, toCurrency, rates);
      const incomingAmount = Number(incomingAmountRaw.toFixed(2));

      const transferId =
        existingTransferId !== null && existingTransferId !== undefined
          ? existingTransferId
          : Date.now();
      const common = {
        type: 'transfer' as const,
        category_id: null,
        merchant: '',
        place: draft.place || '',
        recipient: '',
        note: draft.note || '',
        photo_url: photoUrl,
        is_pinned: isPinned,
        date_time: draft.date.toISOString(),
        tag_ids: buildTagIds(),
        transfer_id: transferId,
      };

      const outPayload = {
        ...common,
        account_id: draft.account.id,
        related_account_id: draft.targetAccount.id,
        amount: amountSafe,
        currency: fromCurrency,
        type: 'expense' as const,
      };
      const inPayload = {
        ...common,
        account_id: draft.targetAccount.id,
        related_account_id: draft.account.id,
        amount: Number.isNaN(incomingAmount) ? amountSafe : incomingAmount,
        currency: toCurrency,
        type: 'income' as const,
      };

      console.log('Saving transfer payloads', outPayload, inPayload);

      const resolveNumericId = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return null;
        const num = typeof val === 'number' ? val : Number(val);
        return Number.isFinite(num) ? num : null;
      };

      const existingExpenseId =
        existingTransferOperationIds.length > 0
          ? resolveNumericId(existingTransferOperationIds[0])
          : null;
      const existingIncomeId =
        existingTransferOperationIds.length > 1
          ? resolveNumericId(existingTransferOperationIds[1])
          : null;
      const isEditingTransfer = existingExpenseId !== null && existingIncomeId !== null;

      try {
        if (isEditingTransfer) {
          const resOut = await fetch(`${API_BASE_URL}/operations/${existingExpenseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(outPayload),
          });
          if (!resOut.ok) {
            const text = await resOut.text().catch(() => '');
            const message = text ? `${resOut.status}: ${text}` : `Код ответа: ${resOut.status}`;
            Alert.alert('Не удалось обновить перевод (списание)', message);
            return false;
          }

          const resIn = await fetch(`${API_BASE_URL}/operations/${existingIncomeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inPayload),
          });
          if (!resIn.ok) {
            const text = await resIn.text().catch(() => '');
            const message = text ? `${resIn.status}: ${text}` : `Код ответа: ${resIn.status}`;
            Alert.alert('Не удалось обновить перевод (зачисление)', message);
            return false;
          }

          DeviceEventEmitter.emit('operation:saved', {
            transfer_id: transferId,
            ids: existingTransferOperationIds,
          });
          setSaveError(null);
          return true;
        } else {
          const resOut = await fetch(`${API_BASE_URL}/operations/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(outPayload),
          });
          if (!resOut.ok) {
            const text = await resOut.text().catch(() => '');
            const message = text ? `${resOut.status}: ${text}` : `Код ответа: ${resOut.status}`;
            Alert.alert('Не удалось сохранить перевод (списание)', message);
            return false;
          }

          const outData = await resOut.json().catch(() => null);
          const createdOutId = resolveNumericId(outData?.id);

          const resIn = await fetch(`${API_BASE_URL}/operations/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inPayload),
          });
          if (!resIn.ok) {
            const text = await resIn.text().catch(() => '');
            const message = text ? `${resIn.status}: ${text}` : `Код ответа: ${resIn.status}`;
            Alert.alert('Не удалось сохранить перевод (зачисление)', message);
            return false;
          }

          const inData = await resIn.json().catch(() => null);
          const createdInId = resolveNumericId(inData?.id);

          const createdIds = [createdOutId, createdInId].filter(
            (v): v is number => v !== null,
          );
          setExistingTransferOperationIds(createdIds.map(String));
          setExistingTransferId(transferId);
          DeviceEventEmitter.emit('operation:saved', {
            transfer_id: transferId,
            ids: createdIds,
          });
          setSaveError(null);
          return true;
        }
      } catch (e: any) {
        const msg = e?.message || 'Неизвестная ошибка сети';
        Alert.alert('Ошибка сети', msg);
        setSaveError(msg);
        return false;
      }
    }

    // Обычная операция
    if (!draft.account?.id || !draft.category?.id) {
      console.warn('Не хватает account_id или category_id для отправки операции');
      return false;
    }

    const payload = {
      account_id: draft.account.id,
      category_id: draft.category.id,
      type: draft.type,
      amount: amountSafe,
      currency: (draft.currency || DEFAULT_MAIN_CURRENCY).toUpperCase(),
      merchant: draft.recipient || '',
      place: draft.place || '',
      recipient: draft.recipient || '',
      note: draft.note || '',
      photo_url: photoUrl,
      is_pinned: isPinned,
      date_time: draft.date.toISOString(),
      tag_ids: buildTagIds(),
      related_account_id: null,
      transfer_id: null,
    };

    console.log('Saving operation payload', payload);

    const numericId = existingOperationId && !Number.isNaN(existingOperationId)
      ? Number(existingOperationId)
      : null;
    const isEditing = numericId !== null;
    const url = isEditing
      ? `${API_BASE_URL}/operations/${numericId}`
      : `${API_BASE_URL}/operations/`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('Ошибка сохранения операции в БД: ', res.status, text);
        const message = text ? `${res.status}: ${text}` : `Код ответа: ${res.status}`;
        Alert.alert('Не удалось сохранить', message);
        setSaveError(message);
        return false;
      }

      const data = await res.json().catch(() => null);
      const persistedId = data?.id ?? numericId ?? null;
      console.log('Операция сохранена в БД', data);
      DeviceEventEmitter.emit('operation:saved', {
        id: persistedId,
        ...payload,
      });
      setSaveError(null);
      if (persistedId && !existingOperationId) {
        setExistingOperationId(persistedId);
      }
      return true;
    } catch (e: any) {
      const msg = e?.message || 'Неизвестная ошибка сети';
      console.warn('Ошибка сети при сохранении операции', e);
      Alert.alert('Ошибка сети', msg);
      setSaveError(msg);
      return false;
    }
  };

  const deleteOperations = async (idsToDelete: string[]) => {
    try {
      setIsDeleting(true);
      for (const id of idsToDelete) {
        const res = await fetch(`${API_BASE_URL}/operations/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          const msg = text ? `${res.status}: ${text}` : `Код ответа: ${res.status}`;
          Alert.alert('Не удалось удалить', msg);
          return;
        }
      }
      DeviceEventEmitter.emit('operation:deleted', { id: existingOperationId, transfer_ids: existingTransferOperationIds });
      router.back();
      setTimeout(() => resetDraft(), 0);
    } catch (e: any) {
      const msg = e?.message || 'Неизвестная ошибка сети';
      Alert.alert('Ошибка сети', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    if (isDeleting) return;
    const idsToDelete =
      isTransfer && existingTransferOperationIds.length > 0
        ? existingTransferOperationIds
        : existingOperationId && !Number.isNaN(existingOperationId)
          ? [String(existingOperationId)]
          : [];
    if (idsToDelete.length === 0) return;

    Alert.alert('Вы действительно хотите удалить эту операцию?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => deleteOperations(idsToDelete),
      },
    ]);
  };

  const handleDuplicate = () => {
    const payload: Record<string, any> = {
      type: draft.type,
      amount: draft.amount,
      amountLabel,
      currency: draft.currency,
      recipient: draft.recipient,
      place: draft.place,
      note: draft.note,
      tags: draft.tags,
      date_time: draft.date.toISOString(),
    };

    if (draft.category) {
      payload.category = {
        id: draft.category.id,
        name: draft.category.name,
        icon: draft.category.icon,
        color: draft.category.color,
        parentName: draft.category.parentName,
      };
    }

    if (draft.account) {
      payload.account = {
        id: draft.account.id,
        name: draft.account.name,
        currency: draft.account.currency,
        icon: draft.account.icon,
        color: draft.account.color,
      };
    }

    if (draft.targetAccount) {
      payload.targetAccount = {
        id: draft.targetAccount.id,
        name: draft.targetAccount.name,
        currency: draft.targetAccount.currency,
        icon: draft.targetAccount.icon,
        color: draft.targetAccount.color,
      };
    }

    router.back();
    setTimeout(() => {
      DeviceEventEmitter.emit('operation:duplicate', payload);
    }, 0);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const amountValue = Number(sanitizeNumericInput(draft.amount));

    if (!draft.account?.id) {
      Alert.alert('Выберите счёт', 'Это поле обязательно для сохранения');
      return;
    }

    if (isTransfer && !draft.targetAccount?.id) {
      Alert.alert('Выберите счёт получателя', 'Нужен счёт зачисления для перевода');
      return;
    }

    if (!isTransfer && !draft.category?.id) {
      Alert.alert('Выберите категорию', 'Категория обязательна для операции');
      return;
    }

    if (Number.isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Введите сумму', 'Укажите сумму операции больше нуля');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveOperationToServer(amountValue);
      if (saved) {
        await saveDraft();
        router.back();
        setTimeout(() => resetDraft(), 0);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const headerSaveHandlerRef = useRef(handleSave);

  useEffect(() => {
    headerSaveHandlerRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(HEADER_SAVE_EVENT, () => {
      headerSaveHandlerRef.current?.();
    });
    return () => subscription.remove();
  }, []);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к фото, чтобы прикрепить изображение.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';

      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
        );
        if (manipulated.base64) {
          setPhotoUri(`data:${mime};base64,${manipulated.base64}`);
          return;
        }
      } catch (e) {
        console.warn('Image compress failed, using original', e);
      }

      if (asset.base64) {
        setPhotoUri(`data:${mime};base64,${asset.base64}`);
      } else {
        setPhotoUri(asset.uri);
      }
    }
  };

  const handleDateChange = (_: any, nextDate?: Date) => {
    if (!nextDate) return;
    const merged = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth(),
      nextDate.getDate(),
      draft.date.getHours(),
      draft.date.getMinutes(),
    );
    setDate(merged);
  };

  const handleTimeChange = (_: any, nextTime?: Date) => {
    if (!nextTime) return;
    const next = new Date(
      draft.date.getFullYear(),
      draft.date.getMonth(),
      draft.date.getDate(),
      nextTime.getHours(),
      nextTime.getMinutes(),
    );
    setDate(next);
  };

  const renderCategoryValue = () => {
    if (!draft.category) {
      return <Text style={styles.operationFieldValueMuted}>Выберите категорию</Text>;
    }
    return (
      <View style={styles.operationFieldValueWithIcon}>
        <CategoryIcon
          name={draft.category.icon || 'wallet'}
          color={draft.category.color || undefined}
          backgroundColor="transparent"
          size={28}
          style={styles.operationFieldCategoryIcon}
        />
        <Text style={styles.operationFieldValue}>{draft.category.name}</Text>
      </View>
    );
  };

  const renderAccountValue = () => {
    if (!draft.account) {
      return <Text style={styles.operationFieldValueMuted}>Выберите счёт</Text>;
    }
    return (
      <View style={styles.operationFieldValueWithIcon}>
        <CategoryIcon
          name={draft.account.icon || 'wallet'}
          color={draft.account.color || undefined}
          backgroundColor="transparent"
          size={28}
          style={styles.operationFieldCategoryIcon}
        />
        <Text style={styles.operationFieldValue}>{draft.account.name}</Text>
      </View>
    );
  };

  const renderTargetAccountValue = () => {
    if (!draft.targetAccount) {
      return <Text style={styles.operationFieldValueMuted}>Выберите счёт получателя</Text>;
    }
    return (
      <View style={styles.operationFieldValueWithIcon}>
        <CategoryIcon
          name={draft.targetAccount.icon || 'wallet'}
          color={draft.targetAccount.color || undefined}
          backgroundColor="transparent"
          size={28}
          style={styles.operationFieldCategoryIcon}
        />
        <Text style={styles.operationFieldValue}>{draft.targetAccount.name}</Text>
      </View>
    );
  };

  const renderTagsValue = () => {
    if (!draft.tags || draft.tags.length === 0) {
      return <Text style={styles.operationFieldValueMuted}>Добавить</Text>;
    }

    const visibleTags = draft.tags.slice(0, 3);
    const hiddenCount = draft.tags.length - visibleTags.length;

    return (
      <View style={styles.tagsChips}>
        {visibleTags.map(tag => (
          <View
            key={tag.id}
            style={[
              styles.tagBadge,
              tag.color ? { borderColor: tag.color } : null,
            ]}
          >
            <FontAwesome6
              name="tag"
              size={14}
              color={tag.color || COLORS.textSecondary}
              style={styles.tagBadgeIcon}
            />
            <Text style={styles.tagBadgeText} numberOfLines={1}>
              {tag.name}
            </Text>
          </View>
        ))}
        {hiddenCount > 0 && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>+{hiddenCount}</Text>
          </View>
        )}
      </View>
    );
  };

  const convertAmountPreview = useCallback(
    (value: number, from: string, to: string) => {
      if (from === to) return value;
      const upperFrom = from.toUpperCase();
      const upperTo = to.toUpperCase();
      const rFrom =
        (ratesMap && typeof ratesMap[upperFrom] === 'number' ? ratesMap[upperFrom] : null) ||
        (upperFrom === upperTo ? 1 : null) ||
        (upperFrom === MAIN_CURRENCY ? 1 : null);
      const rTo =
        (ratesMap && typeof ratesMap[upperTo] === 'number' ? ratesMap[upperTo] : null) ||
        (upperTo === upperFrom ? 1 : null) ||
        (upperTo === MAIN_CURRENCY ? 1 : null);
      if (!rFrom || !rTo) return value;
      return value * (rFrom / rTo);
    },
    [ratesMap, MAIN_CURRENCY],
  );

  const convertedAmountLabel = useMemo(() => {
    const sanitized = sanitizeNumericInput(draft.amount || '0');
    const num = Number(sanitized);
    const baseValue = Number.isFinite(num) ? num : 0;
    const fromCurrency = (draft.currency || DEFAULT_MAIN_CURRENCY).toUpperCase();
    const converted = convertAmountPreview(baseValue, fromCurrency, MAIN_CURRENCY);
    const hasFraction = Math.round(converted * 100) % 100 !== 0;
    const formatted = converted.toLocaleString('ru-RU', {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
    const sign = draft.type === 'income' ? '+ ' : draft.type === 'transfer' ? '± ' : '− ';
    const symbol = getCurrencySymbol(MAIN_CURRENCY);
    return `${sign}${formatted} ${symbol}`;
  }, [draft.amount, draft.currency, draft.type, MAIN_CURRENCY, convertAmountPreview]);

  const scrollNoteIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 140);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Новая операция',
          headerShown: true,
        }}
      />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.amountInputWrapper}>
          <View style={styles.amountInputRow}>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              inputMode="decimal"
              // autoFocus={!isEditingExisting}
              placeholder="0"
              placeholderTextColor={COLORS.textMain}
              value={draft.amount}
              onChangeText={setAmount}
              returnKeyType="done"
              selectionColor={COLORS.primary}
              inputAccessoryViewID={Platform.OS === 'ios' ? 'amountAccessory' : undefined}
            />
            <Text style={styles.amountInputSymbol}>{amountCurrencySymbol}</Text>
          </View>
          <Text style={styles.amountInputHint}>{convertedAmountLabel}</Text>
        </View>

        <View style={styles.operationDetailsBlock}>
          {!isTransfer && (
            <TouchableOpacity
              style={styles.operationFieldRow}
              activeOpacity={0.7}
              onPress={() => router.push('/transactions/new/category')}
            >
              <Text style={styles.operationFieldLabel}>Категория</Text>
              <View style={styles.operationFieldValueWithIcon}>
                {renderCategoryValue()}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.operationFieldRow}
            activeOpacity={0.7}
            onPress={() => router.push('/transactions/new/account')}
          >
            <Text style={styles.operationFieldLabel}>
              {isTransfer ? 'Со счёта' : 'Счёт'}
            </Text>
            <View style={styles.operationFieldValueWithIcon}>
              {renderAccountValue()}
            </View>
          </TouchableOpacity>

          {isTransfer && (
            <TouchableOpacity
              style={styles.operationFieldRow}
              activeOpacity={0.7}
              onPress={() => router.push('/transactions/new/account?target=1')}
            >
              <Text style={styles.operationFieldLabel}>На счёт</Text>
              <View style={styles.operationFieldValueWithIcon}>
                {renderTargetAccountValue()}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.operationFieldRow}
            activeOpacity={0.7}
            onPress={toggleDatePicker}
          >
            <Text style={styles.operationFieldLabel}>Дата</Text>
            <View style={styles.operationFieldValueWithIcon}>
              <Text style={styles.operationFieldValue}>{formattedDateLabel}</Text>
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[styles.datePickerBlock, styles.datePickerAnimated, datePickerAnimatedStyle]}
            pointerEvents={datePickerVisible ? 'auto' : 'none'}
          >
            <DateTimePicker
              value={draft.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              locale="ru-RU"
              onChange={handleDateChange}
              style={styles.inlinePicker}
              accentColor={COLORS.primary}
            />

            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Время</Text>
              <View style={styles.compactTimePickerWrapper}>
                <DateTimePicker
                  value={draft.date}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={handleTimeChange}
                  style={styles.compactTimePicker}
                  locale="ru-RU"
                  textColor={COLORS.textMain}
                  accentColor={COLORS.primary}
                />
              </View>
            </View>
            <View style={styles.timeDivider} />
          </Animated.View>

          <TouchableOpacity
            style={styles.operationFieldRow}
            activeOpacity={0.7}
            onPress={() => router.push('/transactions/new/tags/tegs')}
          >
            <Text style={styles.operationFieldLabel}>Метки</Text>
            <View style={[styles.operationFieldValueWithIcon, styles.tagsValueWrapper]}>
              {renderTagsValue()}
            </View>
          </TouchableOpacity>

          {!isTransfer && (
            <View style={styles.operationFieldRow}>
              <Text style={styles.operationFieldLabel}>Получатель</Text>
              <TextInput
                style={[styles.operationFieldInput, { flex: 1 }]}
                placeholder="Добавьте получателя"
                placeholderTextColor="#B0B3B8"
                value={draft.recipient}
                onChangeText={setRecipient}
                returnKeyType="done"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.operationFieldRow}>
            <Text style={styles.operationFieldLabel}>Примечание</Text>
            <TextInput
              ref={noteInputRef}
              style={[styles.operationFieldInput, { flex: 1 }]}
              placeholder="Добавьте примечание"
              placeholderTextColor="#B0B3B8"
              value={draft.note}
              onChangeText={setNote}
              onFocus={scrollNoteIntoView}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>
        </View>

        <Button
          variant="primary"
          onPress={handleSave}
          isDisabled={isSaving || isDeleting}
          style={styles.operationPrimaryButton}
        >
          <Text style={styles.operationPrimaryButtonText}>
            {isSaving ? 'Сохраняем...' : isDeleting ? 'Удаляем...' : 'Сохранить операцию'}
          </Text>
        </Button>

        {photoUri ? (
          <View style={styles.photoPreviewCard}>
            <Image source={{ uri: photoUri }} style={styles.photoPreviewImage} resizeMode="cover" />
          </View>
        ) : null}

        <View style={styles.operationActionsGrid}>
          {[
            {
              label: 'Дублировать',
              icon: <FontAwesome6 name="copy" size={18} color={COLORS.primary} />,
              disabled:
                (!existingOperationId && existingTransferOperationIds.length === 0) ||
                isSaving ||
                isDeleting,
              onPress: handleDuplicate,
            },
            {
              label: isPinned ? 'Открепить' : 'Закрепить',
              icon: (
                <MaterialCommunityIcons
                  name={isPinned ? 'pin-off' : 'pin'}
                  size={18}
                  color={COLORS.primary}
                />
              ),
              disabled: isSaving || isDeleting,
              onPress: () => setIsPinned(prev => !prev),
            },
            {
              label: 'Фото',
              icon: <Ionicons name="camera" size={18} color={COLORS.primary} />,
              disabled: false,
              onPress: pickPhoto,
            },
            {
              label: 'Удалить',
              icon: <FontAwesome6 name="trash-alt" size={18} color="#E53935" />,
              textColor: '#E53935',
              disabled:
                (!existingOperationId && existingTransferOperationIds.length === 0) ||
                isSaving ||
                isDeleting,
              onPress: handleDelete,
            },
          ].map(action => (
            <Button
              key={action.label}
              variant="danger-soft"
              style={[
                styles.operationActionPill,
                (action.disabled || isDeleting || isSaving) && styles.operationActionPillDisabled,
              ]}
              onPress={action.disabled ? undefined : action.onPress}
              isDisabled={action.disabled}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {typeof action.icon === 'string' ? (
                  <Text
                    style={[
                      styles.operationActionIcon,
                      (action.disabled || isDeleting || isSaving) && styles.operationActionIconDisabled,
                    ]}
                  >
                    {action.icon}
                  </Text>
                ) : (
                  <View
                    style={[
                      styles.operationActionIconElement,
                      (action.disabled || isDeleting || isSaving) && styles.operationActionIconElementDisabled,
                    ]}
                  >
                    {action.icon}
                  </View>
                )}
                <Text
                  style={[
                    styles.operationActionText,
                    action.textColor ? { color: action.textColor } : null,
                    (action.disabled || isDeleting || isSaving) && styles.operationActionTextDisabled,
                  ]}
                >
                  {action.label}
                </Text>
              </View>
            </Button>
          ))}
        </View>
      </ScrollView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="amountAccessory">
          <View style={{ height: 0 }} />
        </InputAccessoryView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 80,
  },
  amountInputWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
    paddingVertical: 16,
  },
  amountInputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
  },
  amountInputSymbol: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  amountInput: {
    minWidth: 40,
    textAlign: 'right',
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.textMain,
    paddingVertical: 4,
  },
  amountInputHint: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  operationDetailsBlock: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginHorizontal: 0,
    marginTop: 12,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  datePickerBlock: {
    paddingBottom: 0,
    paddingTop: 0,
  },
  datePickerAnimated: {
    overflow: 'hidden',
  },
  inlinePicker: { //календарь
    minWidth: '104%',
    alignSelf: 'center',
    marginHorizontal: -12,
    minHeight: 345,
    transform: [{ scale: 1 }],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 16,
    color: COLORS.textMain,
    fontWeight: '600',
  },
  compactTimePickerWrapper: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactTimePicker: {
    minWidth: 120,
    height: 34,
  },
  timeDivider: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8EAEE',
  },
  operationFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAEE',
  },
  operationFieldLabel: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  operationFieldValue: {
    fontSize: 18,
    color: COLORS.textMain,
  },
  operationFieldValueMuted: {
    fontSize: 18,
    lineHeight: 22,
    color: '#B0B3B8',
  },
  operationFieldValueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagsValueWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  operationFieldCategoryIcon: {
    marginRight: 2,
  },
  operationFieldIcon: {
    fontSize: 18,
    color: '#B0B3B8',
    marginRight: 6,
  },
  operationFieldInput: {
    fontSize: 18,
    color: COLORS.textMain,
    textAlign: 'right',
    minWidth: 120,
    paddingVertical: 4,
  },
  operationPrimaryButton: {
    marginBottom: 12,
    marginHorizontal: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  operationPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  tagsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(43,175,140,0.2)',
    backgroundColor: 'rgba(43,175,140,0.08)',
  },
  tagBadgeIcon: {
    marginRight: 6,
  },
  tagBadgeText: {
    fontSize: 13,
    color: COLORS.textMain,
    fontWeight: '600',
  },
  operationActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  operationActionPill: {
    width: '48%',
    backgroundColor: '#F6F6F8',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  operationActionIcon: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 10,
  },
  operationActionIconElement: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  operationActionText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  operationActionPillDisabled: {
    backgroundColor: '#F0F1F3',
  },
  operationActionTextDisabled: {
    color: '#C3C5CD',
  },
  operationActionIconDisabled: {
    color: '#C3C5CD',
  },
  operationActionIconElementDisabled: {
    opacity: 0.5,
    marginRight: 10,
  },
  photoPreviewCard: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
  },
  photoPreviewImage: {
    width: '100%',
    aspectRatio: 1,
  },
});
