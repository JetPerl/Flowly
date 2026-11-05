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
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import CategoryIcon from '../../../../src/components/CategoryIcon';
import { useTransactionDraft } from '../../../../src/context/_TransactionDraftContext';
import {
  API_BASE_URL,
  DEFAULT_MAIN_CURRENCY,
  HEADER_SAVE_EVENT,
  sanitizeNumericInput,
  getCurrencySymbol,
} from '../../../../src/utils/_utils';
import { useMainCurrency } from '../../../../src/currency/CurrencyContext';
import { apiRequest, uploadImageFile } from '../../../../src/api/client';

const COLORS = {
  textMain: '#212121',
  textSecondary: '#757575',
  primary: '#2BAF8C',
};

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
const scrollRef = useRef<any>(null);
const noteInputRef = useRef<any>(null);

  const toggleDatePicker = useCallback(() => {
    setDatePickerVisible(prev => !prev);
  }, []);

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

  const resolvePhotoUrl = (uri: string | null): string | null => {
    if (!uri) return null;
    if (
      uri.startsWith('file://') ||
      uri.startsWith('data:') ||
      uri.startsWith('http://') ||
      uri.startsWith('https://')
    ) {
      return uri;
    }
    const cleanPath = uri.startsWith('/') ? uri : `/${uri}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const isTransfer = draft.type === 'transfer';
  const MAIN_CURRENCY = useMemo(
    () => (mainCurrency || DEFAULT_MAIN_CURRENCY).toUpperCase(),
    [mainCurrency],
  );

  useEffect(() => {
    let cancelled = false;
    const loadRates = async () => {
      try {
        const data = await apiRequest<Record<string, number>>('/rates');
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
        return;
      }
      setExistingOperationId(null);
      setExistingTransferOperationIds([]);
      setExistingTransferId(null);
      setPhotoUri(null);
      setIsPinned(false);
      return;
    }

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
  ]);

  useEffect(() => {
    const opId = params?.operationId ? String(params.operationId) : null;
    if (!opId) return;

    let cancelled = false;
    const fetchOp = async () => {
      try {
        const data = await apiRequest<any>(`/operations/${opId}`);
        if (cancelled || !data) return;

        setExistingOperationId(Number(opId));
        if (data?.type) {
          const lowerType = String(data.type).toLowerCase();
          if (lowerType === 'income' || lowerType === 'expense' || lowerType === 'transfer') {
            setType(lowerType);
          }
        }
        if (data?.amount !== undefined) {
          setAmount(sanitizeNumericInput(String(data.amount)));
        }

        const catId = data?.categoryId ?? data?.category_id ?? data?.category?.id;
        if (catId) {
          setCategory({
            id: catId,
            name: (typeof data.category === 'string' ? data.category : data.category?.name) || 'Категория',
            icon: data.categoryIcon ?? data.category?.icon ?? null,
            color: data.categoryColor ?? data.category?.color ?? null,
            parentName: null,
          });
        }

        const accId = data?.accountId ?? data?.account_id ?? data?.account?.id;
        if (accId) {
          setAccount({
            id: accId,
            name: (typeof data.account === 'string' ? data.account : data.account?.name) || 'Счёт',
            currency: data.currency,
            icon: data.accountIcon ?? data.account?.icon ?? null,
            color: data.accountColor ?? data.account?.color ?? null,
          });
        }

        if (data?.dateTime || data?.date_time) {
          const d = new Date(data.dateTime || data.date_time);
          if (!Number.isNaN(d.getTime())) setDate(d);
        }

        if (data?.recipient !== undefined) setRecipient(data.recipient || '');
        if (data?.place !== undefined) setPlace(data.place || '');
        if (data?.note !== undefined) setNote(data.note || '');
        if (data?.isPinned !== undefined || data?.is_pinned !== undefined) {
          setIsPinned(Boolean(data.isPinned ?? data.is_pinned));
        }
        if (data?.transferId !== undefined || data?.transfer_id !== undefined) {
          setExistingTransferId(data.transferId ?? data.transfer_id);
        }
        if (data?.photoUrl || data?.photo_url) {
          setPhotoUri(data.photoUrl || data.photo_url);
        }
      } catch (e) {
        console.warn('Failed to fetch operation by id', e);
      }
    };

    fetchOp();
    return () => {
      cancelled = true;
    };
  }, [params?.operationId, setAccount, setAmount, setCategory, setDate, setNote, setPlace, setRecipient, setType]);

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

    const currencyCode = (
      draft.currency ||
      draft.account?.currency ||
      DEFAULT_MAIN_CURRENCY
    ).toUpperCase();

    if (isTransfer) {
      if (!draft.account?.id || !draft.targetAccount?.id) {
        Alert.alert('Выберите оба счета', 'Нужен счёт списания и счёт зачисления');
        return false;
      }

      const fromCurrency = (draft.account.currency || currencyCode).toUpperCase();
      const toCurrency = (draft.targetAccount.currency || DEFAULT_MAIN_CURRENCY).toUpperCase();

      const fetchRatesMap = async () => {
        try {
          return await apiRequest<Record<string, number>>('/rates');
        } catch {
          return null;
        }
      };

      const convertAmount = (value: number, from: string, to: string, rates: any) => {
        if (!rates) return value;
        const rFrom = typeof rates[from] === 'number' ? rates[from] : null;
        const rTo = typeof rates[to] === 'number' ? rates[to] : null;
        if (!rFrom || !rTo) return value;
        return value * (rFrom / rTo);
      };

      const rates = await fetchRatesMap();
      const incomingAmountRaw = convertAmount(amountSafe, fromCurrency, toCurrency, rates);
      const incomingAmount = Number(incomingAmountRaw.toFixed(2));

      const editOperationId =
        existingTransferOperationIds.length > 0
          ? Number(existingTransferOperationIds[0])
          : existingOperationId;

      const isEditingTransfer = editOperationId !== null && !Number.isNaN(editOperationId);

      try {
        if (isEditingTransfer) {
          const patchPayload = {
            amount: amountSafe,
            currency: fromCurrency,
            accountId: draft.account.id,
            relatedAccountId: draft.targetAccount.id,
            dateTime: draft.date.toISOString(),
            note: draft.note || '',
            place: draft.place || '',
            photoUrl: photoUri || null,
            isPinned,
            tagIds: buildTagIds(),
          };

          await apiRequest(`/operations/${editOperationId}`, {
            method: 'PATCH',
            body: JSON.stringify(patchPayload),
          });

          DeviceEventEmitter.emit('operation:saved', { id: editOperationId });
        } else {
          const transferPayload = {
            type: 'TRANSFER',
            amount: amountSafe,
            currency: fromCurrency,
            accountId: draft.account.id,
            relatedAccountId: draft.targetAccount.id,
            targetAmount: Number.isNaN(incomingAmount) ? amountSafe : incomingAmount,
            dateTime: draft.date.toISOString(),
            note: draft.note || '',
            place: draft.place || '',
            recipient: '',
            merchant: '',
            photoUrl: photoUri || null,
            isPinned,
            tagIds: buildTagIds(),
          };

          const result: any = await apiRequest('/operations', {
            method: 'POST',
            body: JSON.stringify(transferPayload),
          });

          DeviceEventEmitter.emit('operation:saved', { transferId: result?.transferId });
        }

        setSaveError(null);
        return true;
      } catch (e: any) {
        const msg = e?.message || 'Неизвестная ошибка сети';
        Alert.alert('Ошибка сохранения перевода', msg);
        setSaveError(msg);
        return false;
      }
    }

    if (!draft.account?.id || !draft.category?.id) {
      Alert.alert('Заполните данные', 'Необходимо выбрать счёт и категорию');
      return false;
    }

    const numericId =
      existingOperationId && !Number.isNaN(existingOperationId)
        ? Number(existingOperationId)
        : null;
    const isEditing = numericId !== null;

    const payload = {
      type: draft.type.toUpperCase(),
      amount: amountSafe,
      currency: currencyCode,
      accountId: draft.account.id,
      categoryId: draft.category.id,
      relatedAccountId: null,
      dateTime: draft.date.toISOString(),
      note: draft.note || '',
      merchant: draft.recipient || '',
      recipient: draft.recipient || '',
      place: draft.place || '',
      photoUrl: photoUri || null,
      isPinned,
      tagIds: buildTagIds(),
    };

    try {
      const data: any = isEditing
        ? await apiRequest(`/operations/${numericId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await apiRequest('/operations', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      const persistedId = data?.id ?? numericId ?? null;
      DeviceEventEmitter.emit('operation:saved', { id: persistedId, ...data });
      setSaveError(null);
      if (persistedId && !existingOperationId) {
        setExistingOperationId(persistedId);
      }
      return true;
    } catch (e: any) {
      const msg = e?.message || 'Неизвестная ошибка';
      Alert.alert('Не удалось сохранить', msg);
      setSaveError(msg);
      return false;
    }
  };

  const deleteOperations = async (idToDelete: string | number) => {
    try {
      setIsDeleting(true);
      await apiRequest(`/operations/${idToDelete}`, {
        method: 'DELETE',
      });

      DeviceEventEmitter.emit('operation:deleted', {
        id: existingOperationId,
        transfer_ids: existingTransferOperationIds,
      });

      router.back();
      setTimeout(() => resetDraft(), 0);
    } catch (e: any) {
      const msg = e?.message || 'Неизвестная ошибка';
      Alert.alert('Ошибка удаления', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    if (isDeleting) return;

    const targetId =
      isTransfer && existingTransferOperationIds.length > 0
        ? existingTransferOperationIds[0]
        : existingOperationId && !Number.isNaN(existingOperationId)
          ? existingOperationId
          : null;

    if (!targetId) return;

    Alert.alert('Вы действительно хотите удалить эту операцию?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => deleteOperations(targetId),
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
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );

        setPhotoUri(manipulated.uri);

        const uploadRes = await uploadImageFile(manipulated.uri);
        if (uploadRes?.url) {
          setPhotoUri(uploadRes.url);
        }
      } catch (e: any) {
        console.warn('Ошибка загрузки фото на сервер:', e);
        Alert.alert('Не удалось загрузить фото', e?.message || 'Ошибка сети');
      }
    }
  };

  const handleDateChange = (eventOrDate: any, maybeDate?: Date) => {
    const nextDate = eventOrDate instanceof Date ? eventOrDate : maybeDate;
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

  const handleTimeChange = (eventOrTime: any, maybeTime?: Date) => {
    const nextTime = eventOrTime instanceof Date ? eventOrTime : maybeTime;
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

  const safeDate = useMemo(
    () => (draft.date instanceof Date && !Number.isNaN(draft.date.getTime()) ? draft.date : new Date()),
    [draft.date],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Новая операция',
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          unstable_headerLeftItems: () => [
            {
              type: 'button',
              label: 'Закрыть',
              icon: {
                type: 'sfSymbol',
                name: 'xmark',
              },
              onPress: () => router.back(),
            },
          ],
          unstable_headerRightItems: () => [
            {
              type: 'button',
              label: 'Шаблоны',
              onPress: () => {
                // Пока ничего не делает
              },
            },
          ],
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
              placeholder="0"
              placeholderTextColor={COLORS.textMain}
              value={draft.amount}
              onChangeText={setAmount}
              returnKeyType="done"
              selectionColor={COLORS.primary}
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

          {datePickerVisible ? (
            <View style={styles.datePickerBlock}>
              <DateTimePicker
                value={safeDate}
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
                    value={safeDate}
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
            </View>
          ) : null}

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

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={isSaving || isDeleting}
          style={[
            styles.operationPrimaryButton,
            (isSaving || isDeleting) && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.operationPrimaryButtonText}>
            {isSaving ? 'Сохраняем...' : isDeleting ? 'Удаляем...' : 'Сохранить операцию'}
          </Text>
        </TouchableOpacity>

        {photoUri ? (
          <View style={styles.photoPreviewCard}>
            <Image
              source={{ uri: resolvePhotoUrl(photoUri) || undefined }}
              style={styles.photoPreviewImage}
              resizeMode="cover"
            />
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
            <TouchableOpacity
              key={action.label}
              activeOpacity={0.75}
              style={[
                styles.operationActionPill,
                (action.disabled || isDeleting || isSaving) && styles.operationActionPillDisabled,
              ]}
              onPress={action.disabled ? undefined : action.onPress}
              disabled={action.disabled}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    styles.operationActionIconElement,
                    (action.disabled || isDeleting || isSaving) && styles.operationActionIconElementDisabled,
                  ]}
                >
                  {action.icon}
                </View>
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
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    marginTop: 12,
  },
  datePickerBlock: {
    paddingTop: 8,
    paddingBottom: 22,
  },
  inlinePicker: {
    alignSelf: 'center',
    minWidth: 345,
    minHeight: 345,
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